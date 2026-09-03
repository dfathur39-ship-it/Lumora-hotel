package repositories

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"lumora-backend/models"
)

type ContactRepository struct {
	db *pgxpool.Pool
}

func NewContactRepository(db *pgxpool.Pool) *ContactRepository {
	return &ContactRepository{db: db}
}

func (r *ContactRepository) GetActive(ctx context.Context) (*models.Contact, error) {
	query := `
		SELECT id, whatsapp, instagram, tiktok, email, phone, address, is_active, created_at, updated_at
		FROM contacts
		WHERE is_active = true
		ORDER BY created_at DESC
		LIMIT 1`

	var c models.Contact
	err := r.db.QueryRow(ctx, query).Scan(
		&c.ID,
		&c.WhatsApp,
		&c.Instagram,
		&c.TikTok,
		&c.Email,
		&c.Phone,
		&c.Address,
		&c.IsActive,
		&c.CreatedAt,
		&c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *ContactRepository) GetByID(ctx context.Context, id string) (*models.Contact, error) {
	query := `
		SELECT id, whatsapp, instagram, tiktok, email, phone, address, is_active, created_at, updated_at
		FROM contacts
		WHERE id = $1`

	var c models.Contact
	err := r.db.QueryRow(ctx, query, id).Scan(
		&c.ID,
		&c.WhatsApp,
		&c.Instagram,
		&c.TikTok,
		&c.Email,
		&c.Phone,
		&c.Address,
		&c.IsActive,
		&c.CreatedAt,
		&c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *ContactRepository) Create(ctx context.Context, contact models.Contact) (*models.Contact, error) {
	query := `
		INSERT INTO contacts (id, whatsapp, instagram, tiktok, email, phone, address, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, whatsapp, instagram, tiktok, email, phone, address, is_active, created_at, updated_at`

	err := r.db.QueryRow(ctx, query,
		contact.ID,
		contact.WhatsApp,
		contact.Instagram,
		contact.TikTok,
		contact.Email,
		contact.Phone,
		contact.Address,
		contact.IsActive,
	).Scan(
		&contact.ID,
		&contact.WhatsApp,
		&contact.Instagram,
		&contact.TikTok,
		&contact.Email,
		&contact.Phone,
		&contact.Address,
		&contact.IsActive,
		&contact.CreatedAt,
		&contact.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &contact, nil
}

func (r *ContactRepository) Update(ctx context.Context, contact models.Contact) (*models.Contact, error) {
	query := `
		UPDATE contacts
		SET whatsapp = $1, instagram = $2, tiktok = $3, email = $4, phone = $5, address = $6, is_active = $7, updated_at = $8
		WHERE id = $9
		RETURNING id, whatsapp, instagram, tiktok, email, phone, address, is_active, created_at, updated_at`

	err := r.db.QueryRow(ctx, query,
		contact.WhatsApp,
		contact.Instagram,
		contact.TikTok,
		contact.Email,
		contact.Phone,
		contact.Address,
		contact.IsActive,
		time.Now(),
		contact.ID,
	).Scan(
		&contact.ID,
		&contact.WhatsApp,
		&contact.Instagram,
		&contact.TikTok,
		&contact.Email,
		&contact.Phone,
		&contact.Address,
		&contact.IsActive,
		&contact.CreatedAt,
		&contact.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &contact, nil
}

func (r *ContactRepository) DeactivateAll(ctx context.Context) error {
	query := `UPDATE contacts SET is_active = false`
	_, err := r.db.Exec(ctx, query)
	return err
}
