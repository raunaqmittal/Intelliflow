import { useState, useEffect } from 'react'
import { ProfileCard } from '@/components/common/dashboard/ProfileCard'
import { TaskSummary } from '@/components/common/dashboard/TaskSummary'
import { TaskCard } from '@/components/common/tasks/TaskCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import type { TaskStatus } from '@/types'
import { useUser } from '@/contexts/UserContext' // Import useUser to access employee ID

type DashboardTask = {
  _id: string;
  task_id: number;
  task_name: string;
  status: string;
  priority?: string;
  sprint?: number;
  createdAt: string;
  project?: {
    project_title?: string;
    client_name?: string;
  };
};

type DashboardProject = {
  _id: string;
  project_title: string;
  status: string;
  client_name?: string;
};

type DashboardData = {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  completionRate: number;
  recentTasks: DashboardTask[];
  projects: DashboardProject[];
};

const mapTaskStatus = (s: string): TaskStatus => {
  if (s === 'Completed' || s === 'Done') return 'Done';
  if (s === 'To Do' || s === 'Pending') return 'Pending';
  if (s === 'In Progress') return 'In Progress';
  return 'Pending';
};

export default function Dashboard() {
  const { employee } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      if (!employee) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/employees/me/dashboard');
        const data: DashboardData = res.data?.data || {};
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [employee]);

  // Recent tasks on dashboard are read-only: status changes happen on the full Tasks page.

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg-col-span-1">
            <div className="h-80 bg-muted rounded-lg animate-pulse"></div>
          </div>
          <div className="lg-col-span-2">
            <div className="h-80 bg-muted rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return <div className="p-6 text-center text-muted-foreground">No data available.</div>;
  }

  // Convert dashboard data to TaskWithDetails format for existing components
  const tasksForSummary = Array.from({ length: dashboardData.totalTasks }, (_, i) => ({
    task_id: i,
    sprint_id: 0,
    task_name: '',
    department_id: 0,
    role_id: 0,
    assigned_to: employee?.employee_id || 0,
    status: (i < dashboardData.completedTasks ? 'Done' : (i < dashboardData.completedTasks + dashboardData.inProgressTasks ? 'In Progress' : 'Pending')) as TaskStatus,
    assigned_employee: null,
  }));

  // Limit recent tasks to 3 for dashboard view
  const recentTasksToShow = dashboardData.recentTasks.slice(0, 3);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground">
            Track your tasks, monitor progress, and stay productive.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card is now self-sufficient via context */}
        <div className="lg:col-span-1">
          <Link to="/employee/profile" className="focus-ring rounded-lg block">
            <ProfileCard />
          </Link>
        </div>

        {/* Right Column - Task Overview */}
        <div className="lg:col-span-2">
          <TaskSummary tasks={tasksForSummary} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData.totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{dashboardData.pendingTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{dashboardData.inProgressTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{dashboardData.completedTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Completion Percentage: {dashboardData.completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Recent Tasks</h2>
          <Link to="/employee/tasks">
            <Button variant="outline" className="group">
              View All Tasks
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {recentTasksToShow.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTasksToShow.map((task) => (
              <TaskCard
                key={task._id}
                task={{
                  task_id: task.task_id,
                  sprint_id: task.sprint || 0,
                  task_name: task.task_name,
                  department_id: 0,
                  role_id: 0,
                  assigned_to: employee?.employee_id || 0,
                  status: mapTaskStatus(task.status),
                  assigned_employee: null,
                  project_title: task.project?.project_title,
                  _id: task._id,
                }}
                className="animate-slide-up"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No Tasks Assigned</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You don't have any tasks assigned yet. Check back later or contact your project manager.
            </p>
          </div>
        )}
      </div>

      {/* Projects section removed: moved to dedicated My Projects page */}
    </div>
  )
}