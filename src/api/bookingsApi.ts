import { apiRequest } from './apiRequest';

export interface BookingEquipment {
  equipmentId: string;
  name: string;
  quantity: number;
  pricePerHour: number;
  totalPrice: number;
}

export interface EmployeeBooking {
  bookingId: string;
  courtId: string;
  courtName: string;
  equipment: BookingEquipment[]; // Array of equipment with quantities
  bookingDate: string; // YYYY-MM-DD format
  timeSlots: string[]; // Array of time slots like ["09:00", "10:00"]
  fullDayBooking: boolean;
  customerName: string;
  customerPhone?: string; // Optional contact
  customerEmail?: string; // Optional contact
  createdBy: string; // Employee user ID
  creatorRole: 'admin' | 'cashier';
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentMethod: 'cash' | 'mobile_money' | 'bank';
  total: number; // Total cost in MWK
  amountPaid: number; // Amount actually paid
  paymentId?: string; // Optional payment reference
  notes?: string; // Optional notes
  discount?: number; // Optional discount amount
}

export interface CreateBookingData {
  courtId: string;
  equipment: BookingEquipment[];
  bookingDate: string;
  timeSlots: string[];
  fullDayBooking: boolean;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod: 'cash' | 'mobile_money' | 'bank';
  total: number;
  amountPaid: number;
  paymentId?: string;
  notes?: string;
  discount?: number;
}

export interface UpdateBookingData {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentMethod?: 'cash' | 'mobile_money' | 'bank';
  amountPaid?: number;
  paymentId?: string;
  notes?: string;
  equipment?: BookingEquipment[];
}

// Time slots available (8am to 5pm)
export const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

// Get all bookings
export const getBookings = async (): Promise<EmployeeBooking[]> => {
  try {
    const response = await apiRequest('/employee-bookings/GetAll', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload || [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw new Error('Failed to fetch bookings');
  }
};

// Get bookings by date
export const getBookingsByDate = async (date: string): Promise<EmployeeBooking[]> => {
  try {
    const response = await apiRequest(`/employee-bookings/GetAll?date=${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload || [];
  } catch (error) {
    console.error('Error fetching bookings by date:', error);
    throw new Error('Failed to fetch bookings');
  }
};

// Get single booking
export const getBooking = async (bookingId: string): Promise<EmployeeBooking> => {
  try {
    const response = await apiRequest(`/employee-bookings/GetByID?id=${bookingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw new Error('Failed to fetch booking');
  }
};

// Create new booking
export const createBooking = async (bookingData: CreateBookingData): Promise<EmployeeBooking> => {
  try {
    const response = await apiRequest('/employee-bookings/Add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    return response.payload;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking');
  }
};

// Update booking
export const updateBooking = async (bookingId: string, updates: UpdateBookingData): Promise<EmployeeBooking> => {
  try {
    const response = await apiRequest(`/employee-bookings/Update?id=${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.payload;
  } catch (error) {
    console.error('Error updating booking:', error);
    throw new Error('Failed to update booking');
  }
};

// Cancel booking
export const cancelBooking = async (bookingId: string): Promise<void> => {
  try {
    await updateBooking(bookingId, { status: 'cancelled' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw new Error('Failed to cancel booking');
  }
};

// Delete booking
export const deleteBooking = async (bookingId: string): Promise<void> => {
  try {
    await apiRequest(`/employee-bookings/Delete?id=${bookingId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw new Error('Failed to delete booking');
  }
};

// Check availability for a court on a specific date and time slots
export const checkAvailability = async (courtId: string, date: string, timeSlots: string[]): Promise<boolean> => {
  try {
    const response = await apiRequest('/employee-bookings/check-availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courtId, date, timeSlots }),
    });
    return response.payload.available;
  } catch (error) {
    console.error('Error checking availability:', error);
    throw new Error('Failed to check availability');
  }
};

// Get occupied time slots for a court on a specific date
export const getOccupiedSlots = async (courtId: string, date: string): Promise<string[]> => {
  try {
    const response = await apiRequest(`/booked-timeslots/occupied?courtId=${courtId}&date=${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload.occupiedSlots || [];
  } catch (error) {
    console.error('Error fetching occupied slots:', error);
    // Fallback to old endpoint if new one fails
    try {
      const fallbackResponse = await apiRequest(`/employee-bookings/occupied-slots?courtId=${courtId}&date=${date}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return fallbackResponse.payload.occupiedSlots || [];
    } catch (fallbackError) {
      console.error('Error with fallback occupied slots:', fallbackError);
      return [];
    }
  }
};
