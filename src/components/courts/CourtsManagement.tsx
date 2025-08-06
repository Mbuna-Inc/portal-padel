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
import { MapPin, DollarSign, Plus, Edit, Trash2, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Court, getCourts, createCourt, updateCourt, deleteCourt, toggleCourtStatus } from "../../api/courtsApi";
import { useAuth } from "../../contexts/AuthContext";
import { formatMWK, isValidMWKAmount } from "../../utils/currency";

interface CourtsManagementProps {
  onDataChange?: () => void;
}

export const CourtsManagement = ({ onDataChange }: CourtsManagementProps = {}) => {
  const { user } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [deletingCourt, setDeletingCourt] = useState<Court | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    pricePerHour: "",
    status: "available" as "available" | "closed"
  });

  useEffect(() => {
    loadCourts();
  }, []);

  const loadCourts = async () => {
    try {
      setLoading(true);
      const courtsData = await getCourts();
      setCourts(courtsData);
    } catch (error) {
      toast.error("Failed to load courts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.location.trim() || !formData.pricePerHour) {
      toast.error("Please fill in all fields");
      return;
    }

    const pricePerHour = parseFloat(formData.pricePerHour);
    if (!isValidMWKAmount(pricePerHour)) {
      toast.error("Please enter a valid price in MWK");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCourt) {
        await updateCourt(editingCourt.courtId, {
          name: formData.name.trim(),
          location: formData.location.trim(),
          pricePerHour,
          status: formData.status
        });
        toast.success(`Court "${formData.name}" updated successfully!`);
      } else {
        await createCourt({
          name: formData.name.trim(),
          location: formData.location.trim(),
          pricePerHour,
          status: formData.status
        });
        toast.success(`Court "${formData.name}" created successfully!`);
      }
      
      setIsDialogOpen(false);
      setEditingCourt(null);
      setFormData({ name: "", location: "", pricePerHour: "", status: "available" });
      await loadCourts();
      onDataChange?.(); // Update sidebar badges
    } catch (error: any) {
      console.error('Error saving court:', error);
      toast.error(error.message || "Failed to save court");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (court: Court) => {
    setEditingCourt(court);
    setFormData({
      name: court.name,
      location: court.location,
      pricePerHour: court.pricePerHour.toString(),
      status: court.status
    });
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCourt) return;
    
    try {
      await deleteCourt(deletingCourt.courtId);
      toast.success(`Court "${deletingCourt.name}" deleted successfully!`);
      setDeletingCourt(null);
      await loadCourts();
      onDataChange?.(); // Update sidebar badges
    } catch (error: any) {
      console.error('Error deleting court:', error);
      toast.error(error.message || "Failed to delete court");
    }
  };

  const handleToggleStatus = async (courtId: string) => {
    try {
      await toggleCourtStatus(courtId);
      toast.success("Court status updated successfully!");
      loadCourts();
      onDataChange?.(); // Update sidebar badges
    } catch (error) {
      toast.error("Failed to update court status");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", location: "", pricePerHour: "", status: "available" });
    setEditingCourt(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <div className="text-lg">Loading courts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Courts Management</h2>
          <p className="text-gray-600">Manage court information, pricing, and availability</p>
        </div>
        
        {user?.role === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Court
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCourt ? 'Edit Court' : 'Add New Court'}</DialogTitle>
                <DialogDescription>
                  {editingCourt ? 'Update court information' : 'Create a new court for the facility'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Court Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Court A, Tennis Court 1"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Building A - Ground Floor"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price per Hour (MWK)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({...formData, pricePerHour: e.target.value})}
                    placeholder="5000"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "available" | "closed") => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      editingCourt ? 'Updating...' : 'Creating...'
                    ) : (
                      editingCourt ? 'Update Court' : 'Create Court'
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

      {/* Courts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courts.map((court) => (
          <Card key={court.courtId} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{court.name}</CardTitle>
                <Badge variant={court.status === 'available' ? 'default' : 'destructive'}>
                  {court.status}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {court.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-lg">{formatMWK(court.pricePerHour)}</span>
                  <span className="text-sm text-gray-500">/hour</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                Updated: {new Date(court.updatedAt).toLocaleDateString()}
              </div>
              
              {user?.role === 'admin' && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(court)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant={court.status === 'available' ? 'secondary' : 'default'} 
                    size="sm" 
                    onClick={() => handleToggleStatus(court.courtId)}
                    className="flex-1"
                  >
                    {court.status === 'available' ? 'Close' : 'Open'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Court</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{court.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => {
                            setDeletingCourt(court);
                            handleDeleteConfirm();
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {courts.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Courts Found</h3>
            <p className="text-gray-600 mb-4">
              {user?.role === 'admin' 
                ? "Get started by adding your first court to the system."
                : "No courts are currently available in the system."
              }
            </p>
            {user?.role === 'admin' && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Court
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Courts Table View (for larger datasets) */}
      {courts.length > 6 && (
        <Card>
          <CardHeader>
            <CardTitle>All Courts</CardTitle>
            <CardDescription>Complete list of all courts in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Court Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price/Hour</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  {user?.role === 'admin' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {courts.map((court) => (
                  <TableRow key={court.courtId}>
                    <TableCell className="font-medium">{court.name}</TableCell>
                    <TableCell>{court.location}</TableCell>
                    <TableCell>{formatMWK(court.pricePerHour)}/hr</TableCell>
                    <TableCell>
                      <Badge variant={court.status === 'available' ? 'default' : 'destructive'}>
                        {court.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(court.updatedAt).toLocaleDateString()}</TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(court)}>
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
                                <AlertDialogTitle>Delete Court</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{court.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => {
                                    setDeletingCourt(court);
                                    handleDeleteConfirm();
                                  }}
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
