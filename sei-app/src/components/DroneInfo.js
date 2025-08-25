"use client";

import { useDroneData } from '@/hooks/useDroneData';
import { useState } from 'react';

export default function DroneInfo({ className = "" }) {
  const { drones, hiveIntelligence, loading, error, refreshData } = useDroneData();
  const [selectedDrone, setSelectedDrone] = useState(null);

  if (loading) {
    return (
      <div className={`bg-drone-graphite/30 backdrop-blur-sm border border-drone-charcoal rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-drone-highlight">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drone-highlight"></div>
            <p className="mt-4 text-center">Loading drone information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-drone-graphite/30 backdrop-blur-sm border border-drone-charcoal rounded-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-400 text-lg mb-4">⚠️ Error loading drone data</div>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={refreshData}
            className="bg-drone-highlight hover:bg-drone-highlight/80 text-black font-bold py-2 px-4 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-drone-graphite/30 backdrop-blur-sm border border-drone-charcoal rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-drone-highlight font-orbitron">
          🤖 ElizaOS Drone Fleet
        </h3>
        <button 
          onClick={refreshData}
          className="text-drone-highlight hover:text-white transition-colors text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Hive Intelligence Status */}
      {hiveIntelligence && (
        <div className="mb-6 p-4 bg-drone-charcoal/50 rounded-lg border border-drone-highlight/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-drone-highlight font-bold">Hive Intelligence Active</span>
            <span className="text-gray-400 text-sm">
              ({hiveIntelligence.connectedDrones} drones connected)
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Network Health:</span>
              <span className="text-green-400 ml-2 capitalize">{hiveIntelligence.networkHealth}</span>
            </div>
            <div>
              <span className="text-gray-400">Success Rate:</span>
              <span className="text-drone-highlight ml-2">{hiveIntelligence.successRate}%</span>
            </div>
          </div>

          {hiveIntelligence.insights && hiveIntelligence.insights.length > 0 && (
            <div className="mt-3">
              <p className="text-gray-400 text-xs mb-1">AI Insights:</p>
              <div className="text-xs text-drone-highlight">
                {hiveIntelligence.insights[0]}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Available Drones */}
      <div className="space-y-4">
        <h4 className="font-bold text-white">Available Drones ({drones.length})</h4>
        
        {drones.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-4">🚁</div>
            <p>No drones currently available</p>
          </div>
        ) : (
          drones.map((drone) => (
            <div 
              key={drone.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                selectedDrone?.id === drone.id
                  ? 'border-drone-highlight bg-drone-highlight/10'
                  : 'border-drone-charcoal hover:border-drone-highlight/50'
              }`}
              onClick={() => setSelectedDrone(selectedDrone?.id === drone.id ? null : drone)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-drone-highlight/20 rounded-full flex items-center justify-center">
                    <span className="text-drone-highlight font-bold">🤖</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-white">{drone.name}</h5>
                    <p className="text-sm text-gray-400">{drone.id}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 text-sm capitalize">{drone.status}</span>
                  </div>
                  <p className="text-xs text-gray-400">🔋 {drone.batteryLevel}%</p>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedDrone?.id === drone.id && (
                <div className="mt-4 pt-4 border-t border-drone-charcoal space-y-3">
                  {/* Wallet Address */}
                  <div className="bg-drone-charcoal/30 p-3 rounded">
                    <p className="text-xs text-gray-400 mb-1">Drone Wallet Address:</p>
                    <p className="text-drone-highlight font-mono text-sm break-all">
                      {drone.walletAddress}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(drone.walletAddress);
                      }}
                      className="text-xs text-drone-highlight hover:text-white mt-1"
                    >
                      📋 Copy Address
                    </button>
                  </div>

                  {/* Technical Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Max Payload:</span>
                      <span className="text-white ml-2">{drone.maxPayload}kg</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Range:</span>
                      <span className="text-white ml-2">{drone.estimatedRange}km</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Location:</span>
                      <span className="text-white ml-2">{drone.location?.address}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">AI Status:</span>
                      <span className="text-drone-highlight ml-2">{drone.aiIntelligence}</span>
                    </div>
                  </div>

                  {/* Capabilities */}
                  {drone.capabilities && (
                    <div>
                      <p className="text-gray-400 text-xs mb-2">Capabilities:</p>
                      <div className="flex flex-wrap gap-2">
                        {drone.capabilities.map((capability, index) => (
                          <span 
                            key={index}
                            className="text-xs bg-drone-highlight/20 text-drone-highlight px-2 py-1 rounded"
                          >
                            {capability}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Active */}
                  <div className="text-xs text-gray-400">
                    Last active: {new Date(drone.lastActive).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-drone-charcoal">
        <p className="text-xs text-gray-400 text-center">
          🧠 Powered by ElizaOS AI • 🔗 Sei Blockchain Integration
        </p>
      </div>
    </div>
  );
}
