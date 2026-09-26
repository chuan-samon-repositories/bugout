/** Newsletter subscription backend (email provider / Shopify customer marketing). */
export interface NewsletterService {
  subscribe(email: string): Promise<void>;
}
