import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { getProjectDetails } from '@/utils/dataParser';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type { Project, Sprint, Employee, TaskWithDetails } from '@/types';

// Combined type for the detailed project data
interface ProjectDetailsData {
  project: Project;
  sprints: Sprint[];
  tasks: TaskWithDetails[];
  teamMembers: Employee[];
}

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const { employee } = useUser();
  const { toast } = useToast();
  const [details, setDetails] = useState<ProjectDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  const fetchData = async () => {
    if (!projectId) return;
    try {
      const projectDetails = await getProjectDetails(Number(projectId));
      setDetails(projectDetails);
    } catch (error) {
      console.error("Failed to load project details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleAdvanceSprint = async () => {
    if (!details?.project._id) return;

    setAdvancing(true);
    try {
      await api.patch(`/projects/${details.project._id}/advance-sprint`);
      
      toast({
        title: "Sprint Advanced",
        description: details.project.activeSprintNumber === details.project.totalSprints
          ? "Project completed successfully!"
          : `Advanced to Sprint ${(details.project.activeSprintNumber || 1) + 1}`,
      });

      // Refresh project details
      await fetchData();
    } catch (error) {
      console.error('Error advancing sprint:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: "Failed to Advance Sprint",
        description: err.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  }

  if (!details) {
    return <div className="p-8 text-center text-muted-foreground">Project not found.</div>;
  }

  const { project, sprints, tasks, teamMembers } = details;

  // Determine if current sprint is complete
  const currentSprint = project.activeSprintNumber || 1;
  const currentSprintTasks = tasks.filter(t => t.sprint_number === currentSprint);
  const currentSprintComplete = currentSprintTasks.length > 0 && 
    currentSprintTasks.every(t => t.status === 'Done');

  // Debug logging
  console.log('Project:', project);
  console.log('Current Sprint:', currentSprint);
  console.log('Total Sprints:', project.totalSprints);
  console.log('All Tasks:', tasks);
  console.log('Current Sprint Tasks:', currentSprintTasks);
  console.log('Current Sprint Complete:', currentSprintComplete);
  console.log('Manager Departments:', employee?.approvesDepartments);

  // Check if manager has authority - should be able to advance if they managed current sprint
  const managerDepts = (employee?.approvesDepartments || []).map(d => d.toLowerCase());
  
  // Check authority based on CURRENT sprint (the one that's complete)
  const currentSprintDepts = new Set(
    currentSprintTasks
      .map(t => t.assigned_employee?.department?.toLowerCase())
      .filter(Boolean)
  );
  
  console.log('Current Sprint Departments:', Array.from(currentSprintDepts));
  console.log('Manager Departments (lowercase):', managerDepts);
  
  const hasAuthorityForCurrentSprint = Array.from(currentSprintDepts).some(dept => {
    console.log(`Checking if manager has '${dept}':`, managerDepts.includes(dept as string));
    return managerDepts.includes(dept as string);
  });

  console.log('Has Authority for Current Sprint:', hasAuthorityForCurrentSprint);

  const canAdvance = currentSprintComplete && 
                     currentSprint <= (project.totalSprints || 1) &&
                     hasAuthorityForCurrentSprint;

  console.log('Can Advance:', canAdvance);

  const isOnFinalSprint = currentSprint === project.totalSprints;
  
  // Display sprint number (cap at totalSprints if project is completed)
  const displaySprintNumber = currentSprint > (project.totalSprints || 1) 
    ? project.totalSprints 
    : currentSprint;
  
  const isProjectCompleted = project.status === 'Completed' || currentSprint > (project.totalSprints || 1);

  return (
    <div className="p-8 space-y-8">
      <Link to="/manager/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to All Projects
      </Link>
      
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{project.project_title}</CardTitle>
              <CardDescription>Client: {project.client_name}</CardDescription>
            </div>
            {project.totalSprints && (
              <div className="text-right">
                {isProjectCompleted ? (
                  <Badge variant="default" className="mb-2 bg-green-600">
                    ✓ Project Completed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mb-2">
                    Sprint {displaySprintNumber} of {project.totalSprints}
                  </Badge>
                )}
                {canAdvance && (
                  <Button 
                    onClick={handleAdvanceSprint}
                    disabled={advancing}
                    className="ml-2"
                  >
                    {advancing ? (
                      "Processing..."
                    ) : isOnFinalSprint ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Project
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Advance to Sprint {currentSprint + 1}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Badge className="whitespace-nowrap">{project.framework}</Badge>
          <StatusBadge status={project.status} variant="project" />
          <Badge variant="outline" className="whitespace-nowrap">{project.category}</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sprints and Tasks Column */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold">Sprints & Tasks</h2>
          {sprints.map(sprint => {
            const sprintTasks = tasks.filter(t => t.sprint_id === sprint.sprint_id);
            return (
              <Card key={sprint.sprint_id}>
                <CardHeader>
                  <CardTitle>{sprint.sprint_name}</CardTitle>
                  <Badge variant={sprint.status === 'Completed' ? 'default' : 'secondary'} className="w-fit">{sprint.status}</Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {sprintTasks.map(task => (
                      <li key={task.task_id} className="flex items-center justify-between p-3 rounded-md border">
                        <div>
                          <p className="font-medium">{task.task_name}</p>
                          <p className="text-xs text-muted-foreground">Assigned to: {task.assigned_employee?.name || 'Unassigned'}</p>
                        </div>
                        <Badge variant="outline">{task.status}</Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Team Members Column */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Project Team</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              {teamMembers.map(member => (
                <div key={member.employee_id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${member.employee_id}`} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate" title={member.email}>
                      {member.email}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
