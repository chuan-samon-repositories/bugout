"use client";

import { use, useState } from "react";
import { useCart } from "../../../presentation/hooks/useCart";
import { ProductId } from "../../../domain/value-objects/ProductId";
import { Quantity } from "../../../domain/value-objects/Quantity";
import { ProductImage } from "../components/ProductImage";
import Link from "next/link";

interface ProductPageProps {
  params: Promise<{ productName: string }>;
}

interface ProductData {
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  contents: Array<{ item: string; quantity: string }>;
}

// Product data - in a real app, this would come from a database or API
const getProductData = (productName: string): ProductData => {
  const products: Record<string, ProductData> = {
    "24h-survival-backpack": {
      name: "24H Survival Backpack",
      price: 199,
      originalPrice: 249,
      rating: 4.9,
      reviews: 1247,
      description:
        "Essential survival kit designed for 24-hour emergency situations. Compact, lightweight, and containing all the critical items you need to survive the first crucial day of any emergency.",
      features: [
        "Lightweight and portable design",
        "24-hour food and water supply",
        "Emergency shelter materials",
        "First aid essentials",
        "Fire starting tools",
        "Emergency communication devices",
      ],
      specifications: {
        Weight: "3.2 kg",
        Dimensions: "45 x 30 x 15 cm",
        Capacity: "35L",
        Material: "600D Ripstop Nylon",
        "Water Resistant": "Yes",
        Warranty: "3 Years",
      },
      contents: [
        { item: "Emergency Food Bars", quantity: "6 x 400cal" },
        { item: "Water Purification Tablets", quantity: "20 tablets" },
        { item: "Emergency Blanket", quantity: "2" },
        { item: "First Aid Kit", quantity: "1 complete" },
        { item: "Multi-tool", quantity: "1" },
        { item: "Fire Starter Kit", quantity: "1" },
        { item: "Emergency Whistle", quantity: "1" },
        { item: "Flashlight", quantity: "1 LED" },
      ],
    },
    "72h-survival-backpack": {
      name: "72H Survival Backpack",
      price: 299,
      originalPrice: 399,
      rating: 5.0,
      reviews: 2156,
      description:
        "Complete 3-day survival solution for serious emergency preparedness. This comprehensive kit contains everything needed to sustain one person for 72 hours in any survival situation.",
      features: [
        "Complete 72-hour survival solution",
        "Professional-grade equipment",
        "Extended food and water supply",
        "Advanced shelter and warmth systems",
        "Comprehensive medical supplies",
        "Emergency communication and signaling",
      ],
      specifications: {
        Weight: "6.8 kg",
        Dimensions: "55 x 35 x 20 cm",
        Capacity: "65L",
        Material: "1000D Cordura Nylon",
        "Water Resistant": "IPX6",
        Warranty: "5 Years",
      },
      contents: [
        { item: "Emergency Food Rations", quantity: "9 meals" },
        { item: "Water Purification System", quantity: "1 complete" },
        { item: "Emergency Shelter", quantity: "1 tent" },
        { item: "Medical Kit", quantity: "1 comprehensive" },
        { item: "Multi-tool Set", quantity: "3 tools" },
        { item: "Fire Starting Kit", quantity: "1 advanced" },
        { item: "Emergency Radio", quantity: "1 solar" },
        { item: "Sleeping System", quantity: "1 complete" },
      ],
    },
  };

  return (
    products[productName] || {
      name: productName
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      price: 199,
      originalPrice: 249,
      rating: 4.8,
      reviews: 856,
      description:
        "Professional survival kit designed for emergency preparedness.",
      features: [
        "High-quality components",
        "Durable construction",
        "Easy to carry",
      ],
      specifications: { Weight: "TBD", Capacity: "TBD" },
      contents: [],
    }
  );
};

