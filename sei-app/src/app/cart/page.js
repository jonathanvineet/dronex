"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { convertUsdcToSei } from "@/app/data/product";
import DroneInfo from "@/components/DroneInfo";

export default function CartPage() {
  const { cart, updateQuantity, removeItem, getTotalPrice } = useCart();

  // Calculate totals
  const subtotal = getTotalPrice();
  const deliveryFee = subtotal / 10;
  const total = subtotal + deliveryFee;
  
  // SEI conversions
  const subtotalSei = convertUsdcToSei(subtotal);
  const deliveryFeeSei = convertUsdcToSei(deliveryFee);
  const totalSei = convertUsdcToSei(total);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-drone-charcoal bg-drone-graphite/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/products" className="flex items-center gap-2 text-drone-highlight hover:text-white transition-colors">
              <span className="text-lg">←</span>
              <span className="font-orbitron">Back to Products</span>
            </Link>
            <h1 className="font-orbitron text-2xl font-bold text-drone-highlight">Shopping Cart</h1>
          </div>
        </div>
      </header>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {cart.length === 0 ? (
          // Empty cart
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">Add some products to get started with drone delivery!</p>
            <Link 
              href="/products" 
              className="bg-drone-highlight hover:bg-drone-highlight/80 text-black font-bold py-3 px-8 rounded-lg transition-colors font-orbitron"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-white mb-6 font-orbitron">Cart Items ({cart.length})</h2>
              
              {cart.map((item) => (
                <div key={item.id} className="bg-drone-graphite/30 backdrop-blur-sm border border-drone-charcoal rounded-lg p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg text-white">{item.name}</h3>
                          <p className="text-sm text-gray-400">{item.category}</p>
                          <p className="font-bold text-drone-highlight mt-1">
                            ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                          </p>
                        </div>
                        
                        {/* Remove Button */}
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-gray-300">Quantity:</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-drone-charcoal border border-drone-highlight text-drone-highlight rounded hover:bg-drone-highlight hover:text-black transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-white">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-drone-charcoal border border-drone-highlight text-drone-highlight rounded hover:bg-drone-highlight hover:text-black transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-gray-300 ml-auto">
                          <div className="text-right">
                            <span className="text-drone-highlight font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                            <div className="text-xs text-drone-highlight/70">≈ {convertUsdcToSei(item.price * item.quantity)} SEI</div>
                          </div>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-drone-graphite/30 backdrop-blur-sm border border-drone-charcoal rounded-lg p-6 sticky top-6">
                <h3 className="text-xl font-bold text-drone-highlight mb-6 font-orbitron">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <div className="text-right">
                      <span>${subtotal.toFixed(2)}</span>
                      <div className="text-xs text-drone-highlight">≈ {subtotalSei} SEI</div>
                    </div>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Drone Delivery</span>
                    <div className="text-right">
                      <span>${deliveryFee.toFixed(2)}</span>
                      <div className="text-xs text-drone-highlight">≈ {deliveryFeeSei} SEI</div>
                    </div>
                  </div>
                  <hr className="border-drone-charcoal" />
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <div className="text-right">
                      <span className="text-drone-highlight">${total.toFixed(2)}</span>
                      <div className="text-sm text-drone-highlight font-normal">≈ {totalSei} SEI</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link 
                    href="/payment"
                    className="w-full bg-drone-highlight hover:bg-drone-highlight/80 text-black font-bold py-4 px-6 rounded-lg transition-colors font-orbitron text-center block"
                  >
                    Proceed to Payment
                  </Link>
                  
                  <Link 
                    href="/products"
                    className="w-full border border-drone-highlight text-drone-highlight hover:bg-drone-highlight/20 font-bold py-4 px-6 rounded-lg transition-colors font-orbitron text-center block"
                  >
                    Continue Shopping
                  </Link>
                </div>

                {/* Real-time Drone Info */}
                <div className="mt-6 pt-6 border-t border-drone-charcoal">
                  <DroneInfo />
                </div>
              </div>
            </div>
          </div>
        )}
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
