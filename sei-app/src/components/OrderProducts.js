"use client";

import Image from "next/image";
import Link from "next/link";
import { Products } from "@/app/data/product";

export default function OrderProducts() {
  // Show only first 3 products
  const displayProducts = Products.slice(0, 3);

  return (
    <div className="bg-drone-graphite/30 backdrop-blur-sm border border-drone-charcoal rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-drone-highlight font-orbitron">
        Order Products
      </h2>

      {/* Product Grid - Show 3 products */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        {displayProducts.map((product) => (
          <Link
            href={`/products/${product.id}`}
            key={product.id}
            className="group"
          >
            <div className="relative aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h3 className="font-medium text-lg text-white">{product.name}</h3>
            <p className="font-medium mt-1 text-drone-highlight">
              ${typeof product.price === "number"
                ? product.price.toFixed(2)
                : product.price}
            </p>
          </Link>
        ))}
      </div>

      {/* Explore All Products Button */}
      <div className="relative h-20 bg-drone-graphite/50 rounded-lg overflow-hidden border border-drone-charcoal">
        {/* Hidden blurred preview (completely behind the button) */}
        <div className="absolute inset-0 grid grid-cols-1 sm:grid-cols-3 gap-6 blur-sm opacity-30 p-4">
          {(Products || []).slice(3, 6).map((product) => (
            <div key={product.id} className="pointer-events-none">
              <div className="relative h-12 bg-gray-100 rounded overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Explore button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-drone-graphite/80 backdrop-blur-sm">
          <Link
            href="/products"
            className="bg-drone-highlight hover:bg-drone-highlight/80 text-black font-bold py-3 px-8 rounded-lg transition-colors font-orbitron shadow-lg"
          >
            Explore All Products
          </Link>
        </div>
      </div>
    </div>
  );
}
