package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"log"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"lumora-backend/models"
	"lumora-backend/repositories"
)

var ErrInvalidCredentials = errors.New("invalid email or password")
var ErrEmailTaken = errors.New("an account with this email already exists")
var ErrInvalidToken = errors.New("invalid or expired reset token")
var ErrTokenNotApproved = errors.New("reset token has not been approved yet")
var ErrTokenExpired = errors.New("reset token has expired")
var ErrTokenAlreadyUsed = errors.New("reset token has already been used")

type AuthService struct {
	users         *repositories.UserRepository
	passwordReset *repositories.PasswordResetRepository
	jwtSecret     []byte
}

func NewAuthService(users *repositories.UserRepository, passwordReset *repositories.PasswordResetRepository, jwtSecret string) *AuthService {
	return &AuthService{
		users:         users,
		passwordReset: passwordReset,
		jwtSecret:     []byte(jwtSecret),
	}
}

// normalizeEmail trims surrounding whitespace and lowercases the email so
// registration and login always compare the same normalized value. Without
// this, "Budi@gmail.com" (register) vs "budi@gmail.com" (login, e.g. due to
// a phone keyboard auto-capitalizing the first letter) would be treated as
// two different accounts and login would fail even with the right password.
func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func (s *AuthService) Register(ctx context.Context, name, email, password string) (*models.User, string, error) {
	email = normalizeEmail(email)

	if _, err := s.users.GetByEmail(ctx, email); err == nil {
		return nil, "", ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	user := models.User{
		ID:           uuid.NewString(),
		Name:         name,
		Email:        email,
		PasswordHash: string(hash),
		Role:         models.RoleUser,
	}

	created, err := s.users.Create(ctx, user)
	if err != nil {
		return nil, "", err
	}

	token, err := s.generateToken(created.ID, created.Role)
	if err != nil {
		return nil, "", err
	}

	return created, token, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*models.User, string, error) {
	email = normalizeEmail(email)
	log.Printf("Login attempt for email: %s", email)
	user, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		log.Printf("User not found for email %s: %v", email, err)
		return nil, "", ErrInvalidCredentials
	}

	log.Printf("User found: %s (role: %s), password hash length: %d", user.Email, user.Role, len(user.PasswordHash))
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		log.Printf("Password mismatch for %s: %v", email, err)
		return nil, "", ErrInvalidCredentials
	}

	token, err := s.generateToken(user.ID, user.Role)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) generateToken(userID string, role models.Role) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"exp":  time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *AuthService) ParseToken(tokenString string) (userID string, role models.Role, err error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return "", "", errors.New("invalid or expired token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", "", errors.New("invalid token claims")
	}

	sub, _ := claims["sub"].(string)
	roleStr, _ := claims["role"].(string)
	return sub, models.Role(roleStr), nil
}

func (s *AuthService) UpdateProfile(ctx context.Context, userID, name, email string) (*models.User, error) {
	email = normalizeEmail(email)

	// Check if email is already taken by another user
	existingUser, err := s.users.GetByEmail(ctx, email)
	if err == nil && existingUser.ID != userID {
		return nil, ErrEmailTaken
	}

	err = s.users.UpdateProfile(ctx, userID, name, email)
	if err != nil {
		return nil, err
	}

	return s.users.GetByID(ctx, userID)
}

func (s *AuthService) ChangePassword(ctx context.Context, userID, oldPassword, newPassword string) error {
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword)); err != nil {
		return ErrInvalidCredentials
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.users.UpdatePassword(ctx, userID, string(hash))
}

func (s *AuthService) RequestPasswordReset(ctx context.Context, email string) (*models.PasswordResetToken, error) {
	email = normalizeEmail(email)
	user, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		// Don't reveal if email exists or not for security
		return nil, nil
	}

	// Generate secure random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, err
	}
	token := hex.EncodeToString(tokenBytes)

	resetToken := models.PasswordResetToken{
		ID:          uuid.NewString(),
		UserID:      user.ID,
		Token:       token,
		Status:      models.ResetTokenPending,
		RequestedAt: time.Now(),
		ExpiresAt:   time.Now().Add(24 * time.Hour), // Token expires in 24 hours
	}

	return s.passwordReset.Create(ctx, resetToken)
}

func (s *AuthService) GetPendingResetRequests(ctx context.Context) ([]models.PasswordResetToken, error) {
	// Expire old tokens first
	_ = s.passwordReset.ExpireOldTokens(ctx)
	return s.passwordReset.GetPendingRequests(ctx)
}

func (s *AuthService) ApprovePasswordReset(ctx context.Context, tokenID, approvedBy string) error {
	return s.passwordReset.Approve(ctx, tokenID, approvedBy)
}

func (s *AuthService) RejectPasswordReset(ctx context.Context, tokenID, approvedBy string) error {
	return s.passwordReset.Reject(ctx, tokenID, approvedBy)
}

func (s *AuthService) ResetPassword(ctx context.Context, token, newPassword string) error {
	resetToken, err := s.passwordReset.GetByToken(ctx, token)
	if err != nil {
		return ErrInvalidToken
	}

	// Check if token is approved
	if resetToken.Status != models.ResetTokenApproved {
		if resetToken.Status == models.ResetTokenPending {
			return ErrTokenNotApproved
		} else if resetToken.Status == models.ResetTokenExpired {
			return ErrTokenExpired
		} else if resetToken.Status == models.ResetTokenUsed {
			return ErrTokenAlreadyUsed
		}
		return ErrInvalidToken
	}

	// Check if token is expired
	if time.Now().After(resetToken.ExpiresAt) {
		_ = s.passwordReset.ExpireOldTokens(ctx)
		return ErrTokenExpired
	}

	// Hash new password
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Update password
	if err := s.users.UpdatePassword(ctx, resetToken.UserID, string(hash)); err != nil {
		return err
	}

	// Mark token as used
	return s.passwordReset.MarkAsUsed(ctx, resetToken.ID)
}

func (s *AuthService) GetResetTokenByID(ctx context.Context, tokenID string) (*models.PasswordResetToken, error) {
	return s.passwordReset.GetByID(ctx, tokenID)
}

func (s *AuthService) GetResetTokenByTokenString(ctx context.Context, token string) (*models.PasswordResetToken, error) {
	return s.passwordReset.GetByTokenString(ctx, token)
}
