package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	CORSOrigin  string

	// Payment (PayPal is the only real gateway wired up; QRIS and card/BCA
	// use in-process sandbox providers that need no credentials — see
	// services/payment). All optional: if PayPalClientID/Secret are empty,
	// the PayPal payment method is simply unavailable rather than crashing
	// the server on boot.
	PayPalClientID     string
	PayPalClientSecret string
	PayPalMode         string
	PayPalReturnURL    string
	PayPalCancelURL    string

	// Supabase Storage (used for uploaded images — required on serverless
	// hosts like Vercel where the local filesystem is not persistent).
	SupabaseURL        string
	SupabaseServiceKey string
	SupabaseBucket     string
}

// Load reads environment variables (via .env in development) into a Config.
// It never logs secret values — only whether they were found.
func Load() *Config {
	// Try to load .env from common locations
	envPaths := []string{
		".env",
		"../.env",
		"../../.env",
	}

	var envFound bool
	for _, path := range envPaths {
		if _, err := os.Stat(path); err == nil {
			if err := godotenv.Load(path); err == nil {
				envFound = true
				break
			}
		}
	}

	if !envFound {
		log.Println("no .env file found, relying on real environment variables")
	}

	cfg := &Config{
		Port:        getEnv("PORT", "3000"),
		DatabaseURL: getEnv("DATABASE_URL", ""),
		JWTSecret:   getEnv("JWT_SECRET", ""),
		CORSOrigin:  getEnv("CORS_ORIGIN", "http://localhost:5173"),

		PayPalClientID:     getEnv("PAYPAL_CLIENT_ID", ""),
		PayPalClientSecret: getEnv("PAYPAL_CLIENT_SECRET", ""),
		PayPalMode:         getEnv("PAYPAL_MODE", "sandbox"),
		PayPalReturnURL:    getEnv("PAYPAL_RETURN_URL", "http://localhost:5173/payment/paypal/return"),
		PayPalCancelURL:    getEnv("PAYPAL_CANCEL_URL", "http://localhost:5173/payment/paypal/cancel"),

		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_KEY", ""),
		SupabaseBucket:     getEnv("SUPABASE_BUCKET", "lumora-uploads"),
	}

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
