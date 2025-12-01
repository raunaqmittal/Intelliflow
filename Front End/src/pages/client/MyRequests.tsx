import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Eye } from 'lucide-react';

interface Request {
  _id: string;
  title: string;
  requestType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-500',
  workflow_generated: 'bg-purple-500',
  under_review: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  converted: 'bg-gray-500',
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  web_dev: 'Web Development',
  app_dev: 'App Development',
  prototype: 'Prototype',
  research: 'Research',
};

export default function MyRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        setLoading(true);
        const response = await api.get('/requests/my-requests');
        setRequests(response.data.data.requests);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load requests',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMyRequests();
  }, [toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading your requests...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Requests</h1>
        <p className="text-muted-foreground">
          View all your submitted project requests and their current status
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground mb-4">You haven't submitted any requests yet</p>
          <Button onClick={() => navigate('/client/new-request')}>
            Submit New Request
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell className="font-medium">{request.title}</TableCell>
                  <TableCell>
                    {REQUEST_TYPE_LABELS[request.requestType] || request.requestType}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[request.status] || 'bg-gray-500'}>
                      {formatStatus(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>{formatDate(request.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/client/requests/${request._id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
