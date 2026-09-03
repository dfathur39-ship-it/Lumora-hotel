package repositories

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"lumora-backend/models"
)

type ReviewRepository struct {
	db *pgxpool.Pool
}

func NewReviewRepository(db *pgxpool.Pool) *ReviewRepository {
	return &ReviewRepository{db: db}
}

func (r *ReviewRepository) Create(ctx context.Context, rev models.Review) (*models.Review, error) {
	query := `
		INSERT INTO reviews (id, hotel_id, user_id, rating, comment)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING created_at`

	err := r.db.QueryRow(ctx, query, rev.ID, rev.HotelID, rev.UserID, rev.Rating, rev.Comment).Scan(&rev.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &rev, nil
}

func (r *ReviewRepository) ListByHotel(ctx context.Context, hotelID string) ([]models.Review, error) {
	query := `
		SELECT r.id, r.hotel_id, r.user_id, u.name, r.rating, r.comment, r.created_at
		FROM reviews r
		JOIN users u ON u.id = r.user_id
		WHERE r.hotel_id = $1
		ORDER BY r.created_at DESC`

	rows, err := r.db.Query(ctx, query, hotelID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var rev models.Review
		if err := rows.Scan(&rev.ID, &rev.HotelID, &rev.UserID, &rev.UserName, &rev.Rating, &rev.Comment, &rev.CreatedAt); err != nil {
			return nil, err
		}
		reviews = append(reviews, rev)
	}
	return reviews, rows.Err()
}

// ListRecent returns the most recent reviews across every hotel, with the
// hotel's name/id attached — used for the homepage testimonials section.
func (r *ReviewRepository) ListRecent(ctx context.Context, limit int) ([]models.Review, error) {
	query := `
		SELECT r.id, r.hotel_id, r.user_id, u.name, r.rating, r.comment, r.created_at, h.name
		FROM reviews r
		JOIN users u ON u.id = r.user_id
		JOIN hotels h ON h.id = r.hotel_id
		WHERE length(r.comment) > 0
		ORDER BY r.created_at DESC
		LIMIT $1`

	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var rev models.Review
		if err := rows.Scan(&rev.ID, &rev.HotelID, &rev.UserID, &rev.UserName, &rev.Rating, &rev.Comment, &rev.CreatedAt, &rev.HotelName); err != nil {
			return nil, err
		}
		reviews = append(reviews, rev)
	}
	return reviews, rows.Err()
}
