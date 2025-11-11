import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { TaskStatus, AvailabilityStatus, ProjectStatus } from "@/types"

interface StatusBadgeProps {
  status: TaskStatus | AvailabilityStatus | ProjectStatus
  variant?: 'task' | 'availability' | 'project'
  className?: string
}

const taskStatusStyles = {
  'Done': 'bg-status-done-bg text-status-done border-status-done-border',
  'In Progress': 'bg-status-progress-bg text-status-progress border-status-progress-border',
  'Pending': 'bg-status-todo-bg text-status-todo border-status-todo-border'
} as const

const availabilityStatusStyles = {
  'Available': 'bg-status-done-bg text-available border-status-done-border',
  'Busy': 'bg-status-progress-bg text-busy border-status-progress-border', 
  'On Leave': 'bg-status-todo-bg text-leave border-status-todo-border'
} as const

const projectStatusStyles = {
  'Completed': 'bg-status-done-bg text-status-done border-status-done-border',
  'In Progress': 'bg-status-progress-bg text-status-progress border-status-progress-border',
  'Pending': 'bg-status-todo-bg text-status-todo border-status-todo-border',
  'Cancelled': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800'
} as const

export function StatusBadge({ status, variant = 'task', className }: StatusBadgeProps) {
  const styles = variant === 'task' 
    ? taskStatusStyles[status as TaskStatus]
    : variant === 'availability'
    ? availabilityStatusStyles[status as AvailabilityStatus]
    : projectStatusStyles[status as ProjectStatus]

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border transition-colors whitespace-nowrap px-2.5 py-0.5 text-xs",
        "inline-flex items-center justify-center",
        styles,
        className
      )}
    >
      {status}
    </Badge>
  )
}