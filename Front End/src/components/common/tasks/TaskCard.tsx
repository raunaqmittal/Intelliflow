import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, FolderOpen, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskWithDetails, TaskStatus } from '@/types'

interface TaskCardProps {
  task: TaskWithDetails
  onStatusChange?: (taskId: number, newStatus: TaskStatus) => void
  showProject?: boolean
  className?: string
}

export function TaskCard({ task, onStatusChange, showProject = true, className }: TaskCardProps) {
  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(task.task_id, newStatus)
    }
  }

  const getNextStatus = (currentStatus: TaskStatus): TaskStatus | null => {
    switch (currentStatus) {
      case 'Pending':
        return 'In Progress'
      case 'In Progress':
        return 'Done'
      case 'Done':
        return null
      default:
        return null
    }
  }

  const nextStatus = getNextStatus(task.status)

  return (
    <Card className={cn(
      "bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 group",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {task.task_name}
            </h4>
            {(task.role_name || task.department_name) && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="w-3 h-3" />
                {task.role_name && <span>{task.role_name}</span>}
                {task.role_name && task.department_name && <span>•</span>}
                {task.department_name && <span>{task.department_name}</span>}
              </div>
            )}
          </div>
          <StatusBadge status={task.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Project & Sprint Info */}
        {showProject && task.project_title && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{task.project_title}</span>
            </div>
            {task.sprint_name && (
              <Badge variant="outline" className="text-xs">
                {task.sprint_name}
              </Badge>
            )}
          </div>
        )}

        {/* Task ID */}
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>Task #{task.task_id}</span>
        </div>

        {/* Action Button */}
        {nextStatus && onStatusChange && (
          <div className="pt-2 border-t border-border">
            <Button
              size="sm"
              onClick={() => handleStatusChange(nextStatus)}
              className="w-full bg-gradient-primary hover:bg-primary-light transition-all duration-200"
            >
              <span>Mark as {nextStatus}</span>
              <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
          </div>
        )}
        
        {task.status === 'Done' && (
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-status-done font-medium text-center py-2">
              ✓ Task Completed
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}