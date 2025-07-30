import { apiRequest } from './apiRequest';

export interface Equipment {
  equipmentId: string;
  name: string;
  price: number; // Price in MWK
  stock: number;
  category: string;
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentData {
  name: string;
  price: number;
  stock: number;
  category: string;
  isActive?: boolean;
  description?: string;
}

export interface UpdateEquipmentData {
  name?: string;
  price?: number;
  stock?: number;
  category?: string;
  isActive?: boolean;
  description?: string;
}

// Get all equipment
export const getEquipment = async (): Promise<Equipment[]> => {
  try {
    const response = await apiRequest('/equipment', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload || [];
  } catch (error) {
    console.error('Error fetching equipment:', error);
    throw new Error('Failed to fetch equipment');
  }
};

// Get a single equipment by ID
export const getEquipmentById = async (equipmentId: string): Promise<Equipment> => {
  try {
    const response = await apiRequest(`/equipment/${equipmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload;
  } catch (error) {
    console.error('Error fetching equipment:', error);
    throw new Error('Failed to fetch equipment');
  }
};

// Create new equipment
export const createEquipment = async (equipmentData: CreateEquipmentData): Promise<Equipment> => {
  try {
    const response = await apiRequest('/equipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(equipmentData),
    });
    return response.payload;
  } catch (error) {
    console.error('Error creating equipment:', error);
    throw new Error('Failed to create equipment');
  }
};

// Update existing equipment
export const updateEquipment = async (equipmentId: string, updates: UpdateEquipmentData): Promise<Equipment> => {
  try {
    const response = await apiRequest(`/equipment/${equipmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.payload;
  } catch (error) {
    console.error('Error updating equipment:', error);
    throw new Error('Failed to update equipment');
  }
};

// Delete equipment
export const deleteEquipment = async (equipmentId: string): Promise<void> => {
  try {
    await apiRequest(`/equipment/${equipmentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    throw new Error('Failed to delete equipment');
  }
};
