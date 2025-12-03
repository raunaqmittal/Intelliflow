import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";

// Layouts and Common Components
import { PortalLayout } from "./components/common/layout/PortalLayout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

// Sidebars
import { ClientSidebar } from "./components/client/ClientSidebar";
import { EmployeeSidebar } from "./components/employee/EmployeeSidebar";
import { ManagerSidebar } from "./components/manager/ManagerSidebar";

// Client Portal Pages
import ClientDashboard from "./pages/client/Dashboard";
import ClientProjects from "./pages/client/Projects";
import ClientProjectDetails from "./pages/client/ProjectDetails";
import ClientSubmitRequest from "./pages/client/SubmitRequest";
import ClientProfile from "./pages/client/Profile";
import MyRequests from "./pages/client/MyRequests";
import RequestDetails from "./pages/client/RequestDetails";

// Employee Portal Pages
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeTasks from "./pages/employee/Tasks";
import EmployeeProfile from "./pages/employee/Profile";
import MyProjects from "./pages/employee/MyProjects";
import MyProjectDetails from "./pages/employee/MyProjectDetails";
import EmployeeTeam from "./pages/employee/Team";

// Manager Portal Pages
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerProjects from "./pages/manager/Projects";
import ManagerTeam from "./pages/manager/Team";
import ManagerProfile from "./pages/manager/Profile";
import ProjectDetails from "./pages/manager/ProjectDetails";
import ManagerRequests from "./pages/manager/Requests";
import ManagerRequestDetails from "./pages/manager/RequestDetails";
import ManageEmployees from "./pages/manager/ManageEmployees";
import AddClient from "./pages/manager/AddClient";

// Common Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import About from "./pages/About";
import HowToUse from "./pages/HowToUse";
import TestCredentials from "./pages/TestCredentials";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <UserProvider>
        <BrowserRouter>
          <Routes>
            {/* Public/Landing Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/test-credentials" element={<TestCredentials />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Client Portal Routes */}
            <Route
              path="/client"
              element={
                <ProtectedRoute allowedRole="client">
                  <PortalLayout sidebar={<ClientSidebar />}>
                    <ClientDashboard />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/change-password"
              element={
                <ProtectedRoute allowedRole="client">
                  <PortalLayout sidebar={<ClientSidebar />}>
                    <ChangePassword />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/projects"
              element={
                <ProtectedRoute allowedRole="client">
                  <PortalLayout sidebar={<ClientSidebar />}>
                    <ClientProjects />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/projects/:id"
              element={
                <ProtectedRoute allowedRole="client">
                  <PortalLayout sidebar={<ClientSidebar />}>
                    <ClientProjectDetails />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/submit"
              element={
                <ProtectedRoute allowedRole="client">
                  <PortalLayout sidebar={<ClientSidebar />}>
                    <ClientSubmitRequest />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/my-requests"
              element={
                <ProtectedRoute allowedRole="client">
                  <PortalLayout sidebar={<ClientSidebar />}>
                    <MyRequests />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/requests/:id"
              element={
                <ProtectedRoute allowedRole="client">
                  <PortalLayout sidebar={<ClientSidebar />}>
                    <RequestDetails />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/profile"
              element={
                <ProtectedRoute allowedRole="client">
                  <PortalLayout sidebar={<ClientSidebar />}>
                    <ClientProfile />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* Employee Portal Routes */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute allowedRole="employee">
                  <PortalLayout sidebar={<EmployeeSidebar />}>
                    <EmployeeDashboard />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/change-password"
              element={
                <ProtectedRoute allowedRole="employee">
                  <PortalLayout sidebar={<EmployeeSidebar />}>
                    <ChangePassword />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/tasks"
              element={
                <ProtectedRoute allowedRole="employee">
                  <PortalLayout sidebar={<EmployeeSidebar />}>
                    <EmployeeTasks />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/projects"
              element={
                <ProtectedRoute allowedRole="employee">
                  <PortalLayout sidebar={<EmployeeSidebar />}>
                    <MyProjects />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/projects/:id"
              element={
                <ProtectedRoute allowedRole="employee">
                  <PortalLayout sidebar={<EmployeeSidebar />}>
                    <MyProjectDetails />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/profile"
              element={
                <ProtectedRoute allowedRole="employee">
                  <PortalLayout sidebar={<EmployeeSidebar />}>
                    <EmployeeProfile />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/team"
              element={
                <ProtectedRoute allowedRole="employee">
                  <PortalLayout sidebar={<EmployeeSidebar />}>
                    <EmployeeTeam />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* Manager Portal Routes */}
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRole="manager">
                  <PortalLayout sidebar={<ManagerSidebar />}>
                    <ManagerDashboard />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/change-password"
              element={
                <ProtectedRoute allowedRole="manager">
                  <PortalLayout sidebar={<ManagerSidebar />}>
                    <ChangePassword />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/projects"
              element={
                <ProtectedRoute allowedRole="manager">
                  <PortalLayout sidebar={<ManagerSidebar />}>
                    <ManagerProjects />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/requests"
              element={
                <ProtectedRoute allowedRole="manager">
                  <PortalLayout sidebar={<ManagerSidebar />}>
                    <ManagerRequests />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/team"
              element={
                <ProtectedRoute allowedRole="manager">
                  <PortalLayout sidebar={<ManagerSidebar />}>
                    <ManagerTeam />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/add-employee"
              element={
                <ProtectedRoute allowedRole="manager">
                  <PortalLayout sidebar={<ManagerSidebar />}>
                    <ManageEmployees />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/add-client"
              element={
                <ProtectedRoute allowedRole="manager">
                  <PortalLayout sidebar={<ManagerSidebar />}>
                    <AddClient />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/profile"
              element={
                <ProtectedRoute allowedRole="manager">
                  <PortalLayout sidebar={<ManagerSidebar />}>
                    <ManagerProfile />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/projects/:projectId"
              element={
                <ProtectedRoute allowedRole="manager">
                  <PortalLayout sidebar={<ManagerSidebar />}>
                    <ProjectDetails />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/requests/:id"
              element={
                <ProtectedRoute allowedRole="manager">
                  <PortalLayout sidebar={<ManagerSidebar />}>
                    <ManagerRequestDetails />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
