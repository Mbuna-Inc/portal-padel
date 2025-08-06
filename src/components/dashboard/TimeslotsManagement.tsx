import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  DollarSign,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
  RotateCcw,
  Eye,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { 
  Timeslot, 
  CreateTimeslotData, 
  UpdateTimeslotData,
  getTimeslots, 
  createTimeslot, 
  updateTimeslot, 
  deleteTimeslot,
  formatTimeRange,
  calculateSlotDuration,
  getPeakStatusColor
} from '../../api/timeslotsApi';
import { Court, getCourts } from '../../api/courtsApi';
import { formatMWK } from '../../utils/currency';

interface TimeslotsManagementProps {
  onDataChange?: () => void;
}

export const TimeslotsManagement = ({ onDataChange }: TimeslotsManagementProps) => {
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [courtsLoading, setCourtsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingTimeslot, setEditingTimeslot] = useState<Timeslot | null>(null);
  const [viewingTimeslot, setViewingTimeslot] = useState<Timeslot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState<CreateTimeslotData>({
    courtId: "",
    startTime: "",
    endTime: "",
    price: 0,
    isPeak: false,
    isActive: true
  });

  useEffect(() => {
    loadTimeslots();
    loadCourts();
  }, []);

  const loadTimeslots = async () => {
    try {
      setLoading(true);
      const data = await getTimeslots();
      setTimeslots(data);
    } catch (error: any) {
      console.error('Error loading timeslots:', error);
      toast.error('Failed to load timeslots');
      setTimeslots([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadCourts = async () => {
    try {
      setCourtsLoading(true);
      const data = await getCourts();
      setCourts(data.filter(court => court.status === 'available'));
    } catch (error: any) {
      console.error('Error loading courts:', error);
      toast.error('Failed to load courts');
    } finally {
      setCourtsLoading(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingTimeslot) {
        const updated = await updateTimeslot(editingTimeslot.slotId, formData);
        setTimeslots(prev => prev.map(slot => slot.slotId === editingTimeslot.slotId ? updated : slot));
        toast.success("Timeslot updated successfully!");
      } else {
        const newSlot = await createTimeslot(formData);
        setTimeslots(prev => [...prev, newSlot]);
        toast.success("Timeslot created successfully!");
      }
      
      setIsDialogOpen(false);
      resetForm();
      onDataChange?.();
    } catch (error: any) {
      console.error('Error saving timeslot:', error);
      toast.error(error.message || 'Failed to save timeslot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (timeslot: Timeslot) => {
    setEditingTimeslot(timeslot);
    setFormData({
      courtId: timeslot.courtId,
      startTime: timeslot.startTime,
      endTime: timeslot.endTime,
      price: timeslot.price,
      isPeak: timeslot.isPeak,
      isActive: timeslot.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (timeslot: Timeslot) => {
    try {
      await deleteTimeslot(timeslot.slotId);
      setTimeslots(prev => prev.filter(slot => slot.slotId !== timeslot.slotId));
      toast.success("Timeslot deleted successfully!");
      onDataChange?.();
    } catch (error: any) {
      console.error('Error deleting timeslot:', error);
      toast.error(error.message || 'Failed to delete timeslot');
    }
  };

  const handleView = (timeslot: Timeslot) => {
    setViewingTimeslot(timeslot);
    setIsViewDialogOpen(true);
  };

  const validateForm = (): boolean => {
    if (!formData.startTime || !formData.endTime) {
      toast.error("Please fill in all required fields");
      return false;
    }
    
    if (formData.startTime >= formData.endTime) {
      toast.error("End time must be after start time");
      return false;
    }
    
    if (formData.price <= 0) {
      toast.error("Price must be greater than 0");
      return false;
    }
    
    return true;
  };

  const resetForm = () => {
    setFormData({
      courtId: "",
      startTime: "",
      endTime: "",
      price: 0,
      isPeak: false,
      isActive: true
    });
    setEditingTimeslot(null);
  };

  const getStatistics = () => {
    const totalSlots = timeslots.length;
    const activeSlots = timeslots.filter(slot => slot.isActive).length;
    const peakSlots = timeslots.filter(slot => slot.isPeak).length;
    const averagePrice = timeslots.length > 0 
      ? timeslots.reduce((sum, slot) => sum + slot.price, 0) / timeslots.length 
      : 0;
    
    return { totalSlots, activeSlots, peakSlots, averagePrice };
  };

  const filteredTimeslots = timeslots.filter(slot => {
    const searchLower = searchTerm.toLowerCase();
    return (
      slot.startTime.includes(searchLower) ||
      slot.endTime.includes(searchLower) ||
      (slot.courtName && slot.courtName.toLowerCase().includes(searchLower)) ||
      slot.courtId.toLowerCase().includes(searchLower) ||
      formatMWK(slot.price).toLowerCase().includes(searchLower)
    );
  });

  const statistics = getStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading timeslots...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Slots</p>
                <p className="text-2xl font-bold">{statistics.totalSlots}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Slots</p>
                <p className="text-2xl font-bold text-green-600">{statistics.activeSlots}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Peak Hours</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.peakSlots}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold text-blue-600">{formatMWK(statistics.averagePrice)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search timeslots..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                className="px-3"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Timeslot
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Timeslots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Timeslots ({filteredTimeslots.length})</CardTitle>
          <CardDescription>
            Manage available time slots for court bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTimeslots.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Court</TableHead>
                  <TableHead>Time Range</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Peak Hour</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTimeslots.map((timeslot) => (
                  <TableRow key={timeslot.slotId}>
                    <TableCell className="font-medium">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {timeslot.courtName || `Court ${timeslot.courtId}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatTimeRange(timeslot.startTime, timeslot.endTime)}
                    </TableCell>
                    <TableCell>
                      {calculateSlotDuration(timeslot.startTime, timeslot.endTime)} min
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatMWK(timeslot.price)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPeakStatusColor(timeslot.isPeak)}>
                        {timeslot.isPeak ? 'Peak' : 'Regular'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={timeslot.isActive ? "default" : "secondary"}>
                        {timeslot.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(timeslot)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(timeslot)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Timeslot</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this timeslot ({formatTimeRange(timeslot.startTime, timeslot.endTime)})? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(timeslot)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Timeslots Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "No timeslots match your search." : "No timeslots have been created yet."}
              </p>
              <Button onClick={() => { setSearchTerm(""); setIsDialogOpen(true); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Timeslot
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTimeslot ? "Edit Timeslot" : "Add New Timeslot"}
            </DialogTitle>
            <DialogDescription>
              {editingTimeslot 
                ? "Update the timeslot details below."
                : "Create a new time slot for court bookings."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="court">Court</Label>
              <select
                id="court"
                value={formData.courtId}
                onChange={(e) => setFormData(prev => ({ ...prev, courtId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={courtsLoading}
              >
                <option value="">Select a court</option>
                {courts.map((court) => (
                  <option key={court.courtId} value={court.courtId}>
                    {court.name}
                  </option>
                ))}
              </select>
              {courtsLoading && (
                <p className="text-sm text-gray-500 mt-1">Loading courts...</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">Price (MWK)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                required
                min="0"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPeak"
                  checked={formData.isPeak}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPeak: checked }))}
                />
                <Label htmlFor="isPeak">Peak Hour</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTimeslot ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Timeslot Details</DialogTitle>
            <DialogDescription>
              Complete information for this timeslot
            </DialogDescription>
          </DialogHeader>
          {viewingTimeslot && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Court</Label>
                  <p className="text-sm font-semibold">
                    {viewingTimeslot.courtName || `Court ${viewingTimeslot.courtId}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Time Range</Label>
                  <p className="text-sm font-semibold">
                    {formatTimeRange(viewingTimeslot.startTime, viewingTimeslot.endTime)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Duration</Label>
                  <p className="text-sm">
                    {calculateSlotDuration(viewingTimeslot.startTime, viewingTimeslot.endTime)} minutes
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Price</Label>
                  <p className="text-sm font-semibold">{formatMWK(viewingTimeslot.price)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Peak Hour</Label>
                  <Badge className={getPeakStatusColor(viewingTimeslot.isPeak)}>
                    {viewingTimeslot.isPeak ? 'Peak' : 'Regular'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge variant={viewingTimeslot.isActive ? "default" : "secondary"}>
                    {viewingTimeslot.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Slot ID</Label>
                  <p className="text-sm font-mono">{viewingTimeslot.slotId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created</Label>
                  <p>{new Date(viewingTimeslot.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Updated</Label>
                  <p>{new Date(viewingTimeslot.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
