import { getShopifyWebhookHandler } from "@/infrastructure/config/server";

// Webhooks need the raw body (the signature covers it) and node:crypto; never cache them.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Shopify order webhooks (`orders/paid`, `refunds/create`, `orders/cancelled`) → server-side analytics events.
 * Registered in Shopify admin → Settings → Notifications → Webhooks; see docs/ANALYTICS.md.
 */
export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const result = await getShopifyWebhookHandler().handle({
    topic: request.headers.get("x-shopify-topic"),
    hmac: request.headers.get("x-shopify-hmac-sha256"),
    rawBody,
  });
  return new Response(result.body, { status: result.status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
