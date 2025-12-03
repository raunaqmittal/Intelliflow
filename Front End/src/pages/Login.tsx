import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/contexts/UserContext';
import { Input } from '@/components/ui/input';
import type { UserRole } from '@/types';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import { Smartphone, Info, X } from 'lucide-react';
import { getErrorMessage, logError } from '@/utils/errorHandler';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';

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
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [is2FALogin, setIs2FALogin] = useState(false);
  const { loginEmployee, loginClient } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Show welcome popup when component mounts
    setShowWelcomePopup(true);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setIs2FALogin(false);
    try {
      const endpoint = selectedRole === 'client' ? '/clients/login' : '/employees/login';
      const response = await api.post(endpoint, { email, password });
      
      // Check if OTP is required (2FA enabled)
      if (response.data.status === 'otp_required') {
        setIs2FALogin(true);
        setOtpRequired(true);
        setMaskedPhone(response.data.maskedPhone || response.data.maskedEmail || '');
        setError('');
        setLoading(false);
        return;
      }
      
      // Normal login (no 2FA) - token and user data returned
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
      logError(err, 'Login');
      const errorMessage = getErrorMessage(err, 'Login failed. Please check your credentials.');
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
      logError(err, 'OTP Verification');
      const errorMessage = getErrorMessage(err, 'Invalid OTP. Please try again.');
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
    setIs2FALogin(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 py-12 relative">
        {/* Welcome Popup Notification */}
        {showWelcomePopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button
                onClick={() => setShowWelcomePopup(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Welcome to Intelliflow Demo Portal
                  </h3>
                  <div className="space-y-3 text-gray-700 dark:text-gray-300">
                    <p className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">•</span>
                      <span>We have added some <strong>test/demo credentials</strong> of employees and clients for you.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">•</span>
                      <span>To sign up, you can either <strong>login as a manager</strong> and sign up a new user, or <strong>sign up here</strong>.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0">⚠</span>
                      <span><strong>Email Limitation:</strong> Due to Render.com free tier restrictions and Twilio limitation, email functionality (OTP for 2FA and password reset) is currently unavailable in production and receiving OTP on phone number also not available as on Twilio trial account we need manual addition of new number.</span>
                    </p>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Link to="/test-credentials" className="flex-1">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        View Test Credentials
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => setShowWelcomePopup(false)}
                      className="flex-1"
                    >
                      Got it
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">Intelliflow Demo Portal</CardTitle>
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
                {loading ? (is2FALogin ? '⏳ Sending OTP...' : 'Signing in...') : 'Sign in'}
              </Button>

              <div className="text-center">
                <Link to="/test-credentials">
                  <Button 
                    variant="default" 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg" 
                    size="lg"
                  >
                    Use Test Credentials for Login
                  </Button>
                </Link>
              </div>

              <div className="text-sm text-muted-foreground text-center space-y-3">
                <Link
                  to={`/forgot-password?role=${selectedRole}&email=${encodeURIComponent(email)}`}
                  className="underline block"
                >
                  Forgot password?
                </Link>
                <div className="text-base">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary hover:underline font-semibold">
                    Sign up here
                  </Link>
                </div>
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
      <Footer />
    </div>
  );
}
