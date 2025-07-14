
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";

export const EquipmentManagement = () => {
  const [equipment, setEquipment] = useState([
    {
      id: "1",
      name: "Tennis Racket - Pro",
      price_per_unit: 15.00,
      image_url: "/placeholder.svg",
      description: "Professional tennis racket suitable for all skill levels",
      category: "Tennis",
      available_quantity: 12,
      total_quantity: 15
    },
    {
      id: "2",
      name: "Basketball",
      price_per_unit: 8.00,
      image_url: "/placeholder.svg",
      description: "Official size basketball for indoor and outdoor play",
      category: "Basketball",
      available_quantity: 20,
      total_quantity: 25
    },
    {
      id: "3",
      name: "Tennis Balls (Set of 3)",
      price_per_unit: 5.00,
      image_url: "/placeholder.svg",
      description: "Professional tennis balls, set of 3",
      category: "Tennis",
      available_quantity: 8,
      total_quantity: 10
    },
    {
      id: "4",
      name: "Badminton Racket",
      price_per_unit: 12.00,
      image_url: "/placeholder.svg",
      description: "Lightweight badminton racket for recreational play",
      category: "Badminton",
      available_quantity: 6,
      total_quantity: 8
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price_per_unit: "",
    description: "",
    category: "",
    total_quantity: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const equipmentData = {
      ...formData,
      price_per_unit: parseFloat(formData.price_per_unit),
      total_quantity: parseInt(formData.total_quantity),
      available_quantity: parseInt(formData.total_quantity), // New equipment is fully available
      image_url: "/placeholder.svg",
    };

    if (editingEquipment) {
      setEquipment(equipment.map(item => 
        item.id === editingEquipment.id 
          ? { ...item, ...equipmentData, available_quantity: item.available_quantity }
          : item
      ));
      toast.success("Equipment updated successfully!");
    } else {
      setEquipment([...equipment, { 
        ...equipmentData, 
        id: Date.now().toString() 
      }]);
      toast.success("Equipment added successfully!");
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price_per_unit: "",
      description: "",
      category: "",
      total_quantity: "",
    });
    setEditingEquipment(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item) => {
    setEditingEquipment(item);
    setFormData({
      name: item.name,
      price_per_unit: item.price_per_unit.toString(),
      description: item.description,
      category: item.category,
      total_quantity: item.total_quantity.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (equipmentId: string) => {
    setEquipment(equipment.filter(item => item.id !== equipmentId));
    toast.success("Equipment deleted successfully!");
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.7) return "text-green-600";
    if (ratio > 0.3) return "text-yellow-600";
    return "text-red-600";
  };

  const getAvailabilityBadge = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.7) return "bg-green-100 text-green-800";
    if (ratio > 0.3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600 mt-1">Manage rental equipment and inventory</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? "Edit Equipment" : "Add New Equipment"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Equipment Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Tennis Racket - Pro"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="e.g., Tennis"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price per Unit</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price_per_unit}
                    onChange={(e) => setFormData({...formData, price_per_unit: e.target.value})}
                    placeholder="15.00"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Total Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.total_quantity}
                    onChange={(e) => setFormData({...formData, total_quantity: e.target.value})}
                    placeholder="15"
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
                  placeholder="Brief description of the equipment"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingEquipment ? "Update Equipment" : "Add Equipment"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{equipment.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inventory</p>
                <p className="text-2xl font-bold">
                  {equipment.reduce((sum, item) => sum + item.total_quantity, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {equipment.reduce((sum, item) => sum + item.available_quantity, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Use</p>
                <p className="text-2xl font-bold text-orange-600">
                  {equipment.reduce((sum, item) => sum + (item.total_quantity - item.available_quantity), 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map((item) => (
          <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {item.category}
                  </Badge>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4">{item.description}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Price per Unit
                  </span>
                  <span className="font-semibold text-green-600">
                    ${item.price_per_unit.toFixed(2)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Availability</span>
                    <span className={`font-medium ${getAvailabilityColor(item.available_quantity, item.total_quantity)}`}>
                      {item.available_quantity} / {item.total_quantity}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(item.available_quantity / item.total_quantity) * 100}%` }}
                    />
                  </div>
                  
                  <Badge className={`${getAvailabilityBadge(item.available_quantity, item.total_quantity)} w-full justify-center`}>
                    {item.available_quantity === 0 ? "Out of Stock" : 
                     item.available_quantity === item.total_quantity ? "Fully Available" : 
                     "Partially Available"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
