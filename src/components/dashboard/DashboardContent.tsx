
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface DashboardContentProps {
  user: any;
}

export const DashboardContent = ({ user }: DashboardContentProps) => {
  const stats = [
    {
      title: "Total Bookings",
      value: user.role === "admin" ? "247" : "12",
      change: "+12%",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Courts",
      value: "8",
      change: "+2",
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: user.role === "admin" ? "Total Users" : "Upcoming",
      value: user.role === "admin" ? "156" : "3",
      change: user.role === "admin" ? "+8%" : "Next 7 days",
      icon: user.role === "admin" ? Users : Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Equipment",
      value: "24",
      change: "Available",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const recentBookings = [
    {
      id: 1,
      court: "Tennis Court A",
      date: "2024-07-15",
      time: "10:00 AM",
      status: "confirmed",
      user: user.role === "admin" ? "John Smith" : "You",
    },
    {
      id: 2,
      court: "Basketball Court",
      date: "2024-07-16",
      time: "2:00 PM",
      status: "pending",
      user: user.role === "admin" ? "Sarah Johnson" : "You",
    },
    {
      id: 3,
      court: "Tennis Court B",
      date: "2024-07-17",
      time: "6:00 PM",
      status: "confirmed",
      user: user.role === "admin" ? "Mike Wilson" : "You",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.full_name}!
        </h1>
        <p className="text-blue-100">
          {user.role === "admin" 
            ? "Here's what's happening with your courts today." 
            : "Ready to book your next court session?"
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {user.role === "admin" ? "Recent Bookings" : "Your Recent Bookings"}
            </CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      booking.status === "confirmed" ? "bg-green-100" : "bg-yellow-100"
                    }`}>
                      {booking.status === "confirmed" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{booking.court}</p>
                      <p className="text-sm text-gray-500">
                        {booking.date} at {booking.time}
                      </p>
                      {user.role === "admin" && (
                        <p className="text-sm text-gray-600">by {booking.user}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button className="justify-start h-12 bg-blue-600 hover:bg-blue-700">
                <Calendar className="mr-3 h-4 w-4" />
                {user.role === "admin" ? "View All Bookings" : "Book a Court"}
              </Button>
              
              {user.role === "admin" && (
                <Button variant="outline" className="justify-start h-12">
                  <MapPin className="mr-3 h-4 w-4" />
                  Manage Courts
                </Button>
              )}
              
              <Button variant="outline" className="justify-start h-12">
                <Package className="mr-3 h-4 w-4" />
                Browse Equipment
              </Button>
              
              {user.role === "admin" && (
                <Button variant="outline" className="justify-start h-12">
                  <Users className="mr-3 h-4 w-4" />
                  Manage Users
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
