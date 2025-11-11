import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';

interface RequestItem {
  _id: string;
  title: string;
  requestType: 'web_dev' | 'app_dev' | 'prototype' | 'research';
  status: 'submitted' | 'workflow_generated' | 'under_review' | 'approved' | 'rejected' | 'converted';
  createdAt: string;
  requiredDepartments?: string[];
}

const typeLabel: Record<RequestItem['requestType'], string> = {
  web_dev: 'Web Dev',
  app_dev: 'App Dev',
  prototype: 'Prototyping',
  research: 'Research',
};

export default function ManagerRequests() {
  const { employee, userRole } = useUser();
  const [allRequests, setAllRequests] = useState<RequestItem[]>([]);
  const [filtered, setFiltered] = useState<RequestItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/requests');
        const list: RequestItem[] = res.data?.data?.requests || [];
        setAllRequests(list);
        // If manager, show only requests involving at least one of their departments
        if (userRole === 'manager' && employee?.approvesDepartments?.length) {
          const myDepts = new Set(employee.approvesDepartments);
          const scoped = list.filter(r => Array.isArray(r.requiredDepartments) && r.requiredDepartments.some(d => myDepts.has(d)));
          setFiltered(scoped);
        } else {
          setFiltered(list);
        }
      } catch (e) {
        console.error('Failed to load requests', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) { setFiltered(allRequests); return; }
    const base = (userRole === 'manager' && employee?.approvesDepartments?.length)
      ? allRequests.filter(r => Array.isArray(r.requiredDepartments) && r.requiredDepartments.some(d => employee.approvesDepartments!.includes(d)))
      : allRequests;
    setFiltered(base.filter(r => r.title.toLowerCase().includes(q) || typeLabel[r.requestType].toLowerCase().includes(q) || r.status.toLowerCase().includes(q)));
  }, [searchTerm, allRequests, userRole, employee?.approvesDepartments]);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Requests</h1>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search requests..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-56" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((req) => (
                  <TableRow key={req._id}>
                    <TableCell className="font-medium">{req.title}</TableCell>
                    <TableCell>{typeLabel[req.requestType]}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{req.status.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Link to={`/manager/requests/${req._id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No requests.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
