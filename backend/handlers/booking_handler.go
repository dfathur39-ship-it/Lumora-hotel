package handlers

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v2"
	"lumora-backend/middleware"
	"lumora-backend/models"
	"lumora-backend/repositories"
	"lumora-backend/services"
)

type BookingHandler struct {
	bookingService *services.BookingService
	bookings       *repositories.BookingRepository
}

func NewBookingHandler(bookingService *services.BookingService, bookings *repositories.BookingRepository) *BookingHandler {
	return &BookingHandler{bookingService: bookingService, bookings: bookings}
}

type createBookingRequest struct {
	HotelID       string `json:"hotelId"`
	RoomID        string `json:"roomId"`
	CheckIn       string `json:"checkIn"`
	CheckOut      string `json:"checkOut"`
	Guests        int    `json:"guests"`
	RoomsCount    int    `json:"roomsCount"`
	GuestName     string `json:"guestName"`
	GuestEmail    string `json:"guestEmail"`
	GuestPhone    string `json:"guestPhone"`
	PaymentMethod string `json:"paymentMethod"`
}

// POST /api/bookings
// Note: the client never sends a price. Total is always computed
// server-side in services.BookingService from room.Price x nights.
func (h *BookingHandler) Create(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)

	var req createBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	checkIn, err1 := time.Parse("2006-01-02", req.CheckIn)
	checkOut, err2 := time.Parse("2006-01-02", req.CheckOut)
	if err1 != nil || err2 != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "checkIn and checkOut must be dates in YYYY-MM-DD format"})
	}

	booking, err := h.bookingService.Create(c.Context(), services.CreateBookingInput{
		UserID:        userID,
		HotelID:       req.HotelID,
		RoomID:        req.RoomID,
		CheckIn:       checkIn,
		CheckOut:      checkOut,
		Guests:        req.Guests,
		RoomsCount:    req.RoomsCount,
		GuestName:     req.GuestName,
		GuestEmail:    req.GuestEmail,
		GuestPhone:    req.GuestPhone,
		PaymentMethod: req.PaymentMethod,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidDateRange),
			errors.Is(err, services.ErrInvalidPaymentMethod),
			errors.Is(err, services.ErrTooManyGuests):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		case errors.Is(err, services.ErrRoomNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		case errors.Is(err, services.ErrRoomUnavailable), errors.Is(err, services.ErrTooManyRooms):
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not create booking"})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(booking)
}

// GET /api/bookings
func (h *BookingHandler) List(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)

	_ = h.bookings.ExpirePendingPayments(c.Context())

	bookings, err := h.bookings.ListByUser(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch bookings"})
	}
	if bookings == nil {
		bookings = []models.Booking{}
	}
	return c.JSON(bookings)
}

// GET /api/bookings/:id
func (h *BookingHandler) GetByID(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)
	id := c.Params("id")

	booking, err := h.bookings.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "booking not found"})
	}
	if booking.UserID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "you do not have access to this booking"})
	}

	return c.JSON(booking)
}

// PATCH /api/bookings/:id/cancel
func (h *BookingHandler) Cancel(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)
	id := c.Params("id")

	booking, err := h.bookings.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "booking not found"})
	}
	if booking.UserID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "you do not have access to this booking"})
	}

	if err := h.bookings.Cancel(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to cancel booking"})
	}

	return c.JSON(fiber.Map{"status": "cancelled"})
}
