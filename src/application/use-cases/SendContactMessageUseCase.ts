import { ContactMessage, ContactTopic } from '@/application/dtos/Contact';
import { FieldErrors, FormValidationError } from '@/application/errors';
import { ContactService } from '@/application/ports/ContactService';
import { isBlank, isValidEmail } from '@/application/validation';

export const CONTACT_MESSAGE_MIN_LENGTH = 10;
export const CONTACT_MESSAGE_MAX_LENGTH = 2000;

const TOPICS: readonly ContactTopic[] = ['general', 'order', 'product', 'wholesale'];

function validate(message: ContactMessage): FieldErrors {
  const errors: FieldErrors = {};
  if (isBlank(message.name)) errors.name = 'required';
  if (isBlank(message.email)) errors.email = 'required';
  else if (!isValidEmail(message.email)) errors.email = 'invalidEmail';
  if (!TOPICS.includes(message.topic)) errors.topic = 'required';
  if (isBlank(message.subject)) errors.subject = 'required';
  if (isBlank(message.message)) errors.message = 'required';
  else if (message.message.length < CONTACT_MESSAGE_MIN_LENGTH) errors.message = 'tooShort';
  else if (message.message.length > CONTACT_MESSAGE_MAX_LENGTH) errors.message = 'tooLong';
  return errors;
}

export class SendContactMessageUseCase {
  constructor(private readonly contactService: ContactService) {}

  /** @throws FormValidationError keyed by field name (name, email, topic, subject, message) */
  async execute(input: ContactMessage): Promise<void> {
    const message: ContactMessage = {
      name: input.name.trim(),
      email: input.email.trim(),
      topic: input.topic,
      subject: input.subject.trim(),
      message: input.message.trim(),
    };
    const errors = validate(message);
    if (Object.keys(errors).length > 0) throw new FormValidationError(errors);
    await this.contactService.send(message);
  }
}
