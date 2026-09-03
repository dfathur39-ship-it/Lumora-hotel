package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"lumora-backend/models"
	"lumora-backend/repositories"
)

type AdminHandler struct {
	hotels   *repositories.HotelRepository
	rooms    *repositories.RoomRepository
	bookings *repositories.BookingRepository
	users    *repositories.UserRepository
}

func NewAdminHandler(hotels *repositories.HotelRepository, rooms *repositories.RoomRepository, bookings *repositories.BookingRepository, users *repositories.UserRepository) *AdminHandler {
	return &AdminHandler{hotels: hotels, rooms: rooms, bookings: bookings, users: users}
}

// GET /api/admin/stats
func (h *AdminHandler) Stats(c *fiber.Ctx) error {
	stats, err := h.bookings.Stats(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to load stats"})
	}
	return c.JSON(stats)
}

// GET /api/admin/bookings — every booking in the system, not just the caller's.
func (h *AdminHandler) ListAllBookings(c *fiber.Ctx) error {
	bookings, err := h.bookings.ListAll(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch bookings"})
	}
	if bookings == nil {
		bookings = []models.Booking{}
	}
	return c.JSON(bookings)
}

// PATCH /api/admin/bookings/:id/cancel — admin can cancel any booking, not just their own.
func (h *AdminHandler) CancelBooking(c *fiber.Ctx) error {
	id := c.Params("id")
	if _, err := h.bookings.GetByID(c.Context(), id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "booking not found"})
	}
	if err := h.bookings.Cancel(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to cancel booking"})
	}
	return c.JSON(fiber.Map{"status": "cancelled"})
}

type hotelRequest struct {
	Name        string   `json:"name"`
	Location    string   `json:"location"`
	Description string   `json:"description"`
	Image       string   `json:"image"`
	Gallery     []string `json:"gallery"`
	Rating      float64  `json:"rating"`
	PriceFrom   int      `json:"priceFrom"`
	Amenities   []string `json:"amenities"`
}

func (req hotelRequest) valid() bool {
	return req.Name != "" && req.Location != "" && req.PriceFrom > 0
}

// POST /api/admin/hotels
func (h *AdminHandler) CreateHotel(c *fiber.Ctx) error {
	var req hotelRequest
	if err := c.BodyParser(&req); err != nil || !req.valid() {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name, location, and a positive priceFrom are required"})
	}

	hotel := models.Hotel{
		ID:          uuid.NewString(),
		Name:        req.Name,
		Location:    req.Location,
		Description: req.Description,
		Image:       req.Image,
		Gallery:     req.Gallery,
		Rating:      req.Rating,
		PriceFrom:   req.PriceFrom,
		Amenities:   req.Amenities,
	}

	created, err := h.hotels.Create(c.Context(), hotel)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create hotel"})
	}
	return c.Status(fiber.StatusCreated).JSON(created)
}

// PUT /api/admin/hotels/:id
func (h *AdminHandler) UpdateHotel(c *fiber.Ctx) error {
	id := c.Params("id")
	existing, err := h.hotels.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "hotel not found"})
	}

	var req hotelRequest
	if err := c.BodyParser(&req); err != nil || !req.valid() {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name, location, and a positive priceFrom are required"})
	}

	existing.Name = req.Name
	existing.Location = req.Location
	existing.Description = req.Description
	existing.Image = req.Image
	existing.Gallery = req.Gallery
	existing.Rating = req.Rating
	existing.PriceFrom = req.PriceFrom
	existing.Amenities = req.Amenities

	updated, err := h.hotels.Update(c.Context(), *existing)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update hotel"})
	}
	return c.JSON(updated)
}

// DELETE /api/admin/hotels/:id
func (h *AdminHandler) DeleteHotel(c *fiber.Ctx) error {
	id := c.Params("id")
	if _, err := h.hotels.GetByID(c.Context(), id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "hotel not found"})
	}
	if err := h.hotels.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete hotel — remove its rooms and bookings first"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

type roomImageRequest struct {
	ImageURL  string `json:"imageUrl"`
	IsPrimary bool   `json:"isPrimary"`
}

type roomFacilityRequest struct {
	Name string `json:"name"`
	Icon string `json:"icon"`
}

