import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/logo.jpg" 
                alt="Intelliflow Logo" 
                className="h-8 w-8 rounded-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="text-xl font-bold text-white">Intelliflow</span>
            </div>
            <p className="text-sm text-gray-400">
              Intelligent workflow and company management solutions for modern businesses.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-blue-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:text-blue-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/how-to-use" className="text-sm hover:text-blue-400 transition-colors">
                  How to Use
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm hover:text-blue-400 transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Workflow Automation</li>
              <li>Project Management</li>
              <li>Team Collaboration</li>
              <li>Client Portal Solutions</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-sm">
                <Mail className="h-4 w-4 mt-0.5 text-blue-400" />
                <span>raunaqmittal2004@gmail.com</span>
              </li>
              <li className="flex items-start space-x-2 text-sm">
                <Phone className="h-4 w-4 mt-0.5 text-blue-400" />
                <span>+91 9625668733</span>
              </li>
              <li className="flex items-start space-x-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-blue-400" />
                <span>New Delhi, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Intelliflow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
