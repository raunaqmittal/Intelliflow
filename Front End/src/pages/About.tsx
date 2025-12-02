import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Building2, 
  Target, 
  Users, 
  Zap, 
  Mail, 
  MapPin, 
  Phone,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
                About
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Intelliflow
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Revolutionizing project management through intelligent automation and seamless collaboration
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
                  <Target className="h-4 w-4 mr-2" />
                  Our Mission
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Empowering Businesses with Intelligent Workflows
                </h2>
                <p className="text-lg text-gray-600 mb-4">
                  At Intelliflow, we believe that project management shouldn't be complicated. Our mission is to 
                  eliminate the complexity and manual effort involved in managing projects, teams, and client relationships.
                </p>
                <p className="text-lg text-gray-600">
                  We leverage cutting-edge AI and automation to create intelligent workflow systems that adapt to your 
                  business needs, saving time and reducing errors while improving collaboration.
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 h-96 flex items-center justify-center">
                <Building2 className="h-48 w-48 text-blue-600 opacity-20" />
              </div>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                What We Offer
              </h2>
              <p className="text-xl text-gray-600">
                Custom workflow management solutions tailored to your business
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Automated Workflow Generation
                </h3>
                <p className="text-gray-600">
                  Our AI analyzes client requests and automatically generates optimized workflows, 
                  complete with task breakdowns, timelines, and resource allocation.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Unified Collaboration Platform
                </h3>
                <p className="text-gray-600">
                  One platform where clients, employees, and managers work together seamlessly. 
                  Real-time updates, role-based access, and transparent communication.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Intelligent Task Management
                </h3>
                <p className="text-gray-600">
                  Smart task allocation based on employee skills, availability, and workload. 
                  Automated approvals and status tracking keep projects on schedule.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Key Features
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to manage projects efficiently
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                'Automatic workflow generation based on client requests',
                'One unified platform for clients and company employees',
                'AI-powered task assignment and resource allocation',
                'Real-time project tracking and status updates',
                'Role-based access control (Client, Employee, Manager)',
                'Automated approval workflows across departments',
                'Intelligent team member suggestions based on skills',
                'Comprehensive project analytics and reporting',
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Portal Info */}
        <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6">
                Experience Our Demo Portal
              </h2>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
                <p className="text-xl text-blue-100 mb-6">
                  We've created a fully functional demonstration portal for a fictional company that handles 
                  four types of client requests:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="font-semibold text-lg">Web Development</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="font-semibold text-lg">App Development</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="font-semibold text-lg">Prototyping</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="font-semibold text-lg">Research</div>
                  </div>
                </div>
              </div>
              <p className="text-lg text-blue-100 mb-8">
                This demo showcases the complete workflow from client request submission through approval, 
                task assignment, and project completion. Explore different user roles to see how Intelliflow 
                works from every perspective.
              </p>
              <Link to="/login">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  Try Demo Portal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Get Your Custom Portal
                </h2>
                <p className="text-xl text-gray-600">
                  Interested in a customized Intelliflow solution for your business? Let's talk!
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4">
                      <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
                    <p className="text-gray-600">raunaqmittal2004@gmail.com</p>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 mb-4">
                      <Phone className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Call Us</h3>
                    <p className="text-gray-600">+91 9625668733</p>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                      <MapPin className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Visit Us</h3>
                    <p className="text-gray-600">New Delhi, India</p>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-gray-600">
                    We'll help you build a custom workflow management portal tailored to your specific needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
