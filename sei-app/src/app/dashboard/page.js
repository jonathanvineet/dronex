import Link from "next/link";

import WalletConnection from "@/components/WalletConnection";
import OrderProducts from "@/components/OrderProducts";
import EscrowTracker from "@/components/EscrowTracker";
import MapInterface from "@/components/MapInterface";
import Deliveredstatus from "@/components/Deliveredstatus";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-drone-charcoal bg-drone-graphite/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-drone-highlight hover:text-white transition-colors">
              <span className="text-lg">←</span>
              <span className="font-orbitron">Back to DroneX</span>
            </Link>
            <h1 className="font-orbitron text-2xl font-bold text-drone-highlight">Dashboard</h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="space-y-8">
            <WalletConnection />
            <EscrowTracker />
            <EscrowTracker />
            <Deliveredstatus />
            <Deliveredstatus />

          </div>

          {/* Center column */}
          <div className="lg:col-span-2 space-y-8">
            <MapInterface />
            <OrderProducts />
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


