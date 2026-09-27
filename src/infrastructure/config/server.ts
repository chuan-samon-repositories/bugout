import { PostHogCaptureClient, serverPostHogHost } from '@/infrastructure/adapters/analytics/PostHogCaptureClient';
import { ShopifyWebhookHandler } from '@/infrastructure/adapters/shopify/webhooks/ShopifyWebhookHandler';
import { getContainer } from '@/infrastructure/config/container';

/**
 * Server-only wiring (route handlers). Kept out of `@/infrastructure/config` so that browser bundles never
 * pull in node:crypto or read server secrets. `SHOPIFY_WEBHOOK_SECRET` is a server-only variable: never give
 * it a NEXT_PUBLIC_ prefix.
 */
export function getShopifyWebhookHandler(): ShopifyWebhookHandler {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  const analytics = apiKey
    ? new PostHogCaptureClient({
        apiKey,
        host: serverPostHogHost(process.env.NEXT_PUBLIC_POSTHOG_HOST),
        superProperties: getContainer().analyticsSuperProperties(),
      })
    : null;
  return new ShopifyWebhookHandler(process.env.SHOPIFY_WEBHOOK_SECRET?.trim() || undefined, analytics);
}
