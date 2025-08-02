"use client";

import { useMemo, useState } from "react";
import { Cart } from "./Cart";
import { useCart } from "../context/cart/CartContext";
import Link from "next/link";

export const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const { state } = useCart();

  const cartAmount = useMemo(() => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  }, [state.items]);

  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  return (
    <div>
      <nav className="w-full fixed grid grid-cols-3 py-6 shadow-md top-0 bg-background">
        <HeaderSections>
          <p>Mochilas</p>
          <p className="font-bold text-red-500">SALE</p>
        </HeaderSections>
        <Link href="/">
          <h1 className="flex justify-center text-2xl">BUGOUT</h1>
        </Link>
        <HeaderSections>
          <div className="flex-1" />
          <p>About us</p>
          <p className="font-bold" onClick={toggleCart}>
            CART {cartAmount}
          </p>
        </HeaderSections>
      </nav>
      <Cart isOpen={cartOpen} />
    </div>
  );
};

const HeaderSections = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="flex flex-row mx-4 *:pt-1 *:mx-4 *:cursor-pointer">
      {children}
    </div>
  );
};
