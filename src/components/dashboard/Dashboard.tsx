
import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardContent } from "./DashboardContent";
import { CourtsManagement } from "../courts/CourtsManagement";
import { BookingManagement } from "./BookingManagement";
import { EquipmentManagement } from "../equipment/EquipmentManagement";
import { EmployeeBookingManagement } from "../bookings/EmployeeBookingManagement";
import { CustomerBookingManagement } from "../bookings/CustomerBookingManagement";
import { TimeslotsManagement } from "./TimeslotsManagement";
import { Analytics } from "../analytics/Analytics";
import { ExpensesManagement } from "../expenses/ExpensesManagement";
import { UserManagement } from "./UserManagement";
import { MyBookings } from "./MyBookings";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getCourts } from "../../api/courtsApi";
import { getEquipment } from "../../api/equipmentApi";

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [courtCount, setCourtCount] = useState(0);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);

  // Function to refresh all counts
  const refreshCounts = async () => {
    try {
      // Load court count
      const courts = await getCourts();
      setCourtCount(courts.length);
    } catch (error) {
      console.error('Error loading courts:', error);
      setCourtCount(0);
    }

    try {
      // Load equipment count
      const equipment = await getEquipment();
      setEquipmentCount(equipment.length);
    } catch (error) {
      console.error('Error loading equipment:', error);
      setEquipmentCount(0);
    }

    try {
      // Load booking count
      const { getBookings } = await import('../../api/bookingsApi');
      const bookings = await getBookings();
      setBookingCount(bookings.length);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookingCount(0);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  if (!user) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardContent user={user} />;
      case "courts":
        return <CourtsManagement onDataChange={refreshCounts} />;
      case "employee-bookings":
        return <EmployeeBookingManagement onDataChange={refreshCounts} />;
      case "customer-bookings":
        return <CustomerBookingManagement onDataChange={refreshCounts} />;
      case "timeslots":
        return user.role === "admin" ? <TimeslotsManagement onDataChange={refreshCounts} /> : <MyBookings user={user} />;
      case "analytics":
        return user.role === "admin" ? <Analytics /> : <MyBookings user={user} />;
      case "equipment":
        return <EquipmentManagement onDataChange={refreshCounts} />;
      case "expenses":
        return user.role === "admin" ? <ExpensesManagement onDataChange={refreshCounts} /> : <MyBookings user={user} />;
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
          onLogout={logout}
          onClose={() => setSidebarOpen(false)}
          courtCount={courtCount}
          equipmentCount={equipmentCount}
          bookingCount={bookingCount}
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
          {activeTab === 'dashboard' ? <DashboardContent user={user} setActiveTab={setActiveTab} /> : renderContent()}
        </main>
      </div>
    </div>
  );
};
