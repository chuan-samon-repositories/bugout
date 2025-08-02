"use client";

import React, { createContext, useReducer, useContext, ReactNode } from "react";

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

type State = {
  items: CartItem[];
};

type Action =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "CLEAR_CART" };

const initialState: State = {
  items: [],
};

function reducer(state: State, action: Action): State {
  console.log("State modified:", action, state);
  switch (action.type) {
    case "ADD_ITEM":
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return { items: [...state.items, action.payload] };
    case "REMOVE_ITEM":
      const itemToRemove = state.items.find(
        (item) => item.id === action.payload.id
      );
      if (!itemToRemove) return state;

      if (itemToRemove.quantity > 1) {
        return {
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity - 1 }
              : item
          ),
        };
      }

      return {
        items: state.items.filter((item) => item.id !== action.payload.id),
      };
    case "CLEAR_CART":
      return { items: [] };
    default:
      return state;
  }
}

const CartContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
