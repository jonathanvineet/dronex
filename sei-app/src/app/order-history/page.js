"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

// Mock order data
const mockOrders = [
  {
    id: "ORD-2025-001",
    date: "2025-08-20",
    status: "delivered",
    items: [
      { name: "Wireless Earbuds Pro", quantity: 2, price: 129.99 },
      { name: "Smart Watch Series X", quantity: 1, price: 299.99 }
    ],
    total: 559.97,
    deliveryFee: 2.50,
    finalTotal: 562.47,
    deliveryAddress: "123 Tech Street, Silicon Valley, CA 94301",
    walletAddress: "sei1k2f8h...9x3v2w",
    deliveredAt: "2025-08-20T15:30:00Z",
    type: "product"
  },
  {
    id: "ORD-2025-002",
    date: "2025-08-21",
    status: "delivered",
    items: [
      { name: "Gaming Headset Ultra", quantity: 1, price: 199.99 }
    ],
    total: 199.99,
    deliveryFee: 2.50,
    finalTotal: 202.49,
    deliveryAddress: "456 Gaming Ave, Los Angeles, CA 90210",
    walletAddress: "sei1m9k2n...7j4x8q",
    deliveredAt: "2025-08-21T11:45:00Z",
    type: "product"
  },
  {
    id: "DEL-2025-003",
    date: "2025-08-22",
    status: "in-transit",
    items: [
      { name: "One-to-One Delivery Service", quantity: 1, price: 45.00 }
    ],
    total: 45.00,
    deliveryFee: 3.50,
    finalTotal: 48.50,
    deliveryAddress: "789 Business Blvd, San Francisco, CA 94105",
    walletAddress: "sei1p3r5t...2k8m4n",
    estimatedDelivery: "2025-08-22T18:00:00Z",
    type: "delivery",
    pickupLocation: "321 Corporate Center, Palo Alto, CA 94301",
    receiverLocation: "789 Business Blvd, San Francisco, CA 94105"
  },
  {
    id: "ORD-2025-004",
    date: "2025-08-22",
    status: "in-transit",
    items: [
      { name: "Drone Camera 4K", quantity: 1, price: 399.99 },
      { name: "Memory Card 128GB", quantity: 2, price: 29.99 }
    ],
    total: 459.97,
    deliveryFee: 2.50,
    finalTotal: 462.47,
    deliveryAddress: "987 Photo Street, Oakland, CA 94612",
    walletAddress: "sei1w8e6r...5t9y1u",
    estimatedDelivery: "2025-08-22T20:30:00Z",
    type: "product"
  }
];

