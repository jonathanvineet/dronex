// elizaos/DroneManagementSystem.js
const geolib = require('geolib');
const { elizaConfig, seiPlugin } = require('./config');
const WebSocket = require('ws');

class DroneManagementSystem {
  constructor() {
    this.wss = null;
    
    // Mock drone fleet with SEI wallet addresses and realistic nearby locations (within 10km radius)
    this.droneFleet = [
      {
        id: 'DRONE_001',
        walletAddress: '0x8fb844ab2e58d08cfe01d8a0ebaa2351c3be1177',
        location: { lat: 28.7041, lng: 77.1025 }, // Central Delhi Hub
        status: 'available',
        properties: {
          maxCapacity: 5, // kg
          currentBattery: 90, // percentage
          maxRange: 30, // km
          speed: 45, // km/h
          operationalAltitude: 120, 
          weatherResistance: 'moderate',
          cargoType: ['electronics', 'documents', 'small_packages'],
          estimatedFlightTime: 180 
        },
        hiveMind: {
          efficiency: 0.92,
          reliability: 0.89,
          energyOptimization: 0.94,
          routeIntelligence: 0.87,
          collaborativeScore: 0.91
        }
      },
      {
        id: 'DRONE_002', 
        walletAddress: '0xf1A68c0D4c1A8de334240050899324B713Cfc677',
        location: { lat: 28.7200, lng: 77.1100 }, // North Delhi (about 2-3km from DRONE_001)
        status: 'available',
        properties: {
          maxCapacity: 8, // kg - increased capacity
          currentBattery: 85, // percentage - slightly lower battery
          maxRange: 35, // km - increased range
          speed: 50, // km/h - slightly faster
          operationalAltitude: 150, // meters
          weatherResistance: 'high', // better weather resistance
          cargoType: ['electronics', 'documents', 'small_packages', 'medicine'],
          estimatedFlightTime: 200 // minutes at full battery
        },
        hiveMind: {
          efficiency: 0.94,
          reliability: 0.91,
          energyOptimization: 0.93,
          routeIntelligence: 0.90,
          collaborativeScore: 0.92
        }
      },
      {
        id: 'DRONE_003',
        walletAddress: '0x742d35Cc6634C0532925a3b8D6Eb97E3Ba78A85A',
        location: { lat: 28.6900, lng: 77.0950 }, // South West Delhi (about 1.5km from DRONE_001)
        status: 'available',
        properties: {
          maxCapacity: 6, // kg
          currentBattery: 95, // percentage - highest battery
          maxRange: 25, // km
          speed: 40, // km/h
          operationalAltitude: 100, 
          weatherResistance: 'moderate',
          cargoType: ['electronics', 'documents', 'food'],
          estimatedFlightTime: 160 
        },
        hiveMind: {
          efficiency: 0.90,
          reliability: 0.93,
          energyOptimization: 0.96,
          routeIntelligence: 0.85,
          collaborativeScore: 0.89
        }
      },
      {
        id: 'DRONE_004',
        walletAddress: '0x9aB5c206516c34896D41DB511BAB9E878F8C1C888',
        location: { lat: 28.7150, lng: 77.1200 }, // East Delhi (about 1.8km from DRONE_001)
        status: 'available',
        properties: {
          maxCapacity: 4, // kg - smaller capacity
          currentBattery: 88, // percentage
          maxRange: 20, // km - shorter range
          speed: 55, // km/h - fastest
          operationalAltitude: 130, 
          weatherResistance: 'low',
          cargoType: ['documents', 'small_packages'],
          estimatedFlightTime: 140 
        },
        hiveMind: {
          efficiency: 0.88,
          reliability: 0.87,
          energyOptimization: 0.90,
          routeIntelligence: 0.92,
          collaborativeScore: 0.85
        }
      }
    ];

    this.activeJobs = new Map();
    this.elizaAgent = null;
    this.initializeEliza();
    this.setupWebSocket();
  }

    /**
     * Returns the current status of the drone fleet (array of drones with status, location, battery, etc.)
     */
    getFleetStatus() {
      // Return a shallow copy to avoid mutation from outside
      return this.droneFleet.map(drone => ({
        id: drone.id,
        walletAddress: drone.walletAddress,
        location: drone.location,
        status: drone.status,
        battery: drone.properties.currentBattery,
        maxCapacity: drone.properties.maxCapacity,
        maxRange: drone.properties.maxRange,
        speed: drone.properties.speed,
        operationalAltitude: drone.properties.operationalAltitude,
        weatherResistance: drone.properties.weatherResistance,
        cargoType: drone.properties.cargoType,
        estimatedFlightTime: drone.properties.estimatedFlightTime
      }));
    }

