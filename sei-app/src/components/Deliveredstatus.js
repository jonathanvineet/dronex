export default function Deliveredstatus() {
    return (
      <div className="hud-card p-6">
        <h2 className="font-orbitron text-xl text-drone-highlight mb-4">Processing Status</h2>
        <div className="space-y-3">
          <div className="text-sm text-gray-300">Pending → In Transit → Delivered</div>
          <div className="w-full h-2 bg-black/50 rounded overflow-hidden">
            <div className="h-full bg-white/70" style={{ width: "100%" }} />
          </div>
          <div className="text-xs text-gray-400">Current: <span className="text-green-500">Delivered</span></div>
        </div>
      </div>
    );
  }
  
  
  