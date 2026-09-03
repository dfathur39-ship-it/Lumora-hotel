package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"lumora-backend/models"
	"lumora-backend/repositories"
)

type ContactHandler struct {
	contact *repositories.ContactRepository
}

func NewContactHandler(contact *repositories.ContactRepository) *ContactHandler {
	return &ContactHandler{contact: contact}
}

type contactRequest struct {
	WhatsApp  *string `json:"whatsapp,omitempty"`
	Instagram *string `json:"instagram,omitempty"`
	TikTok    *string `json:"tiktok,omitempty"`
	Email     *string `json:"email,omitempty"`
	Phone     *string `json:"phone,omitempty"`
	Address   *string `json:"address,omitempty"`
	IsActive  bool    `json:"isActive"`
}

func (req contactRequest) valid() bool {
	return req.IsActive
}

func (h *ContactHandler) GetContact(c *fiber.Ctx) error {
	contact, err := h.contact.GetActive(c.Context())
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "contact not found"})
	}
	return c.JSON(contact)
}

func (h *ContactHandler) UpdateContact(c *fiber.Ctx) error {
	adminID, _ := c.Locals("userID").(string)
	log.Printf("UpdateContact called by admin: %s", adminID)

	var req contactRequest
	if err := c.BodyParser(&req); err != nil || !req.valid() {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "isActive is required"})
	}

	contact, err := h.contact.GetActive(c.Context())
	if err != nil {
		contact = &models.Contact{
			ID:        uuid.NewString(),
			WhatsApp:  req.WhatsApp,
			Instagram: req.Instagram,
			TikTok:    req.TikTok,
			Email:     req.Email,
			Phone:     req.Phone,
			Address:   req.Address,
			IsActive:  req.IsActive,
		}
		created, err := h.contact.Create(c.Context(), *contact)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create contact"})
		}
		return c.Status(fiber.StatusCreated).JSON(created)
	}

	contact.WhatsApp = req.WhatsApp
	contact.Instagram = req.Instagram
	contact.TikTok = req.TikTok
	contact.Email = req.Email
	contact.Phone = req.Phone
	contact.Address = req.Address
	contact.IsActive = req.IsActive

	updated, err := h.contact.Update(c.Context(), *contact)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update contact"})
	}
	return c.JSON(updated)
}
