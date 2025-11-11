import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, FolderOpen } from 'lucide-react'

interface MyProject {
  _id: string
  project_title: string
  status: string
  activeSprintNumber?: number
  totalSprints?: number
  requirements?: string
  createdAt?: string
}

export default function MyProjects() {
  const [projects, setProjects] = useState<MyProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await api.get('/employees/me/projects')
        setProjects(res.data?.data?.projects || [])
      } catch (e) {
        console.error('Failed to load projects', e)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">My Projects</h1>
        <p className="text-muted-foreground">Projects you are currently part of.</p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Projects Found</CardTitle>
            <CardDescription>Once you are assigned tasks, your projects will appear here.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const isCompleted = p.status === 'Completed'
            const sprintLabel = isCompleted
              ? 'Completed'
              : p.totalSprints && p.activeSprintNumber
                ? `Sprint ${Math.min(p.activeSprintNumber, p.totalSprints)}/${p.totalSprints}`
                : '—'
            return (
              <Card key={p._id} className="bg-gradient-card shadow-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      <span>{p.project_title}</span>
                    </CardTitle>
                    <Badge variant="outline">{p.status}</Badge>
                  </div>
                  <CardDescription>{sprintLabel}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{p.requirements || 'No requirements provided.'}</p>
                  <div className="mt-4 flex justify-end">
                    <Link to={`/employee/projects/${p._id}`} className="text-primary font-medium inline-flex items-center">
                      View Details <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
