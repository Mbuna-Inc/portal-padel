
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, Edit, Trash2, DollarSign, Clock, Users } from "lucide-react";
import { toast } from "sonner";

export const CourtManagement = () => {
  const [courts, setCourts] = useState([
    {
      id: "1",
      name: "Tennis Court A",
      location: "North Wing",
      price_per_hour: 25.00,
      image_url: "/placeholder.svg",
      description: "Professional tennis court with premium surface",
      capacity: 4,
      amenities: ["Lighting", "Scoreboard", "Seating"]
    },
    {
      id: "2",
      name: "Basketball Court",
      location: "Main Building",
      price_per_hour: 30.00,
      image_url: "/placeholder.svg",
      description: "Full-size basketball court with wooden flooring",
      capacity: 10,
      amenities: ["Sound System", "Scoreboard", "Air Conditioning"]
    },
    {
      id: "3",
      name: "Tennis Court B",
      location: "South Wing",
      price_per_hour: 25.00,
      image_url: "/placeholder.svg",
      description: "Standard tennis court for recreational play",
      capacity: 4,
      amenities: ["Lighting", "Seating"]
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    price_per_hour: "",
    description: "",
    capacity: "",
    amenities: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const courtData = {
      ...formData,
      price_per_hour: parseFloat(formData.price_per_hour),
      capacity: parseInt(formData.capacity),
      amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a),
      image_url: "/placeholder.svg",
    };

    if (editingCourt) {
      setCourts(courts.map(court => 
        court.id === editingCourt.id 
          ? { ...court, ...courtData }
          : court
      ));
      toast.success("Court updated successfully!");
    } else {
      setCourts([...courts, { 
        ...courtData, 
        id: Date.now().toString() 
      }]);
      toast.success("Court added successfully!");
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      price_per_hour: "",
      description: "",
      capacity: "",
      amenities: "",
    });
    setEditingCourt(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (court) => {
    setEditingCourt(court);
    setFormData({
      name: court.name,
      location: court.location,
      price_per_hour: court.price_per_hour.toString(),
      description: court.description,
      capacity: court.capacity.toString(),
      amenities: court.amenities.join(', '),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (courtId: string) => {
    setCourts(courts.filter(court => court.id !== courtId));
    toast.success("Court deleted successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Court Management</h1>
          <p className="text-gray-600 mt-1">Manage your courts and facilities</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add New Court
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCourt ? "Edit Court" : "Add New Court"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Court Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Tennis Court A"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., North Wing"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price per Hour</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price_per_hour}
                    onChange={(e) => setFormData({...formData, price_per_hour: e.target.value})}
                    placeholder="25.00"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    placeholder="4"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the court"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  value={formData.amenities}
                  onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                  placeholder="Lighting, Scoreboard, Seating"
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCourt ? "Update Court" : "Add Court"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Courts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courts.map((court) => (
          <Card key={court.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{court.name}</CardTitle>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {court.location}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(court)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(court.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4">{court.description}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Per Hour
                  </span>
                  <span className="font-semibold text-green-600">
                    ${court.price_per_hour.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    Capacity
                  </span>
                  <span className="font-medium">{court.capacity} people</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {court.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                View Bookings
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
