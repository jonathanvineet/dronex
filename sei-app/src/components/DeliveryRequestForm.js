"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeliveryRequestForm({ isOpen, onClose }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    serviceType: "food",
    itemName: "",
    description: "",
    weight: "",
    escrowAmount: "",
    receiverName: "",
    receiverPhone: "",
    receiverLocation: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.itemName || !formData.receiverName || !formData.receiverPhone || !formData.escrowAmount) {
      alert("Please fill in all required fields");
      return;
    }

    // Store the delivery request data
    const deliveryRequest = {
      ...formData,
      id: Date.now().toString(),
      status: "pending",
      createdAt: new Date().toISOString()
    };

    // Save to localStorage for persistence
    const existingRequests = JSON.parse(localStorage.getItem("deliveryRequests") || "[]");
    existingRequests.push(deliveryRequest);
    localStorage.setItem("deliveryRequests", JSON.stringify(existingRequests));

    // Navigate to payment page with delivery request data
    localStorage.setItem("currentDeliveryRequest", JSON.stringify(deliveryRequest));
    router.push("/payment");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-drone-graphite/95 backdrop-blur-sm border border-drone-charcoal rounded-lg p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-drone-highlight font-orbitron">
              New Delivery Request
            </h1>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Service Type *</label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-drone-charcoal border border-drone-highlight/30 rounded-lg text-white focus:border-drone-highlight focus:outline-none"
                  >
                    <option value="food">Food Delivery</option>
                    <option value="tools">Tool Delivery</option>
                    <option value="pickup">Pickup Service</option>
                    <option value="document">Document Delivery</option>
                    <option value="medicine">Medicine Delivery</option>
                    <option value="package">Package Delivery</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Item Name *</label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    placeholder="e.g., Pizza Margherita"
                    className="w-full p-3 bg-drone-charcoal border border-drone-highlight/30 rounded-lg text-white placeholder-gray-400 focus:border-drone-highlight focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the item..."
                    rows={3}
                    className="w-full p-3 bg-drone-charcoal border border-drone-highlight/30 rounded-lg text-white placeholder-gray-400 focus:border-drone-highlight focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="0.5"
                    step="0.1"
                    min="0"
                    max="5"
                    className="w-full p-3 bg-drone-charcoal border border-drone-highlight/30 rounded-lg text-white placeholder-gray-400 focus:border-drone-highlight focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Maximum 5kg per delivery</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Escrow Amount (SEI) *</label>
                  <input
                    type="number"
                    name="escrowAmount"
                    value={formData.escrowAmount}
                    onChange={handleInputChange}
                    placeholder="25.00"
                    step="0.01"
                    min="1"
                    className="w-full p-3 bg-drone-charcoal border border-drone-highlight/30 rounded-lg text-white placeholder-gray-400 focus:border-drone-highlight focus:outline-none"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Amount held in escrow until delivery confirmation</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Receiver Location</label>
                  <div className="h-64 bg-gradient-to-br from-drone-highlight/10 to-drone-charcoal/50 rounded-lg border border-drone-highlight/30 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p>Map Integration Coming Soon</p>
                      <p className="text-sm">Manual address entry for now</p>
                    </div>
                  </div>
                  <input
                    type="text"
                    name="receiverLocation"
                    value={formData.receiverLocation}
                    onChange={handleInputChange}
                    placeholder="Enter full delivery address"
                    className="w-full p-3 mt-3 bg-drone-charcoal border border-drone-highlight/30 rounded-lg text-white placeholder-gray-400 focus:border-drone-highlight focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Receiver Details</label>
                  <input
                    type="text"
                    name="receiverName"
                    value={formData.receiverName}
                    onChange={handleInputChange}
                    placeholder="Receiver Name *"
                    className="w-full p-3 bg-drone-charcoal border border-drone-highlight/30 rounded-lg text-white placeholder-gray-400 mb-3 focus:border-drone-highlight focus:outline-none"
                    required
                  />
                  <input
                    type="tel"
                    name="receiverPhone"
                    value={formData.receiverPhone}
                    onChange={handleInputChange}
                    placeholder="Phone Number *"
                    className="w-full p-3 bg-drone-charcoal border border-drone-highlight/30 rounded-lg text-white placeholder-gray-400 focus:border-drone-highlight focus:outline-none"
                    required
                  />
                </div>

                {/* Delivery Estimate */}
                <div className="bg-drone-charcoal/50 p-4 rounded-lg border border-drone-highlight/20">
                  <h4 className="font-bold text-drone-highlight mb-2">Delivery Estimate</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Delivery Time:</span>
                      <span className="text-drone-highlight">15-30 minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Fee:</span>
                      <span className="text-drone-highlight">3.50 SEI</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Range:</span>
                      <span className="text-drone-highlight">Up to 10km</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-drone-highlight/30 rounded-lg text-white hover:bg-drone-highlight/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-3 bg-drone-highlight text-black font-medium rounded-lg hover:bg-drone-highlight/80 transition-colors font-orbitron cursor-pointer"
              >
                Submit Request & Pay
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
