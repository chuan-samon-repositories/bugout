import { describe, test, expect, beforeEach } from "vitest";
import { DependencyContainer, initializeDependencies } from "./dependencies";
import {
  JsonProductAdapter,
  ShopifyProductAdapter,
  LocalStorageCartAdapter,
  ShopifyCartAdapter,
  LocalCheckoutAdapter,
  ShopifyCheckoutAdapter,
} from "../adapters";
import { GetProductsUseCase } from "../../application/use-cases/GetProductsUseCase";
import { FilterProductsUseCase } from "../../application/use-cases/FilterProductsUseCase";
import { ManageCartUseCase } from "../../application/use-cases/ManageCartUseCase";
import { CreateCheckoutUseCase } from "../../application/use-cases/CreateCheckoutUseCase";

const SHOPIFY_CONFIG = {
  storeDomain: "test.myshopify.com",
  storefrontAccessToken: "test-token",
};

describe("DependencyContainer", () => {
  beforeEach(() => {
    // @ts-expect-error Reset singleton between tests
    DependencyContainer.instance = undefined;
  });

  describe("initialization", () => {
    test("initialize creates a singleton instance", () => {
      DependencyContainer.initialize({ provider: "local" });
      const instance1 = DependencyContainer.getInstance();
      const instance2 = DependencyContainer.getInstance();
      expect(instance1).toBe(instance2);
    });

    test("getInstance creates default local instance if not initialized", () => {
      const instance = DependencyContainer.getInstance();
      expect(instance.getProductRepository()).toBeInstanceOf(JsonProductAdapter);
    });

    test("local provider wires JSON + localStorage + local checkout", () => {
      DependencyContainer.initialize({ provider: "local" });
      const instance = DependencyContainer.getInstance();
      expect(instance.getProductRepository()).toBeInstanceOf(JsonProductAdapter);
      expect(instance.getCartRepository()).toBeInstanceOf(LocalStorageCartAdapter);
      expect(instance.getCheckoutService()).toBeInstanceOf(LocalCheckoutAdapter);
    });

    test("shopify provider wires Shopify adapters", () => {
      DependencyContainer.initialize({ provider: "shopify", shopify: SHOPIFY_CONFIG });
      const instance = DependencyContainer.getInstance();
      expect(instance.getProductRepository()).toBeInstanceOf(ShopifyProductAdapter);
      expect(instance.getCartRepository()).toBeInstanceOf(ShopifyCartAdapter);
      expect(instance.getCheckoutService()).toBeInstanceOf(ShopifyCheckoutAdapter);
    });
  });

  describe("getProductRepository", () => {
    test("returns new instance on each call", () => {
      DependencyContainer.initialize({ provider: "local" });
      const instance = DependencyContainer.getInstance();
      expect(instance.getProductRepository()).not.toBe(instance.getProductRepository());
    });
  });

  describe("getCartRepository", () => {
    test("local provider returns LocalStorageCartAdapter", () => {
      DependencyContainer.initialize({ provider: "local" });
      expect(DependencyContainer.getInstance().getCartRepository()).toBeInstanceOf(LocalStorageCartAdapter);
    });
  });

  describe("use case factory methods", () => {
    test("getGetProductsUseCase returns configured use case", () => {
      DependencyContainer.initialize({ provider: "local" });
      expect(DependencyContainer.getInstance().getGetProductsUseCase()).toBeInstanceOf(GetProductsUseCase);
    });

    test("getFilterProductsUseCase returns configured use case", () => {
      DependencyContainer.initialize({ provider: "local" });
      expect(DependencyContainer.getInstance().getFilterProductsUseCase()).toBeInstanceOf(FilterProductsUseCase);
    });

    test("getManageCartUseCase returns configured use case", () => {
      DependencyContainer.initialize({ provider: "local" });
      expect(DependencyContainer.getInstance().getManageCartUseCase()).toBeInstanceOf(ManageCartUseCase);
    });

    test("getCreateCheckoutUseCase returns configured use case", () => {
      DependencyContainer.initialize({ provider: "local" });
      expect(DependencyContainer.getInstance().getCreateCheckoutUseCase()).toBeInstanceOf(CreateCheckoutUseCase);
    });
  });

  describe("initializeDependencies", () => {
    test("defaults to local provider when env var not set", () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.NEXT_PUBLIC_COMMERCE_PROVIDER;

      initializeDependencies();
      expect(DependencyContainer.getInstance().getProductRepository()).toBeInstanceOf(JsonProductAdapter);

      process.env = originalEnv;
    });

    test("uses local provider from env", () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, NEXT_PUBLIC_COMMERCE_PROVIDER: "local" };

      initializeDependencies();
      expect(DependencyContainer.getInstance().getProductRepository()).toBeInstanceOf(JsonProductAdapter);

      process.env = originalEnv;
    });

    test("uses shopify provider from env", () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_COMMERCE_PROVIDER: "shopify",
        NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: "mystore.myshopify.com",
        NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN: "test-token",
      };

      initializeDependencies();
      expect(DependencyContainer.getInstance().getProductRepository()).toBeInstanceOf(ShopifyProductAdapter);

      process.env = originalEnv;
    });
  });
});
