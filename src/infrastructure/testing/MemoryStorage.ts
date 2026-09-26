import { KeyValueStorage } from '@/infrastructure/adapters/storage';

/** In-memory Storage fake for adapter tests. */
export class MemoryStorage implements KeyValueStorage {
  readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  json(key: string): unknown {
    const raw = this.data.get(key);
    return raw === undefined ? undefined : JSON.parse(raw);
  }
}
