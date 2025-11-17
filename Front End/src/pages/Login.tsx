import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/contexts/UserContext';
import { Input } from '@/components/ui/input';
import type { UserRole } from '@/types';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import { Smartphone } from 'lucide-react';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const { loginEmployee, loginClient } = useUser();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = selectedRole === 'client' ? '/clients/login' : '/employees/login';
      const response = await api.post(endpoint, { email, password });
      
      // Check if OTP is required (2FA enabled)
      if (response.data.status === 'otp_required') {
        setOtpRequired(true);
        setMaskedPhone(response.data.maskedPhone || '');
        setError('');
        setLoading(false);
        return;
      }
      
      // Normal login (no 2FA)
      if (selectedRole === 'client') {
        const role = await loginClient(email, password);
        navigate(role === 'client' ? '/client' : '/');
      } else {
        const role = await loginEmployee(email, password);
        navigate(role === 'manager' ? '/manager' : '/employee');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      let errorMessage = 'Login failed. Please check your credentials.';
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setOtpLoading(true);
    setError('');
    try {
      const endpoint = selectedRole === 'client' ? '/clients/verify-login-otp' : '/employees/verify-login-otp';
      const response = await api.post(endpoint, { email, otpCode });
      
      // OTP verified, login successful
      const token = response.data.token;
      const user = response.data.data.user;
      
      // Store token
      localStorage.setItem('authToken', token);
      
      // Navigate based on role
      if (selectedRole === 'client') {
        localStorage.setItem('lastUserRole', 'client');
        navigate('/client');
      } else {
        const role = user.role === 'manager' ? 'manager' : 'employee';
        localStorage.setItem('lastUserRole', role);
        localStorage.setItem('employeeProfile', JSON.stringify(user));
        navigate(role === 'manager' ? '/manager' : '/employee');
      }
      
      // Refresh page to update context
      window.location.reload();
    } catch (err: unknown) {
      console.error('OTP verification error:', err);
      let errorMessage = 'Invalid OTP. Please try again.';
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setOtpRequired(false);
    setOtpCode('');
    setMaskedPhone('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Intelliflow Portal</CardTitle>
          <CardDescription>
            {otpRequired ? 'Enter Verification Code' : 'Login as Client or Employee'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!otpRequired ? (
            <>
              <div className="space-y-2">
                <label htmlFor="role-select" className="text-sm font-medium">Login As</label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
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
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <Button onClick={handleLogin} className="w-full" size="lg" disabled={loading || !email || !password}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
              <div className="text-sm text-muted-foreground text-center">
                <Link
                  to={`/forgot-password?role=${selectedRole}&email=${encodeURIComponent(email)}`}
                  className="underline"
                >
                  Forgot password?
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* OTP Input Screen */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="font-medium text-blue-900 dark:text-blue-100">Two-Factor Authentication</p>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  We've sent a verification code to {maskedPhone}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium">Verification Code</label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Button onClick={handleVerifyOTP} className="w-full" size="lg" disabled={otpLoading || otpCode.length !== 6}>
                  {otpLoading ? 'Verifying...' : 'Verify & Sign In'}
                </Button>
                <Button onClick={handleBackToLogin} variant="outline" className="w-full" size="lg" disabled={otpLoading}>
                  Back to Login
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
