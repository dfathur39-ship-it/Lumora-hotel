package middleware

import (
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"
	"lumora-backend/models"
	"lumora-backend/services"
)

const (
	ContextUserID = "userID"
	ContextRole   = "role"
)

// RequireAuth validates the Bearer JWT and stores the user id/role in locals.
func RequireAuth(auth *services.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		log.Printf("RequireAuth - Header: %s", header)
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			log.Printf("RequireAuth - Missing or malformed auth header")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "missing or malformed authorization header"})
		}

		tokenString := strings.TrimPrefix(header, "Bearer ")
		userID, role, err := auth.ParseToken(tokenString)
		if err != nil {
			log.Printf("RequireAuth - Token parse error: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid or expired token"})
		}

		log.Printf("RequireAuth - User ID: %s, Role: %s", userID, role)
		c.Locals(ContextUserID, userID)
		c.Locals(ContextRole, role)
		return c.Next()
	}
}

// RequireAdmin must run after RequireAuth.
func RequireAdmin(c *fiber.Ctx) error {
	role, _ := c.Locals(ContextRole).(models.Role)
	if role != models.RoleAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "admin access required"})
	}
	return c.Next()
}
