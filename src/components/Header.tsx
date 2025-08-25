"use client";

import { useMemo, useState, useEffect } from "react";
import { Cart } from "./Cart";
import { useCart } from "../context/cart/CartContext";
import Link from "next/link";

export const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { state } = useCart();

  const cartAmount = useMemo(() => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  }, [state.items]);

  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
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
        className={`w-full fixed top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "py-4 bg-white/95 backdrop-blur-md shadow-xl"
            : "py-6 bg-white/90 backdrop-blur-sm shadow-lg"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          {/* Desktop Navigation */}
          <div className="hidden md:grid md:grid-cols-3 items-center">
            <div className="flex items-center space-x-8">
              <Link
                href="/products"
                className="text-slate-700 hover:text-orange-600 transition-colors duration-200 font-medium"
              >
                Products
              </Link>
              <div className="relative group">
                <button className="text-slate-700 hover:text-orange-600 transition-colors duration-200 font-medium flex items-center">
                  Kits
                  <svg
                    className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link
                    href="/products/24h-survival-backpack"
                    className="block px-4 py-3 text-slate-700 hover:text-orange-600 hover:bg-gray-50 transition-colors duration-200"
                  >
                    24H Survival Kit
                  </Link>
                  <Link
                    href="/products/72h-survival-backpack"
                    className="block px-4 py-3 text-slate-700 hover:text-orange-600 hover:bg-gray-50 transition-colors duration-200"
                  >
                    72H Survival Kit
                  </Link>
                  <Link
                    href="/products/custom-kit"
                    className="block px-4 py-3 text-slate-700 hover:text-orange-600 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Custom Kit
                  </Link>
                </div>
              </div>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse cursor-pointer hover:bg-red-600 transition-colors duration-200">
                SALE
              </span>
            </div>

            <Link href="/" className="group justify-self-center">
              <h1 className="text-2xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors duration-200">
                BUGOUT
              </h1>
            </Link>

            <div className="flex items-center justify-end space-x-8">
              <Link
                href="/about"
                className="text-slate-700 hover:text-orange-600 transition-colors duration-200 font-medium"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-slate-700 hover:text-orange-600 transition-colors duration-200 font-medium"
              >
                Contact
              </Link>
              <button
                className="relative text-slate-700 hover:text-orange-600 transition-colors duration-200 font-medium flex items-center"
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
                <span className="ml-1">Cart</span>
                {cartAmount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {cartAmount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex justify-between items-center">
            <Link href="/" className="group">
              <h1 className="text-xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors duration-200">
                BUGOUT
              </h1>
            </Link>

            <div className="flex items-center space-x-4">
              <button
                className="relative text-slate-700 hover:text-orange-600 transition-colors duration-200"
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
                {cartAmount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {cartAmount}
                  </span>
                )}
              </button>

              <button
                onClick={toggleMobileMenu}
                className="text-slate-700 hover:text-orange-600 transition-colors duration-200"
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
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4 pt-4">
                <Link
                  href="/products"
                  className="text-slate-700 hover:text-orange-600 transition-colors duration-200 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Products
                </Link>
                <Link
                  href="/products/24h-survival-backpack"
                  className="text-slate-700 hover:text-orange-600 transition-colors duration-200 pl-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  24H Survival Kit
                </Link>
                <Link
                  href="/products/72h-survival-backpack"
                  className="text-slate-700 hover:text-orange-600 transition-colors duration-200 pl-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  72H Survival Kit
                </Link>
                <Link
                  href="/about"
                  className="text-slate-700 hover:text-orange-600 transition-colors duration-200 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="text-slate-700 hover:text-orange-600 transition-colors duration-200 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};
