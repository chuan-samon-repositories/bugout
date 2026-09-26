import { FormValidationError } from '../errors';
import { NewsletterService } from '../ports/NewsletterService';
import { isBlank, isValidEmail } from '../validation';

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
