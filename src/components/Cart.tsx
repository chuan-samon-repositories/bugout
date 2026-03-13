"use client";

import { useCart } from "../presentation/hooks/useCart";
import { useRouter } from "next/navigation";
import { ProductId } from "../domain/value-objects/ProductId";
import { Quantity } from "../domain/value-objects/Quantity";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Cart = ({ isOpen, onClose }: CartProps) => {
  const { cart, loading, addItem, removeItem, clearCart: clearCartAction, itemCount, totalAmount } = useCart();
  const router = useRouter();

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeItem(new ProductId(productId));
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCartAction();
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    const cartItems = cart?.getItems() || [];
    const item = cartItems.find((item) => item.product.id.value === productId);
    if (!item) return;

    const currentQuantity = item.quantity.value;

    if (newQuantity <= 0) {
      // Remove the item entirely
      await handleRemoveItem(productId);
    } else if (newQuantity > currentQuantity) {
      // Add the difference
      const difference = newQuantity - currentQuantity;
      await addItem(new ProductId(productId), new Quantity(difference));
    } else {
      // For reducing quantity, we need to remove and re-add with new quantity
      // First remove the item
      await handleRemoveItem(productId);
      // Then add it back with the new quantity
      await addItem(new ProductId(productId), new Quantity(newQuantity));
    }
  };

  const handleCheckout = () => {
    onClose();
    // Navigate to checkout page using Next.js router
    router.push("/checkout");
  };

  // Get cart items from domain entity
  const cartItems = cart?.getItems() || [];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Cart Sidebar */}
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#EEE8CE] bg-[#EEE8CE]/20">
          <h2 className="text-2xl font-bold text-[#243C58]">
            Shopping Cart
            {itemCount > 0 && (
              <span className="ml-2 bg-[#FF780C] text-white text-sm px-2 py-1 rounded-full">
                {itemCount}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#EEE8CE]/50 rounded-lg transition-colors duration-200"
          >
            <svg
              className="w-6 h-6 text-[#243C58]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-medium text-[#243C58] mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-600 mb-6">
                Start adding some survival gear to get prepared!
              </p>
              <button
                onClick={onClose}
                className="bg-[#FF780C] hover:bg-[#e66b0a] text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.product.id.value}
                  className="bg-[#EEE8CE]/10 rounded-lg p-4 border border-[#EEE8CE]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-[#243C58] mb-1">
                        {item.product.name}
                      </h4>
                      <p className="text-[#FF780C] font-medium">
                        ${item.product.price.amount.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => updateQuantity(item.product.id.value, 0)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors duration-200"
                      title="Remove item"
                      disabled={loading}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id.value, item.quantity.value - 1)
                        }
                        className="w-8 h-8 rounded-full border border-[#EEE8CE] flex items-center justify-center hover:bg-[#EEE8CE]/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 12H4"
                          />
                        </svg>
                      </button>

                      <span className="font-medium text-[#243C58] min-w-[2rem] text-center">
                        {item.quantity.value}
                      </span>

                      <button
                        onClick={() =>
                          updateQuantity(item.product.id.value, item.quantity.value + 1)
                        }
                        className="w-8 h-8 rounded-full border border-[#EEE8CE] flex items-center justify-center hover:bg-[#EEE8CE]/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-[#243C58]">
                        ${item.subtotal().amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-[#EEE8CE] p-6 bg-[#EEE8CE]/20">
            {/* Subtotal */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium text-[#243C58]">
                Subtotal:
              </span>
              <span className="text-2xl font-bold text-[#243C58]">
                ${totalAmount.amount.toFixed(2)}
              </span>
            </div>

            {/* Shipping Notice */}
            <div className="bg-[#EEE8CE]/30 border border-[#EEE8CE] rounded-lg p-3 mb-4">
              <p className="text-sm text-[#243C58] text-center">
                🚚 Free shipping on orders over $75
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                className="w-full bg-[#FF780C] hover:bg-[#e66b0a] text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Proceed to Checkout
              </button>

              <button
                onClick={onClose}
                className="w-full border-2 border-[#EEE8CE] text-[#243C58] hover:bg-[#EEE8CE]/50 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Continue Shopping
              </button>

              {cartItems.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="w-full text-red-600 hover:text-red-700 font-medium py-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
