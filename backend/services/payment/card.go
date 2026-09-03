package payment

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"
	"lumora-backend/models"
)

// CardSandboxProvider is a SANDBOX/DEMO implementation only. It does not
// process real card payments — that requires a licensed, PCI-DSS
// compliant gateway (Midtrans, Xendit, Stripe, etc.) with real
// credentials. Crucially: this provider (and the handler that calls it)
// never receives or stores a full card number, CVV, or PIN — see
// handlers/payment_handler.go, which only accepts a masked last-4 for
// display purposes. In production, card fields must be collected by the
// gateway's own hosted fields/SDK so raw card data never touches this
// server at all.
type CardSandboxProvider struct {
	mu   sync.Mutex
	txns map[string]models.PaymentStatus
}

func NewCardSandboxProvider() *CardSandboxProvider {
	return &CardSandboxProvider{txns: make(map[string]models.PaymentStatus)}
}

func (p *CardSandboxProvider) Name() string { return "card-bca-sandbox" }

func (p *CardSandboxProvider) Initiate(ctx context.Context, req InitiateRequest) (*InitiateResult, error) {
	txID := "CARD-" + uuid.NewString()[:12]
	expiresAt := time.Now().Add(10 * time.Minute)

	p.mu.Lock()
	p.txns[txID] = models.PaymentPending
	p.mu.Unlock()

	return &InitiateResult{
		Provider:      p.Name(),
		TransactionID: txID,
		Status:        models.PaymentPending,
		ExpiresAt:     &expiresAt,
	}, nil
}

func (p *CardSandboxProvider) Simulate(ctx context.Context, transactionID string, succeed bool) (*VerifyResult, error) {
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
