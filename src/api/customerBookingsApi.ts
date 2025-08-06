import { apiRequest } from './apiRequest';

export interface CustomerBookingEquipment {
  equipmentId: string;
  name: string;
  quantity: number;
}

export interface CustomerBooking {
  id: string;
  bookingDate: string;
  courts: {
    courtId: string;
    courtName: string;
    slots: string[];
  }[];
  createdAt: any; // Firestore timestamp
  createdBy: string;
  creatorRole: string;
  customer: {
    email: string;
    name: string;
    userId: string;
  };
  equipment: CustomerBookingEquipment[];
  payment: {
    amountPaid: number;
    method: string;
    paymentId: string;
    status: 'pending' | 'completed' | 'failed';
    total: number;
  };
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  summary: {
    courtNames: string;
    equipmentCount: number;
    totalAmount: number;
    totalSlots: number;
  };
  updatedAt: any; // Firestore timestamp
  notes?: string;
}

export interface CustomerBookingFilters {
  status?: string;
  paymentStatus?: string;
  courtId?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

// Get all customer bookings with optional filters
export const getCustomerBookings = async (filters?: CustomerBookingFilters): Promise<CustomerBooking[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
    }
    
    const url = `/bookings/GetAll${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await apiRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Customer bookings API response:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', Object.keys(response || {}));
    
    // Handle different response structures
    let bookingsData = [];
    if (response && response.payload) {
      console.log('Using response.payload:', response.payload);
      console.log('Payload is array:', Array.isArray(response.payload));
      
      if (Array.isArray(response.payload)) {
        bookingsData = response.payload;
      } else if (response.payload && typeof response.payload === 'object') {
        console.log('Payload object keys:', Object.keys(response.payload));
        console.log('Payload object:', response.payload);
        
        // Check if payload has bookings array property (this is the correct structure)
        if (Array.isArray(response.payload.bookings)) {
          console.log('Found bookings array in payload.bookings');
          bookingsData = response.payload.bookings;
        } else if (Array.isArray(response.payload.data)) {
          console.log('Found bookings array in payload.data');
          bookingsData = response.payload.data;
        } else if (Array.isArray(response.payload.items)) {
          console.log('Found bookings array in payload.items');
          bookingsData = response.payload.items;
        } else if (Array.isArray(response.payload.results)) {
          console.log('Found bookings array in payload.results');
          bookingsData = response.payload.results;
        } else {
          // Convert object values to array if they look like bookings
          const values = Object.values(response.payload);
          console.log('Payload values:', values);
          if (values.length > 0 && values[0] && typeof values[0] === 'object') {
            console.log('Converting payload object values to array');
            bookingsData = values;
          } else {
            console.log('Payload object does not contain recognizable booking data');
          }
        }
      }
    } else if (response && response.data) {
      console.log('Using response.data:', response.data);
      bookingsData = Array.isArray(response.data) ? response.data : [];
    } else if (Array.isArray(response)) {
      console.log('Response is direct array:', response);
      bookingsData = response;
    } else {
      console.log('No valid data found in response, using empty array');
    }
    
    console.log('Final processed bookings data:', bookingsData);
    console.log('Bookings data length:', bookingsData.length);
    return bookingsData;
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    // Return empty array instead of throwing to prevent crashes
    return [];
  }
};

// Get customer booking by ID
export const getCustomerBooking = async (bookingId: string): Promise<CustomerBooking> => {
  try {
    const response = await apiRequest(`/bookings/GetByID?id=${bookingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.payload;
  } catch (error) {
    console.error('Error fetching customer booking:', error);
    throw new Error('Failed to fetch customer booking');
  }
};

// Update customer booking status
export const updateCustomerBookingStatus = async (
  bookingId: string, 
  status: CustomerBooking['status']
): Promise<CustomerBooking> => {
  try {
    const response = await apiRequest(`/bookings/Update?id=${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return response.payload;
  } catch (error) {
    console.error('Error updating customer booking status:', error);
    throw new Error('Failed to update booking status');
  }
};

// Update customer booking payment status
export const updateCustomerBookingPaymentStatus = async (
  bookingId: string, 
  paymentStatus: 'pending' | 'completed' | 'failed',
  paymentReference?: string
): Promise<CustomerBooking> => {
  try {
    const updateData: any = { paymentStatus };
    if (paymentReference) {
      updateData.paymentReference = paymentReference;
    }
    
    const response = await apiRequest(`/bookings/Update?id=${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    return response.payload;
  } catch (error) {
    console.error('Error updating customer booking payment status:', error);
    throw new Error('Failed to update payment status');
  }
};

// Cancel customer booking
export const cancelCustomerBooking = async (bookingId: string): Promise<void> => {
  try {
    await apiRequest(`/bookings/Delete?id=${bookingId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error cancelling customer booking:', error);
    throw new Error('Failed to cancel booking');
  }
};

// Get booking statistics
export const getBookingStatistics = async (): Promise<{
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  pendingPayments: number;
}> => {
  try {
    const bookings = await getCustomerBookings();
    
    // Ensure bookings is an array
    const safeBookings = Array.isArray(bookings) ? bookings : [];
    
    const totalBookings = safeBookings.length;
    const confirmedBookings = safeBookings.filter(booking => booking.status === 'confirmed').length;
    
    // Calculate total revenue from completed payments
    const totalRevenue = safeBookings
      .filter(booking => booking.payment?.status === 'completed')
      .reduce((sum, booking) => sum + (booking.payment?.total || booking.summary?.totalAmount || 0), 0);
    
    // Count pending payments
    const pendingPayments = safeBookings.filter(booking => booking.payment?.status === 'pending').length;
    
    return {
      totalBookings,
      confirmedBookings,
      totalRevenue,
      pendingPayments
    };
  } catch (error) {
    console.error('Error calculating booking statistics:', error);
    return {
      totalBookings: 0,
      confirmedBookings: 0,
      totalRevenue: 0,
      pendingPayments: 0
    };
  }
};

// Format date for display
export const formatBookingDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

// Format time for display
export const formatBookingTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    return dateString;
  }
};

// Calculate duration between start and end time
export const calculateDuration = (startTime: string, endTime: string): number => {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    return Math.round(durationMs / (1000 * 60 * 60)); // Convert to hours
  } catch (error) {
    return 0;
  }
};
