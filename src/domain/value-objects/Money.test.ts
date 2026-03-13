import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { Money } from './Money';
import { ValidationError } from '../errors';

/**
 * Property-Based Tests for Money Value Object Validation
 * 
 * **Validates: Requirements 1.2, 1.5, 9.2**
 * 
 * Feature: hexagonal-architecture-refactor, Property 1: Domain Entity Validation
 * Money value object SHALL throw ValidationError when constructed with negative amounts.
 */

describe('Property 1: Domain Entity Validation - Money', () => {
  test('Money rejects negative amounts', () => {
    fc.assert(
      fc.property(
        fc.double({ max: -0.01, noNaN: true }), // Generate negative amounts
        (negativeAmount) => {
          expect(() => {
            new Money(negativeAmount);
          }).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Money accepts zero and positive amounts', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, noNaN: true }), // Generate non-negative amounts
        (validAmount) => {
          const money = new Money(validAmount);
          expect(money.amount).toBe(validAmount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
