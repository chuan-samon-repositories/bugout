import { NewsletterService } from '@/application/ports/NewsletterService';
import { delay } from '@/infrastructure/adapters/delay';

/**
 * Placeholder until a mail/CRM backend is connected: resolves after a short
 * simulated delay and deliberately sends nothing anywhere.
 */
export class LocalNewsletterAdapter implements NewsletterService {
  constructor(private readonly options: { delayMs?: number } = {}) {}

  async subscribe(): Promise<void> {
    await delay(this.options.delayMs ?? 600);
  }
}
