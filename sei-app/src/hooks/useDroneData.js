// Hook for managing drone data and hive intelligence
import { useState, useEffect } from 'react';
import DroneService from '@/services/droneService';

export function useDroneData() {
  const [drones, setDrones] = useState([]);
  const [hiveIntelligence, setHiveIntelligence] = useState(null);
  const [allocatedDrone, setAllocatedDrone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available drones
  const fetchDrones = async () => {
    try {
      setLoading(true);
      const data = await DroneService.getAvailableDrones();
      if (data.success) {
        setDrones(data.drones || []);
      }
    } catch (err) {
      setError('Failed to fetch drone data');
      console.error('Error fetching drones:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hive intelligence
  const fetchHiveIntelligence = async () => {
    try {
      const data = await DroneService.getHiveIntelligence();
      if (data.success) {
        setHiveIntelligence(data.hiveIntelligence);
      }
    } catch (err) {
      console.error('Error fetching hive intelligence:', err);
    }
  };

  // Allocate drone for delivery
  const allocateDrone = async (orderData) => {
    try {
      setLoading(true);
      const data = await DroneService.allocateDroneForDelivery(orderData);
      if (data.success) {
        setAllocatedDrone(data.allocatedDrone);
        return data.allocatedDrone;
      }
      throw new Error('Failed to allocate drone');
    } catch (err) {
      setError('Failed to allocate drone');
      console.error('Error allocating drone:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get drone wallet information
  const getDroneWallet = async (droneId) => {
    try {
      const walletData = await DroneService.getDroneWalletInfo(droneId);
      return walletData;
    } catch (err) {
      console.error('Error fetching drone wallet:', err);
      return null;
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchDrones();
    fetchHiveIntelligence();
    
    // Set up periodic refresh for real-time updates
    const interval = setInterval(() => {
      fetchDrones();
      fetchHiveIntelligence();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    drones,
    hiveIntelligence,
    allocatedDrone,
    loading,
    error,
    fetchDrones,
    fetchHiveIntelligence,
    allocateDrone,
    getDroneWallet,
    refreshData: () => {
      fetchDrones();
      fetchHiveIntelligence();
    }
  };
}

export function useDroneAllocation() {
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const allocateForOrder = async (orderData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await DroneService.allocateDroneForDelivery(orderData);
      if (result.success) {
        setAllocation(result.allocatedDrone);
        return result.allocatedDrone;
      } else {
        throw new Error(result.error || 'Failed to allocate drone');
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearAllocation = () => {
    setAllocation(null);
    setError(null);
  };

  return {
    allocation,
    loading,
    error,
    allocateForOrder,
    clearAllocation
  };
}
