package repositories

import (
	"context"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"lumora-backend/models"
)

type RoomRepository struct {
	db *pgxpool.Pool
}

func NewRoomRepository(db *pgxpool.Pool) *RoomRepository {
	return &RoomRepository{db: db}
}

const roomColumns = `
	id, hotel_id, name, description, price, capacity, size, image, amenities,
	bed_type, bed_count, bedroom_count, max_adults, max_children,
	discount_percent, badge, status, breakfast, parking, wifi, total_units,
	updated_at, deleted_at`

func scanRoom(row pgx.Row) (*models.Room, error) {
	var room models.Room
	if err := row.Scan(
		&room.ID, &room.HotelID, &room.Name, &room.Description, &room.Price, &room.Capacity, &room.Size, &room.Image, &room.Amenities,
		&room.BedType, &room.BedCount, &room.BedroomCount, &room.MaxAdults, &room.MaxChildren,
		&room.DiscountPercent, &room.Badge, &room.Status, &room.Breakfast, &room.Parking, &room.Wifi, &room.TotalUnits,
		&room.UpdatedAt, &room.DeletedAt,
	); err != nil {
		return nil, err
	}
	return &room, nil
}

// AvailabilityQuery narrows a room list down to what a guest could
// actually book right now. Every field is optional — a zero value means
// "don't filter on this".
type AvailabilityQuery struct {
	CheckIn     *time.Time
	CheckOut    *time.Time
	Adults      int
	Children    int
	RoomsWanted int
}

