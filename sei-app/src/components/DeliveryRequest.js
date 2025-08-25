export default function DeliveryRequest() {
  return (
    <div className="hud-card p-6">
      <h2 className="font-orbitron text-xl text-drone-highlight mb-2">Delivery Request</h2>
      <p className="text-sm text-gray-300 mb-4">Create a new delivery mission with escrow.</p>
      <div className="flex gap-3">
        <button className="btn-drone font-russo">New Mission</button>
        <button className="btn-drone font-russo" style={{opacity:0.9}}>Estimate Route</button>
      </div>
    </div>
  );
}


