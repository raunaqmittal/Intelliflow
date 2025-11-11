import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

type DashboardData = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  pendingRequests: number;
  recentProjects: Array<{
    _id: string;
    project_title: string;
    status: string;
    category: string;
    createdAt: string;
  }>;
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/clients/me/dashboard');
        const data: DashboardData = res.data?.data || {};
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to load client dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
        <div className="p-8 space-y-8">
            <Skeleton className="h-12 w-1/3" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
            <div className="grid grid-cols-1 gap-6">
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
  }

  if (!dashboardData) {
    return <div className="p-8 text-center text-muted-foreground">No data available.</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Dashboard</h1>
          <p className="text-muted-foreground">Here's a summary of your projects with us.</p>
        </div>
        <Link to="/client/submit">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Submit New Request
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData.totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{dashboardData.activeProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{dashboardData.completedProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{dashboardData.pendingRequests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your most recently created projects.</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.recentProjects.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentProjects.map(project => (
                <div key={project._id} className="p-4 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{project.project_title}</h3>
                    <Badge variant="secondary">{project.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{project.category}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No projects yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
