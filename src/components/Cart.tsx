"use client";

import { useCart } from "../context/cart/CartContext";

interface CartProps {
  isOpen: boolean;
}

export const Cart = ({ isOpen }: CartProps) => {
  const { state, dispatch } = useCart();

  const removeItem = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
  };
  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 80,
        backgroundColor: "white",
        border: "1px solid #ccc",
        display: isOpen ? "flex" : "none",
        flexDirection: "column",
        height: "calc(100vh - 80px)",
        width: "20vw",
      }}
    >
      <h2>Shopping Cart</h2>
      {state.items.map((item) => {
        const elements = [];

        for (let i = 0; i < item.quantity; i++) {
          elements.push(
            <div
              key={`${item.id}-${i}`}
              style={{
                display: "flex",
                flexDirection: "row",
                height: "50px",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 10px",
              }}
            >
              <span>{item.name}</span>
              <span>${item.price.toFixed(2)}</span>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "red",
                  cursor: "pointer",
                }}
                onClick={() => removeItem(item.id)}
              >
                Remove
              </button>
            </div>
          );
        }
        return elements;
      })}

      <div style={{ flex: 1 }} />

      <div>
        <h3>
          Total: $
          {state.items
            .reduce((total, item) => total + item.price * item.quantity, 0)
            .toFixed(2)}
        </h3>
        <button
          onClick={() => dispatch({ type: "CLEAR_CART" })}
          style={{
            backgroundColor: "red",
            color: "white",
            padding: "10px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
};
