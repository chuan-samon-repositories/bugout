import { ContactMessage } from '@/application/dtos/Contact';

/** Delivers messages from the contact form to the support team. */
export interface ContactService {
  send(message: ContactMessage): Promise<void>;
}
