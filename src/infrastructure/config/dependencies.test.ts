import { describe, test, expect, beforeEach } from "vitest";
import { DependencyContainer, initializeDependencies } from "./dependencies";
import { JsonProductAdapter } from "../adapters/JsonProductAdapter";
import { ApiProductAdapter } from "../adapters/ApiProductAdapter";
import { LocalStorageCartAdapter } from "../adapters/LocalStorageCartAdapter";
import { GetProductsUseCase } from "../../application/use-cases/GetProductsUseCase";
import { FilterProductsUseCase } from "../../application/use-cases/FilterProductsUseCase";
import { ManageCartUseCase } from "../../application/use-cases/ManageCartUseCase";

describe("DependencyContainer", () => {
  beforeEach(() => {
    // Reset the singleton instance before each test
    // @ts-expect-error Only god knows why this is needed
    DependencyContainer.instance = undefined;
  });

  describe("initialization", () => {
    test("initialize creates a singleton instance", () => {
      DependencyContainer.initialize({ productAdapterType: "json" });
      const instance1 = DependencyContainer.getInstance();
      const instance2 = DependencyContainer.getInstance();

      expect(instance1).toBe(instance2);
    });

    test("getInstance creates default instance if not initialized", () => {
      const instance = DependencyContainer.getInstance();
      const repository = instance.getProductRepository();

      expect(repository).toBeInstanceOf(JsonProductAdapter);
    });

    test("initialize with json adapter type", () => {
      DependencyContainer.initialize({ productAdapterType: "json" });
      const instance = DependencyContainer.getInstance();
      const repository = instance.getProductRepository();

      expect(repository).toBeInstanceOf(JsonProductAdapter);
    });

    test("initialize with api adapter type", () => {
      DependencyContainer.initialize({
        productAdapterType: "api",
        apiBaseUrl: "https://api.example.com",
        apiAuthToken: "test-token",
      });
      const instance = DependencyContainer.getInstance();
      const repository = instance.getProductRepository();

      expect(repository).toBeInstanceOf(ApiProductAdapter);
    });
  });

  describe("getProductRepository", () => {
    test("returns JsonProductAdapter when configured for json", () => {
      DependencyContainer.initialize({ productAdapterType: "json" });
      const instance = DependencyContainer.getInstance();
      const repository = instance.getProductRepository();

      expect(repository).toBeInstanceOf(JsonProductAdapter);
    });

    test("returns ApiProductAdapter when configured for api", () => {
      DependencyContainer.initialize({
        productAdapterType: "api",
        apiBaseUrl: "https://api.example.com",
      });
      const instance = DependencyContainer.getInstance();
      const repository = instance.getProductRepository();

      expect(repository).toBeInstanceOf(ApiProductAdapter);
    });

    test("returns new instance on each call", () => {
      DependencyContainer.initialize({ productAdapterType: "json" });
      const instance = DependencyContainer.getInstance();
      const repo1 = instance.getProductRepository();
      const repo2 = instance.getProductRepository();

      // Should create new instances, not reuse
      expect(repo1).not.toBe(repo2);
    });
  });

  describe("getCartRepository", () => {
    test("returns LocalStorageCartAdapter", () => {
      DependencyContainer.initialize({ productAdapterType: "json" });
      const instance = DependencyContainer.getInstance();
      const repository = instance.getCartRepository();

      expect(repository).toBeInstanceOf(LocalStorageCartAdapter);
    });
  });

  describe("use case factory methods", () => {
    test("getGetProductsUseCase returns configured use case", () => {
      DependencyContainer.initialize({ productAdapterType: "json" });
      const instance = DependencyContainer.getInstance();
      const useCase = instance.getGetProductsUseCase();

      expect(useCase).toBeInstanceOf(GetProductsUseCase);
    });

    test("getFilterProductsUseCase returns configured use case", () => {
      DependencyContainer.initialize({ productAdapterType: "json" });
      const instance = DependencyContainer.getInstance();
      const useCase = instance.getFilterProductsUseCase();

      expect(useCase).toBeInstanceOf(FilterProductsUseCase);
    });

    test("getManageCartUseCase returns configured use case", () => {
      DependencyContainer.initialize({ productAdapterType: "json" });
      const instance = DependencyContainer.getInstance();
      const useCase = instance.getManageCartUseCase();

      expect(useCase).toBeInstanceOf(ManageCartUseCase);
    });

    test("use cases receive correct adapter based on configuration", () => {
      DependencyContainer.initialize({
        productAdapterType: "api",
        apiBaseUrl: "https://api.example.com",
      });
      const instance = DependencyContainer.getInstance();
      const useCase = instance.getGetProductsUseCase();

      // Verify the use case was created (we can't easily inspect the injected dependency)
      expect(useCase).toBeInstanceOf(GetProductsUseCase);
    });
  });

  describe("initializeDependencies", () => {
    test("initializes with environment variables", () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_PRODUCT_ADAPTER: "json",
      };

      initializeDependencies();
      const instance = DependencyContainer.getInstance();
      const repository = instance.getProductRepository();

      expect(repository).toBeInstanceOf(JsonProductAdapter);

      // Restore original environment
      process.env = originalEnv;
    });

    test("defaults to json adapter when env var not set", () => {
      // Mock environment variables without NEXT_PUBLIC_PRODUCT_ADAPTER
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.NEXT_PUBLIC_PRODUCT_ADAPTER;

      initializeDependencies();
      const instance = DependencyContainer.getInstance();
      const repository = instance.getProductRepository();

      expect(repository).toBeInstanceOf(JsonProductAdapter);

      // Restore original environment
      process.env = originalEnv;
    });

    test("initializes with api adapter from environment", () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_PRODUCT_ADAPTER: "api",
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
        NEXT_PUBLIC_API_AUTH_TOKEN: "test-token",
      };

      initializeDependencies();
      const instance = DependencyContainer.getInstance();
      const repository = instance.getProductRepository();

      expect(repository).toBeInstanceOf(ApiProductAdapter);

      // Restore original environment
      process.env = originalEnv;
    });
  });
});
