import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCcw, CheckCircle2, Ban, Wand2, Users } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { matchesManagerDepartments, normalizeDept, expandDeptAliases } from '@/lib/departments';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerClose, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface SuggestedEmployee {
  employee: {
    _id: string;
    name: string;
    email: string;
    role?: string;
    department?: string;
    availability?: 'Available' | 'Busy' | 'On Leave';
  };
  matchScore: number;
  reason?: string;
}

interface WorkflowTask {
  _id: string;
  taskName: string;
  team?: string;
  estimatedHours?: number;
  requiredSkills?: string[];
  suggestedEmployees?: SuggestedEmployee[];
  assignedEmployees?: Array<{ _id?: string; name?: string; email?: string }>;
}

interface RequestDetailsModel {
  _id: string;
  title: string;
  description?: string;
  requirements?: string[];
  requestType: 'web_dev' | 'app_dev' | 'prototype' | 'research';
  status: 'submitted' | 'workflow_generated' | 'under_review' | 'approved' | 'rejected' | 'converted';
  createdAt: string;
  client?: { client_name?: string; contact_email?: string };
  generatedWorkflow?: {
    estimatedDuration?: number;
    taskBreakdown: WorkflowTask[];
  };
  approvalsByDepartment?: Array<{ 
    department: string; 
    approved: boolean; 
    rejected?: boolean;
    approvedBy?: { name?: string } | string; 
    rejectedBy?: { name?: string } | string;
    approvedAt?: string;
    rejectedAt?: string;
  }>;
  requiredDepartments?: string[];
}

const typeLabel = {
  web_dev: 'Web Dev',
  app_dev: 'App Dev',
  prototype: 'Prototyping',
  research: 'Research',
} as const;

