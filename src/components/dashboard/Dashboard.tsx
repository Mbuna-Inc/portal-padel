
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardContent } from "./DashboardContent";
import { CourtManagement } from "./CourtManagement";
import { BookingManagement } from "./BookingManagement";
import { EquipmentManagement } from "./EquipmentManagement";
import { UserManagement } from "./UserManagement";
import { MyBookings } from "./MyBookings";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardContent user={user} />;
      case "courts":
        return <CourtManagement />;
      case "bookings":
        return user.role === "admin" ? <BookingManagement /> : <MyBookings user={user} />;
      case "equipment":
        return <EquipmentManagement />;
      case "users":
        return user.role === "admin" ? <UserManagement /> : <MyBookings user={user} />;
      default:
        return <DashboardContent user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white shadow-md"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ease-in-out lg:transition-none`}>
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={onLogout}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-6 pt-16 lg:pt-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
