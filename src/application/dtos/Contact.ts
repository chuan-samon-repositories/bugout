export type ContactTopic = 'general' | 'order' | 'product' | 'wholesale';

export interface ContactMessage {
  name: string;
  email: string;
  topic: ContactTopic;
  subject: string;
  message: string;
}
