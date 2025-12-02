import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/logo.jpg" 
              alt="Intelliflow Logo" 
              className="h-10 w-10 rounded-md"
              onError={(e) => {
                // Fallback if logo doesn't load
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Intelliflow
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive("/") 
                  ? "text-blue-600" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`text-sm font-medium transition-colors ${
                isActive("/about") 
                  ? "text-blue-600" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              About
            </Link>
            <Link
              to="/how-to-use"
              className={`text-sm font-medium transition-colors ${
                isActive("/how-to-use") 
                  ? "text-blue-600" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              How to Use
            </Link>
            <Link
              to="/test-credentials"
              className={`text-sm font-medium transition-colors ${
                isActive("/test-credentials") 
                  ? "text-blue-600" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Test Credentials
            </Link>
            <Link to="/login">
              <Button 
                variant={isActive("/login") ? "default" : "outline"}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Login
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Link to="/login">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden pb-4 space-y-2">
          <Link
            to="/"
            className={`block px-3 py-2 rounded-md text-sm font-medium ${
              isActive("/") 
                ? "bg-blue-50 text-blue-600" 
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={`block px-3 py-2 rounded-md text-sm font-medium ${
              isActive("/about") 
                ? "bg-blue-50 text-blue-600" 
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            About
          </Link>
          <Link
            to="/how-to-use"
            className={`block px-3 py-2 rounded-md text-sm font-medium ${
              isActive("/how-to-use") 
                ? "bg-blue-50 text-blue-600" 
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            How to Use
          </Link>
          <Link
            to="/test-credentials"
            className={`block px-3 py-2 rounded-md text-sm font-medium ${
              isActive("/test-credentials") 
                ? "bg-blue-50 text-blue-600" 
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Test Credentials
          </Link>
        </nav>
      </div>
    </header>
  );
};
