import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  CheckCircle,
  AlertCircle,
  Calendar,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/api/apiRequest";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const CourtManagement = () => {
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    pricePerHour: "",
    imageUrl: "",
    isActive: true,
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courtToDelete, setCourtToDelete] = useState<any>(null);
  const filteredCourts = courts.filter(court => {
    const matchesSearch = court.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      court.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || (court.isActive ? "available" : "maintenance") === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredCourts.length / pageSize);
  const paginatedCourts = filteredCourts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiRequest("/courts")
      .then((data) => {
        console.log("Fetched courts:", data.payload);
        setCourts(data.payload || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load courts");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters/search change
  }, [searchTerm, statusFilter, courts]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddCourt = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let imageUrl = form.imageUrl;
      // If an image file is selected, you would upload it here and get the URL
      // For now, just use the preview URL as a placeholder
      if (imageFile) {
        imageUrl = imagePreview;
      }
      const payload = {
        name: form.name,
        location: form.location,
        pricePerHour: Number(form.pricePerHour),
        imageUrl,
        isActive: form.isActive,
        description: form.description,
      };
      const res = await apiRequest("/courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setCourts((prev) => [...prev, ...(res.payload || [])]);
      setIsDialogOpen(false);
      setForm({ name: "", location: "", pricePerHour: "", imageUrl: "", isActive: true, description: "" });
      setImageFile(null);
      setImagePreview("");
    } catch (err: any) {
      setError(err.message || "Failed to add court");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteCourt = (court: any) => {
    setCourtToDelete(court);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCourt = async () => {
    if (!courtToDelete) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/courts/${courtToDelete.id}`, { method: "DELETE" });
      setCourts(prev => prev.filter(c => c.id !== courtToDelete.id));
      setDeleteDialogOpen(false);
      setCourtToDelete(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete court");
    } finally {
      setSubmitting(false);
    }
  };

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const openEditDialog = (court: any) => {
    setEditForm({ ...court, pricePerHour: court.pricePerHour?.toString() || "" });
    setEditDialogOpen(true);
  };
  const handleEditCourt = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: editForm.name,
        location: editForm.location,
        pricePerHour: Number(editForm.pricePerHour),
        imageUrl: editForm.imageUrl,
        isActive: editForm.isActive,
        description: editForm.description,
      };
      await apiRequest(`/courts/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setCourts(prev => prev.map(c => c.id === editForm.id ? { ...c, ...payload } : c));
      setEditDialogOpen(false);
      setEditForm(null);
    } catch (err: any) {
      setError(err.message || "Failed to update court");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (court: any, newStatus: boolean) => {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/courts/${court.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      setCourts(prev => prev.map(c => c.id === court.id ? { ...c, isActive: newStatus } : c));
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
      case "maintenance":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Court Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all courts</p>
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
              <DialogTitle className="text-2xl font-bold text-blue-700 mb-2">Add New Court</DialogTitle>
              <p className="text-gray-500 mb-4">Fill in the details below to add a new court to the system.</p>
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
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <Label>Price Per Hour</Label>
                <Input type="number" value={form.pricePerHour} onChange={e => setForm(f => ({ ...f, pricePerHour: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.isActive ? "available" : "maintenance"} onValueChange={v => setForm(f => ({ ...f, isActive: v === "available" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddCourt} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-2 rounded">
                {submitting ? "Adding..." : "Add Court"}
              </Button>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 font-medium mb-1">Total Courts</div>
            <div className="text-2xl font-bold text-gray-900">{courts.length}</div>
          </div>
          <MapPin className="h-8 w-8 text-blue-600" />
        </div>
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 font-medium mb-1">Available</div>
            <div className="text-2xl font-bold text-green-600">{courts.filter(c => c.isActive).length}</div>
          </div>
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 font-medium mb-1">Under Maintenance</div>
            <div className="text-2xl font-bold text-orange-600">{courts.filter(c => !c.isActive).length}</div>
          </div>
          <AlertCircle className="h-8 w-8 text-orange-600" />
        </div>
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 font-medium mb-1">Today's Bookings</div>
            <div className="text-2xl font-bold text-purple-600">0</div>
          </div>
          <Calendar className="h-8 w-8 text-purple-600" />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price/Hour</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCourts.map((court) => (
                <TableRow key={court.id}>
                  <TableCell>
                    <img
                      src={court.imageUrl || "/placeholder.svg"}
                      alt={court.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{court.name}</TableCell>
                  <TableCell>{court.location}</TableCell>
                  <TableCell>MK {court.pricePerHour?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(court.isActive ? "available" : "maintenance")}>{court.isActive ? "available" : "maintenance"}</Badge>
                  </TableCell>
                  <TableCell>{court.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEditDialog(court)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => confirmDeleteCourt(court)} disabled={submitting}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                      <Switch
                        checked={court.isActive}
                        onCheckedChange={v => handleStatusChange(court, v)}
                        disabled={submitting}
                        aria-label="Toggle court status"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCourts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No courts found.
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

      {/* Edit Court Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Court</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <Label>Price Per Hour</Label>
                <Input type="number" value={editForm.pricePerHour} onChange={e => setEditForm(f => ({ ...f, pricePerHour: e.target.value }))} />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={editForm.imageUrl} onChange={e => setEditForm(f => ({ ...f, imageUrl: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.isActive ? "available" : "maintenance"} onValueChange={v => setEditForm(f => ({ ...f, isActive: v === "available" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEditCourt} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700">
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Court Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this court?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteCourt}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
