package payment

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"lumora-backend/models"
)

// PayPalProvider is a real integration against PayPal's Orders v2 REST
// API (https://developer.paypal.com/docs/api/orders/v2/). Point it at
// sandbox during development (PAYPAL_MODE=sandbox, the default) and at
// live once you have production credentials. It requires
// PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET — get free sandbox
// credentials at https://developer.paypal.com/dashboard/applications.
//
// This project's dev container has no outbound network access, so this
// code is written to PayPal's documented contract but has not been
// exercised against a live sandbox call from here — test it against your
// own sandbox credentials before relying on it.
type PayPalProvider struct {
	clientID     string
	clientSecret string
	baseURL      string
	returnURL    string
	cancelURL    string
	httpClient   *http.Client
}

func NewPayPalProvider(clientID, clientSecret, mode, returnURL, cancelURL string) *PayPalProvider {
	base := "https://api-m.sandbox.paypal.com"
	if mode == "live" {
		base = "https://api-m.paypal.com"
	}
	return &PayPalProvider{
		clientID:     clientID,
		clientSecret: clientSecret,
		baseURL:      base,
		returnURL:    returnURL,
		cancelURL:    cancelURL,
		httpClient:   &http.Client{Timeout: 15 * time.Second},
	}
}

func (p *PayPalProvider) Name() string { return "paypal" }

func (p *PayPalProvider) configured() bool {
	return p.clientID != "" && p.clientSecret != ""
}

func (p *PayPalProvider) getAccessToken(ctx context.Context) (string, error) {
	form := url.Values{"grant_type": {"client_credentials"}}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.baseURL+"/v1/oauth2/token", bytes.NewBufferString(form.Encode()))
	if err != nil {
		return "", err
	}
	req.SetBasicAuth(p.clientID, p.clientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err := p.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("paypal oauth request failed: %w", err)
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("paypal oauth failed (%d): %s", res.StatusCode, string(body))
	}

	var parsed struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return "", err
	}
	return parsed.AccessToken, nil
}

// Initiate creates a PayPal order (intent=CAPTURE) and returns the
// approval link the guest must be redirected to.
func (p *PayPalProvider) Initiate(ctx context.Context, req InitiateRequest) (*InitiateResult, error) {
	if !p.configured() {
		return nil, ErrProviderNotConfigured
	}

	token, err := p.getAccessToken(ctx)
	if err != nil {
		return nil, err
	}

	orderBody := map[string]any{
		"intent": "CAPTURE",
		"purchase_units": []map[string]any{
			{
				"reference_id": req.BookingCode,
				"description":  req.Description,
				"amount": map[string]any{
					"currency_code": "USD",
					"value":         fmt.Sprintf("%d.00", req.Amount),
				},
			},
		},
		"application_context": map[string]any{
			"return_url": p.returnURL,
			"cancel_url": p.cancelURL,
			"brand_name": "LUMORA HOTELS",
			"user_action": "PAY_NOW",
		},
	}

	payload, err := json.Marshal(orderBody)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, p.baseURL+"/v2/checkout/orders", bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+token)

	res, err := p.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("paypal create order request failed: %w", err)
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("paypal create order failed (%d): %s", res.StatusCode, string(body))
	}

	var parsed struct {
		ID    string `json:"id"`
		Links []struct {
			Href string `json:"href"`
			Rel  string `json:"rel"`
		} `json:"links"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, err
	}

	var approveURL string
	for _, l := range parsed.Links {
		if l.Rel == "approve" {
			approveURL = l.Href
		}
	}
	if approveURL == "" {
		return nil, errors.New("paypal response did not include an approval link")
	}

	return &InitiateResult{
		Provider:      p.Name(),
		TransactionID: parsed.ID,
		Status:        models.PaymentPending,
		RedirectURL:   approveURL,
	}, nil
}

// Capture confirms the order server-side after the guest approves it on
// PayPal — this is the verification step that must never be skipped in
// favor of trusting a frontend redirect alone.
func (p *PayPalProvider) Capture(ctx context.Context, orderID string) (*VerifyResult, error) {
	if !p.configured() {
		return nil, ErrProviderNotConfigured
	}

	token, err := p.getAccessToken(ctx)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, p.baseURL+"/v2/checkout/orders/"+orderID+"/capture", nil)
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+token)

	res, err := p.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("paypal capture request failed: %w", err)
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusCreated && res.StatusCode != http.StatusOK {
		return &VerifyResult{TransactionID: orderID, Status: models.PaymentFailed}, fmt.Errorf("paypal capture failed (%d): %s", res.StatusCode, string(body))
	}

	var parsed struct {
		Status string `json:"status"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, err
	}

	status := models.PaymentFailed
	if parsed.Status == "COMPLETED" {
		status = models.PaymentPaid
	}

	return &VerifyResult{TransactionID: orderID, Status: status}, nil
}
