import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Edit, Trash2, Search, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Equipment, getEquipment, createEquipment, updateEquipment, deleteEquipment } from "../../api/equipmentApi";
import { useAuth } from "../../contexts/AuthContext";
import { formatMWK, isValidMWKAmount } from "../../utils/currency";

interface EquipmentManagementProps {
  onDataChange?: () => void;
}

export const EquipmentManagement = ({ onDataChange }: EquipmentManagementProps = {}) => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    category: "rackets",
    price: "",
    stock: "",
    description: "",
    isActive: true
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const equipmentData = await getEquipment();
      setEquipment(equipmentData);
    } catch (error) {
      toast.error("Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price || !formData.stock) {
      toast.error("Please fill in all required fields");
      return;
    }

    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);
    
    if (!isValidMWKAmount(price)) {
      toast.error("Please enter a valid price in MWK");
      return;
    }

    if (stock < 0) {
      toast.error("Stock cannot be negative");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEquipment) {
        await updateEquipment(editingEquipment.equipmentId, {
          name: formData.name.trim(),
          category: formData.category,
          price,
          stock,
          description: formData.description.trim(),
          isActive: formData.isActive
        });
        toast.success(`Equipment "${formData.name}" updated successfully!`);
      } else {
        await createEquipment({
          name: formData.name.trim(),
          category: formData.category,
          price,
          stock,
          description: formData.description.trim(),
          isActive: formData.isActive
        });
        toast.success(`Equipment "${formData.name}" created successfully!`);
      }
      
      setIsDialogOpen(false);
      setEditingEquipment(null);
      resetForm();
      await loadEquipment();
      onDataChange?.(); // Update sidebar badges
    } catch (error: any) {
      console.error('Error saving equipment:', error);
      toast.error(error.message || "Failed to save equipment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setFormData({
      name: equipment.name,
      category: equipment.category,
      price: equipment.price.toString(),
      stock: equipment.stock.toString(),
      description: equipment.description,
      isActive: equipment.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async (equipment: Equipment) => {
    try {
      await deleteEquipment(equipment.equipmentId);
      toast.success(`Equipment "${equipment.name}" deleted successfully!`);
      await loadEquipment();
      onDataChange?.(); // Update sidebar badges
    } catch (error: any) {
      console.error('Error deleting equipment:', error);
      toast.error(error.message || "Failed to delete equipment");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "rackets",
      price: "",
      stock: "",
      description: "",
      isActive: true
    });
    setEditingEquipment(null);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'out_of_stock', label: 'Out of Stock', variant: 'destructive' as const };
    if (stock < 10) return { status: 'low_stock', label: 'Low Stock', variant: 'secondary' as const };
    return { status: 'in_stock', label: 'In Stock', variant: 'default' as const };
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const stockStatus = getStockStatus(item.stock);
    const matchesStatus = statusFilter === "all" || stockStatus.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValue = equipment.reduce((sum, item) => sum + (item.price * item.stock), 0);
  const inStockCount = equipment.filter(item => item.stock > 0).length;
  const lowStockCount = equipment.filter(item => item.stock > 0 && item.stock < 10).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <div className="text-lg">Loading equipment...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Equipment Management</h2>
          <p className="text-gray-600">Manage rental equipment and inventory</p>
        </div>
        
        {user?.role === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}</DialogTitle>
                <DialogDescription>
                  {editingEquipment ? 'Update equipment information' : 'Add new equipment to the inventory'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Equipment Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Tennis Racket, Paddle"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rackets">Rackets</SelectItem>
                      <SelectItem value="balls">Balls</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="protective">Protective Gear</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per Hour (MWK)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="1"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="1000"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      placeholder="10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Equipment description..."
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      editingEquipment ? 'Updating...' : 'Creating...'
                    ) : (
                      editingEquipment ? 'Update Equipment' : 'Create Equipment'
                    )}
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
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{equipment.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{inStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">MK</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">{formatMWK(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="rackets">Rackets</SelectItem>
            <SelectItem value="balls">Balls</SelectItem>
            <SelectItem value="accessories">Accessories</SelectItem>
            <SelectItem value="protective">Protective Gear</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Equipment Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price/Hour</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                {user?.role === 'admin' && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.map((item) => {
                const stockStatus = getStockStatus(item.stock);
                return (
                  <TableRow key={item.equipmentId}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="capitalize">{item.category}</TableCell>
                    <TableCell>{formatMWK(item.price)}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.variant}>
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteConfirm(item)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredEquipment.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Equipment Found</h3>
              <p className="text-gray-600 mb-4">
                {equipment.length === 0 
                  ? "Get started by adding your first equipment item."
                  : "No equipment matches your current filters."
                }
              </p>
              {user?.role === 'admin' && equipment.length === 0 && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Equipment
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