export default function ManagerRequestDetails() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<RequestDetailsModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { employee, userRole } = useUser();
  // Keep original list for display/queries, and an alias-aware normalized set for comparisons
  const myDeptList = employee?.approvesDepartments || [];
  const myAliasSet = new Set(myDeptList.flatMap(expandDeptAliases).map(normalizeDept));
  const managerCanActForTeam = (team?: string) => {
    if (!team) return false;
    return myAliasSet.has(normalizeDept(team));
  };
  const [deptToApprove, setDeptToApprove] = useState<string | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTask, setDrawerTask] = useState<WorkflowTask | null>(null);
  const [teamEmployees, setTeamEmployees] = useState<Array<{ _id: string; name: string; email: string; department?: string; availability?: 'Available' | 'Busy' | 'On Leave' }>>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [availability, setAvailability] = useState<'' | 'Available' | 'Busy' | 'On Leave'>('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/requests/${id}`);
      const req: RequestDetailsModel = res.data?.data?.request || null;
      setData(req);
    } catch (e) {
      console.error('Failed to load request', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // define locally to avoid exhaustive-deps issue
    const run = async () => { await load(); };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTeamEmployees = async (task: WorkflowTask, availabilityFilter: '' | 'Available' | 'Busy' | 'On Leave') => {
    // Fetch ALL employees (like My Team does), then filter client-side for consistency
    const params: Record<string, string> = {};
    if (availabilityFilter) params.availability = availabilityFilter;
    try {
      const res = await api.get(`/employees`, { params });
      type EmployeeApi = { _id: string; name: string; email: string; department?: string; availability?: 'Available' | 'Busy' | 'On Leave' };
      const all = (res.data?.data?.employees || []) as EmployeeApi[];
      
      console.log('=== ASSIGNMENT DRAWER DEBUG ===');
      console.log('Total employees from API:', all.length);
      console.log('Manager departments:', myDeptList);
      console.log('Task team:', task.team);
      
      // Filter to manager's departments using the same logic as My Team page
      let filtered = all.filter(e => matchesManagerDepartments(e.department || '', myDeptList));
      console.log('After manager dept filter:', filtered.length);
      console.log('Filtered employees:', filtered.map(e => ({ name: e.name, dept: e.department })));
      
      // Optionally prefer employees matching the task's team if specified
      if (task.team) {
        const teamLower = normalizeDept(task.team);
        console.log('Normalized task.team:', teamLower);
        const teamMatches = filtered.filter((e) => {
          const empDept = normalizeDept(e.department || '');
          console.log(`  Comparing ${empDept} === ${teamLower}:`, empDept === teamLower);
          return empDept === teamLower;
        });
        console.log('Team matches found:', teamMatches.length);
        // Only narrow if we found exact matches, otherwise show all manager's dept employees
        filtered = teamMatches.length > 0 ? teamMatches : filtered;
        console.log('Final filtered after team matching:', filtered.length);
      }
      
      const mapped = filtered.map((e) => ({
        _id: String(e._id),
        name: e.name,
        email: e.email,
        department: e.department,
        availability: e.availability,
      }));
      console.log('Final mapped employees:', mapped.length);
      console.log('=== END DEBUG ===');
      setTeamEmployees(mapped);
    } catch (err) {
      console.error('Failed to load employees', err);
      setTeamEmployees([]);
    }
  };

  const openDrawerForTask = async (task: WorkflowTask) => {
    setDrawerTask(task);
    setSearch('');
    setAvailability('');
    // Pre-select currently assigned employees if available (ids)
    const pre = new Set<string>();
    (task.assignedEmployees || []).forEach((a) => {
      if (a && a._id) pre.add(a._id);
    });
    setSelectedIds(pre);

    await fetchTeamEmployees(task, '');

    setDrawerOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const saveAssignments = async () => {
    if (!id || !drawerTask) return;
    setBusy(true);
    try {
      const list = Array.from(selectedIds);
      await api.patch(`/requests/${id}/assign-employees`, { assignments: { [drawerTask._id]: list } });
      toast({ title: 'Assignments updated', description: `${list.length} ${list.length === 1 ? 'assignee' : 'assignees'} saved` });
      setDrawerOpen(false);
      await load();
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Failed to save assignments';
      toast({ title: 'Action failed', description: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const generateWorkflow = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await api.post(`/requests/${id}/generate-workflow`);
      toast({ title: 'Workflow generated', description: 'Employee suggestions have been added.' });
      await load();
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Failed to generate workflow';
      toast({ title: 'Action failed', description: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const refreshSuggestions = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await api.post(`/requests/${id}/refresh-suggestions`);
      toast({ title: 'Suggestions refreshed' });
      await load();
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Failed to refresh suggestions';
      toast({ title: 'Action failed', description: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await api.post(`/requests/${id}/approve`);
      toast({ title: 'Request approved', description: 'A project has been created from this request.' });
      navigate('/manager/projects');
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Failed to approve request';
      toast({ title: 'Action failed', description: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const approveMyDepartment = async () => {
    if (!id || !data) return;
    setBusy(true);
    try {
      // Determine which of my departments can be approved (pending or rejected)
      const approvable = (data.approvalsByDepartment || [])
        .filter(d => !d.approved)
        .map(d => d.department);
      const myApprovable = approvable.filter(d => managerCanActForTeam(d));
      // If multiple, use selected dropdown value
      let body: Record<string, string> | undefined = undefined;
      if (myApprovable.length > 1) {
        const chosen = deptToApprove || myApprovable[0];
        body = { department: chosen };
      } else if (myApprovable.length === 1) {
        body = { department: myApprovable[0] };
      } else {
        toast({ title: 'No department available to approve for you', variant: 'destructive' });
        return;
      }
      await api.post(`/requests/${id}/department-approve`, body);
      toast({ title: 'Department approved' });
      await load();
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Failed to approve department';
      toast({ title: 'Action failed', description: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const rejectMyDepartment = async () => {
    if (!id || !data) return;
    setBusy(true);
    try {
      // Determine which of my departments I can act on
      const actionable = (data.approvalsByDepartment || [])
        .filter(d => !d.rejected)
        .map(d => d.department);
      const myActionable = actionable.filter(d => managerCanActForTeam(d));
      // If multiple, use selected dropdown value
      let body: Record<string, string> | undefined = undefined;
      if (myActionable.length > 1) {
        const chosen = deptToApprove || myActionable[0];
        body = { department: chosen };
      } else if (myActionable.length === 1) {
        body = { department: myActionable[0] };
      } else {
        toast({ title: 'No department available to reject for you', variant: 'destructive' });
        return;
      }
      await api.post(`/requests/${id}/department-reject`, body);
      toast({ title: 'Department rejected' });
      await load();
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Failed to reject department';
      toast({ title: 'Action failed', description: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const assignEmployee = async (taskId: string, employeeId: string) => {
    if (!id) return;
    setBusy(true);
    try {
      await api.patch(`/requests/${id}/assign-employees`, { assignments: { [taskId]: [employeeId] } });
      toast({ title: 'Assigned', description: 'Employee assigned to task' });
      await load();
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Failed to assign employee';
      toast({ title: 'Action failed', description: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await api.post(`/requests/${id}/reject`);
      toast({ title: 'Request rejected' });
      await load();
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Failed to reject request';
      toast({ title: 'Action failed', description: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  }

  if (!data) {
    return <div className="p-8 text-muted-foreground">Request not found.</div>;
  }

  const canGenerate = data.status === 'submitted';
  const hasWorkflow = !!data.generatedWorkflow?.taskBreakdown?.length;
  const allDeptsApproved = (data.approvalsByDepartment || []).every(d => d.approved);
  const allTasksAssigned = (data.generatedWorkflow?.taskBreakdown || []).every(t => (t.assignedEmployees && t.assignedEmployees.length > 0));
  const canApprove = (data.status === 'workflow_generated' || data.status === 'under_review') && allDeptsApproved && allTasksAssigned;
  const canReject = canApprove || data.status === 'submitted';
  const myPendingDepts = (data.approvalsByDepartment || [])
    .filter(d => !d.approved && !d.rejected && managerCanActForTeam(d.department))
    .map(d => d.department);
  const myRejectedDepts = (data.approvalsByDepartment || [])
    .filter(d => d.rejected && !d.approved && managerCanActForTeam(d.department))
    .map(d => d.department);
  const myActionableDepts = (data.approvalsByDepartment || [])
    .filter(d => !d.approved && managerCanActForTeam(d.department))
    .map(d => d.department);
  const canDeptApprove = userRole === 'manager' && hasWorkflow && (myPendingDepts.length > 0 || myRejectedDepts.length > 0);
  const canDeptReject = userRole === 'manager' && hasWorkflow && myActionableDepts.length > 0;
  const pendingDepts = (data.approvalsByDepartment || []).filter(d => !d.approved && !d.rejected).map(d => d.department);
  const unassignedTasks = (data.generatedWorkflow?.taskBreakdown || []).filter(t => !(t.assignedEmployees && t.assignedEmployees.length > 0));

  return (
    <div className="p-8 space-y-8">
      <Link to="/manager/requests" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Requests
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{data.title}</CardTitle>
          <CardDescription>
            Type: {typeLabel[data.requestType]} • Status: <Badge variant="secondary">{data.status.replace(/_/g, ' ')}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client and Meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Client</div>
              <div className="font-medium">{data.client?.client_name || '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Client Email</div>
              <div className="font-medium">{data.client?.contact_email || '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Submitted</div>
              <div className="font-medium">{new Date(data.createdAt).toLocaleString()}</div>
            </div>
          </div>

          {data.description && (
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.description}</p>
            </div>
          )}

          {(data.requirements && data.requirements.length > 0) && (
            <div>
              <h3 className="font-medium">Requirements</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {data.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            {canGenerate && (
              <Button onClick={generateWorkflow} disabled={busy}>
                <Wand2 className="h-4 w-4 mr-2" /> Generate Workflow
              </Button>
            )}
            {hasWorkflow && (
              <Button variant="outline" onClick={refreshSuggestions} disabled={busy}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Refresh Suggestions
              </Button>
            )}
            {canDeptApprove && (
              <div className="flex items-center gap-2">
                {(myPendingDepts.length + myRejectedDepts.length) > 1 && (
                  <Select onValueChange={(v) => setDeptToApprove(v)} defaultValue={deptToApprove}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Choose department" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...myPendingDepts, ...myRejectedDepts].map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="secondary" onClick={approveMyDepartment} disabled={busy}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Approve My Department
                </Button>
              </div>
            )}
            {canDeptReject && (
              <div className="flex items-center gap-2">
                {myActionableDepts.length > 1 && !canDeptApprove && (
                  <Select onValueChange={(v) => setDeptToApprove(v)} defaultValue={deptToApprove}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Choose department" />
                    </SelectTrigger>
                    <SelectContent>
                      {myActionableDepts.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" onClick={rejectMyDepartment} disabled={busy}>
                  <Ban className="h-4 w-4 mr-2" /> Reject My Department
                </Button>
              </div>
            )}
            {canApprove && (
              <Button variant="default" onClick={approve} disabled={busy}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
              </Button>
            )}
            {canReject && (
              <Button variant="destructive" onClick={reject} disabled={busy}>
                <Ban className="h-4 w-4 mr-2" /> Reject
              </Button>
            )}
          </div>

          {hasWorkflow && (
            <div className="space-y-3">
              <Separator />
              <h3 className="text-lg font-semibold">Generated Workflow</h3>
              {/* Guidance if final approve is disabled */}
              {!canApprove && (
                <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/30">
                  <div className="font-medium text-foreground mb-1">To enable Final Approve:</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Pending departments: {pendingDepts.length > 0 ? pendingDepts.join(', ') : 'None'}
                    </li>
                    <li>
                      Unassigned tasks: {unassignedTasks.length}
                    </li>
                  </ul>
                </div>
              )}
              {/* Approvals overview */}
              <div className="text-sm">
                <div className="font-medium mb-2">Department Approvals</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarked By</TableHead>
                      <TableHead>Remarked At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.approvalsByDepartment || []).map((d) => (
                      <TableRow key={d.department}>
                        <TableCell className="font-medium">{d.department}</TableCell>
                        <TableCell>
                          <Badge variant={d.approved ? 'default' : d.rejected ? 'destructive' : 'secondary'}>
                            {d.approved ? 'Approved' : d.rejected ? 'Rejected' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {d.approved && typeof d.approvedBy === 'object' ? d.approvedBy?.name : ''}
                          {d.rejected && typeof d.rejectedBy === 'object' ? d.rejectedBy?.name : ''}
                        </TableCell>
                        <TableCell>
                          {d.approvedAt ? new Date(d.approvedAt).toLocaleString() : ''}
                          {d.rejectedAt ? new Date(d.rejectedAt).toLocaleString() : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Est. Hours</TableHead>
                    <TableHead>Required Skills</TableHead>
                    <TableHead>Suggested</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.generatedWorkflow!.taskBreakdown.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell className="font-medium">{t.taskName}</TableCell>
                      <TableCell>{t.team || '-'}</TableCell>
                      <TableCell>{t.estimatedHours ?? '-'}</TableCell>
                      <TableCell>{(t.requiredSkills || []).join(', ')}</TableCell>
                      <TableCell>
                        {t.suggestedEmployees && t.suggestedEmployees.length > 0 ? (
                          <div className="space-y-1">
                            {t.suggestedEmployees.slice(0, 3).map((se) => (
                              <div key={se.employee._id} className="text-sm">
                                <span className="font-medium">{se.employee.name}</span>
                                <span className="text-muted-foreground"> — {se.employee.availability || 'Unknown'} • {Math.round(se.matchScore)}%</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No suggestions</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(t.assignedEmployees || []).length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">{(t.assignedEmployees || []).length} assignee(s)</div>
                            <div>{(t.assignedEmployees || []).map(a => a?.name).join(', ')}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {t.team && managerCanActForTeam(t.team) && (
                          <Button variant="outline" size="sm" className="ml-2" onClick={() => openDrawerForTask(t)}>
                            <Users className="h-4 w-4 mr-1" /> Assign team
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Assign team members</DrawerTitle>
            <DrawerDescription>
              {drawerTask?.taskName} {drawerTask?.team ? `• Team: ${drawerTask.team}` : ''}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:flex-1" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Availability</span>
                <Select
                  value={availability || 'All'}
                  onValueChange={async (v) => {
                    const val = v === 'All' ? '' : (v as 'Available' | 'Busy' | 'On Leave');
                    setAvailability(val);
                    if (drawerTask) await fetchTeamEmployees(drawerTask, val);
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Busy">Busy</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="max-h-72 overflow-auto border rounded-md divide-y">
              {teamEmployees
                .filter((e) => {
                  const q = search.trim().toLowerCase();
                  if (!q) return true;
                  return (e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q));
                })
                .map((e) => (
                  <label key={e._id} className="flex items-center gap-3 p-3 cursor-pointer">
                    <Checkbox checked={selectedIds.has(e._id)} onCheckedChange={() => toggleSelect(e._id)} />
                    <div className="flex-1">
                      <div className="font-medium">{e.name}</div>
                      <div className="text-xs text-muted-foreground">{e.email} • {e.department || '—'} • {e.availability || 'Unknown'}</div>
                    </div>
                  </label>
              ))}
              {teamEmployees.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No team employees found.</div>
              )}
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={saveAssignments} disabled={busy}>Save assignments</Button>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
