import { CommerceProvider } from '@/application/dtos/Checkout';
import { AnalyticsService } from '@/application/ports/AnalyticsService';
import { CartRepository } from '@/application/ports/CartRepository';
import { CheckoutService } from '@/application/ports/CheckoutService';
import { ConsentRepository } from '@/application/ports/ConsentRepository';
import { ProductRepository } from '@/application/ports/ProductRepository';
import { CreateCheckoutUseCase } from '@/application/use-cases/CreateCheckoutUseCase';
import { GetProductBySlugUseCase } from '@/application/use-cases/GetProductBySlugUseCase';
import { GetProductsUseCase } from '@/application/use-cases/GetProductsUseCase';
import { ManageCartUseCase } from '@/application/use-cases/ManageCartUseCase';
import { PlaceOrderUseCase } from '@/application/use-cases/PlaceOrderUseCase';
import { SendContactMessageUseCase } from '@/application/use-cases/SendContactMessageUseCase';
import { SubscribeNewsletterUseCase } from '@/application/use-cases/SubscribeNewsletterUseCase';
import { PricingPolicy } from '@/domain/entities/order/OrderPricing';
import { NoopAnalyticsAdapter } from '../adapters/analytics/NoopAnalyticsAdapter';
import { PostHogAnalyticsAdapter } from '../adapters/analytics/PostHogAnalyticsAdapter';
import { LocalStorageCartAdapter } from '../adapters/cart/LocalStorageCartAdapter';
import { ShopifyCartAdapter } from '../adapters/cart/ShopifyCartAdapter';
import { LocalCheckoutAdapter } from '../adapters/checkout/LocalCheckoutAdapter';
import { ShopifyCheckoutAdapter } from '../adapters/checkout/ShopifyCheckoutAdapter';
import { LocalStorageConsentRepository } from '../adapters/consent/LocalStorageConsentRepository';
import { LocalContactAdapter } from '../adapters/contact/LocalContactAdapter';
import { LocalNewsletterAdapter } from '../adapters/newsletter/LocalNewsletterAdapter';
import { LocalOrderGateway } from '../adapters/order/LocalOrderGateway';
import { JsonProductAdapter } from '../adapters/product/JsonProductAdapter';
import { ShopifyProductAdapter } from '../adapters/product/ShopifyProductAdapter';
import { ShopifyCartIdStore } from '../adapters/shopify/ShopifyCartIdStore';
import { ShopifyClient } from '../adapters/shopify/ShopifyClient';
import { AppConfig, readConfigFromEnv } from './appConfig';
import { storePricingPolicy } from './pricingPolicy';

/**
 * Wires adapters to ports for the configured provider. Every adapter and use case is
 * created once per container, so all callers share the same repositories.
 */
export class AppContainer {
  private readonly instances = new Map<string, unknown>();

  constructor(private readonly config: AppConfig) {}

  getProvider(): CommerceProvider {
    return this.config.provider;
  }

  getPricingPolicy(): PricingPolicy {
    return storePricingPolicy;
  }

  getGetProductsUseCase(): GetProductsUseCase {
    return this.once('getProducts', () => new GetProductsUseCase(this.productRepository()));
  }

  getGetProductBySlugUseCase(): GetProductBySlugUseCase {
    return this.once('getProductBySlug', () => new GetProductBySlugUseCase(this.productRepository()));
  }

  getManageCartUseCase(): ManageCartUseCase {
    return this.once('manageCart', () => new ManageCartUseCase(this.cartRepository(), this.productRepository()));
  }

  getCreateCheckoutUseCase(): CreateCheckoutUseCase {
    return this.once(
      'createCheckout',
      () => new CreateCheckoutUseCase(this.cartRepository(), this.checkoutService(), this.config.provider),
    );
  }

  getPlaceOrderUseCase(): PlaceOrderUseCase {
    return this.once(
      'placeOrder',
      () =>
        new PlaceOrderUseCase(
          this.cartRepository(),
          new LocalOrderGateway({ delayMs: this.config.simulatedDelayMs }),
          this.getPricingPolicy(),
        ),
    );
  }

  /**
   * True while the newsletter and contact use cases run on the simulated Local*
   * adapters (`LocalNewsletterAdapter`, `LocalContactAdapter`), which only wait and
   * resolve without delivering anything. That is always the case today, under both
   * commerce providers, until a mail/CRM backend is connected. The UI uses it to
   * label those forms honestly instead of claiming a message was sent.
   */
  isMessagingSimulated(): boolean {
    return true;
  }

  getSubscribeNewsletterUseCase(): SubscribeNewsletterUseCase {
    return this.once(
      'subscribeNewsletter',
      () => new SubscribeNewsletterUseCase(new LocalNewsletterAdapter({ delayMs: this.config.simulatedDelayMs })),
    );
  }

  getSendContactMessageUseCase(): SendContactMessageUseCase {
    return this.once(
      'sendContactMessage',
      () => new SendContactMessageUseCase(new LocalContactAdapter({ delayMs: this.config.simulatedDelayMs })),
    );
  }

  getAnalyticsService(): AnalyticsService {
    return this.once('analytics', () =>
      this.config.posthog ? new PostHogAnalyticsAdapter(this.config.posthog) : new NoopAnalyticsAdapter(),
    );
  }

  getConsentRepository(): ConsentRepository {
    return this.once('consent', () => new LocalStorageConsentRepository());
  }

  private productRepository(): ProductRepository {
    return this.once('productRepository', () =>
      this.config.provider === 'shopify'
        ? new ShopifyProductAdapter(this.shopifyClient())
        : new JsonProductAdapter({ currency: storePricingPolicy.currency }),
    );
  }

  private cartRepository(): CartRepository {
    return this.once('cartRepository', () =>
      this.config.provider === 'shopify'
        ? new ShopifyCartAdapter(this.shopifyClient(), this.shopifyCartIds(), storePricingPolicy.currency)
        : new LocalStorageCartAdapter(this.productRepository(), storePricingPolicy.currency),
    );
  }

  private checkoutService(): CheckoutService {
    return this.once('checkoutService', () =>
      this.config.provider === 'shopify'
        ? new ShopifyCheckoutAdapter(this.shopifyClient(), this.shopifyCartIds())
        : new LocalCheckoutAdapter(),
    );
  }

  private shopifyClient(): ShopifyClient {
    if (this.config.provider !== 'shopify') throw new Error('Shopify is not the configured commerce provider');
    const { shopify } = this.config;
    return this.once('shopifyClient', () => new ShopifyClient(shopify));
  }

  private shopifyCartIds(): ShopifyCartIdStore {
    return this.once('shopifyCartIds', () => new ShopifyCartIdStore());
  }

  private once<T>(key: string, create: () => T): T {
    if (!this.instances.has(key)) this.instances.set(key, create());
    return this.instances.get(key) as T;
  }
}

let container: AppContainer | null = null;

export function createContainer(config: AppConfig): AppContainer {
  return new AppContainer(config);
}

/** The app-wide container, built from environment variables on first use (server and client). */
export function getContainer(): AppContainer {
  container ??= createContainer(readConfigFromEnv());
  return container;
}

/** Drops the singleton so the next getContainer() re-reads the environment. For tests. */
export function resetContainer(): void {
  container = null;
}
