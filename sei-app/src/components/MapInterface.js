export default function MapInterface() {
  return (
    <div className="hud-card p-6">
      <h2 className="font-orbitron text-xl text-drone-highlight mb-4">Mission Map</h2>
      <div className="map-grid animate-grid-pulse w-full h-90.5 rounded relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.10), transparent 40%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.08), transparent 45%)"
        }} />
        <div className="absolute left-8 top-8 w-3 h-3 bg-white rounded-full shadow-glow" />
        <div className="absolute right-10 bottom-10 w-3 h-3 bg-white rounded-full shadow-glow" />
        <svg className="absolute inset-0" role="img" aria-label="route">
          <polyline points="40,40 200,120 380,220 560,300" stroke="rgba(255,255,255,0.8)" strokeWidth="2" fill="none" />
        </svg>
      </div>
    </div>
  );
}