type roomRequest struct {
	HotelID         string                `json:"hotelId"`
	Name            string                `json:"name"`
	Description     string                `json:"description"`
	Price           int                   `json:"price"`
	Capacity        int                   `json:"capacity"`
	Size            int                   `json:"size"`
	Image           string                `json:"image"`
	Amenities       []string              `json:"amenities"`
	BedType         string                `json:"bedType"`
	BedCount        int                   `json:"bedCount"`
	BedroomCount    int                   `json:"bedroomCount"`
	MaxAdults       int                   `json:"maxAdults"`
	MaxChildren     int                   `json:"maxChildren"`
	DiscountPercent int                   `json:"discountPercent"`
	Badge           string                `json:"badge"`
	Status          string                `json:"status"`
	Breakfast       bool                  `json:"breakfast"`
	Parking         bool                  `json:"parking"`
	Wifi            bool                  `json:"wifi"`
	TotalUnits      int                   `json:"totalUnits"`
	Images          []roomImageRequest    `json:"images"`
	Facilities      []roomFacilityRequest `json:"facilities"`
}

var validRoomStatus = map[string]models.RoomStatus{
	"available":   models.RoomAvailable,
	"hidden":      models.RoomHidden,
	"maintenance": models.RoomMaintenance,
}

func (req roomRequest) valid() bool {
	return req.Name != "" && req.Price > 0 && req.Capacity > 0
}

// applyDefaults fills in sensible values so the admin form doesn't have to
// submit every advanced field explicitly (e.g. quickly adding a room).
func (req *roomRequest) applyDefaults() {
	if req.BedType == "" {
		req.BedType = "Queen Bed"
	}
	if req.BedCount < 1 {
		req.BedCount = 1
	}
	if req.BedroomCount < 1 {
		req.BedroomCount = 1
	}
	if req.MaxAdults < 1 {
		req.MaxAdults = req.Capacity
	}
	if req.MaxChildren < 0 {
		req.MaxChildren = 0
	}
	if req.TotalUnits < 1 {
		req.TotalUnits = 1
	}
	if req.DiscountPercent < 0 {
		req.DiscountPercent = 0
	}
	if req.DiscountPercent > 90 {
		req.DiscountPercent = 90
	}
	if req.Status == "" {
		req.Status = string(models.RoomAvailable)
	}
	if len(req.Images) > 0 && req.Image == "" {
		req.Image = req.Images[0].ImageURL
	}
}

func toModelImages(images []roomImageRequest) []models.RoomImage {
	out := make([]models.RoomImage, 0, len(images))
	for _, img := range images {
		if img.ImageURL == "" {
			continue
		}
		out = append(out, models.RoomImage{ImageURL: img.ImageURL, IsPrimary: img.IsPrimary})
	}
	return out
}

func toModelFacilities(facilities []roomFacilityRequest) []models.RoomFacility {
	out := make([]models.RoomFacility, 0, len(facilities))
	for _, f := range facilities {
		if f.Name == "" {
			continue
		}
		out = append(out, models.RoomFacility{Name: f.Name, Icon: f.Icon})
	}
	return out
}

// GET /api/admin/rooms?hotelId=&status=&search= — every room across every
// hotel (including hidden/maintenance/archived ones), for Room Management.
func (h *AdminHandler) ListAllRooms(c *fiber.Ctx) error {
	hotelID := c.Query("hotelId", "")
	status := c.Query("status", "")
	search := c.Query("search", "")

	rooms, err := h.rooms.ListAllForAdmin(c.Context(), hotelID, status, search)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch rooms"})
	}
	if rooms == nil {
		rooms = []models.Room{}
	}
	return c.JSON(rooms)
}

