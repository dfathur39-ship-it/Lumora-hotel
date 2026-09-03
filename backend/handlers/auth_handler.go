package handlers

import (
	"errors"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"lumora-backend/middleware"
	"lumora-backend/models"
	"lumora-backend/repositories"
	"lumora-backend/services"
)

type AuthHandler struct {
	auth  *services.AuthService
	users *repositories.UserRepository
}

func NewAuthHandler(auth *services.AuthService, users *repositories.UserRepository) *AuthHandler {
	return &AuthHandler{auth: auth, users: users}
}

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type updateProfileRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type changePasswordRequest struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

type forgotPasswordRequest struct {
	Email string `json:"email"`
}

type resetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"newPassword"`
}

type approveResetRequest struct {
	TokenID string `json:"tokenId"`
}

// POST /api/auth/register
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req registerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.Name == "" || req.Email == "" || len(req.Password) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name, email, and a password of at least 8 characters are required"})
	}

	user, token, err := h.auth.Register(c.Context(), req.Name, req.Email, req.Password)
	if err != nil {
		if errors.Is(err, services.ErrEmailTaken) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not create account"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"user": user, "token": token})
}

// POST /api/auth/login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req loginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	user, token, err := h.auth.Login(c.Context(), req.Email, req.Password)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid email or password"})
	}

	return c.JSON(fiber.Map{"user": user, "token": token})
}

// GET /api/auth/me
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)

	user, err := h.users.GetByID(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}

	return c.JSON(fiber.Map{"user": user})
}

// PUT /api/auth/profile
func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)

	var req updateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if req.Name == "" || req.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name and email are required"})
	}

	user, err := h.auth.UpdateProfile(c.Context(), userID, req.Name, req.Email)
	if err != nil {
		if errors.Is(err, services.ErrEmailTaken) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not update profile"})
	}

	return c.JSON(fiber.Map{"user": user})
}

// POST /api/auth/change-password
func (h *AuthHandler) ChangePassword(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)
	
	log.Printf("ChangePassword called for userID: %s", userID)

	var req changePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		log.Printf("BodyParser error: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if len(req.NewPassword) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "new password must be at least 8 characters"})
	}

	err := h.auth.ChangePassword(c.Context(), userID, req.OldPassword, req.NewPassword)
	if err != nil {
		log.Printf("ChangePassword error: %v", err)
		if errors.Is(err, services.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "old password is incorrect"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not change password"})
	}

	return c.JSON(fiber.Map{"message": "password changed successfully"})
}

// POST /api/auth/forgot-password
func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	var req forgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if req.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "email is required"})
	}

	resetToken, err := h.auth.RequestPasswordReset(c.Context(), req.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not process request"})
	}

	if resetToken != nil {
		return c.JSON(fiber.Map{
			"message": "if the email exists, a password reset request has been submitted for admin approval",
			"requestId": resetToken.ID,
		})
	}

	return c.JSON(fiber.Map{"message": "if the email exists, a password reset request has been submitted for admin approval"})
}

// GET /api/auth/reset-requests (Admin only)
func (h *AuthHandler) GetResetRequests(c *fiber.Ctx) error {
	requests, err := h.auth.GetPendingResetRequests(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not fetch requests"})
	}

	return c.JSON(fiber.Map{"requests": requests})
}

// POST /api/auth/reset-requests/:id/approve (Admin only)
func (h *AuthHandler) ApproveResetRequest(c *fiber.Ctx) error {
	tokenID := c.Params("id")
	adminID, _ := c.Locals(middleware.ContextUserID).(string)

	err := h.auth.ApprovePasswordReset(c.Context(), tokenID, adminID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not approve request"})
	}

	return c.JSON(fiber.Map{"message": "password reset request approved"})
}

// POST /api/auth/reset-requests/:id/reject (Admin only)
func (h *AuthHandler) RejectResetRequest(c *fiber.Ctx) error {
	tokenID := c.Params("id")
	adminID, _ := c.Locals(middleware.ContextUserID).(string)

	err := h.auth.RejectPasswordReset(c.Context(), tokenID, adminID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not reject request"})
	}

	return c.JSON(fiber.Map{"message": "password reset request rejected"})
}

// POST /api/auth/reset-password
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req resetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if req.Token == "" || len(req.NewPassword) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "token and a password of at least 8 characters are required"})
	}

	err := h.auth.ResetPassword(c.Context(), req.Token, req.NewPassword)
	if err != nil {
		if errors.Is(err, services.ErrTokenNotApproved) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "password reset has not been approved yet"})
		} else if errors.Is(err, services.ErrTokenExpired) {
			return c.Status(fiber.StatusGone).JSON(fiber.Map{"error": "reset token has expired"})
		} else if errors.Is(err, services.ErrTokenAlreadyUsed) {
			return c.Status(fiber.StatusGone).JSON(fiber.Map{"error": "reset token has already been used"})
		} else if errors.Is(err, services.ErrInvalidToken) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid reset token"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not reset password"})
	}

	return c.JSON(fiber.Map{"message": "password reset successfully"})
}

// POST /api/auth/verify-reset-token
func (h *AuthHandler) VerifyResetToken(c *fiber.Ctx) error {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	token, err := h.auth.GetResetTokenByTokenString(c.Context(), req.Token)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "token not found"})
	}

	if token.Status != models.ResetTokenApproved {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "token not approved"})
	}

	if time.Now().After(token.ExpiresAt) {
		_, _ = h.auth.GetResetTokenByID(c.Context(), token.ID)
		return c.Status(fiber.StatusGone).JSON(fiber.Map{"error": "token expired"})
	}

	return c.JSON(fiber.Map{"valid": true, "userId": token.UserID})
}

// GET /api/auth/reset-status/:requestId
func (h *AuthHandler) GetResetStatus(c *fiber.Ctx) error {
	requestID := c.Params("requestId")
	
	resetToken, err := h.auth.GetResetTokenByID(c.Context(), requestID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "request not found"})
	}

	return c.JSON(fiber.Map{
		"status": resetToken.Status,
		"token": resetToken.Token,
		"requestedAt": resetToken.RequestedAt,
		"approvedAt": resetToken.ApprovedAt,
		"expiresAt": resetToken.ExpiresAt,
	})
}
