
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge as UIBadge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Package,
  Users,
  LogOut,
  User,
  BookOpen,
  X,
  ChevronDown,
  ChevronRight,
  UserCheck,
  CreditCard,
  BarChart3,
  TrendingUp,
} from "lucide-react";

interface SidebarProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onClose: () => void;
  courtCount?: number;
  equipmentCount?: number;
  bookingCount?: number;
}

export const Sidebar = ({ user, activeTab, setActiveTab, onLogout, onClose, courtCount = 0, equipmentCount = 0, bookingCount = 0 }: SidebarProps) => {
  const [bookingsExpanded, setBookingsExpanded] = useState(false);
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "cashier"] },
    // Bookings will be handled separately as dropdown
    { id: "analytics", label: "Analytics", icon: BarChart3, roles: ["admin", "cashier"] },
    { id: "courts", label: "Courts", icon: MapPin, roles: ["admin", "cashier"], badge: courtCount },
    { id: "equipment", label: "Equipment", icon: Package, roles: ["admin", "cashier"], badge: equipmentCount },
    { id: "users", label: "User Management", icon: Users, roles: ["admin"] },
  ];

  const bookingMenuItems = [
    { id: "employee-bookings", label: "Employee Bookings", icon: UserCheck, roles: ["admin", "cashier"] },
    { id: "customer-bookings", label: "Customer Bookings", icon: CreditCard, roles: ["admin", "cashier"] },
  ];

  const handleMenuClick = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user?.role || "cashier"));
  const visibleBookingItems = bookingMenuItems.filter(item => item.roles.includes(user?.role || "cashier"));

  // Check if any booking submenu is active
  const isBookingActive = activeTab === "employee-bookings" || activeTab === "customer-bookings";
  
  // Auto-expand bookings if a booking tab is active
  React.useEffect(() => {
    if (isBookingActive) {
      setBookingsExpanded(true);
    }
  }, [isBookingActive]);

  console.log("User object:", user);
  console.log("User role:", user?.role);
  console.log("All menu items:", menuItems);
  console.log("Visible menu items:", visibleMenuItems);

  return (
    <div className="bg-white h-full shadow-lg flex flex-col">
      {/* Mobile Close Button */}
      <div className="lg:hidden flex justify-end p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CourtFlow</h1>
            <p className="text-xs text-gray-500">Management Portal</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={user?.profile_image_url} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.full_name || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
            <div className="flex items-center mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user?.role === "admin" 
                  ? "bg-purple-100 text-purple-800" 
                  : "bg-green-100 text-green-800"
              }`}>
                {user?.role || "member"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {/* Dashboard */}
          <li>
            <Button
              variant={activeTab === "dashboard" ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                activeTab === "dashboard" 
                  ? "bg-blue-50 text-blue-700 border-blue-200" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleMenuClick("dashboard")}
            >
              <LayoutDashboard className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Dashboard</span>
            </Button>
          </li>
          
          {/* Bookings Dropdown */}
          <li>
            <Button
              variant={isBookingActive ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                isBookingActive 
                  ? "bg-blue-50 text-blue-700 border-blue-200" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setBookingsExpanded(!bookingsExpanded)}
            >
              <Calendar className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate flex-1 text-left">Bookings</span>
              {bookingCount > 0 && (
                <UIBadge className="mr-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                  {bookingCount}
                </UIBadge>
              )}
              {bookingsExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
            </Button>
            
            {/* Booking Submenu */}
            {bookingsExpanded && (
              <ul className="mt-2 ml-6 space-y-1">
                {visibleBookingItems.map((subItem) => (
                  <li key={subItem.id}>
                    <Button
                      variant={activeTab === subItem.id ? "secondary" : "ghost"}
                      size="sm"
                      className={`w-full justify-start text-sm ${
                        activeTab === subItem.id 
                          ? "bg-blue-100 text-blue-800" 
                          : "hover:bg-gray-50 text-gray-600"
                      }`}
                      onClick={() => handleMenuClick(subItem.id)}
                    >
                      <subItem.icon className="mr-2 h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{subItem.label}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Analytics */}
          <li>
            <Button
              variant={activeTab === "analytics" ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                activeTab === "analytics" 
                  ? "bg-blue-50 text-blue-700 border-blue-200" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleMenuClick("analytics")}
            >
              <BarChart3 className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Analytics</span>
            </Button>
          </li>
          
          {/* Courts */}
          <li>
            <Button
              variant={activeTab === "courts" ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                activeTab === "courts" 
                  ? "bg-blue-50 text-blue-700 border-blue-200" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleMenuClick("courts")}
            >
              <MapPin className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Courts</span>
              {courtCount > 0 && (
                <UIBadge className="ml-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                  {courtCount}
                </UIBadge>
              )}
            </Button>
          </li>
          
          {/* Equipment */}
          <li>
            <Button
              variant={activeTab === "equipment" ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                activeTab === "equipment" 
                  ? "bg-blue-50 text-blue-700 border-blue-200" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleMenuClick("equipment")}
            >
              <Package className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Equipment</span>
              {equipmentCount > 0 && (
                <UIBadge className="ml-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                  {equipmentCount}
                </UIBadge>
              )}
            </Button>
          </li>
          
          {/* User Management (Admin only) */}
          {user?.role === "admin" && (
            <li>
              <Button
                variant={activeTab === "users" ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  activeTab === "users" 
                    ? "bg-blue-50 text-blue-700 border-blue-200" 
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleMenuClick("users")}
              >
                <Users className="mr-3 h-4 w-4 flex-shrink-0" />
                <span className="truncate">User Management</span>
              </Button>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="mr-3 h-4 w-4 flex-shrink-0" />
          <span className="truncate">Sign Out</span>
        </Button>
      </div>
    </div>
  );
};
