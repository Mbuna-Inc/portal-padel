import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Calendar, Clock, Plus, Edit, Trash2, User, CreditCard, Loader2, CheckCircle, XCircle, Search, Filter, Users, Crown, CalendarDays, CalendarRange, Clock3, CalendarCheck, Printer, Eye } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import { EmployeeBooking, BookingEquipment, createBooking, getBookings, updateBooking, deleteBooking, TIME_SLOTS, checkAvailability, getOccupiedSlots } from "../../api/bookingsApi";
import { Court, getCourts } from "../../api/courtsApi";
import { Equipment, getEquipment } from "../../api/equipmentApi";
import { useAuth } from "../../contexts/AuthContext";
import { formatMWK, isValidMWKAmount } from "../../utils/currency";
import { StepBookingModal } from "./StepBookingModal";

interface EmployeeBookingManagementProps {
  onDataChange?: () => void;
}

export const EmployeeBookingManagement = ({ onDataChange }: EmployeeBookingManagementProps = {}) => {
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
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<EmployeeBooking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

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
      onDataChange?.(); // Update sidebar badges
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingSubmit = async (bookingData: any) => {
    if (!user) return;

    const finalBookingData = {
      courtId: bookingData.courtId,
      equipment: bookingData.equipment,
      bookingDate: bookingData.bookingDate,
      timeSlots: bookingData.timeSlots,
      fullDayBooking: bookingData.fullDayBooking,
      customerName: bookingData.customerName.trim(),
      customerPhone: bookingData.customerPhone?.trim() || undefined,
      customerEmail: bookingData.customerEmail?.trim() || undefined,
      paymentMethod: bookingData.paymentMethod,
      total: parseFloat(bookingData.total),
      amountPaid: parseFloat(bookingData.amountPaid),
      paymentId: bookingData.paymentId?.trim() || undefined,
      notes: bookingData.notes?.trim() || undefined,
      discount: parseFloat(bookingData.discount) || undefined
    };

    await createBooking(finalBookingData);
    toast.success(`Booking created successfully for ${bookingData.customerName}!`);
    
    await loadData();
    onDataChange?.(); // Update sidebar badges
  };

  const handleStatusUpdate = async (booking: EmployeeBooking, newStatus: EmployeeBooking['status']) => {
    try {
      await updateBooking(booking.bookingId, { status: newStatus });
      toast.success(`Booking ${newStatus} successfully!`);
      await loadData();
      onDataChange?.(); // Update sidebar badges
    } catch (error: any) {
      toast.error(error.message || "Failed to update booking");
    }
  };

  const handleDelete = async (booking: EmployeeBooking) => {
    try {
      await deleteBooking(booking.bookingId);
      toast.success(`Booking for ${booking.customerName} deleted successfully!`);
      await loadData();
      onDataChange?.(); // Update sidebar badges
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

  const printReceipt = (booking: EmployeeBooking) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // POS paper width (80mm) with flexible height
    });

    // Set font
    doc.setFont('helvetica');
    
    let yPos = 10;
    const lineHeight = 4;
    const centerX = 40; // Center of 80mm width

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PADLE ZONE', centerX, yPos, { align: 'center' });
    yPos += lineHeight + 2;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Receipt', centerX, yPos, { align: 'center' });
    yPos += lineHeight + 3;
    
    // Separator line
    doc.text('================================', centerX, yPos, { align: 'center' });
    yPos += lineHeight + 2;

    // Booking Details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BOOKING DETAILS', 5, yPos);
    yPos += lineHeight + 1;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: ${booking.bookingId}`, 5, yPos);
    yPos += lineHeight;
    
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 5, yPos);
    yPos += lineHeight;
    
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 5, yPos);
    yPos += lineHeight + 2;

    // Customer Information
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER INFO', 5, yPos);
    yPos += lineHeight + 1;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${booking.customerName}`, 5, yPos);
    yPos += lineHeight;
    
    if (booking.customerPhone) {
      doc.text(`Phone: ${booking.customerPhone}`, 5, yPos);
      yPos += lineHeight;
    }
    
    if (booking.customerEmail) {
      doc.text(`Email: ${booking.customerEmail}`, 5, yPos);
      yPos += lineHeight;
    }
    yPos += 2;

    // Court & Time Details
    doc.setFont('helvetica', 'bold');
    doc.text('COURT & TIME', 5, yPos);
    yPos += lineHeight + 1;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Court: ${booking.courtName}`, 5, yPos);
    yPos += lineHeight;
    
    doc.text(`Date: ${booking.bookingDate}`, 5, yPos);
    yPos += lineHeight;
    
    doc.text(`Time: ${formatTimeSlots(booking.timeSlots)}`, 5, yPos);
    yPos += lineHeight + 2;

    // Equipment (if any)
    if (booking.equipment && booking.equipment.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('EQUIPMENT', 5, yPos);
      yPos += lineHeight + 1;
      
      doc.setFont('helvetica', 'normal');
      booking.equipment.forEach((item) => {
        doc.text(`${item.name} x${item.quantity}`, 5, yPos);
        doc.text(`${formatMWK(item.totalPrice)}`, 65, yPos, { align: 'right' });
        yPos += lineHeight;
      });
      yPos += 2;
    }

    // Payment Details
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', 5, yPos);
    yPos += lineHeight + 1;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Method: ${booking.paymentMethod.replace('_', ' ').toUpperCase()}`, 5, yPos);
    yPos += lineHeight;
    
    doc.text(`Total: ${formatMWK(booking.total)}`, 5, yPos);
    doc.text(`${formatMWK(booking.total)}`, 65, yPos, { align: 'right' });
    yPos += lineHeight;
    
    doc.text(`Paid: ${formatMWK(booking.amountPaid)}`, 5, yPos);
    doc.text(`${formatMWK(booking.amountPaid)}`, 65, yPos, { align: 'right' });
    yPos += lineHeight;
    
    if (booking.amountPaid < booking.total) {
      const balance = booking.total - booking.amountPaid;
      doc.text(`Balance: ${formatMWK(balance)}`, 5, yPos);
      doc.text(`${formatMWK(balance)}`, 65, yPos, { align: 'right' });
      yPos += lineHeight;
    }
    
    if (booking.paymentId) {
      doc.text(`Payment ID: ${booking.paymentId}`, 5, yPos);
      yPos += lineHeight;
    }
    yPos += 2;

    // Status
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${booking.status.toUpperCase()}`, 5, yPos);
    yPos += lineHeight + 3;

    // Separator line
    doc.text('================================', centerX, yPos, { align: 'center' });
    yPos += lineHeight + 2;

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for choosing Padle!', centerX, yPos, { align: 'center' });
    yPos += lineHeight;
    
    doc.text('Visit us again soon', centerX, yPos, { align: 'center' });
    yPos += lineHeight + 2;
    
    doc.text(`Served by: ${user?.fullName || 'Staff'}`, centerX, yPos, { align: 'center' });
    yPos += lineHeight;
    
    if (booking.notes) {
      yPos += 2;
      doc.text('Notes:', 5, yPos);
      yPos += lineHeight;
      // Split long notes into multiple lines
      const noteLines = doc.splitTextToSize(booking.notes, 70);
      noteLines.forEach((line: string) => {
        doc.text(line, 5, yPos);
        yPos += lineHeight;
      });
    }

    // Save and print
    const fileName = `receipt_${booking.bookingId}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
    
    toast.success('Receipt generated successfully!');
  };

  const handleViewBooking = (booking: EmployeeBooking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  // Filter bookings by date based on active tab
  const filterBookingsByDate = (bookings: EmployeeBooking[]) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (activeTab) {
      case 'upcoming':
        return bookings.filter(booking => {
          const bookingDate = new Date(booking.bookingDate);
          return bookingDate > today;
        });
      case 'today':
        return bookings.filter(booking => booking.bookingDate === todayStr);
      case 'past':
        return bookings.filter(booking => {
          const bookingDate = new Date(booking.bookingDate);
          return bookingDate < today && booking.bookingDate !== todayStr;
        });
      case 'all':
      default:
        return bookings;
    }
  };

  // Filter bookings based on search, filters, and date tab
  const filteredBookings = filterBookingsByDate(bookings).filter(booking => {
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
        <Button 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Booking
        </Button>
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

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <TabsList className="grid w-full lg:w-auto grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              All
              <Badge variant="secondary" className="ml-1">
                {bookings.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="today" className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              Today
              <Badge variant="secondary" className="ml-1">
                {bookings.filter(booking => booking.bookingDate === new Date().toISOString().split('T')[0]).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              Upcoming
              <Badge variant="secondary" className="ml-1">
                {bookings.filter(booking => {
                  const bookingDate = new Date(booking.bookingDate);
                  const today = new Date();
                  return bookingDate > today;
                }).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Past
              <Badge variant="secondary" className="ml-1">
                {bookings.filter(booking => {
                  const bookingDate = new Date(booking.bookingDate);
                  const today = new Date();
                  const todayStr = today.toISOString().split('T')[0];
                  return bookingDate < today && booking.bookingDate !== todayStr;
                }).length}
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
          </div>
        </div>

        <TabsContent value={activeTab} className="space-y-4">

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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewBooking(booking)}
                          title="View Booking Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printReceipt(booking)}
                          title="Print Receipt"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {/* Delete Button (Admin only) */}
                        {user?.role === "admin" && (
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
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
              <p className="text-gray-600 mb-4">
                {bookings.length === 0 
                  ? "No walk-in bookings have been created yet."
                  : "No bookings match your search criteria."
                }
              </p>
              {/* Removed duplicate Add Booking button here, use only the header button */}
            </div>
          )}
        </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Details Modal */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Booking Details
            </DialogTitle>
            <DialogDescription>
              Complete information for booking {selectedBooking?.bookingId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{selectedBooking.customerName}</span>
                    </div>
                    {selectedBooking.customerPhone && (
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-4 text-gray-500">📞</span>
                        <span>{selectedBooking.customerPhone}</span>
                      </div>
                    )}
                    {selectedBooking.customerEmail && (
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-4 text-gray-500">✉️</span>
                        <span>{selectedBooking.customerEmail}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Booking Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{selectedBooking.bookingDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{formatTimeSlots(selectedBooking.timeSlots)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 text-gray-500">🏟️</span>
                      <span>{selectedBooking.courtName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={getStatusBadge(selectedBooking.status).variant}>
                        {getStatusBadge(selectedBooking.status).label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Equipment */}
              {selectedBooking.equipment && selectedBooking.equipment.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Equipment Rental</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedBooking.equipment.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>{item.name} x{item.quantity}</span>
                          <span className="font-medium">{formatMWK(item.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Payment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="capitalize">{selectedBooking.paymentMethod.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">{formatMWK(selectedBooking.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span className="font-medium">{formatMWK(selectedBooking.amountPaid)}</span>
                    </div>
                    {selectedBooking.amountPaid < selectedBooking.total && (
                      <div className="flex justify-between text-red-600">
                        <span>Balance:</span>
                        <span className="font-medium">{formatMWK(selectedBooking.total - selectedBooking.amountPaid)}</span>
                      </div>
                    )}
                    {selectedBooking.paymentId && (
                      <div className="flex justify-between">
                        <span>Payment ID:</span>
                        <span className="font-mono text-sm">{selectedBooking.paymentId}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Booking Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Booking ID:</span>
                      <span className="font-mono text-sm">{selectedBooking.bookingId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created By:</span>
                      <span>{selectedBooking.createdBy || 'System'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created At:</span>
                      <span className="text-sm">{new Date(selectedBooking.createdAt).toLocaleString()}</span>
                    </div>
                    {selectedBooking.discount && selectedBooking.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span className="font-medium">{formatMWK(selectedBooking.discount)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Notes */}
              {selectedBooking.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{selectedBooking.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <StepBookingModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleBookingSubmit}
        courts={courts}
        equipment={equipment}
        title="Create Employee Booking"
        description="Create a new booking with step-by-step process"
        bookingType="employee"
      />
    </div>
  );
};
