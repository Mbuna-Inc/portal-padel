import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Calendar, DollarSign, Users, Activity, PieChart, LineChart } from "lucide-react";

export const Analytics = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Reports</h2>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl">Analytics Dashboard</CardTitle>
          <CardDescription className="text-base">
            Comprehensive business analytics and reporting system for data-driven decisions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Planned Analytics Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Revenue Analytics
              </h3>
              <div className="space-y-2 text-sm text-gray-700 ml-7">
                <div>• Daily, weekly, monthly revenue reports</div>
                <div>• Court vs equipment revenue breakdown</div>
                <div>• Payment method analysis</div>
                <div>• Revenue trends and forecasting</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Booking Analytics
              </h3>
              <div className="space-y-2 text-sm text-gray-700 ml-7">
                <div>• Peak hours and busy periods</div>
                <div>• Court utilization rates</div>
                <div>• Booking cancellation patterns</div>
                <div>• Customer booking behavior</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Customer Insights
              </h3>
              <div className="space-y-2 text-sm text-gray-700 ml-7">
                <div>• Customer retention rates</div>
                <div>• Frequent customer analysis</div>
                <div>• Customer lifetime value</div>
                <div>• Demographics and preferences</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-orange-600" />
                Operational Metrics
              </h3>
              <div className="space-y-2 text-sm text-gray-700 ml-7">
                <div>• Equipment utilization tracking</div>
                <div>• Staff performance metrics</div>
                <div>• Maintenance scheduling insights</div>
                <div>• Inventory turnover analysis</div>
              </div>
            </div>
          </div>

          {/* Chart Types */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Visualization Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2 text-sm">
                <LineChart className="h-4 w-4 text-blue-500" />
                <span>Line Charts</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <span>Bar Charts</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <PieChart className="h-4 w-4 text-purple-500" />
                <span>Pie Charts</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span>Trend Analysis</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">MWK 0</div>
              <div className="text-sm text-blue-700">Total Revenue</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">0</div>
              <div className="text-sm text-green-700">Total Bookings</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">0</div>
              <div className="text-sm text-purple-700">Active Customers</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900">0%</div>
              <div className="text-sm text-orange-700">Growth Rate</div>
            </div>
          </div>

          {/* Development Timeline */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Development Roadmap</h3>
            <div className="space-y-2 text-sm text-green-800">
              <div className="flex justify-between">
                <span>Phase 1: Basic Revenue & Booking Reports</span>
                <span className="font-medium">Q2 2025</span>
              </div>
              <div className="flex justify-between">
                <span>Phase 2: Advanced Analytics & Insights</span>
                <span className="font-medium">Q3 2025</span>
              </div>
              <div className="flex justify-between">
                <span>Phase 3: Predictive Analytics & AI</span>
                <span className="font-medium">Q4 2025</span>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Analytics features will be implemented after the core booking and payment systems are complete.
            </p>
            <Button variant="outline" disabled>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics Dashboard (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Data Sources</CardTitle>
          <CardDescription>
            Data that will be used to generate analytics and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Booking Data</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Employee bookings</li>
                <li>• Customer bookings (future)</li>
                <li>• Time slots and duration</li>
                <li>• Court utilization</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Financial Data</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Payment transactions</li>
                <li>• Revenue by service type</li>
                <li>• Payment methods used</li>
                <li>• Discounts applied</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Operational Data</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Equipment usage</li>
                <li>• Staff performance</li>
                <li>• Customer information</li>
                <li>• System usage patterns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
