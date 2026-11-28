# n8n booking handoff

Diablo does the research and asks the user to confirm a selected option. n8n handles the handoff and any post-booking automation; it does not purchase anything silently.

## 1. Create the n8n workflow

Add these nodes:

1. **Webhook**
   - Method: `POST`
   - Path: `diablo-booking-handoff`
   - Respond: `Using Respond to Webhook node`
2. **Code** — verify the `X-Diablo-Signature` HMAC using the same secret as Diablo. Reject mismatches.
3. **IF** — continue only when `user_confirmed` is `true`.
4. **HTTP Request / provider node** — optional; use the provider API only if you have an approved integration.
5. **Respond to Webhook** — return JSON:

```json
{
  "redirect_url": "https://booking-provider.example/checkout"
}
```

If you do not have a provider API, return the original `booking_url` so Diablo redirects the user to the provider’s checkout page.

## 2. Configure Diablo

Set these backend environment variables:

```env
N8N_BOOKING_WEBHOOK_URL=https://your-n8n.example/webhook/diablo-booking-handoff
N8N_BOOKING_WEBHOOK_SECRET=use-a-long-random-secret
```

Keep both values on the FastAPI/Render backend only. Never put them in `VITE_*` variables.

## 3. Connect the selection UI

When a user confirms an option, call:

```http
POST /api/booking/handoff
Authorization: Bearer <user-token>
Content-Type: application/json
```

with `run_id`, `provider`, `booking_url`, the selected option in `selection`, and `user_confirmed: true`. Redirect the browser to the returned `redirect_url`.

Use a fresh availability/price check before redirecting. The `run_id` is also used as an idempotency key to prevent duplicate handoffs.
