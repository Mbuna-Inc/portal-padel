import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, MapPin, Clock, Package, ArrowLeft, ArrowRight, CheckCircle, User } from "lucide-react";
import { toast } from "sonner";
import { BookingEquipment, getOccupiedSlots } from "../../api/bookingsApi";
import { getTimeslots, Timeslot } from "../../api/timeslotsApi";
import { Court } from "../../api/courtsApi";
import { Equipment } from "../../api/equipmentApi";
import { formatMWK } from "../../utils/currency";

interface StepBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: any) => Promise<void>;
  courts: Court[];
  equipment: Equipment[];
  title: string;
  description: string;
  bookingType: 'employee' | 'customer';
  initialData?: any;
}

export const StepBookingModal = ({
  isOpen,
  onClose,
  onSubmit,
  courts,
  equipment,
  title,
  description,
  bookingType,
  initialData
}: StepBookingModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCourts, setSelectedCourts] = useState<Court[]>([]);
  const [courtTimeslots, setCourtTimeslots] = useState<{[courtId: string]: Timeslot[]}>({});
  const [selectedTimeslots, setSelectedTimeslots] = useState<{[courtId: string]: string[]}>({});
  const [loadingTimeslots, setLoadingTimeslots] = useState<{[courtId: string]: boolean}>({});
  const [occupiedSlots, setOccupiedSlots] = useState<{[courtId: string]: string[]}>({});
  const [selectedEquipment, setSelectedEquipment] = useState<{[key: string]: number}>({});
  
  // Form data for step-by-step flow
  const [selectedDate, setSelectedDate] = useState("");
  
  const [formData, setFormData] = useState({
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

  // No longer needed - timeslots loaded on court selection

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      const equipmentMap: {[key: string]: number} = {};
      initialData.equipment?.forEach((eq: BookingEquipment) => {
        if (eq && eq.equipmentId && eq.quantity != null) {
          equipmentMap[eq.equipmentId] = eq.quantity;
        }
      });
      setSelectedEquipment(equipmentMap);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const loadTimeslots = async (court: Court) => {
    if (!court?.courtId || !selectedDate) return;
    setLoadingTimeslots(prev => ({...prev, [court.courtId]: true}));
    try {
      // Fetch both timeslots and occupied slots in parallel
      const [allTimeslots, occupiedSlotsForCourt] = await Promise.all([
        getTimeslots(),
        getOccupiedSlots(court.courtId, selectedDate)
      ]);
      
      let filteredTimeslots: Timeslot[] = [];
      // Defensive check: courtId must be string
      filteredTimeslots = allTimeslots.filter(slot =>
        String(slot.courtId) === String(court.courtId) && slot.isActive
      );
      if (filteredTimeslots.length === 0 && court.category) {
        filteredTimeslots = allTimeslots.filter(slot => {
          if (!slot.isActive) return false;
          const slotCourtName = (slot.courtName || '').toLowerCase();
          const courtCategory = court.category.toLowerCase();
          return slotCourtName.includes(courtCategory) ||
            slotCourtName.includes(court.name.toLowerCase());
        });
      }
      if (filteredTimeslots.length === 0) {
        filteredTimeslots = allTimeslots.filter(slot => slot.isActive);
        console.warn(`No specific timeslots found for court ${court.name}, showing all available timeslots`);
      }
      filteredTimeslots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      // Update both timeslots and occupied slots state
      setCourtTimeslots(prev => ({...prev, [court.courtId]: filteredTimeslots}));
      setOccupiedSlots(prev => ({...prev, [court.courtId]: occupiedSlotsForCourt}));
    } catch (err) {
      toast.error("Failed to load timeslots");
      setCourtTimeslots(prev => ({...prev, [court.courtId]: []}));
      setOccupiedSlots(prev => ({...prev, [court.courtId]: []}));
    } finally {
      setLoadingTimeslots(prev => ({...prev, [court.courtId]: false}));
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: return selectedDate !== "";
      case 2: {
        // Check if at least one court is selected and has timeslots selected
        const hasSelectedCourts = selectedCourts.length > 0;
        const hasSelectedTimeslots = Object.values(selectedTimeslots).some(slots => slots.length > 0);
        return hasSelectedCourts && hasSelectedTimeslots;
      }
      case 3: return true; // Equipment is optional
      case 4: return true;
      default: return false;
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedDate("");
    setSelectedCourts([]);
    setSelectedTimeslots({});
    setSelectedEquipment({});
    setCourtTimeslots({});
    setLoadingTimeslots({});
    setOccupiedSlots({});
    setFormData({
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
  };

  const handleTimeslotToggle = (courtId: string, timeslotId: string) => {
    const timeslot = (courtTimeslots[courtId] || []).find(t => t.slotId === timeslotId);
    if (!timeslot) return;
    
    // Get the status of this timeslot
    const status = getTimeslotStatus(courtId, timeslot);
    
    // Prevent selection of occupied timeslots
    if (status === "occupied") {
      toast.error("This timeslot is already booked and cannot be selected");
      return;
    }
    
    // Prevent selection of expired timeslots
    if (status === "expired") {
      toast.error("This timeslot has already passed and cannot be selected");
      return;
    }
    
    setSelectedTimeslots(prev => {
      const courtSlots = prev[courtId] || [];
      const isSelected = courtSlots.includes(timeslotId);
      return {
        ...prev,
        [courtId]: isSelected 
          ? courtSlots.filter(id => id !== timeslotId)
          : [...courtSlots, timeslotId]
      };
    });
  };

  const getTimeslotStatus = (courtId: string, timeslot: Timeslot) => {
    const courtSlots = selectedTimeslots[courtId] || [];
    const courtOccupiedSlots = occupiedSlots[courtId] || [];
    
    // Check if timeslot is in the past (only for today's date)
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    if (isToday) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      
      if (timeslot.startTime < currentTime) {
        return "expired";
      }
    }
    
    // Check if timeslot is occupied (booked)
    if (courtOccupiedSlots.includes(timeslot.startTime)) {
      return "occupied";
    }
    
    // Check if timeslot is selected by user
    if (courtSlots.includes(timeslot.slotId)) {
      return "selected";
    }
    
    return "available";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-white text-gray-800 border-gray-200 hover:border-gray-300 cursor-pointer";
      case "occupied": return "bg-red-100 text-red-800 border-red-300 cursor-not-allowed opacity-75";
      case "selected": return "bg-blue-100 text-blue-800 border-blue-500 cursor-pointer";
      case "expired": return "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed opacity-60";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleEquipmentQuantityChange = (equipmentId: string, quantity: number) => {
    const equip = equipment.find(e => e.equipmentId === equipmentId);
    const maxQuantity = Math.min(equip?.stock || 0, 10);
    
    setSelectedEquipment(prev => ({
      ...prev,
      [equipmentId]: Math.max(0, Math.min(quantity, maxQuantity))
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    let totalHours = 0;
    
    // Calculate timeslot costs from all courts
    Object.entries(selectedTimeslots).forEach(([courtId, slotIds]) => {
      const courtSlots = courtTimeslots[courtId] || [];
      slotIds.forEach(slotId => {
        const timeslot = courtSlots.find(t => t.slotId === slotId);
        if (timeslot) {
          total += timeslot.price;
          totalHours += 1; // Each timeslot is 1 hour
        }
      });
    });
    
    // Calculate equipment costs (per item, not per hour)
    Object.entries(selectedEquipment).forEach(([equipmentId, quantity]) => {
      const equip = equipment.find(e => e.equipmentId === equipmentId);
      if (equip && quantity > 0) {
        const itemPrice = equip.price || 0;
        // Equipment pricing:
        // - Balls: 5,000 per set of 3
        // - Rackets: 10,000 per racket
        // Equipment is charged per item, not per hour
        total += itemPrice * quantity;
      }
    });
    
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || selectedCourts.length === 0 || Object.keys(selectedTimeslots).length === 0) {
      toast.error("Please complete all booking steps");
      return;
    }
    
    // Check if all selected courts have timeslots
    const hasTimeslots = Object.values(selectedTimeslots).some(slots => slots.length > 0);
    if (!hasTimeslots) {
      toast.error("Please select at least one timeslot");
      return;
    }
    
    if (!formData.customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }
    
    if (bookingType === 'employee') {
      if (!formData.paymentMethod) {
        toast.error("Please select a payment method");
        return;
      }
      
      if (!formData.amountPaid || parseFloat(formData.amountPaid) <= 0) {
        toast.error("Please enter amount paid");
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      // Calculate total hours across all courts
      let totalHours = 0;
      Object.values(selectedTimeslots).forEach(slots => {
        totalHours += slots.length;
      });
      
      // Prepare equipment data
      const equipmentData: BookingEquipment[] = Object.entries(selectedEquipment)
        .filter(([_, quantity]) => quantity > 0)
        .map(([equipmentId, quantity]) => {
          const equip = equipment.find(e => e.equipmentId === equipmentId);
          const pricePerItem = equip?.price || 0;
          const totalPrice = pricePerItem * quantity; // Per item, not per hour
          return {
            equipmentId,
            name: equip?.name || '',
            quantity,
            pricePerHour: pricePerItem, // Keep field name for compatibility
            totalPrice
          };
        });

      // Create a single booking with multiple courts
      const allCourtIds = selectedCourts.map(court => court.courtId);
      const allCourtNames = selectedCourts.map(court => court.name);
      const allTimeSlots: string[] = [];
      let totalBookingCost = 0;
      
      // Collect all timeslots and calculate total cost
      selectedCourts.forEach(court => {
        const courtSlots = selectedTimeslots[court.courtId] || [];
        const courtTimeslotData = courtSlots.map(slotId => {
          const timeslot = (courtTimeslots[court.courtId] || []).find(t => t.slotId === slotId);
          return timeslot;
        }).filter(Boolean);
        
        // Add court-specific timeslots with court identifier
        courtSlots.forEach(slotId => {
          const timeslot = courtTimeslotData.find(t => t.slotId === slotId);
          if (timeslot) {
            allTimeSlots.push(`${court.name}: ${timeslot.startTime}-${timeslot.endTime}`);
            totalBookingCost += timeslot.price || 0;
          }
        });
      });
      
      // Add equipment costs
      const equipmentCost = equipmentData.reduce((sum, eq) => sum + eq.totalPrice, 0);
      totalBookingCost += equipmentCost;
      
      const bookingData = {
        courtId: allCourtIds[0], // Primary court ID
        courtIds: allCourtIds, // All selected court IDs
        courtNames: allCourtNames, // All selected court names
        bookingDate: selectedDate,
        timeSlots: allTimeSlots, // All timeslots with court identifiers
        fullDayBooking: false,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        paymentMethod: formData.paymentMethod,
        total: totalBookingCost,
        amountPaid: parseFloat(formData.amountPaid) || totalBookingCost,
        paymentId: formData.paymentId,
        notes: formData.notes,
        discount: parseFloat(formData.discount) || 0,
        equipment: equipmentData,
        multiCourt: true, // Flag to indicate this is a multi-court booking
        selectedCourts: selectedCourts.length // Number of courts selected
      };
      
      await onSubmit(bookingData);
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Step 1: Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="date">Booking Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        const handleCourtToggle = async (court: Court) => {
          const isSelected = selectedCourts.some(c => c.courtId === court.courtId);
          if (isSelected) {
            // Remove court and its timeslots
            setSelectedCourts(prev => prev.filter(c => c.courtId !== court.courtId));
            setSelectedTimeslots(prev => {
              const newSlots = {...prev};
              delete newSlots[court.courtId];
              return newSlots;
            });
            setCourtTimeslots(prev => {
              const newTimeslots = {...prev};
              delete newTimeslots[court.courtId];
              return newTimeslots;
            });
          } else {
            // Add court and load its timeslots
            setSelectedCourts(prev => [...prev, court]);
            await loadTimeslots(court);
          }
        };

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Step 2: Select Courts & Time Slots
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {courts.map(court => {
                const isSelected = selectedCourts.some(c => c.courtId === court.courtId);
                const isLoading = loadingTimeslots[court.courtId];
                const courtSlots = courtTimeslots[court.courtId] || [];
                const selectedSlots = selectedTimeslots[court.courtId] || [];

                return (
                  <div key={court.courtId} className="border rounded-lg overflow-hidden">
                    {/* Court Selection */}
                    <div
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCourtToggle(court)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCourtToggle(court)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <h3 className="font-medium text-lg">{court.name}</h3>
                            {court.category && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {court.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isLoading && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          )}
                          {isSelected && !isLoading && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timeslots Display */}
                    {isSelected && (
                      <div className="border-t bg-gray-50 p-4">
                        {isLoading ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading timeslots for {court.name}...
                          </div>
                        ) : courtSlots.length > 0 ? (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-700">
                                {courtSlots.length} available timeslots - Select your preferred times:
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {courtSlots.map(timeslot => {
                                const status = getTimeslotStatus(court.courtId, timeslot);
                                const isOccupied = status === "occupied";
                                const isExpired = status === "expired";
                                const isClickable = status === "available" || status === "selected";
                                
                                return (
                                  <div
                                    key={timeslot.slotId}
                                    className={`border rounded-lg p-3 transition-all ${
                                      getStatusColor(status)
                                    }`}
                                    onClick={() => isClickable && handleTimeslotToggle(court.courtId, timeslot.slotId)}
                                  >
                                    <div className="text-center">
                                      <div className="font-medium text-sm">
                                        {timeslot.startTime} - {timeslot.endTime}
                                      </div>
                                      <div className="text-xs mt-1">
                                        {formatMWK(timeslot.price)}
                                      </div>
                                      <div className="flex items-center justify-center gap-1 mt-1">
                                        {timeslot.isPeak && (
                                          <Badge variant="secondary" className="text-xs">
                                            Peak
                                          </Badge>
                                        )}
                                        {isOccupied && (
                                          <Badge variant="destructive" className="text-xs">
                                            Booked
                                          </Badge>
                                        )}
                                        {isExpired && (
                                          <Badge variant="outline" className="text-xs text-gray-500">
                                            Expired
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {selectedSlots.length > 0 && (
                              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                <span className="text-sm text-blue-700">
                                  Selected {selectedSlots.length} timeslot(s) for {court.name}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">
                            No timeslots available for {court.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {selectedCourts.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-700">
                    <strong>Selected:</strong> {selectedCourts.length} court(s) with {' '}
                    {Object.values(selectedTimeslots).reduce((total, slots) => total + slots.length, 0)} timeslot(s)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Step 3: Equipment (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipment.map(equip => {
                  const currentQuantity = selectedEquipment[equip.equipmentId] || 0;
                  const maxQuantity = Math.min(equip.stock, 10);
                  
                  return (
                    <div key={equip.equipmentId} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{equip.name}</div>
                          <div className="text-sm text-gray-600">
                            {formatMWK(equip.price)}/hour
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
                            value={currentQuantity}
                            onChange={(e) => handleEquipmentQuantityChange(equip.equipmentId, parseInt(e.target.value) || 0)}
                            min="0"
                            max={maxQuantity}
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
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Step 4: Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  />
                </div>
                {bookingType === 'employee' && (
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(value: any) => setFormData({...formData, paymentMethod: value})}
                    >
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
                )}
              </div>

              {bookingType === 'employee' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="total">Total Amount</Label>
                    <Input
                      id="total"
                      value={formatMWK(calculateTotal())}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amountPaid">Amount Paid *</Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      value={formData.amountPaid}
                      onChange={(e) => setFormData({...formData, amountPaid: e.target.value})}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        {/* Step Progress */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`w-16 h-1 mx-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderStepContent()}

          {/* Customer information is now in Step 4 */}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToNextStep()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || !canProceedToNextStep()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    'Create Booking'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
