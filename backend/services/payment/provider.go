// Package payment defines a provider-agnostic interface for taking a
// payment against a booking. Each payment method (QRIS, card/BCA, PayPal,
// pay-at-hotel) is implemented as a Provider, so swapping a sandbox
// implementation for a real one (e.g. wiring in Midtrans or Xendit for
// QRIS/card in Indonesia) means writing a new Provider — nothing in
// services.BookingService or the HTTP handlers needs to change.
package payment

import (
	"context"
	"errors"
	"time"

	"lumora-backend/models"
)

var ErrProviderNotConfigured = errors.New("payment provider is not configured")
var ErrTransactionNotFound = errors.New("transaction not found")

// InitiateRequest carries everything a provider needs to start a payment.
// Amount is in whole currency units (USD), matching Booking.Total — never
// trust a client-supplied amount; the caller always passes the
// server-computed total.
type InitiateRequest struct {
	BookingID   string
	BookingCode string
	Amount      int
	Description string
}

// InitiateResult is what the frontend needs to actually collect payment:
// a QR code to scan, a redirect link to follow, or nothing at all for
// pay-at-hotel.
type InitiateResult struct {
	Provider      string                `json:"provider"`
	TransactionID string                `json:"transactionId"`
	Status        models.PaymentStatus  `json:"status"`
	ExpiresAt     *time.Time            `json:"expiresAt,omitempty"`

	// QRIS-specific
	QRCodeData string `json:"qrCodeData,omitempty"`
	QRImageURL string `json:"qrImageUrl,omitempty"`

	// PayPal-specific
	RedirectURL string `json:"redirectUrl,omitempty"`
}

// VerifyResult is the outcome of asking a provider (or, for sandbox
// providers, a simulated trigger) for the current state of a transaction.
type VerifyResult struct {
	TransactionID string               `json:"transactionId"`
	Status        models.PaymentStatus `json:"status"`
}

// Provider is implemented by every payment method that isn't pay-at-hotel.
type Provider interface {
	Name() string
	Initiate(ctx context.Context, req InitiateRequest) (*InitiateResult, error)
}

// Simulatable is implemented only by sandbox/demo providers (QRIS, card)
// that have no real aggregator wired up, so a developer can trigger the
// "payment succeeded" webhook manually instead of waiting on a real bank.
// Production providers (a real Midtrans/Xendit integration, PayPal) do NOT
// implement this — their state changes only through a verified callback
// or an explicit server-to-server capture call.
type Simulatable interface {
	Simulate(ctx context.Context, transactionID string, succeed bool) (*VerifyResult, error)
}

// Capturable is implemented by providers where the backend must actively
// confirm the transaction with the provider's API after the user
// completes the payment flow (PayPal's Capture Order step). This is the
// "don't trust the frontend callback" verification step.
type Capturable interface {
	Capture(ctx context.Context, transactionID string) (*VerifyResult, error)
}
