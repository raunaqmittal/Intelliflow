import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import type { TaskWithDetails } from '@/types'

interface TaskSummaryProps {
  tasks: TaskWithDetails[]
}

export function TaskSummary({ tasks }: TaskSummaryProps) {
  const taskCounts = {
    done: tasks.filter(t => t.status === 'Done').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    pending: tasks.filter(t => t.status === 'Pending').length,
    total: tasks.length
  }

  const completionRate = taskCounts.total > 0 
    ? Math.round((taskCounts.done / taskCounts.total) * 100) 
    : 0

  const summaryStats = [
    {
      label: 'Completed',
      value: taskCounts.done,
      icon: CheckCircle,
      color: 'text-status-done',
      bgColor: 'bg-status-done-bg',
      borderColor: 'border-status-done-border'
    },
    {
      label: 'In Progress',
      value: taskCounts.inProgress,
      icon: Clock,
      color: 'text-status-progress',
      bgColor: 'bg-status-progress-bg',
      borderColor: 'border-status-progress-border'
    },
    {
      label: 'Pending',
      value: taskCounts.pending,
      icon: AlertCircle,
      color: 'text-status-todo',
      bgColor: 'bg-status-todo-bg',
      borderColor: 'border-status-todo-border'
    }
  ]

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Task Overview</CardTitle>
          <Badge variant="outline" className="bg-gradient-status">
            {taskCounts.total} Total Tasks
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {summaryStats.map((stat) => (
            <div
              key={stat.label}
              className={`p-4 rounded-lg border transition-all duration-200 hover:scale-105 ${stat.bgColor} ${stat.borderColor}`}
            >
              <div className="flex items-center space-x-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Completion Percentage */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Completion Percentage</span>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-status-done" />
              <span className="text-lg font-bold text-status-done">{completionRate}%</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-status-done to-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}