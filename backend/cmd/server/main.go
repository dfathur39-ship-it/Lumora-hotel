package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"lumora-backend/config"
	"lumora-backend/database"
	"lumora-backend/handlers"
	"lumora-backend/repositories"
	"lumora-backend/routes"
	"lumora-backend/services"
	"lumora-backend/services/payment"
)

func main() {
	// Try to load .env from backend directory
	_, err := os.Stat(filepath.Join("..", "..", ".env"))
	if err == nil {
		log.Println("Loading .env from backend directory")
	}
	
	cfg := config.Load()

	db := database.Connect(cfg.DatabaseURL)
	defer db.Close()

	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Fatalf("unable to create uploads directory: %v", err)
	}

	// Repositories
	userRepo := repositories.NewUserRepository(db)
	hotelRepo := repositories.NewHotelRepository(db)
	roomRepo := repositories.NewRoomRepository(db)
	bookingRepo := repositories.NewBookingRepository(db)
	favoriteRepo := repositories.NewFavoriteRepository(db)
	reviewRepo := repositories.NewReviewRepository(db)
	passwordResetRepo := repositories.NewPasswordResetRepository(db)
	contactRepo := repositories.NewContactRepository(db)

	// Services
	authService := services.NewAuthService(userRepo, passwordResetRepo, cfg.JWTSecret)
	bookingService := services.NewBookingService(bookingRepo, roomRepo, hotelRepo)

	// Payment providers — QRIS and card/BCA are in-process sandbox
	// providers (see services/payment for why); PayPal is a real Orders v2
	// integration that only activates if credentials are configured.
	qrisProvider := payment.NewQRISSandboxProvider()
	cardProvider := payment.NewCardSandboxProvider()
	var paypalProvider *payment.PayPalProvider
	if cfg.PayPalClientID != "" && cfg.PayPalClientSecret != "" {
		paypalProvider = payment.NewPayPalProvider(cfg.PayPalClientID, cfg.PayPalClientSecret, cfg.PayPalMode, cfg.PayPalReturnURL, cfg.PayPalCancelURL)
	} else {
		log.Println("PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET not set — PayPal payment method is disabled")
	}
	paymentService := payment.NewService(qrisProvider, cardProvider, paypalProvider)
	paymentOrchestrator := services.NewPaymentOrchestrator(bookingRepo, paymentService)

	// Handlers
	h := routes.Handlers{
		Auth:     handlers.NewAuthHandler(authService, userRepo),
		Hotel:    handlers.NewHotelHandler(hotelRepo, roomRepo, reviewRepo),
		Room:     handlers.NewRoomHandler(roomRepo, hotelRepo, reviewRepo),
		Booking:  handlers.NewBookingHandler(bookingService, bookingRepo),
		Favorite: handlers.NewFavoriteHandler(favoriteRepo),
		Review:   handlers.NewReviewHandler(reviewRepo, userRepo),
		Admin:    handlers.NewAdminHandler(hotelRepo, roomRepo, bookingRepo, userRepo),
		Upload:   handlers.NewUploadHandler(uploadDir),
		Payment:  handlers.NewPaymentHandler(paymentOrchestrator),
		Contact:  handlers.NewContactHandler(contactRepo),
	}

	app := fiber.New(fiber.Config{
		AppName:      "LUMORA HOTELS API",
		ErrorHandler: errorHandler,
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigin,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowCredentials: true,
	}))

	// Serve uploaded images (e.g. http://localhost:3000/uploads/xxxx.jpg)
	app.Static("/uploads", uploadDir)

	routes.Register(app, h, authService)

	log.Printf("LUMORA API listening on :%s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{"error": err.Error()})
}
