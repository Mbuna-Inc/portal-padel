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
import { Textarea } from "@/components/ui/textarea";

import { DollarSign, Plus, Edit, Trash2, Calendar, CreditCard, Loader2, Search, Filter, TrendingDown, TrendingUp, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { formatMWK } from "../../utils/currency";
import { 
  getExpenses, 
  createExpense, 
  updateExpense, 
  deleteExpense, 
  getExpensesStats,
  type Expense,
  type CreateExpenseData,
  type UpdateExpenseData
} from "../../api/expensesApi";

interface ExpensesManagementProps {
  onDataChange?: () => void;
}

const EXPENSE_TYPES = [
  "utility",
  "maintenance", 
  "salaries",
  "equipment",
  "supplies",
  "marketing",
  "insurance",
  "rent",
  "other"
];

const PAYMENT_METHODS = [
  "cash",
  "bank_transfer", 
  "mobile_money",
  "card",
  "check"
];

export const ExpensesManagement = ({ onDataChange }: ExpensesManagementProps = {}) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);

  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    paymentMethod: ""
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const expensesData = await getExpenses();
      setExpenses(expensesData);
      onDataChange?.(); // Update sidebar badges if needed
    } catch (error: any) {
      // Fallback to mock data if API endpoints are not implemented (404 errors)
      if (error.message?.includes('Cannot GET') || error.message?.includes('404') || error.message?.includes('<!DOCTYPE html>')) {
        console.warn('Expenses API not implemented, using mock data');
        const mockExpenses: Expense[] = [
          {
            id: "exp-001",
            type: "utility",
            amount: 150000,
            description: "Electricity bill for December",
            date: "2025-01-15",
            addedBy: user?.fullName || "Admin",
            createdAt: "2025-01-15T10:30:00Z",
            paymentMethod: "bank_transfer"
          },
          {
            id: "exp-002", 
            type: "maintenance",
            amount: 75000,
            description: "Court surface repair",
            date: "2025-01-10",
            addedBy: user?.fullName || "Admin",
            createdAt: "2025-01-10T14:20:00Z",
            paymentMethod: "cash"
          },
          {
            id: "exp-003",
            type: "salaries",
            amount: 500000,
            description: "Staff salaries for January",
            date: "2025-01-31",
            addedBy: user?.fullName || "Admin",
            createdAt: "2025-01-31T16:00:00Z",
            paymentMethod: "bank_transfer"
          }
        ];
        setExpenses(mockExpenses);
        toast.info("Using demo data - Backend API not yet implemented");
      } else {
        toast.error("Failed to load expenses");
        console.error('Error loading expenses:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.amount || !formData.description || !formData.paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseData: CreateExpenseData | UpdateExpenseData = {
        type: formData.type,
        amount: amount,
        description: formData.description.trim(),
        date: formData.date,
        paymentMethod: formData.paymentMethod
      };

      if (editingExpense) {
        // Update existing expense
        try {
          await updateExpense(editingExpense.id, expenseData as UpdateExpenseData);
          toast.success("Expense updated successfully!");
        } catch (error: any) {
          if (error.message?.includes('Cannot PUT') || error.message?.includes('404') || error.message?.includes('<!DOCTYPE html>')) {
            // Fallback to local update when API not available
            const updatedExpense: Expense = {
              ...editingExpense,
              ...expenseData,
              id: editingExpense.id,
              addedBy: editingExpense.addedBy,
              createdAt: editingExpense.createdAt
            };
            setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? updatedExpense : exp));
            toast.success("Expense updated successfully! (Demo mode)");
          } else {
            throw error;
          }
        }
      } else {
        // Add new expense
        try {
          await createExpense(expenseData as CreateExpenseData);
          toast.success("Expense added successfully!");
        } catch (error: any) {
          if (error.message?.includes('Cannot POST') || error.message?.includes('404') || error.message?.includes('<!DOCTYPE html>')) {
            // Fallback to local add when API not available
            const newExpense: Expense = {
              id: `exp-${Date.now()}`,
              type: expenseData.type,
              amount: expenseData.amount,
              description: expenseData.description,
              date: expenseData.date,
              addedBy: user?.fullName || "Admin",
              createdAt: new Date().toISOString(),
              paymentMethod: expenseData.paymentMethod
            };
            setExpenses(prev => [newExpense, ...prev]);
            toast.success("Expense added successfully! (Demo mode)");
          } else {
            throw error;
          }
        }
      }

      // Try to reload from API, but don't fail if API is not available
      try {
        await loadExpenses();
      } catch {
        // API not available, data already updated locally
      }
      resetForm();
      setIsDialogOpen(false);
      onDataChange?.();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast.error(error.message || "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      type: expense.type,
      amount: expense.amount.toString(),
      description: expense.description,
      date: expense.date,
      paymentMethod: expense.paymentMethod
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (expense: Expense) => {
    try {
      await deleteExpense(expense.id);
      toast.success(`Expense "${expense.description}" deleted successfully!`);
    } catch (error: any) {
      if (error.message?.includes('Cannot DELETE') || error.message?.includes('404') || error.message?.includes('<!DOCTYPE html>')) {
        // Fallback to local delete when API not available
        setExpenses(prev => prev.filter(exp => exp.id !== expense.id));
        toast.success(`Expense "${expense.description}" deleted successfully! (Demo mode)`);
      } else {
        toast.error(error.message || "Failed to delete expense");
        return;
      }
    }
    
    // Try to reload from API, but don't fail if API is not available
    try {
      await loadExpenses();
    } catch {
      // API not available, data already updated locally
    }
    onDataChange?.();
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowExpenseDetails(true);
  };

  const resetForm = () => {
    setFormData({
      type: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      paymentMethod: ""
    });
    setEditingExpense(null);
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  const getPaymentMethodLabel = (method: string) => {
    return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
  };

  // Filter expenses based on search and filters
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.addedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || expense.type === typeFilter;
    const matchesPaymentMethod = paymentMethodFilter === "all" || expense.paymentMethod === paymentMethodFilter;
    
    return matchesSearch && matchesType && matchesPaymentMethod;
  });

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Expenses Management</h2>
          <p className="text-gray-600">Track and manage business expenses</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatMWK(totalExpenses)}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-orange-600">{formatMWK(thisMonthExpenses)}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-blue-600">{expenses.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EXPENSE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {getTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-32">
                  <CreditCard className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method} value={method}>
                      {getPaymentMethodLabel(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>All business expenses and their details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTypeLabel(expense.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                  <TableCell className="font-medium text-red-600">{formatMWK(expense.amount)}</TableCell>
                  <TableCell className="capitalize">{getPaymentMethodLabel(expense.paymentMethod)}</TableCell>
                  <TableCell>{expense.addedBy}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewExpense(expense)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(expense)}
                        title="Edit Expense"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" title="Delete Expense">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this expense record? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(expense)}
                              className="bg-red-600 hover:bg-red-700"
                            >
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
          
          {filteredExpenses.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || typeFilter !== "all" || paymentMethodFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Get started by adding your first expense"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
            <DialogDescription>
              {editingExpense ? "Update expense details" : "Enter the expense information"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {getTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="amount">Amount (MWK) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter expense description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method} value={method}>
                        {getPaymentMethodLabel(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                resetForm();
                setIsDialogOpen(false);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingExpense ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  editingExpense ? "Update Expense" : "Add Expense"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense Details Modal */}
      <Dialog open={showExpenseDetails} onOpenChange={setShowExpenseDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Expense Details
            </DialogTitle>
            <DialogDescription>
              Complete information for expense record
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Type</Label>
                  <p className="text-sm">{getTypeLabel(selectedExpense.type)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Amount</Label>
                  <p className="text-sm font-medium text-red-600">{formatMWK(selectedExpense.amount)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="text-sm">{selectedExpense.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date</Label>
                  <p className="text-sm">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                  <p className="text-sm">{getPaymentMethodLabel(selectedExpense.paymentMethod)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Added By</Label>
                  <p className="text-sm">{selectedExpense.addedBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created At</Label>
                  <p className="text-sm">{new Date(selectedExpense.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Expense ID</Label>
                <p className="text-sm font-mono">{selectedExpense.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
