import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { Product } from './Product';
import { Money } from '../../value-objects/Money';
import { ProductId } from '../../value-objects/ProductId';
import { ValidationError } from '../../errors';

/**
 * Property-Based Tests for Domain Entity Validation
 * 
 * **Validates: Requirements 1.2, 1.5, 9.2**
 * 
 * Feature: hexagonal-architecture-refactor, Property 1: Domain Entity Validation
 * For any domain entity (Product, Cart, Money, ProductId, Quantity), when constructed 
 * with invalid data (negative prices, invalid ratings, empty IDs, non-positive quantities), 
 * the entity SHALL throw a ValidationError with a descriptive message.
 */

describe('Property 1: Domain Entity Validation', () => {
  test('Product entity rejects non-positive prices', () => {
    fc.assert(
      fc.property(
        fc.double({ max: 0, noNaN: true }), // Generate non-positive prices
        fc.string({ minLength: 1 }), // Valid product ID
        fc.string({ minLength: 1 }), // Valid name
        fc.double({ min: 0, max: 5, noNaN: true }), // Valid rating
        fc.integer({ min: 0 }), // Valid reviews
        fc.string({ minLength: 1 }), // Valid description
        fc.string({ minLength: 1 }), // Valid category
        fc.boolean(), // Valid inStock
        (invalidPrice, id, name, rating, reviews, description, category, inStock) => {
          expect(() => {
            new Product(
              new ProductId(id),
              name,
              new Money(invalidPrice),
              null,
              rating,
              reviews,
              description,
              category,
              inStock,
              null
            );
          }).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Product entity rejects invalid ratings (< 0 or > 5)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ max: -0.01, noNaN: true }), // Negative ratings
          fc.double({ min: 5.01, noNaN: true })   // Ratings above 5
        ),
        fc.string({ minLength: 1 }), // Valid product ID
        fc.string({ minLength: 1 }), // Valid name
        fc.double({ min: 0.01, noNaN: true }), // Valid price
        fc.integer({ min: 0 }), // Valid reviews
        fc.string({ minLength: 1 }), // Valid description
        fc.string({ minLength: 1 }), // Valid category
        fc.boolean(), // Valid inStock
        (invalidRating, id, name, price, reviews, description, category, inStock) => {
          expect(() => {
            new Product(
              new ProductId(id),
              name,
              new Money(price),
              null,
              invalidRating,
              reviews,
              description,
              category,
              inStock,
              null
            );
          }).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Product entity rejects negative review counts', () => {
    fc.assert(
      fc.property(
        fc.integer({ max: -1 }), // Generate negative review counts
        fc.string({ minLength: 1 }), // Valid product ID
        fc.string({ minLength: 1 }), // Valid name
        fc.double({ min: 0.01, noNaN: true }), // Valid price
        fc.double({ min: 0, max: 5, noNaN: true }), // Valid rating
        fc.string({ minLength: 1 }), // Valid description
        fc.string({ minLength: 1 }), // Valid category
        fc.boolean(), // Valid inStock
        (invalidReviews, id, name, price, rating, description, category, inStock) => {
          expect(() => {
            new Product(
              new ProductId(id),
              name,
              new Money(price),
              null,
              rating,
              invalidReviews,
              description,
              category,
              inStock,
              null
            );
          }).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });
});
