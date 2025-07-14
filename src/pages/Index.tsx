
import { useState, useEffect } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, MapPin, Trophy } from "lucide-react";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check for existing authentication on component mount
  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData: any) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  if (isAuthenticated) {
    return <Dashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Court<span className="text-blue-600">Flow</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Professional Court Booking & Management System
          </p>
          
          {/* Feature Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800">Easy Booking</h3>
                <p className="text-sm text-gray-600">Book courts with just a few clicks</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <MapPin className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800">Multiple Courts</h3>
                <p className="text-sm text-gray-600">Manage various court types</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800">User Management</h3>
                <p className="text-sm text-gray-600">Complete member management</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Trophy className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800">Equipment</h3>
                <p className="text-sm text-gray-600">Rent equipment easily</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Authentication Section */}
        <div className="max-w-md mx-auto">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">
                {showRegister ? "Create Account" : "Welcome Back"}
              </CardTitle>
              <p className="text-gray-600">
                {showRegister 
                  ? "Join our tennis community today" 
                  : "Sign in to manage your bookings"
                }
              </p>
            </CardHeader>
            <CardContent>
              {showRegister ? (
                <RegisterForm onRegister={handleLogin} />
              ) : (
                <LoginForm onLogin={handleLogin} />
              )}
              
              <div className="text-center mt-6 pt-4 border-t">
                <p className="text-gray-600">
                  {showRegister ? "Already have an account?" : "Don't have an account?"}
                </p>
                <Button
                  variant="link"
                  onClick={() => setShowRegister(!showRegister)}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  {showRegister ? "Sign In" : "Create Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
