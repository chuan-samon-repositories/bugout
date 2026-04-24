import { ProductRepository } from '../../application/ports/ProductRepository';
import { CartRepository } from '../../application/ports/CartRepository';
import { CheckoutService } from '../../application/ports/CheckoutService';
import { GetProductsUseCase } from '../../application/use-cases/GetProductsUseCase';
import { FilterProductsUseCase } from '../../application/use-cases/FilterProductsUseCase';
import { ManageCartUseCase } from '../../application/use-cases/ManageCartUseCase';
import { CreateCheckoutUseCase } from '../../application/use-cases/CreateCheckoutUseCase';
import {
  JsonProductAdapter,
  ShopifyProductAdapter,
  LocalStorageCartAdapter,
  ShopifyCartAdapter,
  LocalCheckoutAdapter,
  ShopifyCheckoutAdapter,
} from '../adapters';
import { ShopifyConfig } from './ShopifyConfig';

// ---------------------------------------------------------------------------
// Config types
// ---------------------------------------------------------------------------

export type CommerceProvider = 'local' | 'shopify';

export interface DependencyConfig {
  provider: CommerceProvider;
  shopify?: ShopifyConfig; // required when provider === 'shopify'
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export class DependencyContainer {
  private static instance: DependencyContainer;
  private config: DependencyConfig;

  private constructor(config: DependencyConfig) {
    this.config = config;
  }

  static initialize(config: DependencyConfig): void {
    DependencyContainer.instance = new DependencyContainer(config);
  }

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer({ provider: 'local' });
    }
    return DependencyContainer.instance;
  }

  // -------------------------------------------------------------------------
  // Repositories & services — swap adapters by changing provider
  // -------------------------------------------------------------------------

  getProductRepository(): ProductRepository {
    if (this.config.provider === 'shopify' && this.config.shopify) {
      return new ShopifyProductAdapter(this.config.shopify);
    }
    return new JsonProductAdapter();
  }

  getCartRepository(): CartRepository {
    if (this.config.provider === 'shopify' && this.config.shopify) {
      return new ShopifyCartAdapter(this.config.shopify);
    }
    return new LocalStorageCartAdapter();
  }

  getCheckoutService(): CheckoutService {
    if (this.config.provider === 'shopify' && this.config.shopify) {
      return new ShopifyCheckoutAdapter(this.config.shopify);
    }
    return new LocalCheckoutAdapter();
  }

  // -------------------------------------------------------------------------
  // Use-case factories
  // -------------------------------------------------------------------------

  getGetProductsUseCase(): GetProductsUseCase {
    return new GetProductsUseCase(this.getProductRepository());
  }

  getFilterProductsUseCase(): FilterProductsUseCase {
    return new FilterProductsUseCase(this.getProductRepository());
  }

  getManageCartUseCase(): ManageCartUseCase {
    return new ManageCartUseCase(this.getCartRepository(), this.getProductRepository());
  }

  getCreateCheckoutUseCase(): CreateCheckoutUseCase {
    return new CreateCheckoutUseCase(this.getCartRepository(), this.getCheckoutService());
  }
}

// ---------------------------------------------------------------------------
// Bootstrap helper — reads env vars to pick provider
// ---------------------------------------------------------------------------

export function initializeDependencies(): void {
  const provider = (process.env.NEXT_PUBLIC_COMMERCE_PROVIDER as CommerceProvider) ?? 'local';

  const shopify: ShopifyConfig | undefined =
    provider === 'shopify'
      ? {
          storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? '',
          storefrontAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN ?? '',
        }
      : undefined;

  DependencyContainer.initialize({ provider, shopify });
}
