package repositories

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"lumora-backend/models"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, u models.User) (*models.User, error) {
	query := `
		INSERT INTO users (id, name, email, password_hash, role)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING created_at`

	err := r.db.QueryRow(ctx, query, u.ID, u.Name, u.Email, u.PasswordHash, u.Role).Scan(&u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	// Case-insensitive match: emails are stored normalized (lowercase) going
	// forward, but this also covers older rows saved with mixed case so
	// existing accounts don't get locked out.
	query := `SELECT id, name, email, password_hash, role, created_at FROM users WHERE lower(email) = lower($1)`
	var u models.User
	err := r.db.QueryRow(ctx, query, email).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	query := `SELECT id, name, email, password_hash, role, created_at FROM users WHERE id = $1`
	var u models.User
	err := r.db.QueryRow(ctx, query, id).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) UpdateProfile(ctx context.Context, id, name, email string) error {
	query := `UPDATE users SET name = $1, email = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, name, email, id)
	return err
}

func (r *UserRepository) UpdatePassword(ctx context.Context, id, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, passwordHash, id)
	return err
}
