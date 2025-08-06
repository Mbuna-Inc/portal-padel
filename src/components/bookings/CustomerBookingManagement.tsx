import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calendar, 
  CheckCircle,
  Clock, 
  User, 
  Loader2, 
  XCircle, 
  Search, 
  Users, 
  CalendarDays, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Eye,
  CalendarCheck,
  Clock3,
  CalendarRange,
  Filter,
  CreditCard
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  CustomerBooking, 
  getCustomerBookings, 
  updateCustomerBookingStatus,
  updateCustomerBookingPaymentStatus,
  cancelCustomerBooking,
  getBookingStatistics,
  formatBookingDate,
  formatBookingTime,
  calculateDuration
} from "../../api/customerBookingsApi";
import { Court, getCourts } from "../../api/courtsApi";
import { formatMWK } from "../../utils/currency";

interface CustomerBookingManagementProps {
  onDataChange?: () => void;
}

export const CustomerBookingManagement: React.FC<CustomerBookingManagementProps> = ({ onDataChange }) => {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [courtFilter, setCourtsFilter] = useState("all");
  const [statistics, setStatistics] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<CustomerBooking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [bookings]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, courtsData] = await Promise.all([
        getCustomerBookings(),
        getCourts()
      ]);
      
      // Ensure bookingsData is always an array
      const safeBookingsData = Array.isArray(bookingsData) ? bookingsData : [];
      console.log('Loaded bookings data:', safeBookingsData);
      
      setBookings(safeBookingsData);
      setCourts(courtsData);
    } catch (error) {
      toast.error("Failed to load customer bookings");
      console.error('Error loading data:', error);
      // Set empty array on error
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getBookingStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleStatusUpdate = async (booking: CustomerBooking, newStatus: CustomerBooking['status']) => {
    try {
      await updateCustomerBookingStatus(booking.id, newStatus);
      toast.success(`Booking ${newStatus} successfully`);
      loadData();
      onDataChange?.();
    } catch (error) {
      toast.error(`Failed to ${newStatus} booking`);
    }
  };

  const handlePaymentStatusUpdate = async (booking: CustomerBooking, newPaymentStatus: 'pending' | 'completed' | 'failed') => {
    try {
      await updateCustomerBookingPaymentStatus(booking.id, newPaymentStatus);
      toast.success(`Payment status updated to ${newPaymentStatus}`);
      loadData();
      onDataChange?.();
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

  const handleCancelBooking = async (booking: CustomerBooking) => {
    try {
      await cancelCustomerBooking(booking.id);
      toast.success("Booking cancelled successfully");
      loadData();
      onDataChange?.();
    } catch (error) {
      toast.error("Failed to cancel booking");
    }
  };

  const getStatusBadge = (status: CustomerBooking['status']) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending", icon: Clock },
      confirmed: { variant: "default" as const, label: "Confirmed", icon: CheckCircle },
      completed: { variant: "default" as const, label: "Completed", icon: CheckCircle },
      cancelled: { variant: "destructive" as const, label: "Cancelled", icon: XCircle },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: 'pending' | 'completed' | 'failed') => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending", icon: Clock },
      paid: { variant: "success" as const, label: "Paid", icon: CheckCircle },
      refunded: { variant: "destructive" as const, label: "Refunded", icon: XCircle },
    };
    
    const config = statusConfig[paymentStatus] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filterBookingsByDate = (bookings: CustomerBooking[]) => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    return bookings.filter(booking => {
      const bookingDate = new Date(booking.bookingDate);
      const isToday = bookingDate >= todayStart && bookingDate <= todayEnd;
      const isPast = bookingDate < now;
      const isFuture = bookingDate > now;

      switch (activeTab) {
        case 'today':
          return isToday;
        case 'upcoming':
          return isFuture;
        case 'past':
          return isPast;
        default:
          return true; // 'all' tab
      }
    });
  };

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  
  const filteredBookings = filterBookingsByDate(safeBookings).filter(booking => {
    const matchesSearch = searchTerm === "" || 
      (booking.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.customer?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.summary?.courtNames || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === "all" || booking.payment?.status === paymentStatusFilter;
    const matchesCourt = courtFilter === "all" || booking.courts?.some(court => court.courtId === courtFilter);
    
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesCourt;
  });

  const showBookingDetails = (booking: CustomerBooking) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading customer bookings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.totalBookings || 0}</div>
              <p className="text-xs text-muted-foreground">+0% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.confirmedBookings || 0}</div>
              <p className="text-xs text-muted-foreground">Active bookings</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMWK(statistics?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">From paid bookings</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.pendingPayments || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <TabsList className="grid w-full lg:w-auto grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              <span>All</span>
              <Badge variant="secondary" className="ml-1">
                {bookings.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="today" className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              <span>Today</span>
              <Badge variant="secondary" className="ml-1">
                {bookings.filter(b => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const bookingDate = new Date(b.bookingDate);
                  return bookingDate >= today && bookingDate < tomorrow;
                }).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              <span>Upcoming</span>
              <Badge variant="secondary" className="ml-1">
                {bookings.filter(b => new Date(b.bookingDate) > new Date()).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Past</span>
              <Badge variant="secondary" className="ml-1">
                {bookings.filter(b => new Date(b.bookingDate) < new Date()).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by customer name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-32">
                  <CreditCard className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={courtFilter} onValueChange={setCourtsFilter}>
                <SelectTrigger className="w-32">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Court" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courts</SelectItem>
                  {courts.map((court) => (
                    <SelectItem key={court.courtId} value={court.courtId}>
                      {court.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Bookings Management
              </CardTitle>
              <CardDescription>
                Manage and monitor all customer bookings from the website
              </CardDescription>
            </CardHeader>
            <CardContent>

          {/* Bookings Table - Simplified */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time Slots</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => {
                // Get all slots from all courts
                const allSlots = booking.courts?.flatMap(court => court.slots) || [];
                const courtNames = booking.summary?.courtNames || booking.courts?.map(c => c.courtName).join(', ') || 'N/A';
                
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {booking.payment?.paymentId || booking.id}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{booking.customer?.name || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {booking.bookingDate ? formatBookingDate(booking.bookingDate) : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {allSlots.length > 0 ? allSlots.join(', ') : 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.summary?.totalSlots || allSlots.length}h • {courtNames}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-600">
                          {formatMWK(booking.payment?.total || booking.summary?.totalAmount || 0)}
                        </span>
                        {booking.payment?.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {booking.payment?.status === 'pending' && (
                          <Clock className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showBookingDetails(booking)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        
                        {booking.payment?.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePaymentStatusUpdate(booking, 'completed')}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
              {filteredBookings.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Customer Bookings Found</h3>
                  <p className="text-gray-600">
                    {bookings.length === 0 
                      ? "No customer bookings have been made yet."
                      : "No bookings match your search criteria."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <AlertDialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <AlertDialogHeader className="flex-shrink-0">
              <AlertDialogTitle>Booking Details</AlertDialogTitle>
              <AlertDialogDescription>
                Complete information for booking {selectedBooking.payment?.paymentId || selectedBooking.id}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="flex-1 overflow-y-auto px-1">
              <div className="space-y-6 py-4">
                {/* Customer Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <p className="font-medium">{selectedBooking.customer?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">{selectedBooking.customer?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">User ID:</span>
                      <p className="font-mono text-xs">{selectedBooking.customer?.userId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment ID:</span>
                      <p className="font-mono text-xs">{selectedBooking.payment?.paymentId || selectedBooking.id}</p>
                    </div>
                  </div>
                </div>

              {/* Booking Details */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Booking Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <p className="font-medium">
                      {selectedBooking.bookingDate ? formatBookingDate(selectedBooking.bookingDate) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Duration:</span>
                    <p className="font-medium">
                      {selectedBooking.summary?.totalSlots || 0} hours
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Courts & Time Slots:</span>
                    <div className="mt-2 space-y-2">
                      {selectedBooking.courts?.map((court, index) => (
                        <div key={index} className="bg-white p-2 rounded border">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{court.courtName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span>{court.slots?.join(', ') || 'No slots'}</span>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500">No court information available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment (if any) */}
              {selectedBooking.equipment && selectedBooking.equipment.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Equipment Rental ({selectedBooking.summary?.equipmentCount || selectedBooking.equipment.length} items)
                  </h4>
                  <div className="space-y-2">
                    {selectedBooking.equipment.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                        <span className="font-medium">{item.name}</span>
                        <div className="text-right">
                          <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                          <p className="font-medium text-green-600">{formatMWK(0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment & Status */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  Payment & Status
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 text-sm">Total Amount:</span>
                    <p className="font-bold text-lg text-green-600">
                      {formatMWK(selectedBooking.payment?.total || selectedBooking.summary?.totalAmount || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Amount Paid:</span>
                    <p className="font-medium text-green-600">
                      {formatMWK(selectedBooking.payment?.amountPaid || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Payment Method:</span>
                    <p className="font-medium capitalize">{selectedBooking.payment?.method || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Payment ID:</span>
                    <p className="font-mono text-xs">{selectedBooking.payment?.paymentId || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Booking Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Payment Status:</span>
                    <div className="mt-1">
                      <Badge 
                        variant={selectedBooking.payment?.status === 'completed' ? 'default' : 
                                selectedBooking.payment?.status === 'pending' ? 'secondary' : 'destructive'}
                        className={selectedBooking.payment?.status === 'completed' ? 'bg-green-600' : 
                                  selectedBooking.payment?.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'}
                      >
                        {selectedBooking.payment?.status || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              {(selectedBooking.createdAt || selectedBooking.updatedAt) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Booking History</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedBooking.createdAt && (
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <p className="font-medium">{new Date(selectedBooking.createdAt).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedBooking.updatedAt && (
                      <div>
                        <span className="text-gray-500">Last Updated:</span>
                        <p className="font-medium">{new Date(selectedBooking.updatedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Management Actions */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Management Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.status === 'pending' && (
                    <Button
                      onClick={() => {
                        handleStatusUpdate(selectedBooking, 'confirmed');
                        setShowDetailsDialog(false);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Confirm Booking
                    </Button>
                  )}
                  
                  {selectedBooking.status === 'confirmed' && (
                    <Button
                      onClick={() => {
                        handleStatusUpdate(selectedBooking, 'completed');
                        setShowDetailsDialog(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark Complete
                    </Button>
                  )}
                  
                  {selectedBooking.payment?.status === 'pending' && (
                    <Button
                      onClick={() => {
                        handlePaymentStatusUpdate(selectedBooking, 'completed');
                        setShowDetailsDialog(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark as Paid
                    </Button>
                  )}
                  
                  {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          Cancel Booking
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this booking for {selectedBooking.customer?.name}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              handleCancelBooking(selectedBooking);
                              setShowDetailsDialog(false);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Cancel Booking
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          </div>
            
            <AlertDialogFooter className="flex-shrink-0">
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};