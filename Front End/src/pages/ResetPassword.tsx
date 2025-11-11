import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type { UserRole } from '@/types';
import { AxiosError } from 'axios';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useParams();
  const [search] = useSearchParams();
  const role = ((search.get('role') as UserRole) || 'employee') === 'client' ? 'client' : 'employee';

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const endpointBase = useMemo(() => (role === 'client' ? 'clients' : 'employees'), [role]);

  const handleReset = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await api.patch(`/${endpointBase}/resetPassword/${token}`,{ password, passwordConfirm });
      toast({ title: 'Password reset successful', description: 'You can now sign in with your new password.' });
      navigate('/login');
    } catch (err: unknown) {
      let msg = 'Failed to reset password. The link may be invalid or expired.';
      if (err instanceof AxiosError && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const disabled = !password || !passwordConfirm || password !== passwordConfirm || loading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
          <CardDescription>Enter and confirm your new password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">New password</label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="passwordConfirm" className="text-sm font-medium">Confirm password</label>
            <Input id="passwordConfirm" type="password" placeholder="••••••••" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
          </div>

          {password && passwordConfirm && password !== passwordConfirm && (
            <div className="text-sm text-red-600">Passwords do not match.</div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={handleReset} disabled={disabled}>
            {loading ? 'Resetting…' : 'Reset password'}
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            Return to <button className="underline" onClick={() => navigate('/login')}>Login</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
