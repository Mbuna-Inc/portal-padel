import { apiRequest } from './apiRequest';

// Timeslot interfaces
export interface Timeslot {
  slotId: string;
  courtId: string;   // Court ID this timeslot belongs to
  courtName: string; // Court name for display
  startTime: string; // Format: "07:00"
  endTime: string;   // Format: "08:00"
  price: number;     // Price in MWK
  isPeak: boolean;   // Peak hour flag
  isActive: boolean; // Whether this slot is available for booking
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeslotData {
  courtId: string;
  startTime: string;
  endTime: string;
  price: number;
  isPeak: boolean;
  isActive?: boolean;
}

export interface UpdateTimeslotData {
  startTime?: string;
  endTime?: string;
  price?: number;
  isPeak?: boolean;
  isActive?: boolean;
}

// Booking slot status for a specific court and date
export interface BookingSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  price: number;
  isPeak: boolean;
  status: 'available' | 'booked' | 'expired';
  courtId: string;
  date: string;
  bookingId?: string; // If booked
}

export interface SlotAvailabilityRequest {
  courtId: string;
  date: string; // Format: "YYYY-MM-DD"
}

// Get all timeslots (admin only)
export const getTimeslots = async (): Promise<Timeslot[]> => {
  try {
    const response = await apiRequest('/timeslots/GetAll', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload || [];
  } catch (error) {
    console.error('Error fetching timeslots:', error);
    throw new Error('Failed to fetch timeslots');
  }
};

// Get single timeslot by ID
export const getTimeslot = async (slotId: string): Promise<Timeslot> => {
  try {
    const response = await apiRequest(`/timeslots/GetByID?id=${slotId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload;
  } catch (error) {
    console.error('Error fetching timeslot:', error);
    throw new Error('Failed to fetch timeslot');
  }
};

// Create new timeslot (admin only)
export const createTimeslot = async (timeslotData: CreateTimeslotData): Promise<Timeslot> => {
  try {
    const response = await apiRequest('/timeslots/Add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(timeslotData),
    });
    return response.payload;
  } catch (error) {
    console.error('Error creating timeslot:', error);
    throw new Error('Failed to create timeslot');
  }
};

// Update timeslot (admin only)
export const updateTimeslot = async (slotId: string, updates: UpdateTimeslotData): Promise<Timeslot> => {
  try {
    const response = await apiRequest(`/timeslots/Update?id=${slotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.payload;
  } catch (error) {
    console.error('Error updating timeslot:', error);
    throw new Error('Failed to update timeslot');
  }
};

// Delete timeslot (admin only)
export const deleteTimeslot = async (slotId: string): Promise<void> => {
  try {
    await apiRequest(`/timeslots/Delete?id=${slotId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting timeslot:', error);
    throw new Error('Failed to delete timeslot');
  }
};

// Get available slots for a specific court and date
export const getSlotAvailability = async (courtId: string, date: string): Promise<BookingSlot[]> => {
  try {
    const response = await apiRequest(`/timeslots/availability?courtId=${courtId}&date=${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload || [];
  } catch (error) {
    console.error('Error fetching slot availability:', error);
    throw new Error('Failed to fetch slot availability');
  }
};

// Check if specific slots are available for booking
export const checkSlotsAvailability = async (
  courtId: string, 
  date: string, 
  slotIds: string[]
): Promise<{ slotId: string; available: boolean }[]> => {
  try {
    const response = await apiRequest('/timeslots/check-availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courtId, date, slotIds }),
    });
    return response.payload || [];
  } catch (error) {
    console.error('Error checking slot availability:', error);
    // Return all as available for demo
    return slotIds.map(slotId => ({ slotId, available: true }));
  }
};

// Reserve slots for booking (temporary hold)
export const reserveSlots = async (
  courtId: string,
  date: string,
  slotIds: string[],
  customerInfo: { name: string; email?: string; phone?: string }
): Promise<{ reservationId: string; expiresAt: string }> => {
  try {
    const response = await apiRequest('/timeslots/reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courtId, date, slotIds, customerInfo }),
    });
    return response.payload;
  } catch (error) {
    console.error('Error reserving slots:', error);
    throw new Error('Failed to reserve slots');
  }
};

// Utility functions
export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${startTime} - ${endTime}`;
};

export const calculateSlotDuration = (startTime: string, endTime: string): number => {
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  return (end.getTime() - start.getTime()) / (1000 * 60); // Duration in minutes
};

export const isSlotExpired = (date: string, startTime: string): boolean => {
  const now = new Date();
  const slotDateTime = new Date(`${date}T${startTime}:00`);
  return slotDateTime < now;
};

export const getSlotStatusColor = (status: BookingSlot['status']): string => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'booked':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'expired':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export const getPeakStatusColor = (isPeak: boolean): string => {
  return isPeak 
    ? 'bg-orange-100 text-orange-800 border-orange-200'
    : 'bg-blue-100 text-blue-800 border-blue-200';
};



export default {
  getTimeslots,
  getTimeslot,
  createTimeslot,
  updateTimeslot,
  deleteTimeslot,
  getSlotAvailability,
  checkSlotsAvailability,
  reserveSlots,
  formatTimeRange,
  calculateSlotDuration,
  isSlotExpired,
  getSlotStatusColor,
  getPeakStatusColor,
};
