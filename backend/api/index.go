// Package handler is the Vercel Go serverless entrypoint for the Lumora
// backend. It builds the exact same Fiber application used by
// cmd/server/main.go (same routes, same handlers) and wraps it as a
// standard net/http handler using Fiber's built-in adaptor, which is what
// Vercel's Go runtime requires.
//
// Every request to the deployed backend (any path) is routed here — see
// vercel.json's rewrite rule.
package handler

import (
	"log"
	"net/http"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"lumora-backend/config"
	"lumora-backend/database"
	"lumora-backend/handlers"
	"lumora-backend/repositories"
	"lumora-backend/routes"
	"lumora-backend/services"
	"lumora-backend/services/payment"
)

var (
	httpHandler http.HandlerFunc
	initOnce    sync.Once
)

// buildHandler wires up the whole app exactly once per warm serverless
// instance (subsequent requests to the same warm instance reuse it, which
// also reuses the database connection pool instead of reconnecting on
// every single request).
func buildHandler() http.HandlerFunc {
	cfg := config.Load()

	db := database.Connect(cfg.DatabaseURL)

	userRepo := repositories.NewUserRepository(db)
	hotelRepo := repositories.NewHotelRepository(db)
	roomRepo := repositories.NewRoomRepository(db)
	bookingRepo := repositories.NewBookingRepository(db)
	favoriteRepo := repositories.NewFavoriteRepository(db)
	reviewRepo := repositories.NewReviewRepository(db)
	passwordResetRepo := repositories.NewPasswordResetRepository(db)
	contactRepo := repositories.NewContactRepository(db)

	authService := services.NewAuthService(userRepo, passwordResetRepo, cfg.JWTSecret)
	bookingService := services.NewBookingService(bookingRepo, roomRepo, hotelRepo)

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

	h := routes.Handlers{
		Auth:     handlers.NewAuthHandler(authService, userRepo),
		Hotel:    handlers.NewHotelHandler(hotelRepo, roomRepo, reviewRepo),
		Room:     handlers.NewRoomHandler(roomRepo, hotelRepo, reviewRepo),
		Booking:  handlers.NewBookingHandler(bookingService, bookingRepo),
		Favorite: handlers.NewFavoriteHandler(favoriteRepo),
		Review:   handlers.NewReviewHandler(reviewRepo, userRepo),
		Admin:    handlers.NewAdminHandler(hotelRepo, roomRepo, bookingRepo, userRepo),
		Upload:   handlers.NewUploadHandler(cfg.SupabaseURL, cfg.SupabaseServiceKey, cfg.SupabaseBucket),
		Payment:  handlers.NewPaymentHandler(paymentOrchestrator),
		Contact:  handlers.NewContactHandler(contactRepo),
	}

	app := fiber.New(fiber.Config{
		AppName:      "LUMORA HOTELS API",
		ErrorHandler: errorHandler,
	})

	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigin,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowCredentials: true,
	}))

	routes.Register(app, h, authService)

	return adaptor.FiberApp(app)
}

// Handler is the exported entrypoint Vercel's Go runtime calls for every
// request.
func Handler(w http.ResponseWriter, r *http.Request) {
	initOnce.Do(func() {
		httpHandler = buildHandler()
	})

	// Required so Fiber sees the correct request path when converting the
	// net/http request into its internal fasthttp representation.
	r.RequestURI = r.URL.String()

	httpHandler(w, r)
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{"error": err.Error()})
}
