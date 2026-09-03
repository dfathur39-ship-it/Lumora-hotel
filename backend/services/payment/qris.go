package payment

import (
	"context"
	"fmt"
	"net/url"
	"sync"
	"time"

	"github.com/google/uuid"
	"lumora-backend/models"
)

// QRISSandboxProvider is a SANDBOX/DEMO implementation only. It does not
// talk to a real Indonesian QRIS aggregator (Midtrans, Xendit, etc.) —
// doing that requires a licensed PJSP merchant account and real
// credentials this project doesn't have. It exists so the booking →
// payment → confirmation flow can be built, tested, and demoed end to
// end; swap it for a real aggregator's Provider implementation before
// accepting real payments.
//
// State lives in memory (map), which is fine for local development but
// won't survive a server restart or scale across multiple instances —
// call that out if this ever needs to run in a real multi-instance
// deployment (move it into the bookings table, which already tracks
// payment_status/transaction_id/payment_expires_at).
type QRISSandboxProvider struct {
	mu   sync.Mutex
	txns map[string]models.PaymentStatus
}

func NewQRISSandboxProvider() *QRISSandboxProvider {
	return &QRISSandboxProvider{txns: make(map[string]models.PaymentStatus)}
}

func (p *QRISSandboxProvider) Name() string { return "qris-sandbox" }

func (p *QRISSandboxProvider) Initiate(ctx context.Context, req InitiateRequest) (*InitiateResult, error) {
	txID := "QRIS-" + uuid.NewString()[:12]
	expiresAt := time.Now().Add(15 * time.Minute)

	// This payload is a plain, human-readable demo string — NOT a real
	// EMVCo/QRIS-compliant payload a bank app would recognize. A real
	// integration gets this string (or an equivalent) from the
	// aggregator's API response.
	payload := fmt.Sprintf("LUMORA-SANDBOX-QRIS|order=%s|amount=%d|txn=%s", req.BookingCode, req.Amount, txID)

	p.mu.Lock()
	p.txns[txID] = models.PaymentPending
	p.mu.Unlock()

	return &InitiateResult{
		Provider:      p.Name(),
		TransactionID: txID,
		Status:        models.PaymentPending,
		ExpiresAt:     &expiresAt,
		QRCodeData:    payload,
		QRImageURL:    "https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=" + url.QueryEscape(payload),
	}, nil
}

func (p *QRISSandboxProvider) Simulate(ctx context.Context, transactionID string, succeed bool) (*VerifyResult, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if _, ok := p.txns[transactionID]; !ok {
		return nil, ErrTransactionNotFound
	}

	status := models.PaymentFailed
	if succeed {
		status = models.PaymentPaid
	}
	p.txns[transactionID] = status

	return &VerifyResult{TransactionID: transactionID, Status: status}, nil
}
