import { describe, expect, it, vi } from 'vitest';
import { CONSENT_STORAGE_KEY, LocalStorageConsentRepository } from './LocalStorageConsentRepository';
import { MemoryStorage } from '@/infrastructure/testing/MemoryStorage';
import { CONSENT_VERSION, ConsentDecision } from '@/application/dtos/Consent';

const decision: ConsentDecision = { analytics: true, decidedAt: '2026-09-01T10:00:00.000Z', version: CONSENT_VERSION };

describe('LocalStorageConsentRepository', () => {
  it('is undecided when nothing is stored', () => {
    expect(new LocalStorageConsentRepository(new MemoryStorage()).get()).toBeNull();
  });

  it('stores and reads a decision', () => {
    const storage = new MemoryStorage();
    const repository = new LocalStorageConsentRepository(storage);
    repository.set(decision);
    expect(storage.json(CONSENT_STORAGE_KEY)).toEqual(decision);
    expect(repository.get()).toEqual(decision);
  });

  it.each([
    ['corrupt JSON', '{'],
    ['a non-object', '"yes"'],
    ['a non-boolean analytics flag', JSON.stringify({ ...decision, analytics: 'true' })],
    ['an invalid date', JSON.stringify({ ...decision, decidedAt: 'yesterday' })],
    ['an older policy version', JSON.stringify({ ...decision, version: CONSENT_VERSION - 1 })],
    ['a missing version', JSON.stringify({ analytics: true, decidedAt: decision.decidedAt })],
  ])('treats %s as undecided', (_label, raw) => {
    const storage = new MemoryStorage();
    storage.setItem(CONSENT_STORAGE_KEY, raw);
    expect(new LocalStorageConsentRepository(storage).get()).toBeNull();
  });

  it('is undecided and silent on the server', () => {
    const repository = new LocalStorageConsentRepository();
    expect(repository.get()).toBeNull();
    expect(() => repository.set(decision)).not.toThrow();
  });

  it('never throws when storage is blocked', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const blocked = new MemoryStorage();
    blocked.getItem = () => {
      throw new Error('SecurityError');
    };
    blocked.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    const repository = new LocalStorageConsentRepository(blocked);
    expect(repository.get()).toBeNull();
    expect(() => repository.set(decision)).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
