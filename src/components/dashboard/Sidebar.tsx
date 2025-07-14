
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

interface SidebarProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const Sidebar = ({ user, activeTab, setActiveTab, onLogout, onClose }: SidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "member"] },
    { id: "courts", label: "Courts", icon: MapPin, roles: ["admin", "member"] },
    { id: "bookings", label: user.role === "admin" ? "All Bookings" : "My Bookings", icon: Calendar, roles: ["admin", "member"] },
    { id: "equipment", label: "Equipment", icon: Package, roles: ["admin", "member"] },
    { id: "users", label: "User Management", icon: Users, roles: ["admin"] },
  ];

  const handleMenuClick = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  console.log("User role:", user.role);
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
            <AvatarImage src={user.profile_image_url} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {user.full_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.full_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <div className="flex items-center mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.role === "admin" 
                  ? "bg-purple-100 text-purple-800" 
                  : "bg-green-100 text-green-800"
              }`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {visibleMenuItems.map((item) => (
            <li key={item.id}>
              <Button
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  activeTab === item.id 
                    ? "bg-blue-50 text-blue-700 border-blue-200" 
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleMenuClick(item.id)}
              >
                <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>
            </li>
          ))}
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
