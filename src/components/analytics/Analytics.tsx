import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, TrendingUp, TrendingDown, Calendar, DollarSign, Users, Activity, PieChart, LineChart, UserCheck, CreditCard, Clock, MapPin, Loader2, FileText, Download } from "lucide-react";
import { getBookings, EmployeeBooking } from "../../api/bookingsApi";
import { getCustomerBookings, CustomerBooking } from "../../api/customerBookingsApi";
import { getExpenses, Expense } from "../../api/expensesApi";
import { formatMWK } from "../../utils/currency";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";

export const Analytics = () => {
  const { user } = useAuth();
  const [employeeBookings, setEmployeeBookings] = useState<EmployeeBooking[]>([]);
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      console.log('Loading analytics data...');
      
      // Load employee bookings
      const empBookings = await getBookings();
      console.log('Employee bookings loaded:', empBookings?.length || 0, empBookings);
      
      // Load customer bookings
      const custBookings = await getCustomerBookings();
      console.log('Customer bookings loaded:', custBookings?.length || 0, custBookings);
      
      // Load expenses (admin only)
      let expensesData = [];
      if (user?.role === 'admin') {
        try {
          const expensesResult = await getExpenses();
          expensesData = Array.isArray(expensesResult) ? expensesResult : [];
          console.log('Expenses loaded:', expensesData?.length || 0, expensesData);
        } catch (expenseError) {
          console.log('Expenses API not available or user not admin, skipping expenses data');
          expensesData = [];
        }
      }
      
      // Set the data with fallback to empty arrays
      const employeeData = Array.isArray(empBookings) ? empBookings : [];
      const customerData = Array.isArray(custBookings) ? custBookings : [];
      
      setEmployeeBookings(employeeData);
      setCustomerBookings(customerData);
      setExpenses(expensesData);
      
      console.log('Analytics data set:', {
        employeeCount: employeeData.length,
        customerCount: customerData.length,
        expensesCount: expensesData.length
      });
      
      const expensesText = user?.role === 'admin' ? ` and ${expensesData.length} expenses` : '';
      toast.success(`Loaded ${employeeData.length} employee bookings, ${customerData.length} customer bookings${expensesText}`);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error(`Failed to load analytics data: ${error.message || 'Unknown error'}`);
      
      // Set empty arrays on error to prevent crashes
      setEmployeeBookings([]);
      setCustomerBookings([]);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF Report
  const generateReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (new Date(reportStartDate) > new Date(reportEndDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    setGeneratingReport(true);
    try {
      // Filter data by report date range
      const reportBookings = [...employeeBookings, ...customerBookings].filter(booking => {
        // Both EmployeeBooking and CustomerBooking have bookingDate property
        const bookingDate = new Date(booking.bookingDate);
        return bookingDate >= new Date(reportStartDate) && bookingDate <= new Date(reportEndDate);
      });

      const reportExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= new Date(reportStartDate) && expenseDate <= new Date(reportEndDate);
      });

      // Calculate report metrics
      const reportEmployeeRevenue = reportBookings
        .filter(b => 'total' in b)
        .reduce((sum, booking) => sum + (booking.total || 0), 0);
      
      const reportCustomerRevenue = reportBookings
        .filter(b => 'payment' in b)
        .reduce((sum, booking) => sum + (booking.payment?.total || 0), 0);
      
      const reportTotalRevenue = reportEmployeeRevenue + reportCustomerRevenue;
      const reportTotalExpenses = reportExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const reportNetProfit = reportTotalRevenue - reportTotalExpenses;

      // Create PDF content
      const reportContent = `
        <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
            <h1 style="color: #1f2937; margin: 0; font-size: 28px;">PadleZone Financial Report</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">
              ${new Date(reportStartDate).toLocaleDateString()} - ${new Date(reportEndDate).toLocaleDateString()}
            </p>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">
              Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Total Revenue</h3>
              <p style="margin: 0; font-size: 24px; font-weight: bold;">${formatMWK(reportTotalRevenue)}</p>
            </div>
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Total Expenses</h3>
              <p style="margin: 0; font-size: 24px; font-weight: bold;">${formatMWK(reportTotalExpenses)}</p>
            </div>
            <div style="background: linear-gradient(135deg, ${reportNetProfit >= 0 ? '#10b981, #059669' : '#f59e0b, #d97706'}); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Net Profit</h3>
              <p style="margin: 0; font-size: 24px; font-weight: bold;">${formatMWK(reportNetProfit)}</p>
            </div>
            <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Total Bookings</h3>
              <p style="margin: 0; font-size: 24px; font-weight: bold;">${reportBookings.length}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px;">Revenue Breakdown</h3>
              <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="color: #374151; font-weight: 500;">Walk-in Revenue</span>
                  <span style="color: #1f2937; font-weight: bold;">${formatMWK(reportEmployeeRevenue)}</span>
                </div>
                <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style="background: #3b82f6; height: 100%; width: ${reportTotalRevenue > 0 ? (reportEmployeeRevenue / reportTotalRevenue) * 100 : 0}%; border-radius: 4px;"></div>
                </div>
              </div>
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="color: #374151; font-weight: 500;">Online Revenue</span>
                  <span style="color: #1f2937; font-weight: bold;">${formatMWK(reportCustomerRevenue)}</span>
                </div>
                <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style="background: #10b981; height: 100%; width: ${reportTotalRevenue > 0 ? (reportCustomerRevenue / reportTotalRevenue) * 100 : 0}%; border-radius: 4px;"></div>
                </div>
              </div>
            </div>

            <div style="background: #fef2f2; padding: 25px; border-radius: 12px; border-left: 4px solid #ef4444;">
              <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px;">Expense Summary</h3>
              <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #374151;">Total Expenses</span>
                  <span style="color: #ef4444; font-weight: bold;">${formatMWK(reportTotalExpenses)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #374151;">Number of Expenses</span>
                  <span style="color: #1f2937; font-weight: bold;">${reportExpenses.length}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #374151;">% of Revenue</span>
                  <span style="color: #1f2937; font-weight: bold;">${reportTotalRevenue > 0 ? Math.round((reportTotalExpenses / reportTotalRevenue) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div style="background: #f9fafb; padding: 25px; border-radius: 12px; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px;">Performance Metrics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px;">
              <div style="text-align: center;">
                <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 14px;">Profit Margin</p>
                <p style="color: ${reportNetProfit >= 0 ? '#10b981' : '#ef4444'}; margin: 0; font-size: 20px; font-weight: bold;">
                  ${reportTotalRevenue > 0 ? Math.round((reportNetProfit / reportTotalRevenue) * 100) : 0}%
                </p>
              </div>
              <div style="text-align: center;">
                <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 14px;">Avg. Booking Value</p>
                <p style="color: #1f2937; margin: 0; font-size: 20px; font-weight: bold;">
                  ${reportBookings.length > 0 ? formatMWK(reportTotalRevenue / reportBookings.length) : formatMWK(0)}
                </p>
              </div>
              <div style="text-align: center;">
                <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 14px;">Days in Period</p>
                <p style="color: #1f2937; margin: 0; font-size: 20px; font-weight: bold;">
                  ${Math.ceil((new Date(reportEndDate).getTime() - new Date(reportStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                </p>
              </div>
            </div>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">This report was generated automatically by PadleZone Management System</p>
            <p style="margin: 5px 0 0 0;">For questions or support, please contact your system administrator</p>
          </div>
        </div>
      `;

      // Create a temporary div to hold the content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = reportContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);

      // Use html2canvas and jsPDF (we'll need to install these)
      // For now, let's create a simple text-based PDF using the browser's print functionality
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Financial Report - ${new Date(reportStartDate).toLocaleDateString()} to ${new Date(reportEndDate).toLocaleDateString()}</title>
              <style>
                body { margin: 0; padding: 0; }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              ${reportContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      // Clean up
      document.body.removeChild(tempDiv);
      
      toast.success('Report generated successfully!');
      setReportDialogOpen(false);
      setReportStartDate('');
      setReportEndDate('');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Filter bookings based on date range
  const getFilteredBookings = (bookings: any[], dateField: string = 'bookingDate') => {
    console.log(`Filtering ${bookings.length} bookings by date range: ${dateRange}`);
    
    if (!Array.isArray(bookings) || bookings.length === 0) {
      console.log('No bookings to filter');
      return [];
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    console.log('Date filters:', {
      today: today.toISOString().split('T')[0],
      thisWeek: thisWeek.toISOString().split('T')[0],
      thisMonth: thisMonth.toISOString().split('T')[0],
      dateRange
    });

    const filtered = bookings.filter(booking => {
      if (!booking || !booking[dateField]) {
        console.log('Booking missing date field:', booking);
        return false;
      }
      
      const bookingDateStr = booking[dateField];
      const bookingDate = new Date(bookingDateStr);
      
      console.log(`Checking booking date: ${bookingDateStr} (${bookingDate.toISOString().split('T')[0]})`);
      
      switch (dateRange) {
        case 'today':
          const isToday = bookingDate.toISOString().split('T')[0] === today.toISOString().split('T')[0];
          console.log(`Is today? ${isToday}`);
          return isToday;
        case 'week':
          const isThisWeek = bookingDate >= thisWeek;
          console.log(`Is this week? ${isThisWeek}`);
          return isThisWeek;
        case 'month':
          const isThisMonth = bookingDate >= thisMonth;
          console.log(`Is this month? ${isThisMonth}`);
          return isThisMonth;
        case 'all':
        default:
          console.log('Showing all bookings');
          return true;
      }
    });
    
    console.log(`Filtered result: ${filtered.length} bookings`);
    return filtered;
  };

  const filteredEmployeeBookings = getFilteredBookings(employeeBookings);
  const filteredCustomerBookings = getFilteredBookings(customerBookings);
  const filteredExpenses = getFilteredBookings(expenses, 'date');

  // Calculate metrics
  const employeeStats = {
    total: filteredEmployeeBookings.length,
    revenue: filteredEmployeeBookings.reduce((sum, booking) => sum + (booking.total || 0), 0),
    cancelled: filteredEmployeeBookings.filter(b => b.status === 'cancelled').length
  };

  const customerStats = {
    total: filteredCustomerBookings.length,
    revenue: filteredCustomerBookings.reduce((sum, booking) => sum + (booking.payment?.total || 0), 0),
    cancelled: filteredCustomerBookings.filter(b => b.status === 'cancelled').length
  };

  // Calculate expenses metrics (admin only)
  const expensesStats = {
    total: filteredExpenses.length,
    totalAmount: filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
    byType: filteredExpenses.reduce((acc, expense) => {
      acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>)
  };

  const totalRevenue = employeeStats.revenue + customerStats.revenue;
  const totalBookings = employeeStats.total + customerStats.total;
  const netProfit = totalRevenue - expensesStats.totalAmount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Booking Analytics</h2>
          <p className="text-gray-600">Employee vs Customer booking performance</p>
          <div className="flex items-center gap-2 mt-2">
          </div>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Net Revenue/Total Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {user?.role === 'admin' ? 'Net Profit' : 'Total Revenue'}
                </p>
                <p className={`text-2xl font-bold ${
                  user?.role === 'admin' 
                    ? (netProfit >= 0 ? 'text-green-600' : 'text-red-600')
                    : 'text-green-600'
                }`}>
                  {user?.role === 'admin' ? formatMWK(netProfit) : formatMWK(totalRevenue)}
                </p>
                {user?.role === 'admin' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Revenue: {formatMWK(totalRevenue)} - Expenses: {formatMWK(expensesStats.totalAmount)}
                  </p>
                )}
              </div>
              <DollarSign className={`h-8 w-8 ${
                user?.role === 'admin' 
                  ? (netProfit >= 0 ? 'text-green-600' : 'text-red-600')
                  : 'text-green-600'
              }`} />
            </div>
          </CardContent>
        </Card>
        
        {/* 2. Expenses (Admin only) */}
        {user?.role === 'admin' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">{formatMWK(expensesStats.totalAmount)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 3. Cancellation Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancellation Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {totalBookings > 0 ? Math.round(((employeeStats.cancelled + customerStats.cancelled) / totalBookings) * 100) : 0}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        {/* 4. Total Bookings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-blue-600">{totalBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Type Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Bookings (Walk-in) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Employee Bookings (Walk-in)
            </CardTitle>
            <CardDescription>Walk-in bookings managed by staff</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Bookings</span>
              <Badge variant="outline" className="text-blue-600">{employeeStats.total}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Revenue</span>
              <span className="font-bold text-green-600">{formatMWK(employeeStats.revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Avg per Booking</span>
              <span className="font-medium">
                {employeeStats.total > 0 ? formatMWK(employeeStats.revenue / employeeStats.total) : formatMWK(0)}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Bookings</span>
                <Badge className="bg-green-100 text-green-800">{employeeStats.total - employeeStats.cancelled}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cancelled</span>
                <Badge className="bg-red-100 text-red-800">{employeeStats.cancelled}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Bookings (Online) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Customer Bookings (Online)
            </CardTitle>
            <CardDescription>Online bookings by customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Bookings</span>
              <Badge variant="outline" className="text-green-600">{customerStats.total}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Revenue</span>
              <span className="font-bold text-green-600">{formatMWK(customerStats.revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Avg per Booking</span>
              <span className="font-medium">
                {customerStats.total > 0 ? formatMWK(customerStats.revenue / customerStats.total) : formatMWK(0)}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Bookings</span>
                <Badge className="bg-green-100 text-green-800">{customerStats.total - customerStats.cancelled}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cancelled</span>
                <Badge className="bg-red-100 text-red-800">{customerStats.cancelled}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Comparison Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                {user?.role === 'admin' ? 'Financial Overview' : 'Revenue Comparison'}
              </CardTitle>
              <CardDescription>
                {user?.role === 'admin' 
                  ? 'Revenue, expenses, and profit breakdown' 
                  : 'Walk-in vs Online booking revenue breakdown'
                }
              </CardDescription>
            </div>
            {user?.role === 'admin' && (
              <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-blue-300">
                    <FileText className="h-4 w-4" />
                    Generate Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Generate Financial Report
                    </DialogTitle>
                    <DialogDescription>
                      Select a date range to generate a comprehensive financial report in PDF format.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={reportStartDate}
                          onChange={(e) => setReportStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={reportEndDate}
                          onChange={(e) => setReportEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setReportDialogOpen(false)}
                        disabled={generatingReport}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={generateReport}
                        disabled={generatingReport || !reportStartDate || !reportEndDate}
                        className="flex items-center gap-2"
                      >
                        {generatingReport ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {generatingReport ? 'Generating...' : 'Generate PDF'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">Walk-in Revenue</p>
                  <p className="text-sm text-blue-700">{employeeStats.total} bookings</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">{formatMWK(employeeStats.revenue)}</p>
                <p className="text-sm text-blue-700">
                  {totalRevenue > 0 ? Math.round((employeeStats.revenue / totalRevenue) * 100) : 0}% of total
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Online Revenue</p>
                  <p className="text-sm text-green-700">{customerStats.total} bookings</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-900">{formatMWK(customerStats.revenue)}</p>
                <p className="text-sm text-green-700">
                  {totalRevenue > 0 ? Math.round((customerStats.revenue / totalRevenue) * 100) : 0}% of total
                </p>
              </div>
            </div>
            
            {user?.role === 'admin' && (
              <>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">Total Expenses</p>
                      <p className="text-sm text-red-700">{expensesStats.total} expenses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-900">{formatMWK(expensesStats.totalAmount)}</p>
                    <p className="text-sm text-red-700">
                      {totalRevenue > 0 ? Math.round((expensesStats.totalAmount / totalRevenue) * 100) : 0}% of revenue
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center justify-between p-4 rounded-lg ${
                  netProfit >= 0 ? 'bg-emerald-50' : 'bg-orange-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <DollarSign className={`h-8 w-8 ${
                      netProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'
                    }`} />
                    <div>
                      <p className={`font-semibold ${
                        netProfit >= 0 ? 'text-emerald-900' : 'text-orange-900'
                      }`}>Net Profit</p>
                      <p className={`text-sm ${
                        netProfit >= 0 ? 'text-emerald-700' : 'text-orange-700'
                      }`}>
                        {netProfit >= 0 ? 'Profitable' : 'Loss'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      netProfit >= 0 ? 'text-emerald-900' : 'text-orange-900'
                    }`}>
                      {formatMWK(netProfit)}
                    </p>
                    <p className={`text-sm ${
                      netProfit >= 0 ? 'text-emerald-700' : 'text-orange-700'
                    }`}>
                      {totalRevenue > 0 ? Math.round((Math.abs(netProfit) / totalRevenue) * 100) : 0}% margin
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>


    </div>
  );
};
