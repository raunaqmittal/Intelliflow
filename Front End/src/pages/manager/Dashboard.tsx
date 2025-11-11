import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { loadProjects } from '@/utils/dataParser';
import type { Project } from '@/types';
import api from '@/lib/api';
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// A simple component to show while data is loading
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  </div>
);

export default function ManagerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Array<{
    _id: string;
    title: string;
    status: string;
    createdAt?: string;
    approvalsByDepartment?: Array<{ department: string; approved: boolean }>;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const { setUserRole, employee } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deptChoice, setDeptChoice] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectData, requestRes] = await Promise.all([
          loadProjects(),
          api.get('/requests')
        ]);

        setProjects(projectData);

        // Compute pending approvals from requests (workflow-generated or under_review)
        type ReqLite = { _id: string; title: string; status: string; createdAt?: string; approvalsByDepartment?: Array<{ department: string; approved: boolean }> };
        const rawReqs = (requestRes.data?.data?.requests || []) as Array<Record<string, unknown>>;
        const reqs: ReqLite[] = rawReqs
          .filter((r) => typeof r._id === 'string' && typeof r.title === 'string' && typeof r.status === 'string')
          .map((r) => ({
            _id: r._id as string,
            title: r.title as string,
            status: r.status as string,
            createdAt: typeof r.createdAt === 'string' ? (r.createdAt as string) : undefined,
            approvalsByDepartment: Array.isArray(r.approvalsByDepartment) ? (r.approvalsByDepartment as Array<{ department: string; approved: boolean }>) : []
          }));
        const pending = reqs.filter((r) => r.status === 'workflow_generated' || r.status === 'under_review');
        setPendingRequests(pending);

      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pendingProjects = projects.filter(p => p.status === 'Pending');
  const activeProjects = projects.filter(p => p.status === 'In Progress');

  // Manager departments for visibility checks (case-insensitive)
  const myDeptSet = new Set((employee?.approvesDepartments || []).map((d) => (d || '').toLowerCase()));

  const approveDept = async (reqId: string, departments: string[]) => {
    if (!reqId) return;
    setBusyId(reqId);
    try {
      const pendingMine = departments.filter((d) => myDeptSet.has((d || '').toLowerCase()));
      if (pendingMine.length === 0) {
        toast({ title: 'No pending department for you on this request', variant: 'destructive' });
        setBusyId(null);
        return;
      }
      let body: Record<string, string> | undefined = undefined;
      const chosen = deptChoice[reqId];
      if (pendingMine.length > 1) {
        const dept = chosen || pendingMine[0];
        body = { department: dept };
      } else {
        body = { department: pendingMine[0] };
      }
      await api.post(`/requests/${reqId}/department-approve`, body);
      toast({ title: 'Department approved' });
      // Refresh requests
      const requestRes = await api.get('/requests');
      const rawReqs = (requestRes.data?.data?.requests || []) as Array<Record<string, unknown>>;
      const reqs = rawReqs
        .filter((r) => typeof r._id === 'string' && typeof r.title === 'string' && typeof r.status === 'string')
        .map((r) => ({
          _id: r._id as string,
          title: r.title as string,
          status: r.status as string,
          createdAt: typeof r.createdAt === 'string' ? (r.createdAt as string) : undefined,
          approvalsByDepartment: Array.isArray(r.approvalsByDepartment) ? (r.approvalsByDepartment as Array<{ department: string; approved: boolean }>) : []
        }))
        .filter((r) => r.status === 'workflow_generated' || r.status === 'under_review');
      setPendingRequests(reqs);
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Failed to approve department';
      toast({ title: 'Action failed', description: msg, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your projects, team workload, and pending approvals.
          </p>
        </div>
      </div>

      {/* Pending Approvals (Requests awaiting workflow/department approvals) */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((req) => {
                const pendingDepts = (req.approvalsByDepartment || [])
                  .filter((d) => !d.approved)
                  .map((d) => d.department);
                const myPending = pendingDepts.filter((d) => myDeptSet.has((d || '').toLowerCase()));
                const canDeptApprove = myPending.length > 0;
                return (
                  <div key={req._id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{req.title}</h3>
                      <p className="text-sm text-muted-foreground">{req.status.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {canDeptApprove && (
                        <div className="flex items-center gap-2">
                          {myPending.length > 1 && (
                            <Select
                              onValueChange={(v) => setDeptChoice((prev) => ({ ...prev, [req._id]: v }))}
                              defaultValue={deptChoice[req._id]}
                            >
                              <SelectTrigger className="w-44">
                                <SelectValue placeholder="Choose department" />
                              </SelectTrigger>
                              <SelectContent>
                                {myPending.map((d) => (
                                  <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyId === req._id}
                            onClick={() => approveDept(req._id, pendingDepts)}
                          >
                            Approve My Department
                          </Button>
                        </div>
                      )}
                      <Link to={`/manager/requests/${req._id}`}>
                        <Button variant="outline" size="sm">Review</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">No requests are currently pending approval.</p>
          )}
        </CardContent>
      </Card>

      {/* Active Projects - This is now dynamic */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Projects</CardTitle>
          <Link to="/manager/projects">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeProjects.map((project) => (
              <div key={project.project_id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <h3 className="font-semibold">{project.project_title}</h3>
                  <p className="text-sm text-muted-foreground">{project.client_name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={project.status} variant="project" />
                  <Link to={`/manager/projects/${project.project_id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Workload section removed as requested */}
    </div>
  );
}

