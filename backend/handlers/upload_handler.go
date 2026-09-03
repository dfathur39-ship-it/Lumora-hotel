package handlers

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UploadHandler struct {
	uploadDir string
}

func NewUploadHandler(uploadDir string) *UploadHandler {
	return &UploadHandler{uploadDir: uploadDir}
}

var allowedImageExt = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
	".gif":  true,
}

const maxUploadSize = 5 * 1024 * 1024 // 5MB

// POST /api/admin/upload — multipart form field "image".
// Returns { "url": "http://host:port/uploads/xxxx.jpg" } which can be used
// directly as a hotel/room image URL.
func (h *UploadHandler) UploadImage(c *fiber.Ctx) error {
	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no file uploaded under field 'image'"})
	}

	if file.Size > maxUploadSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "file exceeds the 5MB limit"})
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedImageExt[ext] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "only jpg, jpeg, png, webp, and gif files are allowed"})
	}

	filename := fmt.Sprintf("%d-%s%s", time.Now().Unix(), uuid.NewString()[:8], ext)
	destPath := filepath.Join(h.uploadDir, filename)

	if err := c.SaveFile(file, destPath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save file"})
	}

	url := fmt.Sprintf("%s/uploads/%s", c.BaseURL(), filename)
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"url": url})
}
