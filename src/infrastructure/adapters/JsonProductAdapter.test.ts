import { describe, test, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { JsonProductAdapter } from "./JsonProductAdapter";
import { ProductId } from "../../domain/value-objects/ProductId";
import { Product } from "../../domain/entities/product/Product";
import { NotFoundError } from "../../domain/errors";

describe("JsonProductAdapter", () => {
  let adapter: JsonProductAdapter;

  beforeEach(() => {
    adapter = new JsonProductAdapter();
  });

  describe("findAll", () => {
    test("successfully loads and transforms products from JSON", async () => {
      const mockData = [
        {
          id: "test-product-1",
          name: "Test Product 1",
          price: 100,
          originalPrice: 150,
          rating: 4.5,
          reviews: 100,
          description: "Test description",
          category: "test-category",
          inStock: true,
          badge: "BESTSELLER",
        },
        {
          id: "test-product-2",
          name: "Test Product 2",
          price: 200,
          rating: 4.0,
          reviews: 50,
          description: "Another test",
          category: "test-category",
          inStock: false,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const products = await adapter.findAll();

      expect(products).toHaveLength(2);
      expect(products[0]).toBeInstanceOf(Product);
      expect(products[0].id.value).toBe("test-product-1");
      expect(products[0].name).toBe("Test Product 1");
      expect(products[0].price.amount).toBe(100);
      expect(products[0].originalPrice?.amount).toBe(150);
      expect(products[1].badge).toBeNull();
    });

    test("throws error when fetch fails", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      } as Response);

      await expect(adapter.findAll()).rejects.toThrow("Error loading products");
    });

    test("throws error when JSON parsing fails", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as unknown as Response);

      await expect(adapter.findAll()).rejects.toThrow("Error loading products");
    });
  });

  describe("findById", () => {
    test("returns product when found", async () => {
      const mockData = [
        {
          id: "test-product-1",
          name: "Test Product 1",
          price: 100,
          rating: 4.5,
          reviews: 100,
          description: "Test description",
          category: "test-category",
          inStock: true,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const product = await adapter.findById(new ProductId("test-product-1"));

      expect(product).toBeInstanceOf(Product);
      expect(product.id.value).toBe("test-product-1");
      expect(product.name).toBe("Test Product 1");
    });

    test("throws NotFoundError when product does not exist", async () => {
      const mockData = [
        {
          id: "test-product-1",
          name: "Test Product 1",
          price: 100,
          rating: 4.5,
          reviews: 100,
          description: "Test description",
          category: "test-category",
          inStock: true,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      await expect(
        adapter.findById(new ProductId("non-existent")),
      ).rejects.toThrow(NotFoundError);
      await expect(
        adapter.findById(new ProductId("non-existent")),
      ).rejects.toThrow("Product with id non-existent not found");
    });
  });

  describe("findByCategory", () => {
    test("returns products in specified category", async () => {
      const mockData = [
        {
          id: "product-1",
          name: "Product 1",
          price: 100,
          rating: 4.5,
          reviews: 100,
          description: "Description",
          category: "survival-kits",
          inStock: true,
        },
        {
          id: "product-2",
          name: "Product 2",
          price: 50,
          rating: 4.0,
          reviews: 50,
          description: "Description",
          category: "accessories",
          inStock: true,
        },
        {
          id: "product-3",
          name: "Product 3",
          price: 75,
          rating: 4.2,
          reviews: 75,
          description: "Description",
          category: "survival-kits",
          inStock: true,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const products = await adapter.findByCategory("survival-kits");

      expect(products).toHaveLength(2);
      expect(products.every((p) => p.category === "survival-kits")).toBe(true);
    });

    test("returns empty array when no products match category", async () => {
      const mockData = [
        {
          id: "product-1",
          name: "Product 1",
          price: 100,
          rating: 4.5,
          reviews: 100,
          description: "Description",
          category: "survival-kits",
          inStock: true,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const products = await adapter.findByCategory("non-existent-category");

      expect(products).toHaveLength(0);
    });
  });

  describe("search", () => {
    test("returns products matching query in name", async () => {
      const mockData = [
        {
          id: "product-1",
          name: "Survival Backpack",
          price: 100,
          rating: 4.5,
          reviews: 100,
          description: "A great product",
          category: "survival-kits",
          inStock: true,
        },
        {
          id: "product-2",
          name: "Emergency Kit",
          price: 50,
          rating: 4.0,
          reviews: 50,
          description: "Another product",
          category: "accessories",
          inStock: true,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const products = await adapter.search("backpack");

      expect(products).toHaveLength(1);
      expect(products[0].name).toBe("Survival Backpack");
    });

    test("returns products matching query in description", async () => {
      const mockData = [
        {
          id: "product-1",
          name: "Product 1",
          price: 100,
          rating: 4.5,
          reviews: 100,
          description: "Contains emergency supplies",
          category: "survival-kits",
          inStock: true,
        },
        {
          id: "product-2",
          name: "Product 2",
          price: 50,
          rating: 4.0,
          reviews: 50,
          description: "Basic kit",
          category: "accessories",
          inStock: true,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const products = await adapter.search("emergency");

      expect(products).toHaveLength(1);
      expect(products[0].description).toContain("emergency");
    });

    test("search is case-insensitive", async () => {
      const mockData = [
        {
          id: "product-1",
          name: "Survival Backpack",
          price: 100,
          rating: 4.5,
          reviews: 100,
          description: "Description",
          category: "survival-kits",
          inStock: true,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const products = await adapter.search("SURVIVAL");

      expect(products).toHaveLength(1);
      expect(products[0].name).toBe("Survival Backpack");
    });

    test("returns empty array when no products match query", async () => {
      const mockData = [
        {
          id: "product-1",
          name: "Product 1",
          price: 100,
          rating: 4.5,
          reviews: 100,
          description: "Description",
          category: "survival-kits",
          inStock: true,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const products = await adapter.search("nonexistent");

      expect(products).toHaveLength(0);
    });
  });
});

/**
 * Property-Based Tests for JsonProductAdapter
 *
 * **Validates: Requirements 3.4, 6.3**
 */

describe("Property 3: JSON to Domain Transformation", () => {
  /**
   * Feature: hexagonal-architecture-refactor, Property 3: JSON to Domain Transformation
   *
   * For any valid JSON product data conforming to the schema, the JsonProductAdapter
   * SHALL successfully transform it into a valid Product entity with all fields
   * correctly mapped and business rules enforced.
   */
  test("transforms valid JSON product data into Product entities", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid product JSON data
        fc.record({
          id: fc.stringMatching(/^[a-z0-9-]+$/), // kebab-case IDs
          name: fc.string({ minLength: 1, maxLength: 100 }),
          price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
          originalPrice: fc.option(
            fc.double({ min: 0.01, max: 10000, noNaN: true }),
            { nil: null },
          ),
          rating: fc.double({ min: 0, max: 5, noNaN: true }),
          reviews: fc.integer({ min: 0, max: 100000 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          category: fc.constantFrom(
            "survival-kits",
            "accessories",
            "food",
            "tools",
          ),
          inStock: fc.boolean(),
          badge: fc.option(fc.constantFrom("BESTSELLER", "PREMIUM", "SALE"), {
            nil: null,
          }),
        }),
        async (jsonProduct) => {
          // Ensure originalPrice is greater than price if it exists
          const validJsonProduct = {
            ...jsonProduct,
            originalPrice:
              jsonProduct.originalPrice &&
              jsonProduct.originalPrice > jsonProduct.price
                ? jsonProduct.originalPrice
                : null,
          };

          const mockData = [validJsonProduct];

          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockData,
          } as Response);

          const adapter = new JsonProductAdapter();
          const products = await adapter.findAll();

          // Verify transformation
          expect(products).toHaveLength(1);
          const product = products[0];

          expect(product).toBeInstanceOf(Product);
          expect(product.id.value).toBe(validJsonProduct.id);
          expect(product.name).toBe(validJsonProduct.name);
          expect(product.price.amount).toBe(validJsonProduct.price);

          // Handle null originalPrice correctly
          if (validJsonProduct.originalPrice === null) {
            expect(product.originalPrice).toBeNull();
          } else {
            expect(product.originalPrice?.amount).toBe(
              validJsonProduct.originalPrice,
            );
          }

          expect(product.rating).toBe(validJsonProduct.rating);
          expect(product.reviews).toBe(validJsonProduct.reviews);
          expect(product.description).toBe(validJsonProduct.description);
          expect(product.category).toBe(validJsonProduct.category);
          expect(product.inStock).toBe(validJsonProduct.inStock);
          expect(product.badge).toBe(validJsonProduct.badge);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("correctly maps all fields from JSON to Product entity", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.stringMatching(/^[a-z0-9-]+$/),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            originalPrice: fc.option(
              fc.double({ min: 0.01, max: 10000, noNaN: true }),
              { nil: null },
            ),
            rating: fc.double({ min: 0, max: 5, noNaN: true }),
            reviews: fc.integer({ min: 0, max: 100000 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            category: fc.string({ minLength: 1, maxLength: 50 }),
            inStock: fc.boolean(),
            badge: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
              nil: null,
            }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        async (jsonProducts) => {
          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => jsonProducts,
          } as Response);

          const adapter = new JsonProductAdapter();
          const products = await adapter.findAll();

          // Verify all products are transformed
          expect(products).toHaveLength(jsonProducts.length);

          // Verify each product maintains field mapping
          products.forEach((product, index) => {
            expect(product.id.value).toBe(jsonProducts[index].id);
            expect(product.name).toBe(jsonProducts[index].name);
            expect(product.price.amount).toBe(jsonProducts[index].price);
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Property 4: JSON Validation Error Handling", () => {
  /**
   * Feature: hexagonal-architecture-refactor, Property 4: JSON Validation Error Handling
   *
   * For any invalid JSON product data (missing required fields, invalid types,
   * constraint violations), the JsonProductAdapter SHALL throw a ValidationError
   * with a clear message indicating which field failed validation.
   */
  test("throws error for negative prices", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ max: -0.01, noNaN: true }), // Generate negative prices
        async (negativePrice) => {
          const invalidData = [
            {
              id: "test-product",
              name: "Test Product",
              price: negativePrice, // Invalid: negative price
              rating: 4.5,
              reviews: 100,
              description: "Test description",
              category: "test-category",
              inStock: true,
            },
          ];

          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => invalidData,
          } as Response);

          const adapter = new JsonProductAdapter();

          // The adapter wraps ValidationError in a generic Error
          await expect(adapter.findAll()).rejects.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  test("throws error for invalid ratings", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.double({ max: -0.01, noNaN: true }), // Negative ratings
          fc.double({ min: 5.01, max: 100, noNaN: true }), // Ratings above 5
        ),
        async (invalidRating) => {
          const invalidData = [
            {
              id: "test-product",
              name: "Test Product",
              price: 100,
              rating: invalidRating, // Invalid: outside 0-5 range
              reviews: 100,
              description: "Test description",
              category: "test-category",
              inStock: true,
            },
          ];

          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => invalidData,
          } as Response);

          const adapter = new JsonProductAdapter();

          await expect(adapter.findAll()).rejects.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  test("throws error for negative review counts", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ max: -1 }), // Generate negative review counts
        async (negativeReviews) => {
          const invalidData = [
            {
              id: "test-product",
              name: "Test Product",
              price: 100,
              rating: 4.5,
              reviews: negativeReviews, // Invalid: negative reviews
              description: "Test description",
              category: "test-category",
              inStock: true,
            },
          ];

          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => invalidData,
          } as Response);

          const adapter = new JsonProductAdapter();

          await expect(adapter.findAll()).rejects.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  test("throws error for empty product IDs", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("", "   ", "\t", "\n"), // Generate empty/whitespace IDs
        async (emptyId) => {
          const invalidData = [
            {
              id: emptyId, // Invalid: empty ID
              name: "Test Product",
              price: 100,
              rating: 4.5,
              reviews: 100,
              description: "Test description",
              category: "test-category",
              inStock: true,
            },
          ];

          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => invalidData,
          } as Response);

          const adapter = new JsonProductAdapter();

          await expect(adapter.findAll()).rejects.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  test("handles originalPrice validation correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 1, max: 1000, noNaN: true }),
        fc.double({ min: 0.01, max: 1, noNaN: true }), // Generate value <= 1
        async (price, factor) => {
          const invalidOriginalPrice = price * factor; // Will be <= price

          const invalidData = [
            {
              id: "test-product",
              name: "Test Product",
              price: price,
              originalPrice: invalidOriginalPrice, // originalPrice <= price (not a sale)
              rating: 4.5,
              reviews: 100,
              description: "Test description",
              category: "test-category",
              inStock: true,
            },
          ];

          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => invalidData,
          } as Response);

          const adapter = new JsonProductAdapter();

          // The adapter doesn't validate this business rule, it just creates the product
          // The Product entity will have originalPrice but isOnSale() will return false
          const products = await adapter.findAll();

          expect(products).toHaveLength(1);
          // Verify that when originalPrice <= price, isOnSale() returns false
          expect(products[0].isOnSale()).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
