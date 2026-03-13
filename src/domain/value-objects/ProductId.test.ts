import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { ProductId } from './ProductId';
import { ValidationError } from '../errors';

/**
 * Property-Based Tests for ProductId Value Object Validation
 * 
 * **Validates: Requirements 1.2, 1.5, 9.2**
 * 
 * Feature: hexagonal-architecture-refactor, Property 1: Domain Entity Validation
 * ProductId value object SHALL throw ValidationError when constructed with empty or whitespace-only strings.
 */

describe('Property 1: Domain Entity Validation - ProductId', () => {
  test('ProductId rejects empty strings', () => {
    expect(() => {
      new ProductId('');
    }).toThrow(ValidationError);
  });

  test('ProductId rejects whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\s+$/), // Generate whitespace-only strings
        (whitespaceString) => {
          expect(() => {
            new ProductId(whitespaceString);
          }).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('ProductId accepts non-empty strings', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // Generate valid non-empty strings
        (validId) => {
          const productId = new ProductId(validId);
          expect(productId.value).toBe(validId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
