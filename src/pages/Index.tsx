
import { useState, useEffect } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Court<span className="text-blue-600">Flow</span>
              </h1>
              <p className="text-sm text-gray-500">Management Portal</p>
            </div>
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <p className="text-gray-600">Sign in to access the management portal</p>
          </CardHeader>
          <CardContent>
            <LoginForm onLogin={handleLogin} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
