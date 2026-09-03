package payment

import "fmt"

// Service resolves a payment method string to its Provider. Adding a new
// method (or swapping a sandbox provider for a real one) means changing
// this map — nothing else in the codebase needs to know.
type Service struct {
	providers map[string]Provider
}

func NewService(qris, card Provider, paypal *PayPalProvider) *Service {
	providers := map[string]Provider{
		"qris":     qris,
		"card_bca": card,
	}
	if paypal != nil {
		providers["paypal"] = paypal
	}
	return &Service{providers: providers}
}

func (s *Service) Provider(method string) (Provider, error) {
	p, ok := s.providers[method]
	if !ok || p == nil {
		return nil, fmt.Errorf("no payment provider registered for method %q", method)
	}
	return p, nil
}
