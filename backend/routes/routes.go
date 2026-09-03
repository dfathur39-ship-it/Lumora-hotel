package routes

import (
	"github.com/gofiber/fiber/v2"
	"lumora-backend/handlers"
	"lumora-backend/middleware"
	"lumora-backend/services"
)

type Handlers struct {
	Auth     *handlers.AuthHandler
	Hotel    *handlers.HotelHandler
	Room     *handlers.RoomHandler
	Booking  *handlers.BookingHandler
	Favorite *handlers.FavoriteHandler
	Review   *handlers.ReviewHandler
	Admin    *handlers.AdminHandler
	Upload   *handlers.UploadHandler
	Payment  *handlers.PaymentHandler
	Contact  *handlers.ContactHandler
}

// Register wires every route required by the LUMORA frontend to its handler.
func Register(app *fiber.App, h Handlers, auth *services.AuthService) {
	api := app.Group("/api")

	// Auth
	authGroup := api.Group("/auth")
	authGroup.Post("/register", h.Auth.Register)
	authGroup.Post("/login", h.Auth.Login)
	authGroup.Get("/me", middleware.RequireAuth(auth), h.Auth.Me)
	authGroup.Put("/profile", middleware.RequireAuth(auth), h.Auth.UpdateProfile)
	authGroup.Post("/change-password", middleware.RequireAuth(auth), h.Auth.ChangePassword)
	authGroup.Post("/forgot-password", h.Auth.ForgotPassword)
	authGroup.Post("/verify-reset-token", h.Auth.VerifyResetToken)
	authGroup.Get("/reset-status/:requestId", h.Auth.GetResetStatus)
	authGroup.Post("/reset-password", h.Auth.ResetPassword)
	authGroup.Get("/reset-requests", middleware.RequireAuth(auth), middleware.RequireAdmin, h.Auth.GetResetRequests)
	authGroup.Post("/reset-requests/:id/approve", middleware.RequireAuth(auth), middleware.RequireAdmin, h.Auth.ApproveResetRequest)
	authGroup.Post("/reset-requests/:id/reject", middleware.RequireAuth(auth), middleware.RequireAdmin, h.Auth.RejectResetRequest)

	// Hotels (public)
	api.Get("/hotels", h.Hotel.List)
	api.Get("/hotels/:id", h.Hotel.GetByID)
	api.Get("/hotels/:id/reviews", h.Hotel.ListReviews)
	api.Post("/hotels/:id/reviews", middleware.RequireAuth(auth), h.Review.Create)

	// Reviews (public)
	api.Get("/reviews/recent", h.Review.ListRecent)

	// Rooms (public)
	api.Get("/rooms", h.Room.List)
	api.Get("/rooms/:id", h.Room.GetByID)

	// Bookings (require auth)
	bookings := api.Group("/bookings", middleware.RequireAuth(auth))
	bookings.Post("/", h.Booking.Create)
	bookings.Get("/", h.Booking.List)
	bookings.Get("/:id", h.Booking.GetByID)
	bookings.Patch("/:id/cancel", h.Booking.Cancel)
	bookings.Post("/:id/pay", h.Payment.Initiate)

	// Payments (require auth)
	payments := api.Group("/payments", middleware.RequireAuth(auth))
	payments.Post("/sandbox/:transactionId/simulate", h.Payment.SimulateSandbox)
	payments.Post("/capture", h.Payment.Capture)

	// Favorites (require auth)
	favorites := api.Group("/favorites", middleware.RequireAuth(auth))
	favorites.Post("/", h.Favorite.Add)
	favorites.Get("/", h.Favorite.List)
	favorites.Delete("/:hotelId", h.Favorite.Remove)

	// Admin (require auth AND admin role)
	admin := api.Group("/admin", middleware.RequireAuth(auth), middleware.RequireAdmin)
	admin.Get("/stats", h.Admin.Stats)
	admin.Get("/bookings", h.Admin.ListAllBookings)
	admin.Patch("/bookings/:id/cancel", h.Admin.CancelBooking)
	admin.Post("/hotels", h.Admin.CreateHotel)
	admin.Put("/hotels/:id", h.Admin.UpdateHotel)
	admin.Delete("/hotels/:id", h.Admin.DeleteHotel)
	admin.Get("/rooms", h.Admin.ListAllRooms)
	admin.Post("/rooms", h.Admin.CreateRoom)
	admin.Put("/rooms/:id", h.Admin.UpdateRoom)
	admin.Patch("/rooms/:id/status", h.Admin.SetRoomStatus)
	admin.Delete("/rooms/:id", h.Admin.DeleteRoom)
	admin.Post("/upload", h.Upload.UploadImage)
	admin.Patch("/users/:id/reset-password", h.Admin.ResetUserPassword)

	// Contact/Social Media
	api.Get("/contact", h.Contact.GetContact)
	api.Put("/contact", middleware.RequireAuth(auth), h.Contact.UpdateContact)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
}
