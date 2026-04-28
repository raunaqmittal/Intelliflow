import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, AlertTriangle, Sparkles } from 'lucide-react';

interface AiClassification {
  detectedType: string;
  confidence: 'high' | 'medium' | 'low';
  outOfScopeReason?: string;
  usedFallback?: boolean;
}

interface RequestDetails {
  _id: string;
  title: string;
  requestType?: string;
  description: string;
  requirements: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  aiClassification?: AiClassification;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-500',
  workflow_generated: 'bg-purple-500',
  under_review: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  converted: 'bg-gray-500',
  out_of_scope: 'bg-red-600',
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  web_dev: 'Web Development',
  app_dev: 'App Development',
  prototype: 'Prototype',
  research: 'Research',
  out_of_scope: 'Out of Scope',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-red-500',
};

export default function RequestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await api.get(`/requests/${id}`);
        setRequest(response.data.data.request);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load request details',
          variant: 'destructive',
        });
        navigate('/client/my-requests');
      } finally {
        setLoading(false);
      }
    };
    fetchRequestDetails();
  }, [id, navigate, toast]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatStatus = (status: string) =>
    status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading request details...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Request not found</p>
      </div>
    );
  }

  const ai = request.aiClassification;
  const detectedLabel = ai?.detectedType
    ? REQUEST_TYPE_LABELS[ai.detectedType] || ai.detectedType
    : REQUEST_TYPE_LABELS[request.requestType || ''] || request.requestType;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/client/my-requests')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to My Requests
      </Button>

      <div className="bg-card rounded-lg border p-6 space-y-6">

        {/* ── Out-of-Scope Warning Banner ─────────────────────────────── */}
        {request.status === 'out_of_scope' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Request Outside Company Scope</p>
              <p className="text-sm text-red-600 mt-1">
                {ai?.outOfScopeReason ||
                  'This request does not fall within our current service offerings.'}
              </p>
              <p className="text-sm text-red-500 mt-2">
                Please contact us to discuss your requirements or submit a different request.
              </p>
            </div>
          </div>
        )}

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="border-b pb-4">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-3xl font-bold">{request.title}</h1>
            <Badge className={STATUS_COLORS[request.status] || 'bg-gray-500'}>
              {formatStatus(request.status)}
            </Badge>
          </div>

          {/* AI-detected type with confidence */}
          {ai ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                AI Detected:{' '}
                <span className="font-medium text-foreground">{detectedLabel}</span>
              </p>
              {ai.confidence && (
                <span className={`text-xs ${CONFIDENCE_COLORS[ai.confidence] || ''}`}>
                  ({ai.confidence} confidence)
                </span>
              )}
              {ai.usedFallback && (
                <Badge variant="secondary" className="text-xs">Template fallback used</Badge>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">{detectedLabel}</p>
          )}
        </div>

        {/* ── Description ────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {request.description || 'No description provided'}
          </p>
        </div>

        {/* ── Requirements ───────────────────────────────────────────── */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Requirements</h2>
          {request.requirements && request.requirements.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {request.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No requirements specified</p>
          )}
        </div>

        {/* ── Timestamps ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Submitted</p>
            <p className="text-sm">{formatDate(request.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
            <p className="text-sm">{formatDate(request.updatedAt)}</p>
          </div>
        </div>

        {/* ── Status Information ──────────────────────────────────────── */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium mb-1">Status Information</p>
          <p className="text-sm text-muted-foreground">
            {request.status === 'submitted' &&
              'Your request has been submitted and is awaiting workflow generation.'}
            {request.status === 'workflow_generated' &&
              'A workflow has been generated for your request and is pending manager review.'}
            {request.status === 'under_review' &&
              'Your request is currently under review by department managers.'}
            {request.status === 'approved' &&
              'Your request has been approved and will be converted to a project soon.'}
            {request.status === 'rejected' &&
              'Your request has been rejected. Please contact support for more information.'}
            {request.status === 'converted' &&
              'Your request has been converted to an active project.'}
            {request.status === 'out_of_scope' &&
              'This request is outside our service scope. See the warning above for details.'}
          </p>
        </div>

      </div>
    </div>
  );
}
