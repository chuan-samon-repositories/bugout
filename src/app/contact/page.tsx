"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    inquiryType: "general",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setSubmitMessage(
        "Thank you for your message! We'll get back to you within 24 hours."
      );
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        inquiryType: "general",
      });
      setIsSubmitting(false);
    }, 2000);
  };

  const departments = [
    {
      name: "Customer Support",
      email: "support@bugout.com",
      description: "Product questions, order status, returns",
    },
    {
      name: "Sales & Quotes",
      email: "sales@bugout.com",
      description: "Bulk orders, corporate inquiries, pricing",
    },
    {
      name: "Technical Support",
      email: "tech@bugout.com",
      description: "Product usage, setup assistance, training",
    },
    {
      name: "Media & Press",
      email: "press@bugout.com",
      description: "Press inquiries, partnerships, collaborations",
    },
  ];

  const faqs = [
    {
      question: "What's your return policy?",
      answer:
        "We offer a 30-day money-back guarantee on all products. Items must be unused and in original packaging.",
    },
    {
      question: "Do you ship internationally?",
      answer:
        "Yes! We ship to 25+ countries worldwide. International shipping typically takes 7-14 business days.",
    },
    {
      question: "Are your products tested?",
      answer:
        "Every product undergoes rigorous field testing by our team and professional survival instructors before release.",
    },
    {
      question: "Do you offer bulk discounts?",
      answer:
        "Yes, we offer volume discounts for organizations, first responders, and corporate clients. Contact our sales team for pricing.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
        <Link
          href="/"
          className="hover:text-orange-600 transition-colors duration-200"
        >
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Contact</span>
      </nav>

      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Get In <span className="text-orange-500">Touch</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Have questions about our products? Need help choosing the right
          survival kit? Our expert team is here to help you stay prepared.
        </p>
      </div>

      {/* Contact Methods */}
      <div className="flex justify-center mb-16">
        <div className="w-full max-w-md">
          <div className="bg-white p-6 rounded-lg border border-gray-200 text-center hover:shadow-lg transition-all duration-300 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
              📧
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Email Support</h3>
            <p className="text-orange-600 font-medium mb-2">
              support@bugout.com
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Response within 24 hours
            </p>
            <button className="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors duration-200">
              Send Email →
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Contact Form */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Send Us a Message
          </h2>
          {submitMessage ? (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6">
              {submitMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="inquiryType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Inquiry Type
              </label>
              <select
                id="inquiryType"
                name="inquiryType"
                value={formData.inquiryType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
              >
                <option value="general">General Inquiry</option>
                <option value="product">Product Question</option>
                <option value="order">Order Support</option>
                <option value="technical">Technical Support</option>
                <option value="bulk">Bulk Order</option>
                <option value="partnership">Partnership</option>
                <option value="media">Media/Press</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                placeholder="Brief subject of your message"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                placeholder="Tell us how we can help you..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Contact Information
          </h2>

          {/* Company Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              BUGOUT Headquarters
            </h3>
            <div className="space-y-3 text-gray-600">
              <p className="flex items-center">
                <span className="mr-3">📍</span>
                123 Preparedness Avenue
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Denver, CO 80202
              </p>
              <p className="flex items-center">
                <span className="mr-3">📞</span>
                +1 (555) 123-4567
              </p>
              <p className="flex items-center">
                <span className="mr-3">📧</span>
                hello@bugout.com
              </p>
              <p className="flex items-center">
                <span className="mr-3">🕒</span>
                Mon-Fri: 8:00 AM - 8:00 PM EST
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Sat-Sun: 10:00 AM - 6:00 PM
                EST
              </p>
            </div>
          </div>

          {/* Departments */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Direct Departments
            </h3>
            <div className="space-y-4">
              {departments.map((dept, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h4 className="font-medium text-gray-900 mb-1">
                    {dept.name}
                  </h4>
                  <p className="text-orange-600 text-sm mb-2">{dept.email}</p>
                  <p className="text-gray-600 text-sm">{dept.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Facebook
              </button>
              <button className="bg-gray-900 text-white p-3 rounded-lg hover:bg-gray-800 transition-colors duration-200">
                Twitter
              </button>
              <button className="bg-pink-600 text-white p-3 rounded-lg hover:bg-pink-700 transition-colors duration-200">
                Instagram
              </button>
              <button className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-colors duration-200">
                YouTube
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg border border-gray-200"
            >
              <h3 className="font-bold text-gray-900 mb-3">{faq.question}</h3>
              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <Link
            href="/support"
            className="text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
          >
            Visit our Help Center →
          </Link>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-gray-200 rounded-2xl h-64 flex items-center justify-center mb-16">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="font-medium">Interactive Map</p>
          <p className="text-sm">123 Preparedness Ave, Denver, CO 80202</p>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-red-800 mb-4">
          Emergency Product Support
        </h2>
        <p className="text-red-700 mb-4">
          If you&apos;re experiencing a product failure during an emergency
          situation, contact our 24/7 emergency support line immediately.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300">
            📞 Emergency Line: +1 (555) 911-HELP
          </button>
          <button className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-300">
            💬 Emergency Chat
          </button>
        </div>
      </div>
    </div>
  );
}
