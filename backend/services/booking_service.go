package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"lumora-backend/models"
	"lumora-backend/repositories"
)

var ErrInvalidDateRange = errors.New("check-out must be after check-in")
var ErrRoomNotFound = errors.New("room not found")
var ErrRoomUnavailable = errors.New("this room is already booked for the selected dates")
var ErrInvalidPaymentMethod = errors.New("invalid payment method")
var ErrTooManyGuests = errors.New("guest count exceeds this room's capacity")
var ErrTooManyRooms = errors.New("requested number of rooms is not available")

var validPaymentMethods = map[string]models.PaymentMethod{
	"qris":         models.PaymentQRIS,
	"card_bca":     models.PaymentCardBCA,
	"paypal":       models.PaymentPayPal,
	"pay_at_hotel": models.PaymentAtHotel,
}

type BookingService struct {
	bookings *repositories.BookingRepository
	rooms    *repositories.RoomRepository
	hotels   *repositories.HotelRepository
}

func NewBookingService(bookings *repositories.BookingRepository, rooms *repositories.RoomRepository, hotels *repositories.HotelRepository) *BookingService {
	return &BookingService{bookings: bookings, rooms: rooms, hotels: hotels}
}

type CreateBookingInput struct {
	UserID        string
	HotelID       string
	RoomID        string
	CheckIn       time.Time
	CheckOut      time.Time
	Guests        int
	RoomsCount    int
	GuestName     string
	GuestEmail    string
	GuestPhone    string
	PaymentMethod string
}

// Create computes the total price entirely from trusted server-side data
// (room.Price x nights) — the client never supplies a price. It also
// checks the room isn't already booked for overlapping dates before
// creating anything, and sets the booking's initial status based on the
// payment method: pay-at-hotel is confirmed immediately since no online
// payment is required; every other method starts as pending until a
// payment provider confirms it (see PaymentOrchestrator).
func (s *BookingService) Create(ctx context.Context, in CreateBookingInput) (*models.Booking, error) {
	if !in.CheckOut.After(in.CheckIn) {
		return nil, ErrInvalidDateRange
	}

	method, ok := validPaymentMethods[in.PaymentMethod]
	if !ok {
		return nil, ErrInvalidPaymentMethod
	}

	room, err := s.rooms.GetByID(ctx, in.RoomID)
	if err != nil {
		return nil, ErrRoomNotFound
	}
	if room.Status != models.RoomAvailable {
		return nil, ErrRoomUnavailable
	}

	roomsCount := in.RoomsCount
	if roomsCount < 1 {
		roomsCount = 1
	}

	// Let already-expired pending payments free up their room before we
	// check availability, so a stale unpaid hold doesn't block a new guest.
	_ = s.bookings.ExpirePendingPayments(ctx)

	// Capacity and availability are always re-checked here, server-side —
	// the frontend's filtering is a UX convenience, never the source of
	// truth, so a stale page or a tampered request can't over-book a room
	// or squeeze more guests into it than it actually holds.
	if in.Guests > room.MaxAdults*roomsCount+room.MaxChildren*roomsCount {
		return nil, ErrTooManyGuests
	}

	available, err := s.rooms.AvailableUnits(ctx, in.RoomID, in.CheckIn, in.CheckOut)
	if err != nil {
		return nil, err
	}
	if available < roomsCount {
		if available <= 0 {
			return nil, ErrRoomUnavailable
		}
		return nil, ErrTooManyRooms
	}

	nights := int(in.CheckOut.Sub(in.CheckIn).Hours() / 24)
	if nights < 1 {
		nights = 1
	}
	discountedPrice := room.Price - (room.Price * room.DiscountPercent / 100)
	total := nights * discountedPrice * roomsCount

	status := models.BookingPending
	paymentStatus := models.PaymentPending
	if method == models.PaymentAtHotel {
		status = models.BookingConfirmed
		paymentStatus = models.PaymentUnpaid
	}

	booking := models.Booking{
		ID:            uuid.NewString(),
		BookingCode:   generateBookingCode(),
		UserID:        in.UserID,
		HotelID:       in.HotelID,
		RoomID:        in.RoomID,
		CheckIn:       in.CheckIn,
		CheckOut:      in.CheckOut,
		Guests:        in.Guests,
		RoomsCount:    roomsCount,
		GuestName:     in.GuestName,
		GuestEmail:    in.GuestEmail,
		GuestPhone:    in.GuestPhone,
		Nights:        nights,
		Total:         total,
		Status:        status,
		PaymentMethod: method,
		PaymentStatus: paymentStatus,
	}

	created, err := s.bookings.Create(ctx, booking)
	if err != nil {
		return nil, err
	}

	// Enrich with hotel/room display fields for the response.
	if hotel, err := s.hotels.GetByID(ctx, in.HotelID); err == nil {
		created.HotelName = hotel.Name
		created.Location = hotel.Location
	}
	created.RoomName = room.Name

	return created, nil
}

func generateBookingCode() string {
	suffix := strings.ToUpper(uuid.NewString()[:6])
	return fmt.Sprintf("LUM-%s-%s", time.Now().Format("20060102"), suffix)
}
