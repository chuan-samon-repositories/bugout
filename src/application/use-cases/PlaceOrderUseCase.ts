import { Cart } from '@/domain/entities/cart/Cart';
import { PricingPolicy, calculateOrderTotals } from '@/domain/entities/order/OrderPricing';
import { ValidationError } from '@/domain/errors';
import { validateCheckoutDetails } from '@/application/checkout/validateCheckoutDetails';
import { CheckoutDetails, OrderConfirmation, OrderLine } from '@/application/dtos/Order';
import { FormValidationError } from '@/application/errors';
import { CartRepository } from '@/application/ports/CartRepository';
import { OrderGateway } from '@/application/ports/OrderGateway';

function normalize(details: CheckoutDetails): CheckoutDetails {
  const { customer, shippingAddress } = details;
  return {
    ...details,
    customer: {
      email: customer.email.trim(),
      firstName: customer.firstName.trim(),
      lastName: customer.lastName.trim(),
      phone: customer.phone.trim(),
    },
    shippingAddress: {
      address: shippingAddress.address.trim(),
      city: shippingAddress.city.trim(),
      province: shippingAddress.province.trim(),
      postalCode: shippingAddress.postalCode.trim(),
      country: shippingAddress.country.trim().toUpperCase(),
    },
    notes: details.notes.trim(),
  };
}

function toOrderLines(cart: Cart): OrderLine[] {
  return cart.getItems().map((item) => ({
    productId: item.product.id.value,
    name: item.product.name,
    quantity: item.quantity.value,
    unitPriceMinor: item.product.price.minor,
    subtotalMinor: item.subtotal().minor,
  }));
}

/** Places an order through the in-app (local) checkout and empties the cart. */
export class PlaceOrderUseCase {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly orderGateway: OrderGateway,
    private readonly pricingPolicy: PricingPolicy,
  ) {}

  /**
   * @throws FormValidationError when any checkout field is invalid
   * @throws ValidationError when the cart is empty
   */
  async execute(input: CheckoutDetails): Promise<OrderConfirmation> {
    const details = normalize(input);
    const fieldErrors = validateCheckoutDetails(details, 'all');
    if (!this.pricingPolicy.shippingRates.some((rate) => rate.id === details.shippingMethod)) {
      fieldErrors.shippingMethod = 'required';
    }
    if (Object.keys(fieldErrors).length > 0) {
      throw new FormValidationError(fieldErrors);
    }

    const cart = await this.cartRepository.load();
    if (cart.isEmpty()) {
      throw new ValidationError('Cannot place an order with an empty cart');
    }

    const confirmation = await this.orderGateway.placeOrder({
      details,
      lines: toOrderLines(cart),
      totals: calculateOrderTotals(cart, details.shippingMethod, this.pricingPolicy),
    });
    await this.cartRepository.clear();
    return confirmation;
  }
}
