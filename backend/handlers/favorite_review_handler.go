package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"lumora-backend/middleware"
	"lumora-backend/models"
	"lumora-backend/repositories"
)

type FavoriteHandler struct {
	favorites *repositories.FavoriteRepository
}

func NewFavoriteHandler(favorites *repositories.FavoriteRepository) *FavoriteHandler {
	return &FavoriteHandler{favorites: favorites}
}

type favoriteRequest struct {
	HotelID string `json:"hotelId"`
}

// POST /api/favorites
func (h *FavoriteHandler) Add(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)

	var req favoriteRequest
	if err := c.BodyParser(&req); err != nil || req.HotelID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "hotelId is required"})
	}

	if err := h.favorites.Add(c.Context(), userID, req.HotelID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to add favorite"})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"status": "added"})
}

// GET /api/favorites
func (h *FavoriteHandler) List(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)

	hotels, err := h.favorites.ListByUser(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch favorites"})
	}
	if hotels == nil {
		hotels = []models.Hotel{}
	}
	return c.JSON(hotels)
}

// DELETE /api/favorites/:hotelId
func (h *FavoriteHandler) Remove(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)
	hotelID := c.Params("hotelId")

	if err := h.favorites.Remove(c.Context(), userID, hotelID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to remove favorite"})
	}
	return c.JSON(fiber.Map{"status": "removed"})
}

type ReviewHandler struct {
	reviews *repositories.ReviewRepository
	users   *repositories.UserRepository
}

func NewReviewHandler(reviews *repositories.ReviewRepository, users *repositories.UserRepository) *ReviewHandler {
	return &ReviewHandler{reviews: reviews, users: users}
}

type createReviewRequest struct {
	Rating  float64 `json:"rating"`
	Comment string  `json:"comment"`
}

// POST /api/hotels/:id/reviews
func (h *ReviewHandler) Create(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)
	hotelID := c.Params("id")

	var req createReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.Rating < 1 || req.Rating > 5 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "rating must be between 1 and 5"})
	}
	if len(req.Comment) > 2000 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "comment is too long"})
	}

	review := models.Review{
		ID:      uuid.NewString(),
		HotelID: hotelID,
		UserID:  userID,
		Rating:  req.Rating,
		Comment: req.Comment,
	}

	created, err := h.reviews.Create(c.Context(), review)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create review"})
	}

	if user, err := h.users.GetByID(c.Context(), userID); err == nil {
		created.UserName = user.Name
	}

	return c.Status(fiber.StatusCreated).JSON(created)
}

// GET /api/reviews/recent?limit=6
func (h *ReviewHandler) ListRecent(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 6)
	if limit < 1 || limit > 24 {
		limit = 6
	}

	reviews, err := h.reviews.ListRecent(c.Context(), limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch reviews"})
	}
	if reviews == nil {
		reviews = []models.Review{}
	}
	return c.JSON(reviews)
}
