package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"lumora-backend/middleware"
	"lumora-backend/services"
)

type PaymentHandler struct {
	orchestrator *services.PaymentOrchestrator
}

func NewPaymentHandler(orchestrator *services.PaymentOrchestrator) *PaymentHandler {
	return &PaymentHandler{orchestrator: orchestrator}
}

// POST /api/bookings/:id/pay
// Starts a payment attempt for a pending booking. Returns whatever the
// chosen method needs to collect payment: a QR code (QRIS), a redirect
// link (PayPal), or a transaction id to simulate against in sandbox mode
// (card/BCA — no real gateway is wired up here).
func (h *PaymentHandler) Initiate(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)
	bookingID := c.Params("id")

	booking, result, err := h.orchestrator.InitiatePayment(c.Context(), bookingID, userID)
	if err != nil {
		return paymentErrorResponse(c, err)
	}

	return c.JSON(fiber.Map{
		"booking": booking,
		"payment": result,
	})
}

type simulateRequest struct {
	Succeed bool `json:"succeed"`
}

// POST /api/payments/sandbox/:transactionId/simulate
// SANDBOX ONLY. Stands in for a real payment aggregator's webhook so the
// QRIS/card flow can be tested without a live provider. This endpoint
// has no place in a production deployment with a real gateway — remove
// it (or gate it behind an environment check) once one is wired up.
func (h *PaymentHandler) SimulateSandbox(c *fiber.Ctx) error {
	transactionID := c.Params("transactionId")

	var req simulateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	booking, err := h.orchestrator.SimulateSandboxPayment(c.Context(), transactionID, req.Succeed)
	if err != nil {
		return paymentErrorResponse(c, err)
	}

	return c.JSON(booking)
}

type captureRequest struct {
	Method        string `json:"method"`
	TransactionID string `json:"transactionId"`
}

// POST /api/payments/capture
// Server-side verification step for providers that require one (PayPal):
// after the guest approves payment on PayPal's site, the frontend calls
// this so the backend — not the frontend redirect — confirms the charge
// actually went through before marking the booking paid.
func (h *PaymentHandler) Capture(c *fiber.Ctx) error {
	userID, _ := c.Locals(middleware.ContextUserID).(string)

	var req captureRequest
	if err := c.BodyParser(&req); err != nil || req.Method == "" || req.TransactionID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "method and transactionId are required"})
	}

	booking, err := h.orchestrator.CaptureProviderPayment(c.Context(), req.Method, req.TransactionID, userID)
	if err != nil {
		return paymentErrorResponse(c, err)
	}

	return c.JSON(booking)
}

func paymentErrorResponse(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, services.ErrBookingNotFound):
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	case errors.Is(err, services.ErrNotBookingOwner):
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
	case errors.Is(err, services.ErrNothingToPay), errors.Is(err, services.ErrAlreadyPaid):
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	default:
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "payment processing failed — please try again"})
	}
}
