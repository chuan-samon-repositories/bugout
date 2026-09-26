import { ContactService } from '@/application/ports/ContactService';
import { delay } from '../delay';

/**
 * Placeholder until a support inbox/helpdesk backend is connected: resolves after
 * a short simulated delay and deliberately sends nothing anywhere.
 */
export class LocalContactAdapter implements ContactService {
  constructor(private readonly options: { delayMs?: number } = {}) {}

  async send(): Promise<void> {
    await delay(this.options.delayMs ?? 600);
  }
}
