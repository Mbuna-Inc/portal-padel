
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Plus, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface MyBookingsProps {
  user: any;
}

export const MyBookings = ({ user }: MyBookingsProps) => {
  const [bookings, setBookings] = useState([
    {
      id: "1",
      court_name: "Tennis Court A",
      booking_date: "2024-07-15",
      start_time: "10:00",
      duration_minutes: 60,
      status: "confirmed",
      equipment: ["Tennis Racket", "Balls"],
      price: 25.00
    },
    {
      id: "2",
      court_name: "Tennis Court B",
      booking_date: "2024-07-18",
      start_time: "14:00",
      duration_minutes: 90,
      status: "pending",
      equipment: ["Tennis Racket"],
      price: 37.50
    },
    {
      id: "3",
      court_name: "Basketball Court",
      booking_date: "2024-07-20",
      start_time: "16:00",
      duration_minutes: 60,
      status: "confirmed",
      equipment: [],
      price: 30.00
    },
  ]);

  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    court_id: "",
    booking_date: "",
    start_time: "",
    duration_minutes: "60",
    equipment: [] as string[],
  });

  const courts = [
    { id: "1", name: "Tennis Court A", price_per_hour: 25.00 },
    { id: "2", name: "Tennis Court B", price_per_hour: 25.00 },
    { id: "3", name: "Basketball Court", price_per_hour: 30.00 },
  ];

  const equipmentOptions = [
    { id: "1", name: "Tennis Racket", price: 15.00 },
    { id: "2", name: "Tennis Balls", price: 5.00 },
    { id: "3", name: "Basketball", price: 8.00 },
  ];

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCourt = courts.find(c => c.id === bookingForm.court_id);
    const duration = parseInt(bookingForm.duration_minutes);
    const courtPrice = (selectedCourt?.price_per_hour || 0) * (duration / 60);
    const equipmentPrice = bookingForm.equipment.reduce((sum, equipId) => {
      const equipment = equipmentOptions.find(e => e.id === equipId);
      return sum + (equipment?.price || 0);
    }, 0);

    const newBooking = {
      id: Date.now().toString(),
      court_name: selectedCourt?.name || "",
      booking_date: bookingForm.booking_date,
      start_time: bookingForm.start_time,
      duration_minutes: duration,
      status: "pending" as const,
      equipment: bookingForm.equipment.map(id => 
        equipmentOptions.find(e => e.id === id)?.name || ""
      ).filter(name => name),
      price: courtPrice + equipmentPrice,
    };

    setBookings([newBooking, ...bookings]);
    setIsBookingDialogOpen(false);
    setBookingForm({
      court_id: "",
      booking_date: "",
      start_time: "",
      duration_minutes: "60",
      equipment: [],
    });
    
    toast.success("Booking request submitted successfully!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">Manage your court reservations</p>
        </div>
        
        <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Book a Court
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Book a Court</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="court">Select Court</Label>
                <Select 
                  value={bookingForm.court_id} 
                  onValueChange={(value) => setBookingForm({...bookingForm, court_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a court" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.name} - ${court.price_per_hour}/hr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={bookingForm.booking_date}
                    onChange={(e) => setBookingForm({...bookingForm, booking_date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({...bookingForm, start_time: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select 
                  value={bookingForm.duration_minutes} 
                  onValueChange={(value) => setBookingForm({...bookingForm, duration_minutes: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Optional Equipment</Label>
                <div className="space-y-2">
                  {equipmentOptions.map((equipment) => (
                    <div key={equipment.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={equipment.id}
                        checked={bookingForm.equipment.includes(equipment.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBookingForm({
                              ...bookingForm, 
                              equipment: [...bookingForm.equipment, equipment.id]
                            });
                          } else {
                            setBookingForm({
                              ...bookingForm, 
                              equipment: bookingForm.equipment.filter(id => id !== equipment.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={equipment.id} className="text-sm">
                        {equipment.name} - ${equipment.price}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  Book Court
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsBookingDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">
                  {bookings.filter(b => b.status === "confirmed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {bookings.filter(b => b.status === "pending").length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-gray-900">{booking.court_name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(booking.booking_date), 'MMM dd, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {booking.start_time} - {calculateEndTime(booking.start_time, booking.duration_minutes)}
                      </span>
                    </div>
                    
                    <span>Duration: {booking.duration_minutes} min</span>
                  </div>
                  
                  {booking.equipment.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Equipment:</span>
                      <div className="flex flex-wrap gap-1">
                        {booking.equipment.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end space-y-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(booking.status)}
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${booking.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Total Cost</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    {booking.status === "pending" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setBookings(bookings.map(b => 
                            b.id === booking.id 
                              ? {...b, status: "cancelled" as const}
                              : b
                          ));
                          toast.success("Booking cancelled successfully!");
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    
                    <Button size="sm" variant="outline">
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {bookings.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-500 mb-4">
                Start by booking your first court session.
              </p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsBookingDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Book a Court
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