export default function ProductPage({ params }: ProductPageProps) {
  const { productName } = use(params);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImage, setSelectedImage] = useState(0);

  const product = getProductData(productName);

  const handleAddToCart = async () => {
    try {
      await addItem(new ProductId(productName), new Quantity(quantity));
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    }
  };

  if (!productName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

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
        <Link
          href="/products"
          className="hover:text-orange-600 transition-colors duration-200"
        >
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
            <ProductImage productId={productName} />
          </div>

          {/* Thumbnail Gallery */}
          <div className="flex space-x-4">
            {[0, 1, 2, 3].map((index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  selectedImage === index
                    ? "border-orange-600"
                    : "border-gray-200"
                }`}
              >
                <ProductImage productId={productName} />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < Math.floor(product.rating)
                        ? "text-orange-500"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  ({product.reviews} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-gray-900">
                ${product.price}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">
                  ${product.originalPrice}
                </span>
              )}
              {product.originalPrice && (
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm font-medium">
                  Save ${product.originalPrice - product.price}
                </span>
              )}
            </div>
            <p className="text-green-600 font-medium">
              ✓ In Stock - Ready to Ship
            </p>
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          {/* Key Features */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Key Features:</h3>
            <ul className="space-y-2">
              {product.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center text-gray-600">
                  <span className="text-orange-600 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label htmlFor="quantity" className="font-medium text-gray-900">
                Quantity:
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  -
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Add to Cart - ${product.price * quantity}
              </button>
              <button className="border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white font-bold py-4 px-6 rounded-lg transition-all duration-300">
                ♡ Save
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl mb-1">🚚</div>
              <p className="text-sm font-medium">Free Shipping</p>
              <p className="text-xs text-gray-600">Orders over $150</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🔒</div>
              <p className="text-sm font-medium">Secure Payment</p>
              <p className="text-xs text-gray-600">SSL Protected</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">↩️</div>
              <p className="text-sm font-medium">30-Day Returns</p>
              <p className="text-xs text-gray-600">Money Back Guarantee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information Tabs */}
      <div className="border-t border-gray-200">
        <div className="flex space-x-8 border-b border-gray-200">
          {["description", "specifications", "contents", "reviews"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-medium capitalize transition-colors duration-200 ${
                  activeTab === tab
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        <div className="py-8">
          {activeTab === "description" && (
            <div className="prose max-w-none">
              <h3 className="text-xl font-bold mb-4">Product Description</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {product.description}
              </p>
              <h4 className="text-lg font-semibold mb-3">
                Why Choose This Kit?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Our survival kits are meticulously designed by survival experts
                and tested in real-world conditions. Each item is carefully
                selected for its reliability, durability, and effectiveness in
                emergency situations. Whether you&apos;re preparing for natural
                disasters, outdoor adventures, or general emergency
                preparedness, this kit provides the essential tools and supplies
                you need to stay safe and survive.
              </p>
            </div>
          )}

          {activeTab === "specifications" && (
            <div>
              <h3 className="text-xl font-bold mb-6">
                Technical Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between py-3 border-b border-gray-200"
                  >
                    <span className="font-medium text-gray-900">{key}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "contents" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Complete Kit Contents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.contents.map((item, index: number) => (
                  <div
                    key={index}
                    className="flex items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <span className="text-orange-600 mr-3">📦</span>
                    <div>
                      <p className="font-medium text-gray-900">{item.item}</p>
                      <p className="text-sm text-gray-600">{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Customer Reviews</h3>
              <div className="space-y-6">
                {[
                  {
                    name: "Sarah M.",
                    rating: 5,
                    comment:
                      "Excellent quality kit. Used it during a camping emergency and everything worked perfectly.",
                  },
                  {
                    name: "Mike D.",
                    rating: 5,
                    comment:
                      "Well organized and comprehensive. Great value for the price.",
                  },
                  {
                    name: "Jessica L.",
                    rating: 4,
                    comment:
                      "Good quality items, compact design. Highly recommend for emergency preparedness.",
                  },
                ].map((review, index) => (
                  <div key={index} className="border-b border-gray-200 pb-6">
                    <div className="flex items-center mb-2">
                      <span className="font-medium mr-3">{review.name}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < review.rating
                                ? "text-orange-500"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
