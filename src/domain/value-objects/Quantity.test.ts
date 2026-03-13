import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { Quantity } from './Quantity';
import { ValidationError } from '../errors';

/**
 * Property-Based Tests for Quantity Value Object Validation
 * 
 * **Validates: Requirements 1.2, 1.5, 9.2**
 * 
 * Feature: hexagonal-architecture-refactor, Property 1: Domain Entity Validation
 * Quantity value object SHALL throw ValidationError when constructed with non-positive 
 * or non-integer values.
 */

describe('Property 1: Domain Entity Validation - Quantity', () => {
  test('Quantity rejects non-positive values', () => {
    fc.assert(
      fc.property(
        fc.integer({ max: 0 }), // Generate non-positive integers
        (nonPositiveValue) => {
          expect(() => {
            new Quantity(nonPositiveValue);
          }).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Quantity rejects non-integer values', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, noNaN: true }).filter(n => !Number.isInteger(n)), // Generate non-integer values
        (nonIntegerValue) => {
          expect(() => {
            new Quantity(nonIntegerValue);
          }).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Quantity accepts positive integers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1 }), // Generate positive integers
        (validQuantity) => {
          const quantity = new Quantity(validQuantity);
          expect(quantity.value).toBe(validQuantity);
        }
      ),
      { numRuns: 100 }
    );
  });
});