    /**
     * Returns hive intelligence analytics for the fleet (efficiency, reliability, etc.)
     */
    getHiveIntelligence() {
      // Use the existing generateHiveAnalytics method
      return this.generateHiveAnalytics();
    }

  setupWebSocket() {
    try {
      this.wss = new WebSocket.Server({ port: 8080 });
      console.log('🔌 WebSocket server started on port 8080');
      
      this.wss.on('connection', (ws) => {
        console.log('Client connected to WebSocket');
        ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to Drone Management System' }));
        
        ws.on('message', (message) => {
          console.log('Received message:', message);
        });
      });
    } catch (error) {
      console.error('Error setting up WebSocket server:', error);
    }
  }

  broadcastUpdate(data) {
    if (!this.wss) return;
    
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  async initializeEliza() {
    // ElizaOS Agent Configuration with SEI Plugin
    console.log('🤖 Initializing ElizaOS Agent for Drone Management...');
    
    // Initialize Eliza agent (using mock implementation)
    this.elizaAgent = await this.createElizaAgent(elizaConfig);
    console.log('✅ ElizaOS Agent initialized successfully');
  }

  // Hive Intelligence Algorithm
  calculateHiveScore(drone, job) {
    if (!job.pickup || !job.pickup.lat || !job.pickup.lng) {
      console.log('⚠️ Warning: Job missing pickup coordinates, using default scoring');
      return 0.75; // Default score
    }
    
    const distance = geolib.getDistance(
      { latitude: drone.location.lat, longitude: drone.location.lng },
      { latitude: job.pickup.lat, longitude: job.pickup.lng }
    ) / 1000; // Convert to km
    
    console.log(`Distance from ${drone.id} to pickup: ${distance.toFixed(2)}km`);

    // Improved distance scoring for realistic close-range selection
    // For distances under 10km, use linear inverse scoring with higher precision
    let distanceScore;
    if (distance <= 10) {
      // Linear inverse scoring for close distances: 1 - (distance/10)
      // This gives: 0km=1.0, 1km=0.9, 2km=0.8, 5km=0.5, 10km=0.0
      distanceScore = Math.max(0, 1 - (distance / 10));
    } else {
      // For longer distances, use exponential decay
      distanceScore = Math.exp(-distance/100); // Adjusted divisor for better sensitivity
    }
    const batteryScore = drone.properties.currentBattery / 100;
    const capacityScore = job.weight <= drone.properties.maxCapacity ? 1 : 0;
    const weatherScore = this.assessWeatherCompatibility(drone, job);
    
    // Combine hive mind metrics
    const hiveMetrics = drone.hiveMind;
    const hiveScore = (
      hiveMetrics.efficiency * 0.25 +
      hiveMetrics.reliability * 0.20 +
      hiveMetrics.energyOptimization * 0.15 +
      hiveMetrics.routeIntelligence * 0.25 +
      hiveMetrics.collaborativeScore * 0.15
    );

    // Final weighted score with even higher emphasis on distance (70% of total score)
    const finalScore = (
      distanceScore * 0.70 +  // Significantly increased weight for distance
      batteryScore * 0.10 +
      capacityScore * 0.10 +
      weatherScore * 0.05 +
      hiveScore * 0.05
    );
    
    console.log(`${drone.id} score breakdown: distance=${distanceScore.toFixed(3)}, battery=${batteryScore.toFixed(2)}, final=${finalScore.toFixed(3)}`);
    
    return finalScore;
  }

  assessWeatherCompatibility(drone, job) {
    // Mock weather assessment - in production, integrate with weather API
    const currentWeather = job.weatherConditions || 'clear';
    const compatibility = {
      'clear': 1.0,
      'light_rain': drone.properties.weatherResistance === 'high' ? 0.8 : 0.4,
      'heavy_rain': drone.properties.weatherResistance === 'high' ? 0.6 : 0.1,
      'wind': 0.7,
      'fog': 0.5
    };
    return compatibility[currentWeather] || 0.8;
  }

  async findOptimalDrone(job) {
    console.log(`🤖 ElizaOS Agent analyzing job: ${job.id}`);
    console.log(`📊 Job pickup location: ${job.pickup.lat}, ${job.pickup.lng}`);
    
    // Use hive intelligence to score each available drone
    const availableDrones = this.droneFleet.filter(drone => drone.status === 'available');
    console.log(`🚁 Available drones: ${availableDrones.length}`);
    
    // Log each drone's location for debugging
    availableDrones.forEach(drone => {
      console.log(`🚁 ${drone.id} location: ${drone.location.lat}, ${drone.location.lng}`);
    });
    
    const scoredDrones = availableDrones.map(drone => {
      const distanceKm = job.pickup && job.pickup.lat ? 
        geolib.getDistance(
          { latitude: drone.location.lat, longitude: drone.location.lng },
          { latitude: job.pickup.lat, longitude: job.pickup.lng }
        ) / 1000 : 'unknown';
      
      return {
        drone,
        score: this.calculateHiveScore(drone, job),
        distance: distanceKm
      };
    });

    // Sort by hive score (highest first)
    scoredDrones.sort((a, b) => b.score - a.score);
    
    if (scoredDrones.length === 0) {
      throw new Error('No available drones found');
    }

    // Log all drone scores for comparison
    console.log("🔍 Drone selection results:");
    scoredDrones.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.drone.id}: score=${item.score.toFixed(3)}, distance=${typeof item.distance === 'number' ? item.distance.toFixed(1) + 'km' : 'unknown'}`);
    });

    const selectedDrone = scoredDrones[0];
    
    // ElizaOS decision reasoning
    const reasoning = `
    🧠 Hive Intelligence Analysis:
    - Selected Drone: ${selectedDrone.drone.id}
    - Hive Score: ${selectedDrone.score.toFixed(3)}
    - Distance: ${typeof selectedDrone.distance === 'number' ? selectedDrone.distance.toFixed(1) + 'km' : 'unknown'}
    - Battery: ${selectedDrone.drone.properties.currentBattery}%
    - Efficiency: ${selectedDrone.drone.hiveMind.efficiency}
    - Reliability: ${selectedDrone.drone.hiveMind.reliability}
    `;
    
    console.log(reasoning);
    return selectedDrone.drone;
  }

  async processDeliveryConfirmation(jobId, jobDetails) {
    try {
      console.log(`🚁 Processing confirmed delivery for job ${jobId} with ElizaOS...`);
      
      // Get location closest to sender/recipient
      let pickupCoordinates;
      
      // If we have a sender wallet address, determine location based on that
      if (jobDetails && jobDetails.sender) {
        // Use realistic locations within Delhi area (all within 10km radius)
        if (jobDetails.sender === '0x2B5c206516c34896D41DB511BAB9E878F8C1C109') {
          pickupCoordinates = { lat: 28.6950, lng: 77.1050 }; // South Delhi (about 1km from DRONE_003, closest)
          console.log(`📍 Sender wallet detected - setting pickup location to South Delhi`);
        } else {
          pickupCoordinates = { lat: 28.7100, lng: 77.1150 }; // Central Delhi (about 1km from DRONE_001, closest)
          console.log(`📍 Sender wallet detected - setting pickup location to Central Delhi`);
        }
      } else {
        // Default to a location that's equidistant from multiple drones
        pickupCoordinates = { lat: 28.7050, lng: 77.1075 }; // Between DRONE_001 and DRONE_003
        console.log(`📍 No sender wallet detected - using default pickup location in Central Delhi`);
      }
      
      // Create a job structure with appropriate coordinates
      const job = {
        id: jobId,
        pickup: pickupCoordinates,
        delivery: { lat: 28.4089, lng: 77.3178 }, // Gurgaon (sample)
        weight: 2.5, // kg (sample)
        weatherConditions: 'clear',
  payment: 0.001, // SEI tokens
        ...jobDetails
      };
      
      // Use ElizaOS hive intelligence to find optimal drone
      const selectedDrone = await this.findOptimalDrone(job);
      
      // Update drone status
      selectedDrone.status = 'assigned';
      
      // Create blockchain transaction for job assignment
      await this.createJobTransaction(selectedDrone, job);
      
      // Store active job
      this.activeJobs.set(job.id, {
        job,
        drone: selectedDrone,
        assignedAt: new Date(),
        status: 'assigned'
      });

      // Notify via WebSocket if available
      this.broadcastUpdate({
        type: 'DRONE_ASSIGNED',
        jobId: job.id,
        drone: selectedDrone,
        estimatedDeliveryTime: this.calculateETA(selectedDrone, job)
      });

      return {
        success: true,
        droneId: selectedDrone.id,
        walletAddress: selectedDrone.walletAddress,
        estimatedDeliveryTime: this.calculateETA(selectedDrone, job),
        hiveScore: this.calculateHiveScore(selectedDrone, job)
      };

    } catch (error) {
      console.error('Error assigning drone:', error);
      throw error;
    }
  }

  async createJobTransaction(drone, job) {
    // Create SEI blockchain transaction for job assignment
    try {
      // Log that we're using the drone wallet for this job
      console.log(`🚁 Using drone wallet ${drone.walletAddress} for job ${job.id}`);
      
      const transactionData = {
        from: process.env.COMPANY_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
        to: drone.walletAddress,
  amount: job.payment || 0.001, // SEI tokens
        memo: `Job Assignment: ${job.id}`,
        metadata: {
          jobId: job.id,
          droneId: drone.id,
          timestamp: Date.now(),
          hiveScore: this.calculateHiveScore(drone, job)
        }
      };

      // Use ElizaOS SEI plugin to send transaction
      const txResult = await this.elizaAgent.sendSEITransaction(transactionData);
      
      console.log(`💰 SEI Transaction sent: ${txResult.txHash}`);
      return txResult;

    } catch (error) {
      console.error('SEI transaction failed:', error);
      throw error;
    }
  }

  calculateETA(drone, job) {
    if (!job.pickup || !job.delivery) {
      return 30; // Default 30 minutes if coordinates not provided
    }
    
    const distance = geolib.getDistance(
      { latitude: drone.location.lat, longitude: drone.location.lng },
      { latitude: job.pickup.lat, longitude: job.pickup.lng }
    ) / 1000;

    const deliveryDistance = geolib.getDistance(
      { latitude: job.pickup.lat, longitude: job.pickup.lng },
      { latitude: job.delivery.lat, longitude: job.delivery.lng }
    ) / 1000;

    const totalDistance = distance + deliveryDistance;
    const estimatedMinutes = (totalDistance / drone.properties.speed) * 60;
    
    return Math.ceil(estimatedMinutes + 10); // Add 10 min buffer
  }

  generateHiveAnalytics() {
    return {
      fleetOverview: {
        totalDrones: this.droneFleet.length,
        availableDrones: this.droneFleet.filter(d => d.status === 'available').length,
        averageBattery: this.droneFleet.reduce((sum, d) => sum + d.properties.currentBattery, 0) / this.droneFleet.length,
        totalCapacity: this.droneFleet.reduce((sum, d) => sum + d.properties.maxCapacity, 0)
      },
      hiveIntelligence: {
        averageEfficiency: this.droneFleet.reduce((sum, d) => sum + d.hiveMind.efficiency, 0) / this.droneFleet.length,
        averageReliability: this.droneFleet.reduce((sum, d) => sum + d.hiveMind.reliability, 0) / this.droneFleet.length,
        networkOptimization: this.calculateNetworkOptimization()
      },
      activeOperations: this.activeJobs.size,
      blockchainTransactions: this.getTodaysTransactionCount()
    };
  }

  calculateNetworkOptimization() {
    // Hive intelligence network optimization score
    const drones = this.droneFleet;
    const collaborativeScore = drones.reduce((sum, d) => sum + d.hiveMind.collaborativeScore, 0) / drones.length;
    const energyEfficiency = drones.reduce((sum, d) => sum + d.hiveMind.energyOptimization, 0) / drones.length;
    
    return (collaborativeScore * 0.6 + energyEfficiency * 0.4).toFixed(3);
  }

  getTodaysTransactionCount() {
    // Mock function - in production, query SEI blockchain
    return Math.floor(Math.random() * 50) + 10;
  }

  // ElizaOS agent creation
  async createElizaAgent(config) {
    // This would be the actual ElizaOS agent initialization in production
    // For now, return a mock agent with SEI capabilities
    return {
      name: config.character.name,
      sendSEITransaction: async (data) => {
        console.log('🔗 Sending SEI transaction:', data);
        return {
          txHash: `0x${Math.random().toString(16).substring(2)}`,
          success: true
        };
      }
    };
  }
}

module.exports = DroneManagementSystem;
