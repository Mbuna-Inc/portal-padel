import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Plus, Edit, Trash2, User, CreditCard, Loader2, CheckCircle, XCircle, Search, Filter, Users, Crown, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { EmployeeBooking, BookingEquipment, createBooking, getBookings, updateBooking, deleteBooking, TIME_SLOTS, checkAvailability, getOccupiedSlots } from "../../api/bookingsApi";
import { Court, getCourts } from "../../api/courtsApi";
import { Equipment, getEquipment } from "../../api/equipmentApi";
import { useAuth } from "../../contexts/AuthContext";
import { formatMWK, isValidMWKAmount } from "../../utils/currency";

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
    equipment: [] as BookingEquipment[],
    bookingDate: "",
    timeSlots: [] as string[],
    fullDayBooking: false,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    paymentMethod: "cash" as "cash" | "mobile_money" | "bank",
    total: "",
    amountPaid: "",
    paymentId: "",
    notes: "",
    discount: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.courtId && formData.bookingDate) {
      loadOccupiedSlots();
    }
  }, [formData.courtId, formData.bookingDate]);

  useEffect(() => {
    updateEquipmentInFormData();
  }, [selectedEquipment]);

  useEffect(() => {
    calculateTotal();
  }, [formData.courtId, formData.equipment, formData.timeSlots, formData.fullDayBooking, formData.discount]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, courtsData, equipmentData] = await Promise.all([
        getBookings(),
        getCourts(),
        getEquipment()
      ]);
      setBookings(bookingsData);
      setCourts(courtsData.filter(court => court.status === 'available'));
      setEquipment(equipmentData.filter(eq => eq.isActive && eq.stock > 0));
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadOccupiedSlots = async () => {
    try {
      const slots = await getOccupiedSlots(formData.courtId, formData.bookingDate);
      setOccupiedSlots(slots);
    } catch (error) {
      console.error('Error loading occupied slots:', error);
    }
  };

  const updateEquipmentInFormData = () => {
    const equipmentArray: BookingEquipment[] = [];
    
    Object.entries(selectedEquipment).forEach(([equipmentId, quantity]) => {
      if (quantity > 0) {
        const equip = equipment.find(eq => eq.equipmentId === equipmentId);
        if (equip) {
          const hours = formData.fullDayBooking ? 9 : formData.timeSlots.length || 1;
          const totalPrice = equip.price * quantity * hours;
          
          equipmentArray.push({
            equipmentId,
            name: equip.name,
            quantity,
            pricePerHour: equip.price,
            totalPrice
          });
        }
      }
    });
    
    setFormData(prev => ({
      ...prev,
      equipment: equipmentArray
    }));
  };

  const calculateTotal = () => {
    const selectedCourt = courts.find(court => court.courtId === formData.courtId);
    if (!selectedCourt) return;

    let courtCost = 0;
    if (formData.fullDayBooking) {
      courtCost = selectedCourt.pricePerHour * 9; // 9 hours (8am-5pm)
    } else {
      courtCost = selectedCourt.pricePerHour * formData.timeSlots.length;
    }

    let equipmentCost = 0;
    formData.equipment.forEach(equipItem => {
      equipmentCost += equipItem.totalPrice;
    });

    const subtotal = courtCost + equipmentCost;
    const discount = parseFloat(formData.discount) || 0;
    const total = Math.max(0, subtotal - discount);

    setFormData(prev => ({
      ...prev,
      total: total.toString(),
      amountPaid: total.toString()
    }));
  };

  const handleTimeSlotToggle = (slot: string) => {
    if (formData.fullDayBooking) return;

    const currentDate = new Date().toISOString().split("T")[0];
    const currentTime = new Date().getHours();

    // Prevent toggling past time slots on the current date
    if (formData.bookingDate === currentDate && parseInt(slot) <= currentTime) {
      toast.error("Cannot book past time slots");
      return;
    }

    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(slot)
        ? prev.timeSlots.filter(s => s !== slot)
        : [...prev.timeSlots, slot].sort()
    }));
  };

  const handleFullDayToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      fullDayBooking: checked,
      timeSlots: checked ? TIME_SLOTS : []
    }));
  };

  const handleEquipmentQuantityChange = (equipmentId: string, quantity: number) => {
    const equip = equipment.find(eq => eq.equipmentId === equipmentId);
    if (!equip) return;
    
    // Check stock availability
    if (quantity > equip.stock) {
      toast.error(`Only ${equip.stock} ${equip.name}(s) available in stock`);
      return;
    }
    
    setSelectedEquipment(prev => ({
      ...prev,
      [equipmentId]: Math.max(0, quantity)
    }));
  };

  const getEquipmentQuantity = (equipmentId: string): number => {
    return selectedEquipment[equipmentId] || 0;
  };

  const validateForm = async () => {
    const today = new Date();
    const selectedDate = new Date(formData.bookingDate);

    if (!formData.courtId) {
      toast.error("Please select a court");
      return false;
    }
    if (!formData.bookingDate) {
      toast.error("Please select a booking date");
      return false;
    }
    if (selectedDate.getTime() < new Date(today.setHours(0, 0, 0, 0)).getTime()) {
      toast.error("Booking date cannot be in the past");
      return false;
    }
    if (!formData.fullDayBooking && formData.timeSlots.length === 0) {
      toast.error("Please select at least one time slot");
      return false;
    }
    if (!formData.customerName.trim()) {
      toast.error("Please enter customer name");
      return false;
    }

    // Check if the selected date is fully booked
    const isFullyBooked = await checkIfDateFullyBooked(formData.bookingDate);
    if (isFullyBooked) {
      toast.error("The selected date is fully booked. Please choose another date.");
      return false;
    }

    const total = parseFloat(formData.total);
    const amountPaid = parseFloat(formData.amountPaid);

    if (!isValidMWKAmount(total) || !isValidMWKAmount(amountPaid)) {
      toast.error("Please enter valid amounts");
      return false;
    }

    if (amountPaid > total) {
      toast.error("Amount paid cannot exceed total");
      return false;
    }

    return true;
  };

  // Helper to check if all courts are booked for the given date
  const checkIfDateFullyBooked = async (bookingDate: string): Promise<boolean> => {
    try {
      // For each court, check if all time slots are occupied
      const results = await Promise.all(
        courts.map(async (court) => {
          const slots = await getOccupiedSlots(court.courtId, bookingDate);
          return slots.length >= TIME_SLOTS.length;
        })
      );
      // If every court is fully booked, return true
      return results.every(Boolean);
    } catch (error) {
      // On error, assume not fully booked to avoid blocking bookings
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check availability
    try {
      const slotsToCheck = formData.fullDayBooking ? TIME_SLOTS : formData.timeSlots;
      const isAvailable = await checkAvailability(formData.courtId, formData.bookingDate, slotsToCheck);
      
      if (!isAvailable) {
        toast.error("Selected time slots are no longer available");
        await loadOccupiedSlots();
        return;
      }
    } catch (error) {
      toast.error("Failed to check availability");
      return;
    }

    // Prepare booking data for confirmation
    const selectedCourt = courts.find(court => court.courtId === formData.courtId);
    
    setPendingBooking({
      ...formData,
      courtName: selectedCourt?.name,
      total: parseFloat(formData.total),
      amountPaid: parseFloat(formData.amountPaid),
      discount: parseFloat(formData.discount) || 0
    });
    
    setShowConfirmation(true);
  };

  const confirmBooking = async () => {
    if (!pendingBooking || !user) return;

    setIsSubmitting(true);
    try {
      const bookingData = {
        courtId: pendingBooking.courtId,
        equipment: pendingBooking.equipment,
        bookingDate: pendingBooking.bookingDate,
        timeSlots: pendingBooking.timeSlots,
        fullDayBooking: pendingBooking.fullDayBooking,
        customerName: pendingBooking.customerName.trim(),
        customerPhone: pendingBooking.customerPhone.trim() || undefined,
        customerEmail: pendingBooking.customerEmail.trim() || undefined,
        paymentMethod: pendingBooking.paymentMethod,
        total: pendingBooking.total,
        amountPaid: pendingBooking.amountPaid,
        paymentId: pendingBooking.paymentId.trim() || undefined,
        notes: pendingBooking.notes.trim() || undefined,
        discount: pendingBooking.discount || undefined
      };

      await createBooking(bookingData);
      toast.success(`Booking created successfully for ${pendingBooking.customerName}!`);
      
      setShowConfirmation(false);
      setIsDialogOpen(false);
      setPendingBooking(null);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (booking: EmployeeBooking, newStatus: EmployeeBooking['status']) => {
    try {
      await updateBooking(booking.bookingId, { status: newStatus });
      toast.success(`Booking ${newStatus} successfully!`);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update booking");
    }
  };

  const handleDelete = async (booking: EmployeeBooking) => {
    try {
      await deleteBooking(booking.bookingId);
      toast.success(`Booking for ${booking.customerName} deleted successfully!`);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete booking");
    }
  };

  const resetForm = () => {
    setFormData({
      courtId: "",
      equipment: [],
      bookingDate: "",
      timeSlots: [],
      fullDayBooking: false,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      paymentMethod: "cash",
      total: "",
      amountPaid: "",
      paymentId: "",
      notes: "",
      discount: ""
    });
    setSelectedEquipment({});
    setEditingBooking(null);
    setOccupiedSlots([]);
  };

  const getStatusBadge = (status: EmployeeBooking['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      confirmed: { variant: 'default' as const, label: 'Confirmed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
      completed: { variant: 'outline' as const, label: 'Completed' }
    };
    return variants[status] || variants.pending;
  };

  const formatTimeSlots = (slots: string[]) => {
    if (slots.length === TIME_SLOTS.length) return "Full Day (8:00 - 17:00)";
    if (slots.length === 0) return "No slots";
    return `${slots[0]} - ${slots[slots.length - 1]}:00`;
  };

  const formatMWK = (amount: number) => {
    return `MWK ${amount.toLocaleString()}`;
  };

  const isSlotDisabled = (slot: string): boolean => {
    const currentDate = new Date().toISOString().split("T")[0];
    const currentTime = new Date().getHours();

    // Disable past time slots on the current date
    if (formData.bookingDate === currentDate && parseInt(slot) <= currentTime) {
      return true;
    }

    // Disable already booked slots
    return occupiedSlots.includes(slot);
  };

  const getSlotStatus = (slot: string): "available" | "booked" | "passed" => {
    const currentDate = new Date().toISOString().split("T")[0];
    const currentTime = new Date().getHours();

    if (formData.bookingDate === currentDate && parseInt(slot) <= currentTime) {
      return "passed"; // Slot is in the past
    }

    if (occupiedSlots.includes(slot)) {
      return "booked"; // Slot is already booked
    }

    return "available"; // Slot is available
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <div className="text-lg">Loading bookings...</div>
        </div>
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

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Walk-In Booking</DialogTitle>
              <DialogDescription>
                Create a new booking for a walk-in customer
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Court Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="court">Court</Label>
                  <Select value={formData.courtId} onValueChange={(value) => setFormData({...formData, courtId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a court" />
                    </SelectTrigger>
                    <SelectContent>
                      {courts.map(court => (
                        <SelectItem key={court.courtId} value={court.courtId}>
                          {court.name} - {formatMWK(court.pricePerHour)}/hour
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Booking Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.bookingDate}
                    onChange={(e) => setFormData({...formData, bookingDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fullDay"
                    checked={formData.fullDayBooking}
                    onCheckedChange={handleFullDayToggle}
                  />
                  <Label htmlFor="fullDay">Book entire day (8:00 AM - 5:00 PM)</Label>
                </div>
                
                {!formData.fullDayBooking && (
                  <div>
                    <Label>Select Time Slots (1 hour each)</Label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {TIME_SLOTS.map(slot => {
                        const slotStatus = getSlotStatus(slot);
                        const isSelected = formData.timeSlots.includes(slot);

                        return (
                          <Button
                            key={slot}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            disabled={slotStatus === "passed" || slotStatus === "booked"}
                            onClick={() => handleTimeSlotToggle(slot)}
                            className={
                              slotStatus === "booked"
                                ? "bg-red-500 text-white"
                                : slotStatus === "passed"
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-green-500 text-white"
                            }
                          >
                            {slot}
                            {slotStatus === "booked" && <XCircle className="h-3 w-3 ml-1" />}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Equipment Selection */}
              <div className="space-y-4">
                <Label>Equipment (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {equipment.map(equip => {
                    const currentQuantity = getEquipmentQuantity(equip.equipmentId);
                    const maxQuantity = Math.min(equip.stock, 10); // Limit to 10 sets max
                    
                    return (
                      <div key={equip.equipmentId} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{equip.name}</div>
                            <div className="text-sm text-gray-600">
                              {formatMWK(equip.price)}/hour per set
                            </div>
                            <div className="text-xs text-gray-500">
                              Stock: {equip.stock} available
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`qty-${equip.equipmentId}`} className="text-sm">
                            Quantity:
                          </Label>
                          <div className="flex items-center space-x-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEquipmentQuantityChange(equip.equipmentId, currentQuantity - 1)}
                              disabled={currentQuantity <= 0}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <Input
                              id={`qty-${equip.equipmentId}`}
                              type="number"
                              min="0"
                              max={maxQuantity}
                              value={currentQuantity}
                              onChange={(e) => handleEquipmentQuantityChange(equip.equipmentId, parseInt(e.target.value) || 0)}
                              className="w-16 text-center h-8"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEquipmentQuantityChange(equip.equipmentId, currentQuantity + 1)}
                              disabled={currentQuantity >= maxQuantity}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        
                        {currentQuantity > 0 && (
                          <div className="text-sm text-blue-600 font-medium">
                            Subtotal: {formatMWK(equip.price * currentQuantity * (formData.fullDayBooking ? 9 : Math.max(formData.timeSlots.length, 1)))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Equipment Summary */}
                {formData.equipment.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-medium text-blue-800 mb-2">Selected Equipment:</div>
                    {formData.equipment.map(item => (
                      <div key={item.equipmentId} className="flex justify-between text-sm text-blue-700">
                        <span>{item.name} × {item.quantity}</span>
                        <span>{formatMWK(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone (Optional)</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email (Optional)</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value: any) => setFormData({...formData, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentId">Payment ID (Optional)</Label>
                  <Input
                    id="paymentId"
                    value={formData.paymentId}
                    onChange={(e) => setFormData({...formData, paymentId: e.target.value})}
                    placeholder="Transaction reference"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (MWK)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="total">Total Amount</Label>
                  <Input
                    id="total"
                    value={formatMWK(parseFloat(formData.total) || 0)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amountPaid">Amount Paid</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    min="0"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({...formData, amountPaid: e.target.value})}
                    placeholder="Amount paid"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Booking'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
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
              {/* Wrap the child content in a single parent element */}
              <div className="space-y-3">
                <p>You're about to finalize a booking for <strong>{pendingBooking?.customerName}</strong> on {pendingBooking?.bookingDate} at <strong>{pendingBooking?.courtName}</strong>.</p>
                
                <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                  <div><strong>Time Slot(s):</strong> {formatTimeSlots(pendingBooking?.timeSlots || [])}</div>
                  {pendingBooking?.equipment?.length > 0 && (
                    <div>
                      <strong>Equipment:</strong>
                      <div className="ml-4 mt-1">
                        {pendingBooking.equipment.map((item: BookingEquipment, index: number) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.name} × {item.quantity}</span>
                            <span>{formatMWK(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div><strong>Full-Day Booking:</strong> {pendingBooking?.fullDayBooking ? 'Yes' : 'No'}</div>
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

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Walk-in customer bookings managed by staff</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <TableCell>{booking.bookingDate}</TableCell>
                    <TableCell>{formatTimeSlots(booking.timeSlots)}</TableCell>
                    <TableCell>{formatMWK(booking.total)}</TableCell>
                    <TableCell className="capitalize">{booking.paymentMethod.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {booking.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(booking, 'confirmed')}
                          >
                            Confirm
                          </Button>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(booking, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the booking for {booking.customerName}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(booking)}
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
          
          {filteredBookings.length === 0 && (
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
    </div>
  );
};