// POST /api/admin/rooms
func (h *AdminHandler) CreateRoom(c *fiber.Ctx) error {
	var req roomRequest
	if err := c.BodyParser(&req); err != nil || req.HotelID == "" || !req.valid() {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "hotelId, name, a positive price, and capacity are required"})
	}
	if _, err := h.hotels.GetByID(c.Context(), req.HotelID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "hotelId does not match an existing hotel"})
	}
	status, ok := validRoomStatus[req.Status]
	if req.Status != "" && !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "status must be available, hidden, or maintenance"})
	}
	req.applyDefaults()
	if !ok {
		status = models.RoomAvailable
	}

	room := models.Room{
		ID:              uuid.NewString(),
		HotelID:         req.HotelID,
		Name:            req.Name,
		Description:     req.Description,
		Price:           req.Price,
		Capacity:        req.Capacity,
		Size:            req.Size,
		Image:           req.Image,
		Amenities:       req.Amenities,
		BedType:         req.BedType,
		BedCount:        req.BedCount,
		BedroomCount:    req.BedroomCount,
		MaxAdults:       req.MaxAdults,
		MaxChildren:     req.MaxChildren,
		DiscountPercent: req.DiscountPercent,
		Badge:           req.Badge,
		Status:          status,
		Breakfast:       req.Breakfast,
		Parking:         req.Parking,
		Wifi:            req.Wifi,
		TotalUnits:      req.TotalUnits,
		Images:          toModelImages(req.Images),
		Facilities:      toModelFacilities(req.Facilities),
	}

	created, err := h.rooms.Create(c.Context(), room)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create room"})
	}
	return c.Status(fiber.StatusCreated).JSON(created)
}

// PUT /api/admin/rooms/:id
func (h *AdminHandler) UpdateRoom(c *fiber.Ctx) error {
	id := c.Params("id")
	existing, err := h.rooms.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "room not found"})
	}

	var req roomRequest
	if err := c.BodyParser(&req); err != nil || req.Name == "" || req.Price <= 0 || req.Capacity <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name, a positive price, and capacity are required"})
	}
	status, ok := validRoomStatus[req.Status]
	if req.Status != "" && !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "status must be available, hidden, or maintenance"})
	}
	req.applyDefaults()
	if !ok {
		status = existing.Status
	}

	existing.Name = req.Name
	existing.Description = req.Description
	existing.Price = req.Price
	existing.Capacity = req.Capacity
	existing.Size = req.Size
	existing.Image = req.Image
	existing.Amenities = req.Amenities
	existing.BedType = req.BedType
	existing.BedCount = req.BedCount
	existing.BedroomCount = req.BedroomCount
	existing.MaxAdults = req.MaxAdults
	existing.MaxChildren = req.MaxChildren
	existing.DiscountPercent = req.DiscountPercent
	existing.Badge = req.Badge
	existing.Status = status
	existing.Breakfast = req.Breakfast
	existing.Parking = req.Parking
	existing.Wifi = req.Wifi
	existing.TotalUnits = req.TotalUnits
	existing.Images = toModelImages(req.Images)
	existing.Facilities = toModelFacilities(req.Facilities)

	updated, err := h.rooms.Update(c.Context(), *existing)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update room"})
	}
	return c.JSON(updated)
}

// PATCH /api/admin/rooms/:id/status — quick hide/show/maintenance toggle
// from the admin room list, without opening the full edit form.
func (h *AdminHandler) SetRoomStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	if _, err := h.rooms.GetByID(c.Context(), id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "room not found"})
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	status, ok := validRoomStatus[req.Status]
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "status must be available, hidden, or maintenance"})
	}

	if err := h.rooms.SetStatus(c.Context(), id, status); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update room status"})
	}
	return c.JSON(fiber.Map{"status": status})
}

// DELETE /api/admin/rooms/:id — soft delete. Existing bookings keep a
// valid room reference; the room simply stops showing up anywhere public
// or in the default admin list.
func (h *AdminHandler) DeleteRoom(c *fiber.Ctx) error {
	id := c.Params("id")
	if _, err := h.rooms.GetByID(c.Context(), id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "room not found"})
	}
	if err := h.rooms.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete room"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// POST /api/admin/users/:id/reset-password
func (h *AdminHandler) ResetUserPassword(c *fiber.Ctx) error {
	id := c.Params("id")
	
	var req struct {
		NewPassword string `json:"newPassword"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	
	if len(req.NewPassword) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "password must be at least 8 characters"})
	}
	
	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to generate password hash"})
	}
	
	if err := h.users.UpdatePassword(c.Context(), id, string(hash)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to reset password"})
	}
	
	return c.JSON(fiber.Map{"message": "password reset successfully"})
}
