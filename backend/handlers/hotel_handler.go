package handlers

import (
	"github.com/gofiber/fiber/v2"
	"lumora-backend/models"
	"lumora-backend/repositories"
)

type HotelHandler struct {
	hotels *repositories.HotelRepository
	rooms  *repositories.RoomRepository
	reviews *repositories.ReviewRepository
}

func NewHotelHandler(hotels *repositories.HotelRepository, rooms *repositories.RoomRepository, reviews *repositories.ReviewRepository) *HotelHandler {
	return &HotelHandler{hotels: hotels, rooms: rooms, reviews: reviews}
}

// GET /api/hotels?destination=Bali&guests=2
func (h *HotelHandler) List(c *fiber.Ctx) error {
	destination := c.Query("destination", "")

	hotels, err := h.hotels.List(c.Context(), destination)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch hotels"})
	}
	if hotels == nil {
		hotels = []models.Hotel{}
	}
	return c.JSON(hotels)
}

// GET /api/hotels/:id
func (h *HotelHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")

	hotel, err := h.hotels.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "hotel not found"})
	}
	return c.JSON(hotel)
}

// GET /api/hotels/:id/reviews
func (h *HotelHandler) ListReviews(c *fiber.Ctx) error {
	id := c.Params("id")

	reviews, err := h.reviews.ListByHotel(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch reviews"})
	}
	if reviews == nil {
		reviews = []models.Review{}
	}
	return c.JSON(reviews)
}
