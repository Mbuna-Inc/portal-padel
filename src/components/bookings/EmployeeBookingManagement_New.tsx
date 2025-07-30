import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Plus, Edit, Trash2, User, CreditCard, Loader2, CheckCircle, XCircle, Search, Filter, Users, Crown, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { EmployeeBooking, BookingEquipment, createBooking, getBookings, updateBooking, deleteBooking, TIME_SLOTS, checkAvailability, getOccupiedSlots } from "../../api/bookingsApi";
import { Court, getCourts } from "../../api/courtsApi";
import { Equipment, getEquipment } from "../../api/equipmentApi";
import { useAuth } from "../../contexts/AuthContext";

export const EmployeeBookingManagement = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<EmployeeBooking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<EmployeeBooking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [selectedEquipment, setSelectedEquipment] = useState<{[key: string]: number}>({});
  
  const [formData, setFormData] = useState({
    courtId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    bookingDate: "",
    timeSlots: [] as string[],
    fullDayBooking: false,
    paymentMethod: "cash" as "cash" | "mobile_money" | "bank",
    amountPaid: 0,
    discount: 0,
    notes: ""
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, courtsData, equipmentData] = await Promise.all([
        getBookings(),
        getCourts(),
        getEquipment()
      ]);
      
      setBookings(bookingsData);
      setCourts(courtsData);
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Format MWK currency
  const formatMWK = (amount: number) => {
    return `MWK ${amount.toLocaleString()}`;
  };

  // Filter bookings based on search and filters
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = searchTerm === "" || 
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerPhone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesRole = roleFilter === "all" || booking.creatorRole === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { variant: 'default' as const, className: 'bg-green-100 text-green-800', text: 'Confirmed' };
      case 'pending':
        return { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800', text: 'Pending' };
      case 'completed':
        return { variant: 'default' as const, className: 'bg-blue-100 text-blue-800', text: 'Completed' };
      case 'cancelled':
        return { variant: 'destructive' as const, className: 'bg-red-100 text-red-800', text: 'Cancelled' };
      default:
        return { variant: 'outline' as const, className: '', text: status };
    }
  };

  // Format time slots for display
  const formatTimeSlots = (slots: string[]) => {
    if (slots.length === 0) return '';
    if (slots.length === 1) return `${slots[0]}:00`;
    return `${slots[0]}:00 - ${slots[slots.length - 1]}:00`;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      courtId: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      bookingDate: "",
      timeSlots: [],
      fullDayBooking: false,
      paymentMethod: "cash",
      amountPaid: 0,
      discount: 0,
      notes: ""
    });
    setSelectedEquipment({});
    setEditingBooking(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.courtId || !formData.customerName || !formData.bookingDate || formData.timeSlots.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedCourt = courts.find(c => c.id === formData.courtId);
    if (!selectedCourt) {
      toast.error('Selected court not found');
      return;
    }

    // Calculate equipment costs
    const equipmentItems: BookingEquipment[] = Object.entries(selectedEquipment)
      .filter(([_, quantity]) => quantity > 0)
      .map(([equipmentId, quantity]) => {
        const equipmentItem = equipment.find(e => e.id === equipmentId);
        if (!equipmentItem) throw new Error(`Equipment ${equipmentId} not found`);
        
        const pricePerHour = equipmentItem.pricePerHour;
        const totalPrice = pricePerHour * quantity * formData.timeSlots.length;
        
        return {
          equipmentId,
          equipmentName: equipmentItem.name,
          quantity,
          pricePerHour,
          totalPrice
        };
      });

    // Calculate total cost
    const courtCost = selectedCourt.pricePerHour * formData.timeSlots.length;
    const equipmentCost = equipmentItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const subtotal = courtCost + equipmentCost;
    const total = subtotal - formData.discount;

    const bookingData = {
      ...formData,
      courtName: selectedCourt.name,
      equipment: equipmentItems,
      total,
      createdBy: user?.id || '',
      creatorRole: user?.role || 'cashier',
      status: 'pending' as const
    };

    setPendingBooking(bookingData);
    setShowConfirmation(true);
  };

  // Confirm booking
  const confirmBooking = async () => {
    try {
      setIsSubmitting(true);
      await createBooking(pendingBooking);
      toast.success('Booking created successfully!');
      setShowConfirmation(false);
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await updateBooking(bookingId, { status });
      toast.success(`Booking ${status} successfully!`);
      loadData();
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast.error(error.message || 'Failed to update booking');
    }
  };

  // Delete booking
  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await deleteBooking(bookingId);
      toast.success('Booking deleted successfully!');
      loadData();
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      toast.error(error.message || 'Failed to delete booking');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Walk-In Bookings</h2>
          <p className="text-gray-600">Manage bookings for walk-in customers</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatMWK(bookings.reduce((sum, b) => sum + b.total, 0))}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by customer name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
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
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="cashier">Cashier</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Walk-in customer bookings managed by staff</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const statusInfo = getStatusBadge(booking.status);
                  return (
                    <TableRow key={booking.bookingId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.customerName}</div>
                          {booking.customerPhone && (
                            <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{booking.courtName}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.bookingDate}</div>
                          <div className="text-sm text-gray-500">
                            {formatTimeSlots(booking.timeSlots)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.equipment.length > 0 ? (
                          <div className="text-sm">
                            {booking.equipment.map((eq, idx) => (
                              <div key={idx}>{eq.equipmentName} x{eq.quantity}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatMWK(booking.total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.className}>
                          {statusInfo.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {booking.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.bookingId, 'confirmed')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.bookingId, 'completed')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Complete
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this booking? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteBooking(booking.bookingId)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
              <p className="text-gray-600 mb-4">
                {bookings.length === 0 
                  ? "No walk-in bookings have been created yet."
                  : "No bookings match your search criteria."
                }
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Booking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Dialog - Simplified for now */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>
              This feature is being enhanced. Please use the existing booking system for now.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              Full booking form with equipment selection, time slots, and payment processing coming soon.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirm Walk-In Booking
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You're about to finalize a booking for <strong>{pendingBooking?.customerName}</strong> on {pendingBooking?.bookingDate} at <strong>{pendingBooking?.courtName}</strong>.</p>
                
                <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                  <div><strong>Time Slot(s):</strong> {formatTimeSlots(pendingBooking?.timeSlots || [])}</div>
                  {pendingBooking?.equipment?.length > 0 && (
                    <div>
                      <strong>Equipment:</strong>
                      <div className="ml-4 mt-1">
                        {pendingBooking.equipment.map((eq: any, idx: number) => (
                          <div key={idx}>• {eq.equipmentName} x{eq.quantity} - {formatMWK(eq.totalPrice)}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div><strong>Total Amount:</strong> {formatMWK(pendingBooking?.total || 0)}</div>
                  <div><strong>Payment Method:</strong> {pendingBooking?.paymentMethod?.replace('_', ' ').toUpperCase()}</div>
                  <div><strong>Handled By:</strong> {user?.role} ({user?.fullName})</div>
                </div>
                
                <p className="text-sm text-gray-600">
                  Please confirm that all booking details are correct. Once submitted, a receipt will be generated and the court slot will be marked as booked.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Edit Details</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBooking}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
