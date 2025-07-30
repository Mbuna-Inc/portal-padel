import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  Search, 
  Filter, 
  Edit, 
  Trash2,
  Plus,
  CheckCircle,
  AlertTriangle,
  DollarSign
} from "lucide-react";
import { Equipment, getEquipment, createEquipment, updateEquipment, deleteEquipment } from "@/api/equipmentApi";
import { formatMWK, isValidMWKAmount } from "@/utils/currency";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

export const EquipmentManagement = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "rackets",
    price: "",
    stock: "",
    description: "",
    isActive: true,
  });
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    // Status logic: available, low_stock, out_of_stock
    let status = "available";
    if ((item.stock || 0) === 0) status = "out_of_stock";
    else if ((item.stock || 0) < 10) status = "low_stock";
    if (statusFilter === "all" || status === statusFilter) {
      return matchesSearch && matchesCategory;
    }
    return false;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredEquipment.length / pageSize);
  const paginatedEquipment = filteredEquipment.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const openEditDialog = (item: any) => {
    setEditForm({ ...item, price: item.price?.toString() || "", stock: item.stock?.toString() || "" });
    setEditDialogOpen(true);
  };
  const handleEditEquipment = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let imageUrl = editForm.imageUrl;
      if (imageFile) {
        imageUrl = imagePreview;
      }
      const payload = {
        name: editForm.name,
        category: editForm.category,
        price: Number(editForm.price),
        stock: Number(editForm.stock),
        description: editForm.description,
        imageUrl,
        isActive: editForm.isActive,
      };
      await apiRequest(`/equipment/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEquipment(prev => prev.map(e => e.id === editForm.id ? { ...e, ...payload } : e));
      setEditDialogOpen(false);
      setEditForm(null);
      setImageFile(null);
      setImagePreview("");
    } catch (err: any) {
      setError(err.message || "Failed to update equipment");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiRequest("/equipment")
      .then((data) => {
        setEquipment(data.payload || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load equipment");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters/search change
  }, [searchTerm, categoryFilter, statusFilter, equipment]);

  const confirmDeleteEquipment = (item: any) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteEquipment = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`/equipment/${itemToDelete.id}`, { method: "DELETE" });
      setEquipment(prev => prev.filter(e => e.id !== itemToDelete.id));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete equipment");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddEquipment = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        imageUrl = imagePreview;
      }
      const payload = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        description: form.description,
        imageUrl,
        isActive: form.isActive,
      };
      const res = await apiRequest("/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEquipment((prev) => [...prev, ...(res.payload || [])]);
      setIsDialogOpen(false);
      setForm({ name: "", category: "rackets", price: "", stock: "", description: "", imageUrl: "", isActive: true });
      setImageFile(null);
      setImagePreview("");
    } catch (err: any) {
      setError(err.message || "Failed to add equipment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (item: any, newStatus: boolean) => {
    setSubmitting(true);
    setError(null);
    try {
      // If toggled off, set stock to 0 (out_of_stock); if on, set to 10 (available)
      const newStock = newStatus ? 10 : 0;
      await apiRequest(`/equipment/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      setEquipment(prev => prev.map(e => e.id === item.id ? { ...e, stock: newStock } : e));
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "low_stock":
        return "bg-orange-100 text-orange-800";
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatus = (item: any) => {
    if ((item.stock || 0) === 0) return "out_of_stock";
    if ((item.stock || 0) < 10) return "low_stock";
    return "available";
  };

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

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
              <DialogTitle className="text-2xl font-bold text-blue-700 mb-2">Add New Equipment</DialogTitle>
              <p className="text-gray-500 mb-4">Fill in the details below to add new equipment to the system.</p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-gray-400 text-xs">No Image</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imageFile ? "Change Image" : "Upload Image"}
                </Button>
              </div>
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rackets">Rackets</SelectItem>
                    <SelectItem value="balls">Balls</SelectItem>
                    <SelectItem value="shoes">Shoes</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.isActive ? "available" : "out_of_stock"} onValueChange={v => setForm(f => ({ ...f, isActive: v === "available" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddEquipment} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-2 rounded">
                {submitting ? "Adding..." : "Add Equipment"}
              </Button>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
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
                <p className="text-sm text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-green-600">
                  {equipment.filter(e => getStatus(e) === "available").length}
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
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">
                  {equipment.filter(e => getStatus(e) === "low_stock").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  MK {equipment.reduce((sum, item) => sum + ((item.price || 0) * (item.stock || 0)), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="rackets">Rackets</SelectItem>
                <SelectItem value="balls">Balls</SelectItem>
                <SelectItem value="shoes">Shoes</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEquipment.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <img
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>MK {(item.price || 0).toLocaleString()}</TableCell>
                  <TableCell>{item.stock || 0}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(getStatus(item))}>{getStatus(item).replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEditDialog(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => confirmDeleteEquipment(item)} disabled={loading}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                      <Switch
                        checked={getStatus(item) === "available"}
                        onCheckedChange={v => handleStatusChange(item, v)}
                        disabled={submitting}
                        aria-label="Toggle equipment status"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEquipment.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No equipment found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <Button onClick={handlePrevPage} disabled={currentPage === 1} variant="outline" size="sm">
          Previous
        </Button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages || 1}
        </span>
        <Button onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0} variant="outline" size="sm">
          Next
        </Button>
      </div>
      {/* Delete Equipment Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this equipment?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteEquipment}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Edit Equipment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={editForm.category} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rackets">Rackets</SelectItem>
                    <SelectItem value="balls">Balls</SelectItem>
                    <SelectItem value="shoes">Shoes</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price</Label>
                <Input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={editForm.stock} onChange={e => setEditForm(f => ({ ...f, stock: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <Button onClick={handleEditEquipment} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-2 rounded">
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
