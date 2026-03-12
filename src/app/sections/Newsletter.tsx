"use client";

import { useState } from "react";

export const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="w-full py-20 bg-gradient-to-r from-[#243C58] to-[#1a2d42]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-4">Stay Prepared</h2>
          <p className="text-xl text-[#EEE8CE] max-w-2xl mx-auto">
            Get survival tips, gear reviews, and exclusive offers delivered to
            your inbox. Join over 10,000 prepared individuals.
          </p>
        </div>

        {!isSubscribed ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-6 py-4 rounded-lg border-0 text-[#243C58] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF780C] w-full sm:w-auto transition-all duration-300"
              required
            />
            <button
              type="submit"
              className="bg-[#FF780C] hover:bg-[#e66b0a] text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg whitespace-nowrap"
            >
              Subscribe Now
            </button>
          </form>
        ) : (
          <div className="bg-[#FF780C] text-white py-4 px-6 rounded-lg max-w-md mx-auto animate-fade-in">
            <div className="flex items-center justify-center gap-2">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-bold">Successfully subscribed!</span>
            </div>
            <p className="text-sm mt-2 opacity-90">
              Check your email for a welcome message.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-6 text-[#EEE8CE]/70 text-sm">
          <div className="flex items-center gap-2 hover:text-[#EEE8CE] transition-colors duration-300">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>Weekly survival tips</span>
          </div>
          <div className="flex items-center gap-2 hover:text-[#EEE8CE] transition-colors duration-300">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>No spam, unsubscribe anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
};
