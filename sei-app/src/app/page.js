import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "var(--gradient-drone)" }}
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <h1 className="font-orbitron text-6xl md:text-8xl font-bold text-white mb-6 animate-fade-in">
            DRONE<span className="text-drone-highlight">X</span>
          </h1>
          <p className="font-russo text-xl md:text-2xl text-drone-highlight mb-8 animate-slide-up">
            Decentralized Drone Delivery on Sei Blockchain
          </p>
          <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto animate-slide-up">
            Secure escrow payments • AI-powered routing • Web3 delivery revolution
          </p>
          <Link href="/dashboard" className="btn-drone font-russo text-lg group">
            Launch Dashboard <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white opacity-20 animate-bounce-soft"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-drone-highlight mb-6">
            The Future of Delivery
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience the next generation of logistics powered by blockchain technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-glass border-gradient backdrop-blur-sm shadow-glass p-8 rounded-lg text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1f2937] to-[#111827] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="font-russo text-xl text-drone-highlight mb-4">Secure Escrow</h3>
            <p className="text-gray-300">Smart contracts ensure payment only upon successful delivery</p>
          </div>

          <div className="bg-gradient-glass border-gradient backdrop-blur-sm shadow-glass p-8 rounded-lg text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1f2937] to-[#111827] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="font-russo text-xl text-drone-highlight mb-4">AI Optimization</h3>
            <p className="text-gray-300">Eliza OS intelligently routes drones for maximum efficiency</p>
          </div>

          <div className="bg-gradient-glass border-gradient backdrop-blur-sm shadow-glass p-8 rounded-lg text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1f2937] to-[#111827] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-russo text-xl text-drone-highlight mb-4">Lightning Fast</h3>
            <p className="text-gray-300">Autonomous drones deliver in minutes, not hours</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-drone-charcoal bg-drone-graphite/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="font-orbitron text-drone-highlight">
              DroneX • Powered by Sei Blockchain • Eliza OS Integration
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Revolutionizing delivery with decentralized drone networks
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
