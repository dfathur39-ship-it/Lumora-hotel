package models

import "time"

type Role string

const (
	RoleUser  Role = "user"
	RoleAdmin Role = "admin"
)

type User struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"`
	CreatedAt    time.Time `json:"createdAt"`
}

type Hotel struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Location    string    `json:"location"`
	Description string    `json:"description"`
	Image       string    `json:"image"`
	Gallery     []string  `json:"gallery"`
	Rating      float64   `json:"rating"`
	PriceFrom   int       `json:"priceFrom"`
	Amenities   []string  `json:"amenities"`
	CreatedAt   time.Time `json:"createdAt"`
}

type RoomStatus string

const (
	RoomAvailable   RoomStatus = "available"
	RoomHidden      RoomStatus = "hidden"
	RoomMaintenance RoomStatus = "maintenance"
)

// RoomImage is one photo in a room's gallery. Order is display_order
// ascending; exactly one image per room should have IsPrimary = true.
type RoomImage struct {
	ID           string `json:"id"`
	RoomID       string `json:"roomId,omitempty"`
	ImageURL     string `json:"imageUrl"`
	IsPrimary    bool   `json:"isPrimary"`
	DisplayOrder int    `json:"displayOrder"`
}

// RoomFacility is a single admin-defined facility ("Free Wi-Fi", "TV", a
// custom one, etc). Icon is a lucide-react icon name resolved client-side;
// unrecognised names fall back to a generic icon so new facility types
// never require a frontend code change.
type RoomFacility struct {
	ID     string `json:"id"`
	RoomID string `json:"roomId,omitempty"`
	Name   string `json:"name"`
	Icon   string `json:"icon"`
}

type Room struct {
	ID              string         `json:"id"`
	HotelID         string         `json:"hotelId"`
	Name            string         `json:"name"`
	Description     string         `json:"description"`
	Price           int            `json:"price"`
	Capacity        int            `json:"capacity"`
	Size            int            `json:"size"`
	Image           string         `json:"image"`
	Amenities       []string       `json:"amenities"`
	BedType         string         `json:"bedType"`
	BedCount        int            `json:"bedCount"`
	BedroomCount    int            `json:"bedroomCount"`
	MaxAdults       int            `json:"maxAdults"`
	MaxChildren     int            `json:"maxChildren"`
	DiscountPercent int            `json:"discountPercent"`
	Badge           string         `json:"badge"`
	Status          RoomStatus     `json:"status"`
	Breakfast       bool           `json:"breakfast"`
	Parking         bool           `json:"parking"`
	Wifi            bool           `json:"wifi"`
	TotalUnits      int            `json:"totalUnits"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	DeletedAt       *time.Time     `json:"deletedAt,omitempty"`
	Images          []RoomImage    `json:"images"`
	Facilities      []RoomFacility `json:"facilities"`

	// The fields below are only populated by availability-aware queries
	// (i.e. when the caller supplied check-in/check-out dates), never
	// stored on the row itself.
	AvailableUnits *int     `json:"availableUnits,omitempty"`
	Nights         int      `json:"nights,omitempty"`
	PricePerNight  int      `json:"pricePerNight,omitempty"`
	TotalPrice     int      `json:"totalPrice,omitempty"`
	Rating         float64  `json:"rating,omitempty"`
	ReviewCount    int      `json:"reviewCount,omitempty"`
}

type BookingStatus string

const (
	BookingPending   BookingStatus = "pending"
	BookingConfirmed BookingStatus = "confirmed"
	BookingCancelled BookingStatus = "cancelled"
	BookingCompleted BookingStatus = "completed"
)

type PaymentMethod string

const (
	PaymentQRIS       PaymentMethod = "qris"
	PaymentCardBCA    PaymentMethod = "card_bca"
	PaymentPayPal     PaymentMethod = "paypal"
	PaymentAtHotel    PaymentMethod = "pay_at_hotel"
)

type PaymentStatus string

const (
	PaymentPending  PaymentStatus = "pending"
	PaymentPaid     PaymentStatus = "paid"
	PaymentFailed   PaymentStatus = "failed"
	PaymentExpired  PaymentStatus = "expired"
	PaymentRefunded PaymentStatus = "refunded"
	PaymentUnpaid   PaymentStatus = "unpaid"
)

type Booking struct {
	ID                string        `json:"id"`
	BookingCode       string        `json:"bookingCode"`
	UserID            string        `json:"userId"`
	HotelID           string        `json:"hotelId"`
	HotelName         string        `json:"hotelName"`
	Location          string        `json:"location"`
	RoomID            string        `json:"roomId"`
	RoomName          string        `json:"roomName"`
	CheckIn           time.Time     `json:"checkIn"`
	CheckOut          time.Time     `json:"checkOut"`
	Guests            int           `json:"guests"`
	RoomsCount        int           `json:"roomsCount"`
	GuestName         string        `json:"guestName"`
	GuestEmail        string        `json:"guestEmail"`
	GuestPhone        string        `json:"guestPhone"`
	Nights            int           `json:"nights"`
	Total             int           `json:"total"`
	Status            BookingStatus `json:"status"`
	PaymentMethod     PaymentMethod `json:"paymentMethod"`
	PaymentStatus     PaymentStatus `json:"paymentStatus"`
	PaymentProvider   *string       `json:"paymentProvider,omitempty"`
	TransactionID     *string       `json:"transactionId,omitempty"`
	PaidAt            *time.Time    `json:"paidAt,omitempty"`
	PaymentExpiresAt  *time.Time    `json:"paymentExpiresAt,omitempty"`
	CreatedAt         time.Time     `json:"createdAt"`
}

type Favorite struct {
	UserID    string    `json:"userId"`
	HotelID   string    `json:"hotelId"`
	CreatedAt time.Time `json:"createdAt"`
}

type Review struct {
	ID        string    `json:"id"`
	HotelID   string    `json:"hotelId"`
	HotelName string    `json:"hotelName,omitempty"`
	UserID    string    `json:"userId"`
	UserName  string    `json:"userName"`
	Rating    float64   `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"createdAt"`
}

type PasswordResetTokenStatus string

const (
	ResetTokenPending  PasswordResetTokenStatus = "pending"
	ResetTokenApproved PasswordResetTokenStatus = "approved"
	ResetTokenRejected PasswordResetTokenStatus = "rejected"
	ResetTokenUsed     PasswordResetTokenStatus = "used"
	ResetTokenExpired  PasswordResetTokenStatus = "expired"
)

type PasswordResetToken struct {
	ID          string                   `json:"id"`
	UserID      string                   `json:"userId"`
	Token       string                   `json:"token"`
	ApprovedBy  *string                  `json:"approvedBy,omitempty"`
	Status      PasswordResetTokenStatus `json:"status"`
	RequestedAt time.Time                `json:"requestedAt"`
	ApprovedAt  *time.Time               `json:"approvedAt,omitempty"`
	ExpiresAt   time.Time                `json:"expiresAt"`
	UsedAt      *time.Time               `json:"usedAt,omitempty"`
}
