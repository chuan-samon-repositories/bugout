import { FormValidationError } from '@/application/errors';
import { NewsletterService } from '@/application/ports/NewsletterService';
import { isBlank, isValidEmail } from '@/application/validation';

export class SubscribeNewsletterUseCase {
  constructor(private readonly newsletterService: NewsletterService) {}

  /** @throws FormValidationError with `email` set to 'required' or 'invalidEmail' */
  async execute(email: string): Promise<void> {
    const trimmed = email.trim();
    if (isBlank(trimmed)) throw new FormValidationError({ email: 'required' });
    if (!isValidEmail(trimmed)) throw new FormValidationError({ email: 'invalidEmail' });
    await this.newsletterService.subscribe(trimmed);
  }
}
