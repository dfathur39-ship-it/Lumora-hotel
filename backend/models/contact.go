package models

import "time"

type Contact struct {
	ID          string    `json:"id"`
	WhatsApp    *string   `json:"whatsapp,omitempty"`
	Instagram   *string   `json:"instagram,omitempty"`
	TikTok      *string   `json:"tiktok,omitempty"`
	Email       *string   `json:"email,omitempty"`
	Phone       *string   `json:"phone,omitempty"`
	Address     *string   `json:"address,omitempty"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   *time.Time `json:"updatedAt,omitempty"`
}

type SocialMediaType string

const (
	SocialWhatsApp  SocialMediaType = "whatsapp"
	SocialInstagram SocialMediaType = "instagram"
	SocialTikTok    SocialMediaType = "tiktok"
)
