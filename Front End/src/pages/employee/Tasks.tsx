import { useState, useEffect } from 'react'
import { TaskCard } from '@/components/common/tasks/TaskCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
// Added the LogOut icon to the import list
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  LogOut 
} from 'lucide-react'
import { getTasksForEmployee } from '@/utils/dataParser'
import type { TaskWithDetails, TaskStatus } from '@/types'
import { useUser } from '@/contexts/UserContext'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function Tasks() {
  const { employee } = useUser();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TaskWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchTasks() {
      try {
        if (!employee) return;
        const employeeTasks = await getTasksForEmployee(employee.employee_id)
        setTasks(employeeTasks)
        setFilteredTasks(employeeTasks)
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [employee])

  // Apply filters
  useEffect(() => {
    let filtered = tasks

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.task_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.sprint_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    setFilteredTasks(filtered)
  }, [tasks, searchQuery, statusFilter])

  const handleTaskStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.task_id === taskId);
    if (!task?._id) {
      toast({
        title: "Update Failed",
        description: "Task ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update in backend
      await api.patch(`/tasks/${task._id}/status`, { status: newStatus });
      
      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.task_id === taskId ? { ...t, status: newStatus } : t
        )
      );
      
      toast({
        title: "Status Updated",
        description: `Task marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  }

  const taskCounts = {
    all: tasks.length,
    'Done': tasks.filter(t => t.status === 'Done').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    'Pending': tasks.filter(t => t.status === 'Pending').length,
  }

  const statusIcons = {
    'Done': CheckCircle,
    'In Progress': Clock,
    'Pending': AlertCircle
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
<div className="space-y-2">
  <h1 className="text-3xl font-bold text-foreground">My Profile</h1> {/* Or "My Tasks" */}
  <p className="text-muted-foreground">
    {/* ... page description ... */}
  </p>
</div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks, projects, or sprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks ({taskCounts.all})</SelectItem>
              {Object.entries(taskCounts).map(([status, count]) => {
                if (status === 'all') return null
                const Icon = statusIcons[status as keyof typeof statusIcons]
                return (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{status} ({count})</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Task Count Badge */}
        <Badge variant="outline" className="bg-gradient-status">
          {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
        </Badge>
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task, index) => (
            <TaskCard
              key={task.task_id}
              task={task}
              onStatusChange={handleTaskStatusChange}
              className="animate-slide-up"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Tasks Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all' 
              ? "No tasks match your current filters. Try adjusting your search or filter criteria."
              : "You don't have any tasks assigned yet. Check back later or contact your project manager."
            }
          </p>
          {(searchQuery || statusFilter !== 'all') && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}