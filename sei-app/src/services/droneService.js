// Service for fetching drone information from ElizaOS backend
const ELIZAOS_BACKEND_URL = process.env.NEXT_PUBLIC_ELIZAOS_BACKEND_URL || 'http://localhost:3001';

export class DroneService {
  static async getAvailableDrones() {
    try {
      const response = await fetch(`${ELIZAOS_BACKEND_URL}/api/drones/available`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Always fetch fresh data
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch drones: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching available drones:', error);
      // Return mock data as fallback
      return this.getMockDroneData();
    }
  }

  static async getDroneById(droneId) {
    try {
      const response = await fetch(`${ELIZAOS_BACKEND_URL}/api/drones/${droneId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch drone ${droneId}: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching drone ${droneId}:`, error);
      return null;
    }
  }

  static async allocateDroneForDelivery(orderData) {
    try {
      const response = await fetch(`${ELIZAOS_BACKEND_URL}/api/drones/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`Failed to allocate drone: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error allocating drone:', error);
      return this.getMockAllocatedDrone();
    }
  }

  static async getHiveIntelligence() {
    try {
      const response = await fetch(`${ELIZAOS_BACKEND_URL}/api/hive/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch hive intelligence: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching hive intelligence:', error);
      return this.getMockHiveData();
    }
  }

  static async getDroneWalletInfo(droneId) {
    try {
      const response = await fetch(`${ELIZAOS_BACKEND_URL}/api/drones/${droneId}/wallet`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch drone wallet: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching drone wallet:', error);
      return null;
    }
  }

  // Fallback mock data when backend is unavailable
  static getMockDroneData() {
    return {
      success: true,
      drones: [
        {
          id: 'DRONE-001',
          name: 'ElizaOS Alpha',
          status: 'available',
          location: { lat: 40.7128, lng: -74.0060, address: 'New York Hub' },
          batteryLevel: 95,
          maxPayload: 5,
          estimatedRange: 15,
          walletAddress: 'sei1mockdronewalletaddress001abc123',
          aiIntelligence: 'Hive Mind Connected',
          capabilities: ['GPS Navigation', 'Obstacle Avoidance', 'Secure Drop'],
          lastActive: new Date().toISOString()
        },
        {
          id: 'DRONE-002',
          name: 'ElizaOS Beta',
          status: 'available',
          location: { lat: 40.7589, lng: -73.9851, address: 'Manhattan Station' },
          batteryLevel: 87,
          maxPayload: 7,
          estimatedRange: 20,
          walletAddress: 'sei1mockdronewalletaddress002def456',
          aiIntelligence: 'Hive Mind Connected',
          capabilities: ['Advanced AI', 'Weather Adaptation', 'Multi-Drop'],
          lastActive: new Date().toISOString()
        }
      ],
      totalDrones: 2,
      availableDrones: 2,
      activeDeliveries: 0
    };
  }

  static getMockAllocatedDrone() {
    return {
      success: true,
      allocatedDrone: {
        id: 'DRONE-001',
        name: 'ElizaOS Alpha',
        status: 'allocated',
        walletAddress: 'sei1mockdronewalletaddress001abc123',
        estimatedPickupTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        batteryLevel: 95,
        currentLocation: { lat: 40.7128, lng: -74.0060 },
        route: {
          pickupLocation: 'Sei Delivery Hub',
          deliveryLocation: 'Customer Address',
          distance: '8.2 km',
          estimatedDuration: '12 minutes'
        },
        aiStatus: 'Hive Intelligence Active - Route Optimized'
      }
    };
  }

  static getMockHiveData() {
    return {
      success: true,
      hiveIntelligence: {
        status: 'online',
        connectedDrones: 2,
        totalMissions: 127,
        successRate: 98.4,
        networkHealth: 'optimal',
        aiModels: ['Navigation', 'Weather', 'Traffic', 'Security'],
        lastUpdate: new Date().toISOString(),
        insights: [
          'Traffic conditions optimal for delivery',
          'Weather conditions favorable',
          'All drones operating within normal parameters'
        ]
      }
    };
  }
}

export default DroneService;
