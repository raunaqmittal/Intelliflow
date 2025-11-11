import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import type { UserRole } from '@/types';
import { AxiosError } from 'axios';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole } = useUser();

  const effectiveRole: UserRole = (userRole === 'client' ? 'client' : 'employee');
  const endpointBase = useMemo(() => (effectiveRole === 'client' ? 'clients' : 'employees'), [effectiveRole]);

  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.patch(`/${endpointBase}/updateMyPassword`, { passwordCurrent, password, passwordConfirm });
      // Backend returns a new token; store it so subsequent calls are authenticated
      const newToken = res.data?.token as string | undefined;
      if (newToken) {
        localStorage.setItem('authToken', newToken);
      }
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      setPasswordCurrent(''); setPassword(''); setPasswordConfirm('');
    } catch (err: unknown) {
      let msg = 'Failed to update password. Please check your current password.';
      if (err instanceof AxiosError && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const disabled = !passwordCurrent || !password || !passwordConfirm || password !== passwordConfirm || loading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Change password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="passwordCurrent" className="text-sm font-medium">Current password</label>
            <Input id="passwordCurrent" type="password" placeholder="••••••••" value={passwordCurrent} onChange={(e) => setPasswordCurrent(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">New password</label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="passwordConfirm" className="text-sm font-medium">Confirm new password</label>
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

          <Button className="w-full" size="lg" onClick={handleChange} disabled={disabled}>
            {loading ? 'Updating…' : 'Change password'}
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            <button className="underline" onClick={() => navigate(-1)}>Back</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
