import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye } from "lucide-react";
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

type Project = {
  _id: string;
  project_id: number;
  project_title: string;
  category?: string;
  framework?: string;
  status: 'In Progress' | 'Completed' | 'Pending' | 'Cancelled' | 'Approved' | string;
  createdAt?: string;
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/clients/me/dashboard');
        const recentProjects: Project[] = res.data?.data?.recentProjects || [];
        setProjects(recentProjects);
        setFilteredProjects(recentProjects);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const results = projects.filter(project =>
      project.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.category && project.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredProjects(results);
  }, [searchTerm, projects]);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Projects</h1>
          <p className="text-muted-foreground mt-1">View and track all your projects</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Project List</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search projects..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project._id}>
                    <TableCell className="font-medium">{project.project_title}</TableCell>
                    <TableCell>{project.category || 'N/A'}</TableCell>
                    <TableCell>{project.framework || 'N/A'}</TableCell>
                    <TableCell>
                      <StatusBadge status={(project.status === 'Approved' ? 'In Progress' : project.status) as ('In Progress' | 'Completed' | 'Pending' | 'Cancelled')} variant="project" />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/client/projects/${project._id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Projects Found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm 
                  ? "No projects match your search criteria. Try adjusting your search term."
                  : "You don't have any projects yet. Submit a new request to get started."
                }
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
