import Link from "next/link";
import Image from "next/image";
import { Products } from "@/app/data/product";

export default async function ProductDetailPage({ params }) {
  // `params` may be a Promise in Next.js app router; await before using
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const product = Products.find(p => p.id === id);
  
  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-drone-highlight mb-4">Product Not Found</h1>
          <Link href="/products" className="text-drone-highlight hover:text-white">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

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
            <h1 className="font-orbitron text-2xl font-bold text-drone-highlight">Product Details</h1>
          </div>
        </div>
      </header>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <span className="text-drone-highlight text-sm font-medium">{product.category}</span>
              <h1 className="text-4xl font-bold text-white mt-2 font-orbitron">{product.name}</h1>
              <p className="text-3xl font-bold text-drone-highlight mt-4">
                ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
              </p>
            </div>

            <div className="space-y-4">
              <button className="w-full bg-drone-highlight hover:bg-drone-highlight/80 text-black font-bold py-4 px-8 rounded-lg transition-colors font-orbitron">
                Order with Drone Delivery
              </button>
              
              <button className="w-full border border-drone-highlight text-drone-highlight hover:bg-drone-highlight hover:text-black font-bold py-4 px-8 rounded-lg transition-colors font-orbitron">
                Add to Cart
              </button>
            </div>

            <div className="bg-drone-graphite/30 backdrop-blur-sm border border-drone-charcoal rounded-lg p-6">
              <h3 className="text-xl font-bold text-drone-highlight mb-4 font-orbitron">Delivery Information</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✈️ Drone delivery available</li>
                <li>🕒 Estimated delivery: 15-30 minutes</li>
                <li>📍 Delivery radius: 10km</li>
                <li>🔒 Secured with blockchain escrow</li>
              </ul>
            </div>
          </div>
        </div>
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
