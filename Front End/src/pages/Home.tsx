import { Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Workflow, Zap, CheckCircle2, Globe, Smartphone, Code, FlaskConical } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered Workflow Management
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight">
                Intelligent Workflows
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>
              
              <p className="max-w-2xl mx-auto text-xl text-gray-600">
                Transform your business with automated workflow generation, seamless collaboration, 
                and intelligent project management—all in one powerful platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/login">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6">
                    Try Demo Portal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose Intelliflow?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Experience the future of project management with our cutting-edge features
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Workflow className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Automated Workflow Generation
                </h3>
                <p className="text-gray-600">
                  AI-powered workflow creation based on client requests. No manual planning needed.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Unified Platform
                </h3>
                <p className="text-gray-600">
                  One portal for clients, employees, and managers. Seamless collaboration guaranteed.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Reduced Manual Work
                </h3>
                <p className="text-gray-600">
                  Automate task assignment, approvals, and status tracking. Save 70% of planning time.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Smart Task Allocation
                </h3>
                <p className="text-gray-600">
                  AI suggests the best team members based on skills, availability, and workload.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Real-time Updates
                </h3>
                <p className="text-gray-600">
                  Live project tracking with instant notifications for all stakeholders.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Client Portal Access
                </h3>
                <p className="text-gray-600">
                  Give clients direct visibility into their projects with secure access controls.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                See It In Action
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                We've created a fully functional demo portal showcasing how Intelliflow works for a company handling various project types
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
                <Globe className="h-10 w-10 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold text-gray-900 mb-1">Web Development</h3>
                <p className="text-sm text-gray-600">Full-stack web applications</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
                <Smartphone className="h-10 w-10 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold text-gray-900 mb-1">App Development</h3>
                <p className="text-sm text-gray-600">Mobile & desktop apps</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
                <Code className="h-10 w-10 mx-auto mb-3 text-pink-600" />
                <h3 className="font-semibold text-gray-900 mb-1">Prototyping</h3>
                <p className="text-sm text-gray-600">UI/UX design & mockups</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
                <FlaskConical className="h-10 w-10 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold text-gray-900 mb-1">Research</h3>
                <p className="text-sm text-gray-600">Market & technical research</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Experience Intelliflow?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Access our demo portal and see how automated workflows transform project management. 
                Login as a client, employee, or manager to explore different perspectives.
              </p>
              <Link to="/login">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6">
                  Access Demo Portal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Want Your Own Custom Portal?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              We build tailored workflow management solutions for businesses of all sizes. 
              Contact us to discuss your requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/about">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  Contact Us
                </Button>
              </Link>
              <Link to="/how-to-use">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-6 border-2 border-purple-500">
                  Learn How It Works
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
