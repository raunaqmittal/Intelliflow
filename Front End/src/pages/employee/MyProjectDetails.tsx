import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface ProjectSafe {
  _id: string
  project_title: string
  requirements?: string
  status: string
  activeSprintNumber?: number
  totalSprints?: number
}

interface TaskSafe {
  _id: string
  task_id: number
  task_name: string
  status: 'Pending' | 'To Do' | 'In Progress' | 'Done' | 'Completed'
  priority?: string
  sprint?: number
  sprint_number?: number
  description?: string
}

interface WorkflowSprintSummary {
  sprintNumber: number
  total: number
  completed: number
  inProgress: number
  pending: number
}

interface ApiResponse {
  project: ProjectSafe
  workflow: {
    totalSprints: number
    activeSprintNumber: number
    sprints: WorkflowSprintSummary[]
  }
  tasks: TaskSafe[]
}

export default function MyProjectDetails() {
  const { id } = useParams()
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await api.get(`/employees/me/projects/${id}`)
        setData(res.data?.data || null)
      } catch (e) {
        console.error('Failed to load project details', e)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchDetails()
  }, [id])

  const groupedTasks = useMemo(() => {
    const map = new Map<number, TaskSafe[]>()
    if (!data) return map
    for (const t of data.tasks) {
      // Normalize sprint to a positive integer; hide Sprint 0 or invalid
      let sn: number = 0
      if (typeof t.sprint_number === 'number') {
        sn = t.sprint_number
      } else if ((t as { sprint?: number | string }).sprint != null) {
        const raw = (t as { sprint?: number | string }).sprint
        if (typeof raw === 'number') sn = raw
        else if (typeof raw === 'string') {
          const m = raw.match(/(\d+)/)
          sn = m ? parseInt(m[1], 10) : 0
        }
      }
      if (sn <= 0) continue
      if (!map.has(sn)) map.set(sn, [])
      map.get(sn)!.push(t)
    }
    return map
  }, [data])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="h-4 bg-muted rounded w-96 animate-pulse" />
        <div className="h-48 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!data) {
    return <div className="p-6 text-muted-foreground">Project not found or you don't have access.</div>
  }

  const { project, workflow } = data
  const isCompleted = project.status === 'Completed'
  const sprintLabel = isCompleted
    ? 'Completed'
    : project.totalSprints && project.activeSprintNumber
      ? `Sprint ${Math.min(project.activeSprintNumber, project.totalSprints)}/${project.totalSprints}`
      : '—'

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{project.project_title}</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{project.status}</Badge>
          <span className="text-sm text-muted-foreground">{sprintLabel}</span>
        </div>
      </div>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
          <CardDescription>Basic details of the project (client info hidden).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Requirements / Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.requirements || 'No requirements provided.'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>Sprints and task status summary.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sprint summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflow.sprints.filter(s => (s.sprintNumber || 0) > 0).map((s) => {
              const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
              return (
                <div key={s.sprintNumber} className="p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold">Sprint {s.sprintNumber}</div>
                    <Badge variant="outline">{pct}%</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Completed: {s.completed} / {s.total}</div>
                  <div className="text-xs text-muted-foreground">In Progress: {s.inProgress}</div>
                  <div className="text-xs text-muted-foreground">Pending: {s.pending}</div>
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Tasks grouped by sprint */}
          <div className="space-y-6">
            {Array.from(groupedTasks.entries()).sort((a, b) => a[0] - b[0]).map(([sn, tasks]) => (
              <div key={sn}>
                <h3 className="text-lg font-semibold mb-3">Sprint {sn}</h3>
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t._id} className="p-3 rounded border flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t.task_name}</div>
                        {t.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>
                        )}
                      </div>
                      <Badge
                        className={
                          t.status === 'Done' || t.status === 'Completed'
                            ? 'bg-status-done-bg text-status-done border-status-done-border'
                            : t.status === 'In Progress'
                              ? 'bg-status-progress-bg text-status-progress border-status-progress-border'
                              : 'bg-status-todo-bg text-status-todo border-status-todo-border'
                        }
                      >
                        {t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
