package handlers

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// UploadHandler stores uploaded images in Supabase Storage instead of local
// disk. This is required because serverless platforms like Vercel do not
// provide a persistent, publicly-servable filesystem — anything written to
// disk during a request disappears once that invocation ends.
type UploadHandler struct {
	supabaseURL        string
	supabaseServiceKey string
	bucket             string
	httpClient         *http.Client
}

// NewUploadHandler wires up the handler with Supabase Storage credentials.
// supabaseURL is your project URL, e.g. https://xxxx.supabase.co
// serviceKey must be the SERVICE ROLE key (not the anon key) so uploads are
// allowed regardless of Row Level Security policies on the bucket.
// bucket is the Supabase Storage bucket name (create it as "public" in the
// Supabase dashboard: Storage -> New bucket -> toggle "Public bucket").
func NewUploadHandler(supabaseURL, serviceKey, bucket string) *UploadHandler {
	return &UploadHandler{
		supabaseURL:        strings.TrimRight(supabaseURL, "/"),
		supabaseServiceKey: serviceKey,
		bucket:             bucket,
		httpClient:         &http.Client{Timeout: 20 * time.Second},
	}
}

var allowedImageExt = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".webp": "image/webp",
	".gif":  "image/gif",
}

const maxUploadSize = 5 * 1024 * 1024 // 5MB

// POST /api/admin/upload — multipart form field "image".
// Returns { "url": "https://xxxx.supabase.co/storage/v1/object/public/<bucket>/xxxx.jpg" }
// which can be used directly as a hotel/room image URL.
func (h *UploadHandler) UploadImage(c *fiber.Ctx) error {
	if h.supabaseURL == "" || h.supabaseServiceKey == "" || h.bucket == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "upload storage is not configured (missing SUPABASE_URL / SUPABASE_SERVICE_KEY / SUPABASE_BUCKET)",
		})
	}

	fileHeader, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no file uploaded under field 'image'"})
	}

	if fileHeader.Size > maxUploadSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "file exceeds the 5MB limit"})
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	contentType, ok := allowedImageExt[ext]
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "only jpg, jpeg, png, webp, and gif files are allowed"})
	}

	src, err := fileHeader.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to read uploaded file"})
	}
	defer src.Close()

	data, err := io.ReadAll(src)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to read uploaded file"})
	}

	filename := fmt.Sprintf("%d-%s%s", time.Now().Unix(), uuid.NewString()[:8], ext)

	uploadURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", h.supabaseURL, h.bucket, filename)
	req, err := http.NewRequest(http.MethodPost, uploadURL, bytes.NewReader(data))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to prepare upload request"})
	}
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Authorization", "Bearer "+h.supabaseServiceKey)
	req.Header.Set("apikey", h.supabaseServiceKey)
	req.Header.Set("x-upsert", "true")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "failed to reach Supabase Storage"})
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"error":  "storage upload failed",
			"detail": string(body),
		})
	}

	url := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", h.supabaseURL, h.bucket, filename)
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"url": url})
}
