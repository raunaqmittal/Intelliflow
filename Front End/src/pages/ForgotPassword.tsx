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
  const [method, setMethod] = useState<'email' | 'sms' | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [sendingMethod, setSendingMethod] = useState<'email' | 'sms' | null>(null);

  useEffect(() => {
    if (inferredRole) setRole(inferredRole);
    if (inferredEmail) setEmail(inferredEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endpointBase = useMemo(() => (role === 'client' ? 'clients' : 'employees'), [role]);

  const handleSendSMS = async () => {
    setSendingMethod('sms');
    setLoading(true);
    setError('');
    setDevToken(null);
    try {
      const res = await api.post(`/${endpointBase}/forgotPassword`, { email, method: 'sms' });
      const { message, maskedPhone: phone } = res.data || {};
      
      // OTP sent via SMS
      setOtpSent(true);
      setMaskedPhone(phone || '');
      setMethod('sms');
      
      toast({ 
        title: 'OTP Sent', 
        description: message || `OTP sent to ${phone}`
      });
    } catch (err: unknown) {
      logError(err, 'SMS OTP Request');
      const msg = getErrorMessage(err, 'Failed to send OTP via SMS.');
      setError(msg);
    } finally {
      setLoading(false);
      setSendingMethod(null);
    }
  };

  const handleSendEmail = async () => {
    setSendingMethod('email');
    setLoading(true);
    setError('');
    setDevToken(null);
    try {
      const res = await api.post(`/${endpointBase}/forgotPassword`, { email, method: 'email' });
      const { message, debug } = res.data || {};
      
      setMethod('email');
      
      toast({ 
        title: 'Email Sent', 
        description: message || 'Password reset link sent to your email.'
      });
      
      // Development mode: show reset token if available
      if (debug?.resetURL) {
        setDevToken(debug.resetURL);
      }
    } catch (err: unknown) {
      logError(err, 'Email Reset Request');
      const msg = getErrorMessage(err, 'Failed to send reset email.');
      setError(msg);
    } finally {
      setLoading(false);
      setSendingMethod(null);
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
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={otpSent || method === 'email'} />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {!otpSent && method !== 'email' ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Choose your preferred reset method:</p>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleSendSMS} 
                  disabled={loading || !email} 
                  className="w-full h-auto py-3 px-3 flex flex-col items-center justify-center gap-1.5 bg-blue-400 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                  variant="default"
                >
                  <span className="text-sm font-semibold">📱 Send OTP to Phone</span>
                  <span className="text-xs opacity-90 leading-tight text-center">⚠️ Note: Twilio trial account requires manual phone verification. Contact admin to add your number.</span>
                </Button>
                <Button 
                  onClick={handleSendEmail} 
                  disabled={loading || !email} 
                  className="w-full h-auto py-3 px-3 flex flex-col items-center justify-center gap-1.5"
                  variant="default"
                >
                  <span className="text-sm font-semibold">📧 Send Reset Link to Email</span>
                  <span className="text-xs opacity-90 leading-tight">Recommended method</span>
                </Button>
              </div>
            </div>
          ) : otpSent ? (
            <>
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
              <div className="flex gap-2">
                <Button onClick={handleVerifyOtp} disabled={loading || otpCode.length !== 6} className="flex-1">
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                <Button variant="outline" onClick={() => { setOtpSent(false); setOtpCode(''); setMaskedPhone(''); setMethod(null); setError(''); }}>
                  Back
                </Button>
              </div>
            </>
          ) : method === 'email' ? (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">✅ Reset link sent!</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">Check your email for the password reset link.</p>
              </div>
              <Button variant="outline" onClick={() => { setMethod(null); setError(''); }} className="w-full">
                Send Again
              </Button>
            </div>
          ) : null}

          <div className="text-sm text-muted-foreground text-center">
            Remembered it? <button className="underline" onClick={() => navigate('/login')}>Back to login</button>
          </div>

          {method === 'email' && devToken && (
            <div className="mt-4 p-3 rounded-md border bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100">
              <p className="text-sm font-medium">Development shortcut</p>
              <Button variant="outline" size="sm" className="mt-2 w-full" onClick={goToReset}>Continue to Reset</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
