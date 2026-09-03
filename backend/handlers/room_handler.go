package handlers

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v2"
	"lumora-backend/models"
	"lumora-backend/repositories"
)

type RoomHandler struct {
	rooms   *repositories.RoomRepository
	hotels  *repositories.HotelRepository
	reviews *repositories.ReviewRepository
}

func NewRoomHandler(rooms *repositories.RoomRepository, hotels *repositories.HotelRepository, reviews *repositories.ReviewRepository) *RoomHandler {
	return &RoomHandler{rooms: rooms, hotels: hotels, reviews: reviews}
}

// GET /api/rooms?hotelId=xxx&checkIn=2026-09-09&checkOut=2026-09-10&adults=2&children=0&rooms=1
//
// checkIn/checkOut/adults/children/rooms are all optional. When dates are
// supplied, every returned room carries a real, backend-computed
// AvailableUnits + price breakdown for those dates — never trusted from
// the client. Rooms that can't fit the requested party size are excluded
// entirely, and hidden/maintenance rooms never appear here at all.
func (h *RoomHandler) List(c *fiber.Ctx) error {
	hotelID := c.Query("hotelId", "")
	if hotelID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "hotelId query param is required"})
	}

	q, err := parseAvailabilityQuery(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	rooms, err := h.rooms.ListByHotel(c.Context(), hotelID, q)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch rooms"})
	}
	if rooms == nil {
		rooms = []models.Room{}
	}

	h.attachRatings(c, rooms)
	return c.JSON(rooms)
}

// GET /api/rooms/:id — used by the room detail modal and the booking flow.
func (h *RoomHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")

	room, err := h.rooms.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "room not found"})
	}

	rooms := []models.Room{*room}
	h.attachRatings(c, rooms)
	return c.JSON(rooms[0])
}

// parseAvailabilityQuery reads the optional booking-search params off the
// request. Returns nil (no filtering) if none of them were supplied.
func parseAvailabilityQuery(c *fiber.Ctx) (*repositories.AvailabilityQuery, error) {
	checkInStr := c.Query("checkIn", "")
	checkOutStr := c.Query("checkOut", "")
	adults := c.QueryInt("adults", 0)
	children := c.QueryInt("children", 0)
	roomsWanted := c.QueryInt("rooms", 1)

	if checkInStr == "" && checkOutStr == "" && adults == 0 && children == 0 && roomsWanted <= 1 {
		return nil, nil
	}

	q := &repositories.AvailabilityQuery{Adults: adults, Children: children, RoomsWanted: roomsWanted}

	if checkInStr != "" || checkOutStr != "" {
		checkIn, err1 := time.Parse("2006-01-02", checkInStr)
		checkOut, err2 := time.Parse("2006-01-02", checkOutStr)
		if err1 != nil || err2 != nil {
			return nil, errInvalidDates
		}
		if !checkOut.After(checkIn) {
			return nil, errInvalidDateOrder
		}
		today := time.Now().Truncate(24 * time.Hour)
		if checkIn.Before(today) {
			return nil, errPastCheckIn
		}
		q.CheckIn = &checkIn
		q.CheckOut = &checkOut
	}

	return q, nil
}

var (
	errInvalidDates     = errors.New("checkIn and checkOut must be dates in YYYY-MM-DD format")
	errInvalidDateOrder = errors.New("checkOut must be after checkIn")
	errPastCheckIn      = errors.New("checkIn cannot be in the past")
)

// attachRatings fills in Rating/ReviewCount from the hotel's aggregate
// reviews. LUMORA's review system is currently hotel-scoped rather than
// per-room, so every room in a hotel shares that hotel's rating; rooms
// show "No reviews yet" (ReviewCount = 0) rather than any invented number.
func (h *RoomHandler) attachRatings(c *fiber.Ctx, rooms []models.Room) {
	cache := map[string]struct {
		rating float64
		count  int
	}{}
	for i, room := range rooms {
		cached, ok := cache[room.HotelID]
		if !ok {
			hotel, err := h.hotels.GetByID(c.Context(), room.HotelID)
			if err == nil {
				cached.rating = hotel.Rating
			}
			if revs, err := h.reviews.ListByHotel(c.Context(), room.HotelID); err == nil {
				cached.count = len(revs)
			}
			cache[room.HotelID] = cached
		}
		if cached.count > 0 {
			rooms[i].Rating = cached.rating
			rooms[i].ReviewCount = cached.count
		}
	}
}
