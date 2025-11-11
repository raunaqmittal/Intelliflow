import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { loadEmployees, loadTasks } from '@/utils/dataParser';
import type { Employee } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { normalizeDept } from '@/lib/departments';

const TeamSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3].map((i) => (
      <Card key={i}>
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

interface TeamMemberWithTasks extends Employee { task_count: number }

export default function EmployeeTeam() {
  const { employee: me } = useUser();
  const [team, setTeam] = useState<TeamMemberWithTasks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [employees, tasks] = await Promise.all([
          loadEmployees(),
          loadTasks()
        ]);
        const myDeptKey = normalizeDept(me?.department || '');
        const scoped = employees.filter(e => normalizeDept(e.department || '') === myDeptKey);
        const withCounts = scoped.map(m => ({
          ...m,
          task_count: tasks.filter(t => t.assigned_to === m.employee_id).length
        }));
        setTeam(withCounts);
      } catch (err) {
        console.error('Failed to load my team', err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [me?.department]);

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <h1 className="text-3xl font-bold text-foreground">My Team</h1>
        <TeamSkeleton />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">My Team</h1>
        <p className="text-muted-foreground">Employees in your department</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map(member => (
          <Card key={member.employee_id} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${member.employee_id}`} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Current Tasks</p>
                  <p className="font-medium">{member.task_count}</p>
                </div>
                {member.role && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="text-sm font-medium truncate max-w-[140px]" title={member.role}>{member.role}</p>
                  </div>
                )}
                {Array.isArray(member.skills) && member.skills.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Skills</p>
                    <p className="text-xs text-foreground line-clamp-2" title={member.skills.join(', ')}>
                      {member.skills.slice(0,5).join(', ')}{member.skills.length > 5 ? '…' : ''}
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={member.availability} variant="availability" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
