package repositories

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"lumora-backend/models"
)

type HotelRepository struct {
	db *pgxpool.Pool
}

func NewHotelRepository(db *pgxpool.Pool) *HotelRepository {
	return &HotelRepository{db: db}
}

func (r *HotelRepository) List(ctx context.Context, destination string) ([]models.Hotel, error) {
	query := `
		SELECT id, name, location, description, image, gallery, rating, price_from, amenities, created_at
		FROM hotels
		WHERE ($1 = '' OR location ILIKE '%' || $1 || '%')
		ORDER BY rating DESC`

	rows, err := r.db.Query(ctx, query, destination)
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

func (r *HotelRepository) GetByID(ctx context.Context, id string) (*models.Hotel, error) {
	query := `
		SELECT id, name, location, description, image, gallery, rating, price_from, amenities, created_at
		FROM hotels WHERE id = $1`

	var h models.Hotel
	err := r.db.QueryRow(ctx, query, id).Scan(
		&h.ID, &h.Name, &h.Location, &h.Description, &h.Image, &h.Gallery, &h.Rating, &h.PriceFrom, &h.Amenities, &h.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *HotelRepository) Create(ctx context.Context, h models.Hotel) (*models.Hotel, error) {
	query := `
		INSERT INTO hotels (id, name, location, description, image, gallery, rating, price_from, amenities)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING created_at`

	err := r.db.QueryRow(ctx, query,
		h.ID, h.Name, h.Location, h.Description, h.Image, h.Gallery, h.Rating, h.PriceFrom, h.Amenities,
	).Scan(&h.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *HotelRepository) Update(ctx context.Context, h models.Hotel) (*models.Hotel, error) {
	query := `
		UPDATE hotels
		SET name = $2, location = $3, description = $4, image = $5, gallery = $6, rating = $7, price_from = $8, amenities = $9
		WHERE id = $1
		RETURNING created_at`

	err := r.db.QueryRow(ctx, query,
		h.ID, h.Name, h.Location, h.Description, h.Image, h.Gallery, h.Rating, h.PriceFrom, h.Amenities,
	).Scan(&h.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *HotelRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM hotels WHERE id = $1`, id)
	return err
}
