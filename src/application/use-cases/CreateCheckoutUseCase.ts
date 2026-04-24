import { CartRepository } from '../ports/CartRepository';
import { CheckoutService } from '../ports/CheckoutService';

export class CreateCheckoutUseCase {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly checkoutService: CheckoutService,
  ) {}

  async execute(): Promise<string> {
    const cart = await this.cartRepository.load();
    return this.checkoutService.getCheckoutUrl(cart);
  }
}
