import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";

interface Task {
  _id: string;
  task_name: string;
  status: 'Pending' | 'To Do' | 'In Progress' | 'Done' | 'Completed';
  sprint?: string;
  priority?: 'low' | 'medium' | 'high';
  description?: string;
}

interface ProjectStatusData {
  project: {
    _id: string;
    project_title: string;
    category?: string;
    framework?: string;
    status: string;
    requirements?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  taskSummary: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
  tasks: Task[];
}

export default function ClientProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProjectStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjectStatus = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.get(`/projects/${id}/client-status`);
        setData(res.data?.data || null);
      } catch (error) {
        console.error('Failed to load project status:', error);
        toast({ 
          title: 'Failed to load project', 
          description: 'Could not retrieve project details',
          variant: 'destructive' 
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProjectStatus();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-muted-foreground">
        Project not found or you don't have access.
      </div>
    );
  }

  const { project, taskSummary, tasks } = data;
  const completionPercent = taskSummary.total > 0 
    ? Math.round((taskSummary.completed / taskSummary.total) * 100) 
    : 0;

  const statusColor = (status: string) => {
    switch (status) {
      case 'Done':
      case 'Completed':
        return 'text-green-600';
      case 'In Progress':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const priorityBadgeVariant = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-8 space-y-8">
      <Link to="/client/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{project.project_title}</CardTitle>
          <CardDescription>
            {project.category && `${project.category} • `}
            {project.framework && `${project.framework} • `}
            <StatusBadge 
              status={
                (project.status === 'Approved' ? 'In Progress' : project.status) as 
                ('In Progress' | 'Completed' | 'Pending' | 'Cancelled')
              } 
              variant="project" 
            />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium">{project.status === 'Approved' ? 'In Progress' : project.status}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Created</div>
              <div className="font-medium">
                {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Last Updated</div>
              <div className="font-medium">
                {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>

          {project.requirements && (
            <div>
              <h3 className="font-medium mb-2">Requirements</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.requirements}</p>
            </div>
          )}

          {/* Task Summary */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Project Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <ListTodo className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">{taskSummary.total}</div>
                      <div className="text-sm text-muted-foreground">Total Tasks</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">{taskSummary.completed}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{taskSummary.inProgress}</div>
                      <div className="text-sm text-muted-foreground">In Progress</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                      {completionPercent}%
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{completionPercent}%</div>
                      <div className="text-sm text-muted-foreground">Complete</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{taskSummary.completed} of {taskSummary.total} tasks done</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            {/* Task List */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Task Breakdown</h3>
              {tasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Sprint</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.task_name}</div>
                            {task.description && (
                              <div className="text-sm text-muted-foreground mt-1">{task.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{task.sprint || '—'}</TableCell>
                        <TableCell>
                          {task.priority && (
                            <Badge variant={priorityBadgeVariant(task.priority)}>
                              {task.priority}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${statusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No tasks available yet.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
