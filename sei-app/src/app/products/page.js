"use client";

import Link from "next/link";
import Image from "next/image";
import { Products } from "@/app/data/product";
import { useCart } from "@/contexts/CartContext";

export default function ProductsPage() {
  // Group products by category
  const categories = [...new Set(Products.map(product => product.category))];
  const { 
    addToCart, 
    updateQuantity, 
    getProductQuantity, 
    getTotalItems, 
    addedItems 
  } = useCart();

  const handleAddToCart = (product, event) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product);
  };

  const handleUpdateQuantity = (product, newQuantity, event) => {
    event.preventDefault();
    event.stopPropagation();
    updateQuantity(product.id, newQuantity);
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-drone-charcoal bg-drone-graphite/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-drone-highlight hover:text-white transition-colors">
              <span className="text-lg">←</span>
              <span className="font-orbitron">Back to Dashboard</span>
            </Link>
            <h1 className="font-orbitron text-2xl font-bold text-drone-highlight">All Products</h1>
            {/* Cart Icon */}
            {getTotalItems() > 0 && (
              <Link href="/cart" className="relative flex items-center gap-2 text-drone-highlight hover:text-white transition-colors">
                <span className="text-2xl">🛒</span>
                <span className="font-orbitron">Cart ({getTotalItems()})</span>
                <span className="absolute -top-2 -right-2 bg-drone-highlight text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {categories.map((category) => {
          const categoryProducts = Products.filter(product => product.category === category);
          
          return (
            <div key={category} className="mb-12">
              <h2 className="text-3xl font-bold mb-8 text-drone-highlight font-orbitron">
                {category}
              </h2>
              
              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {categoryProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-drone-graphite/30 backdrop-blur-sm border border-drone-charcoal rounded-lg p-4 hover:border-drone-highlight transition-colors"
                  >
                    {/* Product Image - Clickable to product detail */}
                    <Link href={`/products/${product.id}`}>
                      <div className="relative aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden cursor-pointer">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="space-y-3">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-medium text-lg text-white mb-2 hover:text-drone-highlight transition-colors cursor-pointer">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="font-bold text-drone-highlight">
                        ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                      </p>

                      {/* Add to Cart / Quantity Controls */}
                      {getProductQuantity(product.id) === 0 ? (
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                            addedItems.has(product.id)
                              ? 'bg-green-600 text-white'
                              : 'bg-drone-highlight hover:bg-drone-highlight/80 text-black'
                          }`}
                        >
                          {addedItems.has(product.id) ? (
                            <span className="flex items-center justify-center gap-2">
                              <span>✓</span>
                              Added to Cart
                            </span>
                          ) : (
                            'Add to Cart'
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleUpdateQuantity(product, getProductQuantity(product.id) - 1, e)}
                            className="w-10 h-10 bg-drone-charcoal border border-drone-highlight text-drone-highlight rounded hover:bg-drone-highlight hover:text-black transition-colors flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          
                          <div className="flex-1 text-center py-2 bg-drone-charcoal/50 border border-drone-charcoal rounded">
                            <span className="text-white font-medium">
                              Qty: {getProductQuantity(product.id)}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => handleUpdateQuantity(product, getProductQuantity(product.id) + 1, e)}
                            className="w-10 h-10 bg-drone-charcoal border border-drone-highlight text-drone-highlight rounded hover:bg-drone-highlight hover:text-black transition-colors flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="border-t border-drone-charcoal bg-drone-graphite/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="font-orbitron text-drone-highlight">DroneX • Powered by Sei Blockchain • Eliza OS Integration</p>
            <p className="text-sm text-gray-400 mt-2">Revolutionizing delivery with decentralized drone networks</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
