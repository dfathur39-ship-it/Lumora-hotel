package repositories

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"lumora-backend/models"
)

type FavoriteRepository struct {
	db *pgxpool.Pool
}

func NewFavoriteRepository(db *pgxpool.Pool) *FavoriteRepository {
	return &FavoriteRepository{db: db}
}

func (r *FavoriteRepository) Add(ctx context.Context, userID, hotelID string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO favorites (user_id, hotel_id) VALUES ($1, $2)
		ON CONFLICT (user_id, hotel_id) DO NOTHING`, userID, hotelID)
	return err
}

func (r *FavoriteRepository) Remove(ctx context.Context, userID, hotelID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM favorites WHERE user_id = $1 AND hotel_id = $2`, userID, hotelID)
	return err
}

func (r *FavoriteRepository) ListByUser(ctx context.Context, userID string) ([]models.Hotel, error) {
	query := `
		SELECT h.id, h.name, h.location, h.description, h.image, h.gallery, h.rating, h.price_from, h.amenities, h.created_at
		FROM favorites f
		JOIN hotels h ON h.id = f.hotel_id
		WHERE f.user_id = $1
		ORDER BY f.created_at DESC`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var hotels []models.Hotel
	for rows.Next() {
		var h models.Hotel
		if err := rows.Scan(&h.ID, &h.Name, &h.Location, &h.Description, &h.Image, &h.Gallery, &h.Rating, &h.PriceFrom, &h.Amenities, &h.CreatedAt); err != nil {
			return nil, err
		}
		hotels = append(hotels, h)
	}
	return hotels, rows.Err()
}
