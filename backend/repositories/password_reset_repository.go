package repositories

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"lumora-backend/models"
)

type PasswordResetRepository struct {
	db *pgxpool.Pool
}

func NewPasswordResetRepository(db *pgxpool.Pool) *PasswordResetRepository {
	return &PasswordResetRepository{db: db}
}

func (r *PasswordResetRepository) Create(ctx context.Context, token models.PasswordResetToken) (*models.PasswordResetToken, error) {
	query := `
		INSERT INTO password_reset_tokens (id, user_id, token, status, requested_at, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, user_id, token, status, requested_at, expires_at`

	err := r.db.QueryRow(ctx, query,
		token.ID,
		token.UserID,
		token.Token,
		token.Status,
		token.RequestedAt,
		token.ExpiresAt,
	).Scan(
		&token.ID,
		&token.UserID,
		&token.Token,
		&token.Status,
		&token.RequestedAt,
		&token.ExpiresAt,
	)
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *PasswordResetRepository) GetByToken(ctx context.Context, token string) (*models.PasswordResetToken, error) {
	query := `
		SELECT id, user_id, token, approved_by, status, requested_at, approved_at, expires_at, used_at
		FROM password_reset_tokens
		WHERE token = $1`

	var t models.PasswordResetToken
	err := r.db.QueryRow(ctx, query, token).Scan(
		&t.ID,
		&t.UserID,
		&t.Token,
		&t.ApprovedBy,
		&t.Status,
		&t.RequestedAt,
		&t.ApprovedAt,
		&t.ExpiresAt,
		&t.UsedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *PasswordResetRepository) GetByTokenString(ctx context.Context, token string) (*models.PasswordResetToken, error) {
	query := `
		SELECT id, user_id, token, approved_by, status, requested_at, approved_at, expires_at, used_at
		FROM password_reset_tokens
		WHERE token = $1`

	var t models.PasswordResetToken
	err := r.db.QueryRow(ctx, query, token).Scan(
		&t.ID,
		&t.UserID,
		&t.Token,
		&t.ApprovedBy,
		&t.Status,
		&t.RequestedAt,
		&t.ApprovedAt,
		&t.ExpiresAt,
		&t.UsedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *PasswordResetRepository) GetByID(ctx context.Context, id string) (*models.PasswordResetToken, error) {
	query := `
		SELECT id, user_id, token, approved_by, status, requested_at, approved_at, expires_at, used_at
		FROM password_reset_tokens
		WHERE id = $1`

	var t models.PasswordResetToken
	err := r.db.QueryRow(ctx, query, id).Scan(
		&t.ID,
		&t.UserID,
		&t.Token,
		&t.ApprovedBy,
		&t.Status,
		&t.RequestedAt,
		&t.ApprovedAt,
		&t.ExpiresAt,
		&t.UsedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *PasswordResetRepository) GetPendingRequests(ctx context.Context) ([]models.PasswordResetToken, error) {
	query := `
		SELECT prt.id, prt.user_id, prt.token, prt.approved_by, prt.status, 
		       prt.requested_at, prt.approved_at, prt.expires_at, prt.used_at
		FROM password_reset_tokens prt
		WHERE prt.status = $1 AND prt.expires_at > NOW()
		ORDER BY prt.requested_at DESC`

	rows, err := r.db.Query(ctx, query, models.ResetTokenPending)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tokens []models.PasswordResetToken
	for rows.Next() {
		var t models.PasswordResetToken
		err := rows.Scan(
			&t.ID,
			&t.UserID,
			&t.Token,
			&t.ApprovedBy,
			&t.Status,
			&t.RequestedAt,
			&t.ApprovedAt,
			&t.ExpiresAt,
			&t.UsedAt,
		)
		if err != nil {
			return nil, err
		}
		tokens = append(tokens, t)
	}
	return tokens, rows.Err()
}

func (r *PasswordResetRepository) Approve(ctx context.Context, tokenID, approvedBy string) error {
	query := `
		UPDATE password_reset_tokens
		SET status = $1, approved_by = $2, approved_at = $3
		WHERE id = $4`

	_, err := r.db.Exec(ctx, query, models.ResetTokenApproved, approvedBy, time.Now(), tokenID)
	return err
}

func (r *PasswordResetRepository) Reject(ctx context.Context, tokenID, approvedBy string) error {
	query := `
		UPDATE password_reset_tokens
		SET status = $1, approved_by = $2, approved_at = $3
		WHERE id = $4`

	_, err := r.db.Exec(ctx, query, models.ResetTokenRejected, approvedBy, time.Now(), tokenID)
	return err
}

func (r *PasswordResetRepository) MarkAsUsed(ctx context.Context, tokenID string) error {
	query := `
		UPDATE password_reset_tokens
		SET status = $1, used_at = $2
		WHERE id = $3`

	_, err := r.db.Exec(ctx, query, models.ResetTokenUsed, time.Now(), tokenID)
	return err
}

func (r *PasswordResetRepository) ExpireOldTokens(ctx context.Context) error {
	query := `
		UPDATE password_reset_tokens
		SET status = $1
		WHERE status IN ($2, $3) AND expires_at <= NOW()`

	_, err := r.db.Exec(ctx, query, models.ResetTokenExpired, models.ResetTokenPending, models.ResetTokenApproved)
	return err
}
