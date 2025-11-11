import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type { UserRole } from '@/types';
import { AxiosError } from 'axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search] = useSearchParams();

  const inferredRole = (search.get('role') as UserRole) || 'employee';
  const inferredEmail = search.get('email') || '';

  const [role, setRole] = useState<UserRole>(inferredRole === 'client' ? 'client' : 'employee');
  const [email, setEmail] = useState<string>(inferredEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);

  useEffect(() => {
    if (inferredRole) setRole(inferredRole);
    if (inferredEmail) setEmail(inferredEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endpointBase = useMemo(() => (role === 'client' ? 'clients' : 'employees'), [role]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setDevToken(null);
    try {
      const res = await api.post(`/${endpointBase}/forgotPassword`, { email });
      // In development, backend returns resetToken and resetURL
      const { message, resetToken, resetURL } = res.data || {};
      toast({ title: 'Request received', description: message || 'If an account exists for this email, you\'ll receive a reset link shortly.' });
      if (resetToken) {
        setDevToken(resetToken);
      }
      // If not in dev, guide the user
      if (!resetToken && resetURL) {
        // Not expected, but handle gracefully
        setDevToken(resetURL);
      }
    } catch (err: unknown) {
      let msg = 'Failed to request password reset.';
      if (err instanceof AxiosError && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const goToReset = () => {
    if (!devToken) return;
    navigate(`/reset-password/${devToken}?role=${role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Forgot your password?</CardTitle>
          <CardDescription>We\'ll email you a link to reset it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="role-select" className="text-sm font-medium">I am a</label>
            <Select value={role} onValueChange={(v) => setRole((v as UserRole) === 'client' ? 'client' : 'employee')}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!email || loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            Remembered it? <button className="underline" onClick={() => navigate('/login')}>Back to login</button>
          </div>

          {devToken && (
            <div className="mt-4 p-3 rounded-md border bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100">
              <p className="text-sm font-medium">Development shortcut</p>
              <p className="text-xs opacity-80 break-all">Token: {devToken}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={goToReset}>Continue to Reset</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
