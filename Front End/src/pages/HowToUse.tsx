import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { BookOpen, User, Users, UserCog, CheckCircle2 } from "lucide-react";

export default function HowToUse() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
                <BookOpen className="h-4 w-4 mr-2" />
                User Guide
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
                How to Use
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Intelliflow
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Learn how to navigate and make the most of our demo portal
              </p>
            </div>
          </div>
        </section>

        {/* Content Placeholder */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Introduction */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 mb-12">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Demo Portal Guide</h2>
              </div>
              <p className="text-lg text-gray-700">
                This is a guide to use our <strong>demo portal</strong> made for a fictional company. 
                The portal demonstrates three levels of users, each with specific roles and permissions:
              </p>
            </div>

            {/* User Roles */}
            <div className="space-y-8">
              {/* Client Role */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold">Client</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">
                    Clients are the customers who submit project requests and track their progress.
                  </p>
                  <h4 className="font-semibold text-gray-900 mb-3">Key Functions:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Submit new project requests (Web Dev, App Dev, Prototyping, Research)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">View request status (Submitted, Under Review, Approved, Rejected)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">View project status and track progress in real-time</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Manager Role */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <UserCog className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold">Team Manager</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">
                    Managers oversee projects, approve requests, and manage team resources.
                  </p>
                  <h4 className="font-semibold text-gray-900 mb-3">Key Functions:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Receive client requests with AI-generated workflow and employee assignment suggestions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Approve or reject client requests based on feasibility and resources</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Assign tasks to team members and manage workload distribution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Review sprint progress and monitor project timelines</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700"><strong>Special Access:</strong> Sign up new employees and clients (exclusive to managers in this demo)</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Team Member Role */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold">Team Member (Employee)</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">
                    Team members are the employees who execute tasks and contribute to project completion.
                  </p>
                  <h4 className="font-semibold text-gray-900 mb-3">Key Functions:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Get tasks assigned by managers based on skills and availability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Update task status (To Do, In Progress, Done)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">View all assigned tasks across different projects</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">View team members and collaborate on projects</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Track personal performance and completion rates</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-12 bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
              <p className="text-gray-700">
                <strong className="text-blue-900">Note:</strong> This is a demonstration portal showcasing Intelliflow's capabilities. 
                In a production environment, user roles and permissions can be fully customized to match your organization's structure and workflow requirements.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