// ListByHotel returns every non-deleted room for a hotel, attaching image
// gallery and facility list to each. If q is non-nil, only rooms with
// status "available" are considered, and (when q has dates) AvailableUnits
// and pricing are computed for those dates. Public callers (the "Choose
// your room" page) should always pass q; admin tooling passes nil to see
// every room regardless of status.
func (r *RoomRepository) ListByHotel(ctx context.Context, hotelID string, q *AvailabilityQuery) ([]models.Room, error) {
	query := `SELECT ` + roomColumns + ` FROM rooms WHERE hotel_id = $1 AND deleted_at IS NULL`
	if q != nil {
		query += ` AND status = 'available'`
	}
	query += ` ORDER BY price ASC`

	rows, err := r.db.Query(ctx, query, hotelID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rooms []models.Room
	for rows.Next() {
		room, err := scanRoom(rows)
		if err != nil {
			return nil, err
		}
		rooms = append(rooms, *room)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if err := r.attachImagesAndFacilities(ctx, rooms); err != nil {
		return nil, err
	}

	if q == nil {
		return rooms, nil
	}
	return r.applyAvailability(ctx, rooms, q)
}

// applyAvailability filters out rooms that can't take the requested party
// size, computes AvailableUnits from real bookings (never trusting the
// frontend), and — when dates are supplied — fills in nights/pricing so
// the client never has to compute money itself.
func (r *RoomRepository) applyAvailability(ctx context.Context, rooms []models.Room, q *AvailabilityQuery) ([]models.Room, error) {
	var nights int
	if q.CheckIn != nil && q.CheckOut != nil {
		nights = int(q.CheckOut.Sub(*q.CheckIn).Hours() / 24)
		if nights < 1 {
			nights = 1
		}
	}
	roomsWanted := q.RoomsWanted
	if roomsWanted < 1 {
		roomsWanted = 1
	}

	filtered := make([]models.Room, 0, len(rooms))
	for _, room := range rooms {
		if q.Adults > 0 && q.Adults > room.MaxAdults*roomsWanted {
			continue
		}
		if q.Children > room.MaxChildren*roomsWanted {
			continue
		}

		available := room.TotalUnits
		if q.CheckIn != nil && q.CheckOut != nil {
			booked, err := r.bookedUnits(ctx, room.ID, *q.CheckIn, *q.CheckOut)
			if err != nil {
				return nil, err
			}
			available = room.TotalUnits - booked
			if available < 0 {
				available = 0
			}
		}
		avail := available
		room.AvailableUnits = &avail

		if nights > 0 {
			discounted := room.Price - (room.Price * room.DiscountPercent / 100)
			room.Nights = nights
			room.PricePerNight = discounted
			room.TotalPrice = discounted * nights * roomsWanted
		}

		filtered = append(filtered, room)
	}
	return filtered, nil
}

// bookedUnits sums rooms_count across every pending/confirmed booking for
// this room whose date range overlaps [checkIn, checkOut).
func (r *RoomRepository) bookedUnits(ctx context.Context, roomID string, checkIn, checkOut time.Time) (int, error) {
	var booked int
	err := r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(rooms_count), 0) FROM bookings
		WHERE room_id = $1
		  AND status IN ('pending', 'confirmed')
		  AND check_in < $3
		  AND check_out > $2`,
		roomID, checkIn, checkOut,
	).Scan(&booked)
	return booked, err
}

// AvailableUnits reports how many units of a room are free for a date
// range right now — used by the booking service to reject a request the
// frontend under-reported or that raced another guest.
func (r *RoomRepository) AvailableUnits(ctx context.Context, roomID string, checkIn, checkOut time.Time) (int, error) {
	room, err := r.GetByID(ctx, roomID)
	if err != nil {
		return 0, err
	}
	booked, err := r.bookedUnits(ctx, roomID, checkIn, checkOut)
	if err != nil {
		return 0, err
	}
	available := room.TotalUnits - booked
	if available < 0 {
		available = 0
	}
	return available, nil
}

func (r *RoomRepository) GetByID(ctx context.Context, id string) (*models.Room, error) {
	query := `SELECT ` + roomColumns + ` FROM rooms WHERE id = $1 AND deleted_at IS NULL`
	room, err := scanRoom(r.db.QueryRow(ctx, query, id))
	if err != nil {
		return nil, err
	}
	rooms := []models.Room{*room}
	if err := r.attachImagesAndFacilities(ctx, rooms); err != nil {
		return nil, err
	}
	return &rooms[0], nil
}

// ListAllForAdmin returns rooms across every hotel, including
// hidden/maintenance ones, for the admin Room Management dashboard.
// status="archived" returns soft-deleted rooms instead. Optional filters
// narrow the result; empty strings mean "no filter".
func (r *RoomRepository) ListAllForAdmin(ctx context.Context, hotelID, status, search string) ([]models.Room, error) {
	query := `SELECT ` + roomColumns + ` FROM rooms WHERE 1=1`
	var args []interface{}

	if hotelID != "" {
		args = append(args, hotelID)
		query += ` AND hotel_id = $` + strconv.Itoa(len(args))
	}
	if status == "archived" {
		query += ` AND deleted_at IS NOT NULL`
	} else {
		query += ` AND deleted_at IS NULL`
		if status != "" {
			args = append(args, status)
			query += ` AND status = $` + strconv.Itoa(len(args))
		}
	}
	if search != "" {
		args = append(args, "%"+search+"%")
		query += ` AND name ILIKE $` + strconv.Itoa(len(args))
	}
	query += ` ORDER BY updated_at DESC`

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rooms []models.Room
	for rows.Next() {
		room, err := scanRoom(rows)
		if err != nil {
			return nil, err
		}
		rooms = append(rooms, *room)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := r.attachImagesAndFacilities(ctx, rooms); err != nil {
		return nil, err
	}
	return rooms, nil
}

func (r *RoomRepository) attachImagesAndFacilities(ctx context.Context, rooms []models.Room) error {
	if len(rooms) == 0 {
		return nil
	}
	ids := make([]string, len(rooms))
	index := make(map[string]int, len(rooms))
	for i, room := range rooms {
		ids[i] = room.ID
		index[room.ID] = i
	}

	imgRows, err := r.db.Query(ctx, `
		SELECT id, room_id, image_url, is_primary, display_order
		FROM room_images WHERE room_id = ANY($1) ORDER BY room_id, display_order ASC`, ids)
	if err != nil {
		return err
	}
	defer imgRows.Close()
	for imgRows.Next() {
		var img models.RoomImage
		if err := imgRows.Scan(&img.ID, &img.RoomID, &img.ImageURL, &img.IsPrimary, &img.DisplayOrder); err != nil {
			return err
		}
		if i, ok := index[img.RoomID]; ok {
			rooms[i].Images = append(rooms[i].Images, img)
		}
	}
	if err := imgRows.Err(); err != nil {
		return err
	}

	facRows, err := r.db.Query(ctx, `
		SELECT id, room_id, facility_name, icon
		FROM room_facilities WHERE room_id = ANY($1) ORDER BY facility_name ASC`, ids)
	if err != nil {
		return err
	}
	defer facRows.Close()
	for facRows.Next() {
		var f models.RoomFacility
		if err := facRows.Scan(&f.ID, &f.RoomID, &f.Name, &f.Icon); err != nil {
			return err
		}
		if i, ok := index[f.RoomID]; ok {
			rooms[i].Facilities = append(rooms[i].Facilities, f)
		}
	}
	return facRows.Err()
}

func (r *RoomRepository) Create(ctx context.Context, room models.Room) (*models.Room, error) {
	query := `
		INSERT INTO rooms (
			id, hotel_id, name, description, price, capacity, size, image, amenities,
			bed_type, bed_count, bedroom_count, max_adults, max_children,
			discount_percent, badge, status, breakfast, parking, wifi, total_units
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`

	_, err := r.db.Exec(ctx, query,
		room.ID, room.HotelID, room.Name, room.Description, room.Price, room.Capacity, room.Size, room.Image, room.Amenities,
		room.BedType, room.BedCount, room.BedroomCount, room.MaxAdults, room.MaxChildren,
		room.DiscountPercent, room.Badge, room.Status, room.Breakfast, room.Parking, room.Wifi, room.TotalUnits,
	)
	if err != nil {
		return nil, err
	}
	if err := r.ReplaceImages(ctx, room.ID, room.Images); err != nil {
		return nil, err
	}
	if err := r.ReplaceFacilities(ctx, room.ID, room.Facilities); err != nil {
		return nil, err
	}
	return r.GetByID(ctx, room.ID)
}

func (r *RoomRepository) Update(ctx context.Context, room models.Room) (*models.Room, error) {
	query := `
		UPDATE rooms
		SET name = $2, description = $3, price = $4, capacity = $5, size = $6, image = $7, amenities = $8,
			bed_type = $9, bed_count = $10, bedroom_count = $11, max_adults = $12, max_children = $13,
			discount_percent = $14, badge = $15, status = $16, breakfast = $17, parking = $18, wifi = $19,
			total_units = $20, updated_at = now()
		WHERE id = $1`

	_, err := r.db.Exec(ctx, query,
		room.ID, room.Name, room.Description, room.Price, room.Capacity, room.Size, room.Image, room.Amenities,
		room.BedType, room.BedCount, room.BedroomCount, room.MaxAdults, room.MaxChildren,
		room.DiscountPercent, room.Badge, room.Status, room.Breakfast, room.Parking, room.Wifi, room.TotalUnits,
	)
	if err != nil {
		return nil, err
	}
	if room.Images != nil {
		if err := r.ReplaceImages(ctx, room.ID, room.Images); err != nil {
			return nil, err
		}
	}
	if room.Facilities != nil {
		if err := r.ReplaceFacilities(ctx, room.ID, room.Facilities); err != nil {
			return nil, err
		}
	}
	return r.GetByID(ctx, room.ID)
}

// ReplaceImages overwrites a room's entire gallery. Simpler and safer
// than fine-grained add/remove/reorder endpoints: the admin form always
// submits the full ordered list, so there's a single source of truth and
// no risk of order/primary drifting out of sync between calls.
func (r *RoomRepository) ReplaceImages(ctx context.Context, roomID string, images []models.RoomImage) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM room_images WHERE room_id = $1`, roomID); err != nil {
		return err
	}
	primarySet := false
	for i, img := range images {
		isPrimary := img.IsPrimary && !primarySet
		if isPrimary {
			primarySet = true
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO room_images (room_id, image_url, is_primary, display_order)
			VALUES ($1, $2, $3, $4)`,
			roomID, img.ImageURL, isPrimary, i,
		); err != nil {
			return err
		}
	}
	// If nothing was marked primary but images exist, the first one wins —
	// the room card always needs a definite cover photo.
	if !primarySet && len(images) > 0 {
		if _, err := tx.Exec(ctx, `
			UPDATE room_images SET is_primary = true
			WHERE room_id = $1 AND display_order = 0`, roomID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ReplaceFacilities overwrites a room's entire facility list, same
// rationale as ReplaceImages.
func (r *RoomRepository) ReplaceFacilities(ctx context.Context, roomID string, facilities []models.RoomFacility) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM room_facilities WHERE room_id = $1`, roomID); err != nil {
		return err
	}
	for _, f := range facilities {
		if f.Name == "" {
			continue
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO room_facilities (room_id, facility_name, icon)
			VALUES ($1, $2, $3)`,
			roomID, f.Name, f.Icon,
		); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// SetStatus is the quick hide/show/maintenance toggle from the admin room
// list, without going through the full edit form.
func (r *RoomRepository) SetStatus(ctx context.Context, id string, status models.RoomStatus) error {
	_, err := r.db.Exec(ctx, `UPDATE rooms SET status = $2, updated_at = now() WHERE id = $1 AND deleted_at IS NULL`, id, status)
	return err
}

// Delete soft-deletes a room: existing bookings keep referencing valid
// history, but the room disappears from every public and admin listing
// (aside from ListAllForAdmin with status="archived").
func (r *RoomRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `UPDATE rooms SET deleted_at = now(), status = 'hidden' WHERE id = $1`, id)
	return err
}
