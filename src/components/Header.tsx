"use client";

import { useMemo, useState, useEffect } from "react";
import { Cart } from "./Cart";
import { useCart } from "../context/cart/CartContext";
import Link from "next/link";

export const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const { state } = useCart();

  const cartAmount = useMemo(() => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  }, [state.items]);

  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  const toggleMobileMenu = () => {
    setNavMenuOpen(!navMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div>
      <nav
        className={`w-full fixed top-0 z-50 transition-all duration-300 h-[50px] ${
          isScrolled
            ? "bg-[#243C58]/95 backdrop-blur-md shadow-xl"
            : "bg-[#243C58]/90 backdrop-blur-sm shadow-lg"
        }`}
      >
        <div className="w-full px-4 h-full relative">
          {/* Main Header Layout */}
          <div className="flex justify-between items-center h-full">
            {/* Left Section - Menu Icon and Brand Name */}
            <div className="flex items-center space-x-4 absolute left-4">
              <button
                onClick={toggleMobileMenu}
                className="text-white hover:text-[#FF780C] transition-colors duration-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <Link href="/" className="group">
                <h1 className="text-2xl md:text-3xl font-black text-white group-hover:text-[#FF780C] transition-colors duration-200">
                  BUGOUT
                </h1>
              </Link>
            </div>

            {/* Right Section - Cart */}
            <div className="flex items-center absolute right-4">
              <button
                className="relative text-white hover:text-[#FF780C] transition-colors duration-200 font-medium flex items-center"
                onClick={toggleCart}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 7H3m4 6v3a2 2 0 002 2h8a2 2 0 002-2v-3m-10 3a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z"
                  />
                </svg>
                <span className="ml-2 hidden sm:inline">Cart</span>
                {cartAmount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#FF780C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {cartAmount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Side Navigation Overlay */}
      {navMenuOpen && (
        <div className="fixed inset-0 z-40">
          {/* Overlay Background */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setNavMenuOpen(false)}
          ></div>

          {/* Side Menu */}
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300">
            <div className="p-6">
              {/* Close Button */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-800">Navigation</h2>
                <button
                  onClick={() => setNavMenuOpen(false)}
                  className="text-slate-500 hover:text-slate-700 transition-colors duration-200"
                >
                  <svg
                    className="w-6 h-6"
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

              {/* Navigation Links */}
              <div className="flex flex-col space-y-6">
                <Link
                  href="/products"
                  className="text-slate-700 hover:text-[#FF780C] transition-colors duration-200 font-medium text-lg py-2 border-b border-[#EEE8CE]"
                  onClick={() => setNavMenuOpen(false)}
                >
                  Products
                </Link>

                <div className="pl-4 space-y-3">
                  <Link
                    href="/products/24h-survival-backpack"
                    className="block text-slate-600 hover:text-[#FF780C] transition-colors duration-200 py-1"
                    onClick={() => setNavMenuOpen(false)}
                  >
                    24H Survival Kit
                  </Link>
                  <Link
                    href="/products/72h-survival-backpack"
                    className="block text-slate-600 hover:text-[#FF780C] transition-colors duration-200 py-1"
                    onClick={() => setNavMenuOpen(false)}
                  >
                    72H Survival Kit
                  </Link>
                  <Link
                    href="/products/custom-kit"
                    className="block text-slate-600 hover:text-[#FF780C] transition-colors duration-200 py-1"
                    onClick={() => setNavMenuOpen(false)}
                  >
                    Custom Kit
                  </Link>
                </div>

                <Link
                  href="/about"
                  className="text-slate-700 hover:text-[#FF780C] transition-colors duration-200 font-medium text-lg py-2 border-b border-[#EEE8CE]"
                  onClick={() => setNavMenuOpen(false)}
                >
                  About
                </Link>

                <Link
                  href="/contact"
                  className="text-slate-700 hover:text-[#FF780C] transition-colors duration-200 font-medium text-lg py-2 border-b border-[#EEE8CE]"
                  onClick={() => setNavMenuOpen(false)}
                >
                  Contact
                </Link>

                <div className="pt-4">
                  <span className="bg-[#FF780C] text-white text-xs font-bold px-3 py-2 rounded-full animate-pulse cursor-pointer hover:bg-[#e66b0a] transition-colors duration-200">
                    SALE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};
