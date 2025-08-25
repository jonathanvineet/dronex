"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// Mock order data (same as order history page)
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

function CompactOrderItem({ order }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return '✅';
      case 'in-transit':
        return '🚁';
      case 'pending':
        return '⏳';
      default:
        return '📦';
    }
  };

  const getProgressWidth = (status) => {
    switch (status) {
      case 'delivered':
        return '100%';
      case 'in-transit':
        return '65%';
      case 'pending':
        return '20%';
      default:
        return '0%';
    }
  };

  // Get first item for compact display
  const mainItem = order.items[0];
  const itemsCount = order.items.length;

  return (
    <div className="border-b border-drone-charcoal/50 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
      {/* Order Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{getStatusIcon(order.status)}</span>
          <span className="text-xs text-drone-highlight font-bold font-mono">
            {order.id}
          </span>
          {order.type === 'delivery' && (
            <span className="text-xs bg-drone-highlight/20 text-drone-highlight px-2 py-0.5 rounded-full">
              🚁
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {formatDate(order.date)}
        </span>
      </div>

      {/* Item Info */}
      <div className="mb-2">
        <div className="text-sm text-gray-300 truncate">
          {mainItem.name}
          {itemsCount > 1 && (
            <span className="text-xs text-gray-400 ml-2">
              +{itemsCount - 1} more
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${getStatusColor(order.status)}`}>
            {order.status === 'in-transit' ? 'In Transit' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          <span className="text-sm font-bold text-drone-highlight">
            ${order.finalTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-black/50 rounded overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            order.status === 'delivered' ? 'bg-green-500' : 
            order.status === 'in-transit' ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
          style={{ width: getProgressWidth(order.status) }}
        />
      </div>
    </div>
  );
}

export default function OrderHistoryWidget() {
  const [orders, setOrders] = useState(mockOrders);

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

  // Show only the 6 most recent orders
  const recentOrders = orders.slice(0, 6);

  const getStats = () => {
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const inTransit = orders.filter(o => o.status === 'in-transit').length;
    return { delivered, inTransit, total: orders.length };
  };

  const stats = getStats();

  return (
    <div className="hud-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-orbitron text-xl text-drone-highlight">Recent Orders</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-green-500">{stats.delivered} ✅</span>
          <span className="text-yellow-500">{stats.inTransit} 🚁</span>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="space-y-0 mb-4">
        {recentOrders.length > 0 ? (
          recentOrders.map((order) => (
            <CompactOrderItem key={order.id} order={order} />
          ))
        ) : (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">📦</div>
            <p className="text-sm text-gray-400">No orders yet</p>
          </div>
        )}
      </div>

      {/* More Button */}
      <Link 
        href="/order-history"
        className="w-full bg-drone-graphite/50 hover:bg-drone-highlight/20 border border-drone-charcoal hover:border-drone-highlight/30 text-gray-300 hover:text-drone-highlight font-bold py-2 px-4 rounded-lg transition-colors font-orbitron text-sm text-center block"
      >
        View All orders
      </Link>
    </div>
  );
}
