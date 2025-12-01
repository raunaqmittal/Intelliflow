import { useState } from "react";
import { LayoutDashboard, FolderKanban, PlusCircle, User, Menu, X, LogOut, FileText } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";

// Updated navigation items for a client portal
const navigationItems = [
  {
    title: "Dashboard",
    url: "/client",
    icon: LayoutDashboard,
    description: "Project Overview",
    exact: true
  },
  {
    title: "My Projects",
    url: "/client/projects",
    icon: FolderKanban,
    description: "View All Projects",
    exact: true
  },
  {
    title: "Submit Request",
    url: "/client/submit",
    icon: PlusCircle,
    description: "Start a New Project",
    exact: true
  },
  {
    title: "My Requests",
    url: "/client/my-requests",
    icon: FileText,
    description: "View Request Status",
    exact: true
  },
  {
    title: "Profile",
    url: "/client/profile",
    icon: User,
    description: "Contact Information",
    exact: true
  },
];

export function ClientSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border transition-all duration-300 ease-in-out",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="p-4 flex items-center justify-between flex-shrink-0">
        {/* 2. Changed title to "Client Portal" */}
        {!collapsed && <h1 className="text-xl font-bold text-primary">Intelliflow Client Portal</h1>}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <Menu /> : <X />}
        </Button>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.exact}
            className={({ isActive: navIsActive }) =>
              cn(
                "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group",
                "hover:bg-accent hover:text-accent-foreground",
                navIsActive
                  ? "bg-primary text-primary-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className={cn("transition-all", collapsed ? "h-5 w-5" : "h-5 w-5 mr-3")} />
            {!collapsed && (
              <div className="flex-1">
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs opacity-75">{item.description}</div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border flex-shrink-0">
        <Button variant="ghost" className="w-full justify-start text-left p-3" onClick={handleLogout}>
          <LogOut className={cn("transition-all", collapsed ? "h-5 w-5" : "h-5 w-5 mr-3")} />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}
