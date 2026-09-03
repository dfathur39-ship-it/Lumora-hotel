package services

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"lumora-backend/models"
	"lumora-backend/repositories"
	"lumora-backend/services/payment"
)

var ErrBookingNotFound = errors.New("booking not found")
var ErrNotBookingOwner = errors.New("you do not have access to this booking")
var ErrNothingToPay = errors.New("this booking does not require an online payment")
var ErrAlreadyPaid = errors.New("this booking has already been paid")

type PaymentOrchestrator struct {
	bookings *repositories.BookingRepository
	payments *payment.Service
}

func NewPaymentOrchestrator(bookings *repositories.BookingRepository, payments *payment.Service) *PaymentOrchestrator {
	return &PaymentOrchestrator{bookings: bookings, payments: payments}
}

// InitiatePayment starts a payment attempt for a pending, online-payable
// booking and records the resulting provider/transaction id so it can be
// verified later — either by a sandbox simulation or a real capture call.
func (o *PaymentOrchestrator) InitiatePayment(ctx context.Context, bookingID, userID string) (*models.Booking, *payment.InitiateResult, error) {
	booking, err := o.bookings.GetByID(ctx, bookingID)
	if err != nil {
		return nil, nil, ErrBookingNotFound
	}
	if booking.UserID != userID {
		return nil, nil, ErrNotBookingOwner
	}
	if booking.PaymentMethod == models.PaymentAtHotel {
		return nil, nil, ErrNothingToPay
	}
	if booking.PaymentStatus == models.PaymentPaid {
		return nil, nil, ErrAlreadyPaid
	}

	provider, err := o.payments.Provider(string(booking.PaymentMethod))
	if err != nil {
		return nil, nil, err
	}

	result, err := provider.Initiate(ctx, payment.InitiateRequest{
		BookingID:   booking.ID,
		BookingCode: booking.BookingCode,
		Amount:      booking.Total,
		Description: fmt.Sprintf("LUMORA HOTELS booking %s", booking.BookingCode),
	})
	if err != nil {
		return nil, nil, err
	}

	if err := o.bookings.SetPaymentInitiated(ctx, booking.ID, result.Provider, result.TransactionID, result.ExpiresAt); err != nil {
		return nil, nil, err
	}

	updated, err := o.bookings.GetByID(ctx, booking.ID)
	if err != nil {
		return nil, nil, err
	}
	return updated, result, nil
}

// SimulateSandboxPayment is for local development only — it stands in
// for a real aggregator's webhook by letting a developer manually mark a
// QRIS or card sandbox transaction as paid/failed. It refuses to touch
// anything associated with a real provider (PayPal).
func (o *PaymentOrchestrator) SimulateSandboxPayment(ctx context.Context, transactionID string, succeed bool) (*models.Booking, error) {
	var provider payment.Provider
	var err error

	switch {
	case strings.HasPrefix(transactionID, "QRIS-"):
		provider, err = o.payments.Provider("qris")
	case strings.HasPrefix(transactionID, "CARD-"):
		provider, err = o.payments.Provider("card_bca")
	default:
		return nil, errors.New("transaction id does not belong to a sandbox provider")
	}
	if err != nil {
		return nil, err
	}

	simulatable, ok := provider.(payment.Simulatable)
	if !ok {
		return nil, errors.New("this provider does not support simulation")
	}

	result, err := simulatable.Simulate(ctx, transactionID, succeed)
	if err != nil {
		return nil, err
	}

	booking, err := o.bookings.GetByTransactionID(ctx, transactionID)
	if err != nil {
		return nil, ErrBookingNotFound
	}

	if result.Status == models.PaymentPaid {
		if err := o.bookings.MarkPaid(ctx, booking.ID); err != nil {
			return nil, err
		}
	} else {
		if err := o.bookings.MarkPaymentFailed(ctx, booking.ID); err != nil {
			return nil, err
		}
	}

	return o.bookings.GetByID(ctx, booking.ID)
}

// CaptureProviderPayment performs the real, server-side verification step
// for providers that require one (PayPal) — the frontend redirect back
// from PayPal is never trusted on its own.
func (o *PaymentOrchestrator) CaptureProviderPayment(ctx context.Context, method, transactionID, userID string) (*models.Booking, error) {
	provider, err := o.payments.Provider(method)
	if err != nil {
		return nil, err
	}

	capturable, ok := provider.(payment.Capturable)
	if !ok {
		return nil, errors.New("this provider does not support server-side capture")
	}

	booking, err := o.bookings.GetByTransactionID(ctx, transactionID)
	if err != nil {
		return nil, ErrBookingNotFound
	}
	if booking.UserID != userID {
		return nil, ErrNotBookingOwner
	}

	result, err := capturable.Capture(ctx, transactionID)
	if err != nil {
		_ = o.bookings.MarkPaymentFailed(ctx, booking.ID)
		return nil, err
	}

	if result.Status == models.PaymentPaid {
		if err := o.bookings.MarkPaid(ctx, booking.ID); err != nil {
			return nil, err
		}
	} else {
		if err := o.bookings.MarkPaymentFailed(ctx, booking.ID); err != nil {
			return nil, err
		}
	}

	return o.bookings.GetByID(ctx, booking.ID)
}
