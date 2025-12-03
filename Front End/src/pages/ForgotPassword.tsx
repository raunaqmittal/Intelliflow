import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type { UserRole } from '@/types';
import { getErrorMessage, logError } from '@/utils/errorHandler';

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
  const [otpSent, setOtpSent] = useState(false);
  const [method, setMethod] = useState<'email' | 'otp' | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');

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
      const { message, resetToken, method: resetMethod, methods, maskedPhone: phone, debug } = res.data || {};
      
      // Check if OTP method is available (either single method or in methods array)
      const hasOtp = resetMethod === 'otp' || (methods && methods.includes('otp'));
      const hasEmail = resetMethod === 'email' || (methods && methods.includes('email'));
      
      if (hasOtp) {
        // OTP was sent via SMS
        setOtpSent(true);
        setMaskedPhone(phone || '');
        setMethod('otp');
      } else if (hasEmail) {
        setMethod('email');
      }
      
      // Show success message
      toast({ 
        title: hasOtp && hasEmail ? 'OTP & Email Sent' : hasOtp ? 'OTP Sent' : 'Email Sent', 
        description: message || 'Password reset information sent successfully.'
      });
      
      // Development mode: show reset token if available
      if (debug?.resetURL || resetToken) {
        setDevToken(resetToken || debug?.resetURL);
      }
    } catch (err: unknown) {
      logError(err, 'Forgot Password Request');
      const msg = getErrorMessage(err, 'Failed to request password reset.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/${endpointBase}/verify-reset-otp`, { email, otpCode });
      const { resetToken } = res.data || {};
      
      if (resetToken) {
        toast({ title: 'OTP Verified', description: 'Redirecting to reset password...' });
        // Navigate to reset password page with token
        navigate(`/reset-password/${resetToken}?role=${role}`);
      }
    } catch (err: unknown) {
      logError(err, 'OTP Verification');
      const msg = getErrorMessage(err, 'Invalid or expired OTP.');
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
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={otpSent} />
          </div>

          {otpSent && method === 'otp' && (
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">Enter OTP</label>
              <p className="text-xs text-muted-foreground">OTP sent to {maskedPhone}</p>
              <Input 
                id="otp" 
                type="text" 
                placeholder="Enter 6-digit OTP" 
                value={otpCode} 
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                maxLength={6}
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {!otpSent ? (
            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!email || loading}>
              {loading ? 'Sending…' : 'Send OTP or Reset Link'}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button className="w-full" size="lg" onClick={handleVerifyOtp} disabled={otpCode.length !== 6 || loading}>
                {loading ? 'Verifying…' : 'Verify OTP'}
              </Button>
              <Button variant="outline" className="w-full" size="lg" onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); }} disabled={loading}>
                Resend OTP
              </Button>
            </div>
          )}

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
