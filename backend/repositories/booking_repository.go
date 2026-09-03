package repositories

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"lumora-backend/models"
)

type BookingRepository struct {
	db *pgxpool.Pool
}

func NewBookingRepository(db *pgxpool.Pool) *BookingRepository {
	return &BookingRepository{db: db}
}

const bookingColumns = `
	b.id, b.booking_code, b.user_id, b.hotel_id, h.name, h.location, b.room_id, rm.name,
	b.check_in, b.check_out, b.guests, b.guest_name, b.guest_email, b.guest_phone,
	b.nights, b.total, b.rooms_count, b.status, b.payment_method, b.payment_status, b.payment_provider,
	b.transaction_id, b.paid_at, b.payment_expires_at, b.created_at`

func scanBooking(row pgx.Row) (*models.Booking, error) {
	var b models.Booking
	err := row.Scan(
		&b.ID, &b.BookingCode, &b.UserID, &b.HotelID, &b.HotelName, &b.Location, &b.RoomID, &b.RoomName,
		&b.CheckIn, &b.CheckOut, &b.Guests, &b.GuestName, &b.GuestEmail, &b.GuestPhone,
		&b.Nights, &b.Total, &b.RoomsCount, &b.Status, &b.PaymentMethod, &b.PaymentStatus, &b.PaymentProvider,
		&b.TransactionID, &b.PaidAt, &b.PaymentExpiresAt, &b.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BookingRepository) Create(ctx context.Context, b models.Booking) (*models.Booking, error) {
	query := `
		INSERT INTO bookings (
			id, booking_code, user_id, hotel_id, room_id, check_in, check_out, guests,
			guest_name, guest_email, guest_phone, nights, total, rooms_count, status,
			payment_method, payment_status, payment_provider, payment_expires_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
		RETURNING created_at`

	if b.RoomsCount < 1 {
		b.RoomsCount = 1
	}

	err := r.db.QueryRow(ctx, query,
		b.ID, b.BookingCode, b.UserID, b.HotelID, b.RoomID, b.CheckIn, b.CheckOut, b.Guests,
		b.GuestName, b.GuestEmail, b.GuestPhone, b.Nights, b.Total, b.RoomsCount, b.Status,
		b.PaymentMethod, b.PaymentStatus, b.PaymentProvider, b.PaymentExpiresAt,
	).Scan(&b.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// HasOverlap reports whether the given room already has a pending or
// confirmed booking whose date range overlaps [checkIn, checkOut).
// Cancelled bookings never block; expired-payment bookings are cancelled
// separately so they stop blocking too. Called before every new booking
// to prevent double-booking the same room for the same dates.
func (r *BookingRepository) HasOverlap(ctx context.Context, roomID string, checkIn, checkOut time.Time) (bool, error) {
	query := `
		SELECT EXISTS (
			SELECT 1 FROM bookings
			WHERE room_id = $1
			  AND status IN ('pending', 'confirmed')
			  AND check_in < $3
			  AND check_out > $2
		)`
	var exists bool
	err := r.db.QueryRow(ctx, query, roomID, checkIn, checkOut).Scan(&exists)
	return exists, err
}

func (r *BookingRepository) ListByUser(ctx context.Context, userID string) ([]models.Booking, error) {
	query := `
		SELECT ` + bookingColumns + `
		FROM bookings b
		JOIN hotels h ON h.id = b.hotel_id
		JOIN rooms rm ON rm.id = b.room_id
		WHERE b.user_id = $1
		ORDER BY b.created_at DESC`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []models.Booking
	for rows.Next() {
		b, err := scanBooking(rows)
		if err != nil {
			return nil, err
		}
		bookings = append(bookings, *b)
	}
	return bookings, rows.Err()
}

func (r *BookingRepository) GetByID(ctx context.Context, id string) (*models.Booking, error) {
	query := `
		SELECT ` + bookingColumns + `
		FROM bookings b
		JOIN hotels h ON h.id = b.hotel_id
		JOIN rooms rm ON rm.id = b.room_id
		WHERE b.id = $1`

	return scanBooking(r.db.QueryRow(ctx, query, id))
}

func (r *BookingRepository) GetByCode(ctx context.Context, code string) (*models.Booking, error) {
	query := `
		SELECT ` + bookingColumns + `
		FROM bookings b
		JOIN hotels h ON h.id = b.hotel_id
		JOIN rooms rm ON rm.id = b.room_id
		WHERE b.booking_code = $1`

	return scanBooking(r.db.QueryRow(ctx, query, code))
}

func (r *BookingRepository) GetByTransactionID(ctx context.Context, transactionID string) (*models.Booking, error) {
	query := `
		SELECT ` + bookingColumns + `
		FROM bookings b
		JOIN hotels h ON h.id = b.hotel_id
		JOIN rooms rm ON rm.id = b.room_id
		WHERE b.transaction_id = $1`

	return scanBooking(r.db.QueryRow(ctx, query, transactionID))
}

func (r *BookingRepository) Cancel(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `UPDATE bookings SET status = $1 WHERE id = $2`, models.BookingCancelled, id)
	return err
}

// SetPaymentInitiated records that a payment attempt has started with a
// given provider/transaction id and, for methods with a time limit
// (QRIS, card), when it expires.
func (r *BookingRepository) SetPaymentInitiated(ctx context.Context, id, provider, transactionID string, expiresAt *time.Time) error {
	_, err := r.db.Exec(ctx, `
		UPDATE bookings
		SET payment_provider = $2, transaction_id = $3, payment_expires_at = $4, payment_status = 'pending'
		WHERE id = $1`,
		id, provider, transactionID, expiresAt,
	)
	return err
}

// MarkPaid transitions a booking to paid/confirmed. Idempotent: calling it
// twice for the same booking is harmless (e.g. a webhook retried).
func (r *BookingRepository) MarkPaid(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE bookings
		SET payment_status = 'paid', status = 'confirmed', paid_at = now()
		WHERE id = $1`,
		id,
	)
	return err
}

// MarkPaymentFailed sets payment_status without changing booking_status,
// so the guest can retry payment on the same booking.
func (r *BookingRepository) MarkPaymentFailed(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `UPDATE bookings SET payment_status = 'failed' WHERE id = $1`, id)
	return err
}

// ExpirePendingPayments cancels bookings whose payment window has passed
// without being paid, freeing the room back up. Safe to call repeatedly
// (e.g. from a periodic job or lazily on each history/availability read).
func (r *BookingRepository) ExpirePendingPayments(ctx context.Context) error {
	_, err := r.db.Exec(ctx, `
		UPDATE bookings
		SET payment_status = 'expired', status = 'cancelled'
		WHERE payment_status = 'pending'
		  AND payment_expires_at IS NOT NULL
		  AND payment_expires_at < now()`,
	)
	return err
}

// ListAll returns every booking in the system, newest first — for admin use only.
func (r *BookingRepository) ListAll(ctx context.Context) ([]models.Booking, error) {
	query := `
		SELECT ` + bookingColumns + `
		FROM bookings b
		JOIN hotels h ON h.id = b.hotel_id
		JOIN rooms rm ON rm.id = b.room_id
		ORDER BY b.created_at DESC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []models.Booking
	for rows.Next() {
		b, err := scanBooking(rows)
		if err != nil {
			return nil, err
		}
		bookings = append(bookings, *b)
	}
	return bookings, rows.Err()
}

// Stats holds simple aggregate counts for the admin dashboard.
type Stats struct {
	TotalHotels       int `json:"totalHotels"`
	TotalBookings     int `json:"totalBookings"`
	ConfirmedBookings int `json:"confirmedBookings"`
	CancelledBookings int `json:"cancelledBookings"`
	TotalUsers        int `json:"totalUsers"`
	RevenueConfirmed  int `json:"revenueConfirmed"`
}

func (r *BookingRepository) Stats(ctx context.Context) (*Stats, error) {
	var s Stats
	err := r.db.QueryRow(ctx, `
		SELECT
			(SELECT count(*) FROM hotels),
			(SELECT count(*) FROM bookings),
			(SELECT count(*) FROM bookings WHERE status = 'confirmed'),
			(SELECT count(*) FROM bookings WHERE status = 'cancelled'),
			(SELECT count(*) FROM users),
			(SELECT coalesce(sum(total), 0) FROM bookings WHERE payment_status = 'paid')
	`).Scan(&s.TotalHotels, &s.TotalBookings, &s.ConfirmedBookings, &s.CancelledBookings, &s.TotalUsers, &s.RevenueConfirmed)
	if err != nil {
		return nil, err
	}
	return &s, nil
}