function OrderCard({ order }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'text-green-500';
      case 'in-transit':
        return 'text-yellow-500';
      case 'pending':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/20 border-green-500/30';
      case 'in-transit':
        return 'bg-yellow-500/20 border-yellow-500/30';
      case 'pending':
        return 'bg-blue-500/20 border-blue-500/30';
      default:
        return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="bg-drone-graphite/30 backdrop-blur-sm border border-drone-charcoal rounded-lg p-6 hover:border-drone-highlight/30 transition-colors">
      {/* Order Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-drone-highlight font-orbitron">
            {order.id}
          </h3>
          <p className="text-sm text-gray-400">
            {formatDate(order.date)}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg border ${getStatusBg(order.status)}`}>
          <span className={`font-bold font-orbitron text-sm ${getStatusColor(order.status)} uppercase`}>
            {order.status === 'in-transit' ? 'In Transit' : order.status}
          </span>
        </div>
      </div>

      {/* Order Type Badge */}
      <div className="mb-4">
        {order.type === 'delivery' ? (
          <span className="inline-flex items-center gap-2 bg-drone-highlight/20 text-drone-highlight px-3 py-1 rounded-full text-sm font-bold">
            🚁 One-to-One Delivery
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold">
            📦 Product Order
          </span>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-gray-300">
              {item.quantity}x {item.name}
            </span>
            <span className="text-drone-highlight font-bold">
              ${item.price.toFixed(2)}
            </span>
          </div>
        ))}
        <div className="border-t border-drone-charcoal pt-2 mt-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300">Delivery Fee</span>
            <span className="text-gray-300">${order.deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center font-bold">
            <span className="text-white">Total</span>
            <span className="text-drone-highlight">${order.finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="space-y-2 text-sm">
        {order.type === 'delivery' && order.pickupLocation && (
          <div>
            <span className="text-gray-400">From: </span>
            <span className="text-gray-300">{order.pickupLocation}</span>
          </div>
        )}
        <div>
          <span className="text-gray-400">
            {order.type === 'delivery' ? 'To: ' : 'Delivery Address: '}
          </span>
          <span className="text-gray-300">{order.deliveryAddress}</span>
        </div>
        <div>
          <span className="text-gray-400">Wallet: </span>
          <span className="text-gray-300 font-mono">{order.walletAddress}</span>
        </div>
        {order.status === 'delivered' && order.deliveredAt && (
          <div>
            <span className="text-gray-400">Delivered: </span>
            <span className="text-green-400">{formatDate(order.deliveredAt)}</span>
          </div>
        )}
        {order.status === 'in-transit' && order.estimatedDelivery && (
          <div>
            <span className="text-gray-400">Estimated Delivery: </span>
            <span className="text-yellow-400">{formatDate(order.estimatedDelivery)}</span>
          </div>
        )}
      </div>

      {/* Progress Bar for In-Transit Orders */}
      {order.status === 'in-transit' && (
        <div className="mt-4">
          <div className="text-xs text-gray-400 mb-2">Pending → In Transit → Delivered</div>
          <div className="w-full h-2 bg-black/50 rounded overflow-hidden">
            <div 
              className="h-full bg-yellow-500 transition-all duration-500" 
              style={{ width: "65%" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState(mockOrders);
  const [filter, setFilter] = useState('all');

  // Check for completed orders from localStorage
  useEffect(() => {
    const checkForNewOrders = () => {
      const completedOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]');
      if (completedOrders.length > 0) {
        // Add new orders to the existing list
        setOrders(prevOrders => {
          const existingIds = prevOrders.map(o => o.id);
          const newOrders = completedOrders.filter(o => !existingIds.includes(o.id));
          return [...newOrders, ...prevOrders];
        });
      }
    };

    // Check immediately
    checkForNewOrders();

    // Set up periodic checking for real-time updates
    const interval = setInterval(checkForNewOrders, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'delivered') return order.status === 'delivered';
    if (filter === 'in-transit') return order.status === 'in-transit';
    if (filter === 'delivery') return order.type === 'delivery';
    if (filter === 'products') return order.type === 'product';
    return true;
  });

  const getOrderStats = () => {
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const inTransit = orders.filter(o => o.status === 'in-transit').length;
    const totalValue = orders.reduce((sum, o) => sum + o.finalTotal, 0);
    
    return { delivered, inTransit, totalValue, total: orders.length };
  };

  const stats = getOrderStats();

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
            <h1 className="font-orbitron text-2xl font-bold text-drone-highlight">Order History</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-drone-graphite/30 backdrop-blur-sm border border-drone-charcoal rounded-lg p-6">
            <h3 className="text-sm text-gray-400 font-orbitron">Total Orders</h3>
            <p className="text-2xl font-bold text-drone-highlight">{stats.total}</p>
          </div>
          <div className="bg-drone-graphite/30 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
            <h3 className="text-sm text-gray-400 font-orbitron">Delivered</h3>
            <p className="text-2xl font-bold text-green-500">{stats.delivered}</p>
          </div>
          <div className="bg-drone-graphite/30 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-6">
            <h3 className="text-sm text-gray-400 font-orbitron">In Transit</h3>
            <p className="text-2xl font-bold text-yellow-500">{stats.inTransit}</p>
          </div>
          <div className="bg-drone-graphite/30 backdrop-blur-sm border border-drone-charcoal rounded-lg p-6">
            <h3 className="text-sm text-gray-400 font-orbitron">Total Value</h3>
            <p className="text-2xl font-bold text-drone-highlight">${stats.totalValue.toFixed(2)}</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'in-transit', label: 'In Transit' },
            { key: 'delivery', label: 'One-to-One Delivery' },
            { key: 'products', label: 'Product Orders' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 cursor-pointer rounded-lg font-orbitron transition-colors ${
                filter === key
                  ? 'bg-drone-highlight text-black font-bold'
                  : 'bg-drone-graphite/30 text-gray-300 hover:bg-drone-highlight/20 hover:text-drone-highlight border border-drone-charcoal'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-400 mb-2">No Orders Found</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You haven't placed any orders yet." 
                  : `No ${filter} orders found.`}
              </p>
              <Link 
                href="/products" 
                className="inline-block mt-4 bg-drone-highlight text-black font-bold py-3 px-6 rounded-lg hover:bg-drone-highlight/80 transition-colors font-orbitron"
              >
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-drone-charcoal bg-drone-graphite/50 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="font-orbitron text-drone-highlight">DroneX • Powered by Sei Blockchain • Eliza OS Integration</p>
            <p className="text-sm text-gray-400 mt-2">Your complete order history and delivery tracking</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
