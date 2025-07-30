import { apiRequest } from './apiRequest';

export interface Court {
  courtId: string;
  name: string;
  location: string;
  pricePerHour: number; // Price in MWK
  status: 'available' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourtData {
  name: string;
  location: string;
  pricePerHour: number;
  status: 'available' | 'closed';
}

export interface UpdateCourtData {
  name?: string;
  location?: string;
  pricePerHour?: number;
  status?: 'available' | 'closed';
}

// Get all courts
export const getCourts = async (): Promise<Court[]> => {
  try {
    const response = await apiRequest('/courts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload || [];
  } catch (error) {
    console.error('Error fetching courts:', error);
    throw new Error('Failed to fetch courts');
  }
};

// Get a single court by ID
export const getCourt = async (courtId: string): Promise<Court> => {
  try {
    const response = await apiRequest(`/courts/${courtId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload;
  } catch (error) {
    console.error('Error fetching court:', error);
    throw new Error('Failed to fetch court');
  }
};

// Create a new court
export const createCourt = async (courtData: CreateCourtData): Promise<Court> => {
  try {
    const response = await apiRequest('/courts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courtData),
    });
    return response.payload;
  } catch (error) {
    console.error('Error creating court:', error);
    throw new Error('Failed to create court');
  }
};

// Update an existing court
export const updateCourt = async (courtId: string, updates: UpdateCourtData): Promise<Court> => {
  try {
    const response = await apiRequest(`/courts/${courtId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.payload;
  } catch (error) {
    console.error('Error updating court:', error);
    throw new Error('Failed to update court');
  }
};

// Delete a court
export const deleteCourt = async (courtId: string): Promise<void> => {
  try {
    await apiRequest(`/courts/${courtId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting court:', error);
    throw new Error('Failed to delete court');
  }
};

// Toggle court status (available/closed)
export const toggleCourtStatus = async (courtId: string): Promise<Court> => {
  try {
    const response = await apiRequest(`/courts/${courtId}/toggle-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload;
  } catch (error) {
    console.error('Error toggling court status:', error);
    throw new Error('Failed to toggle court status');
  }
};
