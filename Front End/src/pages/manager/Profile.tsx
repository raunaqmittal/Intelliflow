import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, Save, X, Shield, Smartphone, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import api from "@/lib/api";

export default function ManagerProfile() {
        const { employee, updateEmployee } = useUser();
        const navigate = useNavigate();
        const [isEditing, setIsEditing] = useState(false);
        const [profile, setProfile] = useState({ name: '', role: '', email: '', phone: '' });
        const [editForm, setEditForm] = useState({ name: '', role: '', email: '', phone: '' });
        const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
        const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'email'>('sms');
        const [isTogglingTwoFactor, setIsTogglingTwoFactor] = useState(false);
        const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
        const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
        const [showPhoneOTPInput, setShowPhoneOTPInput] = useState(false);
        const [showEmailOTPInput, setShowEmailOTPInput] = useState(false);
        const [phoneOtpCode, setPhoneOtpCode] = useState('');
        const [emailOtpCode, setEmailOtpCode] = useState('');
        const { toast } = useToast();

        const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Remove all non-digits (including if user types +91 manually)
            let value = e.target.value.replace(/\D/g, '')
            
            // Remove 91 prefix if user typed it manually (we'll add it back)
            if (value.startsWith('91')) {
                value = value.slice(2)
            }
            
            // Limit to exactly 10 digits for Indian mobile number
            value = value.slice(0, 10)
            
            // Store with 91 prefix only if user has entered some digits
            const phoneValue = value ? '91' + value : ''
            setEditForm({ ...editForm, phone: phoneValue })
        }

        const formatPhoneDisplay = (phone: string) => {
            if (!phone) return ''
            const digits = phone.replace(/\D/g, '')
            
            // Remove 91 prefix for display formatting
            const number = digits.startsWith('91') ? digits.slice(2) : digits
            
            if (number) {
                // Format as +91 XXXXX XXXXX
                return `+91 ${number.slice(0, 5)} ${number.slice(5)}`
            }
            return ''
        }

        useEffect(() => {
            if (employee) {
                const current = {
                    name: employee.name,
                    role: employee.role || 'Manager',
                    email: employee.email,
                    phone: employee.phone || ''
                };
                setProfile(current);
                setEditForm(current);
                setTwoFactorEnabled((employee as any).twoFactorEnabled || false);
                setTwoFactorMethod((employee as any).twoFactorMethod || 'sms');
            }
        }, [employee]);

        const handleSave = async () => {
                try {
                    const response = await api.patch('/employees/updateMe', {
                        name: editForm.name,
                        phone: editForm.phone,
                    });
                    
                    // Update with the full response from server (includes phoneVerified, twoFactorEnabled, etc.)
                    const updatedData = response.data.data.employee;
                    updateEmployee(updatedData);
                    setProfile({
                        name: updatedData.name,
                        role: updatedData.role,
                        email: updatedData.email,
                        phone: updatedData.phone,
                    });
                    setTwoFactorEnabled(updatedData.twoFactorEnabled || false);
                    setIsEditing(false);
                    toast({
                            title: "Profile Updated",
                            description: updatedData.phoneVerified === false && employee?.phone !== editForm.phone
                                ? "Phone number updated. Please verify your new number."
                                : "Your profile information has been successfully updated.",
                    });
                } catch (e) {
                    toast({ title: 'Update failed', description: 'Please try again.', variant: 'destructive' });
                }
        };

        const handleCancel = () => {
                setEditForm(profile);
                setIsEditing(false);
        };

        const handleToggleTwoFactor = async () => {
            if (!employee) return;

            // Check verification requirements before enabling
            if (!twoFactorEnabled) {
                if (twoFactorMethod === 'sms') {
                    if (!employee.phone) {
                        toast({
                            title: "Phone Number Required",
                            description: "Please add your phone number before enabling SMS 2FA.",
                            variant: "destructive",
                        });
                        return;
                    }
                    if (!(employee as any).phoneVerified) {
                        toast({
                            title: "Phone Verification Required",
                            description: "Please verify your phone number before enabling SMS 2FA.",
                            variant: "destructive",
                        });
                        return;
                    }
                } else if (twoFactorMethod === 'email') {
                    if (!(employee as any).emailVerified) {
                        toast({
                            title: "Email Verification Required",
                            description: "Please verify your email before enabling email 2FA.",
                            variant: "destructive",
                        });
                        return;
                    }
                }
            }

            setIsTogglingTwoFactor(true);
            try {
                await api.patch('/employees/updateMe', {
                    twoFactorEnabled: !twoFactorEnabled,
                    twoFactorMethod: twoFactorMethod
                });
                
                setTwoFactorEnabled(!twoFactorEnabled);
                toast({
                    title: twoFactorEnabled ? "2FA Disabled" : "2FA Enabled",
                    description: twoFactorEnabled 
                        ? "Two-factor authentication has been disabled." 
                        : `Two-factor authentication is now active via ${twoFactorMethod === 'sms' ? 'SMS' : 'Email'}. You'll receive an OTP when logging in.`,
                });
            } catch (error: any) {
                console.error('Error toggling 2FA:', error);
                toast({
                    title: "Update Failed",
                    description: error.response?.data?.message || "Failed to update 2FA settings.",
                    variant: "destructive",
                });
            } finally {
                setIsTogglingTwoFactor(false);
            }
        };

        const handleSendVerificationOTP = async () => {
            setIsVerifyingPhone(true);
            try {
                const res = await api.post('/employees/send-phone-verification-otp');
                setShowPhoneOTPInput(true);
                toast({
                    title: "Verification Code Sent",
                    description: res.data.message || "Please check your phone for the verification code.",
                });
            } catch (error: any) {
                toast({
                    title: "Failed to Send Code",
                    description: error.response?.data?.message || "Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsVerifyingPhone(false);
            }
        };

        const handleVerifyPhone = async () => {
            if (!phoneOtpCode || phoneOtpCode.length !== 6) {
                toast({
                    title: "Invalid Code",
                    description: "Please enter a valid 6-digit verification code.",
                    variant: "destructive",
                });
                return;
            }

            setIsVerifyingPhone(true);
            try {
                await api.post('/employees/verify-phone', { otp: phoneOtpCode });
                setShowPhoneOTPInput(false);
                setPhoneOtpCode('');
                
                // Refresh employee data
                const res = await api.get('/employees/me');
                updateEmployee(res.data.data.employee);
                const current = {
                    name: res.data.data.employee.name,
                    role: res.data.data.employee.role || 'Manager',
                    email: res.data.data.employee.email,
                    phone: res.data.data.employee.phone || ''
                };
                setProfile(current);
                
                toast({
                    title: "Phone Verified",
                    description: "Your phone number has been verified successfully.",
                });
            } catch (error: any) {
                toast({
                    title: "Verification Failed",
                    description: error.response?.data?.message || "Invalid code. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsVerifyingPhone(false);
            }
        };

        const handleSendEmailVerificationOTP = async () => {
            setIsVerifyingEmail(true);
            try {
                const res = await api.post('/employees/send-email-verification-otp');
                setShowEmailOTPInput(true);
                toast({
                    title: "Verification Code Sent",
                    description: res.data.message || "Please check your email for the verification code.",
                });
            } catch (error: any) {
                toast({
                    title: "Failed to Send Code",
                    description: error.response?.data?.message || "Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsVerifyingEmail(false);
            }
        };

        const handleVerifyEmail = async () => {
            if (!emailOtpCode || emailOtpCode.length !== 6) {
                toast({
                    title: "Invalid Code",
                    description: "Please enter a valid 6-digit verification code.",
                    variant: "destructive",
                });
                return;
            }

            setIsVerifyingEmail(true);
            try {
                await api.post('/employees/verify-email', { otp: emailOtpCode });
                setShowEmailOTPInput(false);
                setEmailOtpCode('');
                
                // Refresh employee data
                const res = await api.get('/employees/me');
                updateEmployee(res.data.data.employee);
                const current = {
                    name: res.data.data.employee.name,
                    role: res.data.data.employee.role || 'Manager',
                    email: res.data.data.employee.email,
                    phone: res.data.data.employee.phone || ''
                };
                setProfile(current);
                
                toast({
                    title: "Email Verified",
                    description: "Your email has been verified successfully.",
                });
            } catch (error: any) {
                toast({
                    title: "Verification Failed",
                    description: error.response?.data?.message || "Invalid code. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsVerifyingEmail(false);
            }
        };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Personal Information</CardTitle>
                {!isEditing ? (
                    <Button 
                        variant="ghost" 
                        onClick={() => {
                            setEditForm(profile);
                            setIsEditing(true);
                        }}
                    >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                ) : (
                    <div className="flex space-x-2">
                        <Button variant="outline" onClick={handleCancel}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${profile.email}`} />
                        <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-2xl font-semibold">{profile.name}</h2>
                        <p className="text-muted-foreground">{profile.role}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Input
                                    id="role"
                                    value={editForm.role}
                                    disabled
                                    className="bg-muted cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={editForm.email}
                                    disabled
                                    readOnly
                                    className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                                />
                                <p className="text-xs text-muted-foreground">Email address cannot be changed. Contact support if needed.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={formatPhoneDisplay(editForm.phone)}
                                    disabled
                                    readOnly
                                    placeholder="+91 98765 43210"
                                    className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                                />
                                <p className="text-xs text-muted-foreground">Phone number cannot be changed. Contact support if needed.</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <Label>Name</Label>
                                <Input value={profile.name} disabled />
                            </div>
                            <div>
                                <Label>Role</Label>
                                <Input value={profile.role} disabled />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input value={profile.email} disabled />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input value={profile.phone || 'Not provided'} disabled />
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>

        {/* Security Settings - 2FA */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                {/* Phone Verification */}
                {employee && employee.phone && !(employee as any).phoneVerified && (
                  <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-3">
                      <Smartphone className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">Verify Phone Number</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {employee.phone} • Not verified
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                          ⚠️ Note: Twilio trial account requires manual phone verification. Contact admin to add your number.
                        </p>
                        {!showPhoneOTPInput ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSendVerificationOTP}
                            disabled={isVerifyingPhone}
                            className="mt-3"
                          >
                            {isVerifyingPhone ? 'Sending...' : 'Send Verification Code'}
                          </Button>
                        ) : (
                          <div className="mt-3 space-y-2">
                            <Input
                              type="text"
                              placeholder="Enter 6-digit code"
                              value={phoneOtpCode}
                              onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              maxLength={6}
                              className="max-w-[200px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleVerifyPhone}
                                disabled={isVerifyingPhone || phoneOtpCode.length !== 6}
                              >
                                {isVerifyingPhone ? 'Verifying...' : 'Verify'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setShowPhoneOTPInput(false); setPhoneOtpCode(''); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* Email Verification */}
                {employee && !(employee as any).emailVerified && (
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">Verify Email Address</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {employee.email} • Not verified
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                          💡 Verify your email to enable email-based 2FA (no phone required)
                        </p>
                        {!showEmailOTPInput ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSendEmailVerificationOTP}
                            disabled={isVerifyingEmail}
                            className="mt-3"
                          >
                            {isVerifyingEmail ? 'Sending...' : 'Send Verification Code'}
                          </Button>
                        ) : (
                          <div className="mt-3 space-y-2">
                            <Input
                              type="text"
                              placeholder="Enter 6-digit code"
                              value={emailOtpCode}
                              onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              maxLength={6}
                              className="max-w-[200px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleVerifyEmail}
                                disabled={isVerifyingEmail || emailOtpCode.length !== 6}
                              >
                                {isVerifyingEmail ? 'Verifying...' : 'Verify'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setShowEmailOTPInput(false); setEmailOtpCode(''); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* 2FA Method Selection */}
                {employee && ((employee as any).phoneVerified || (employee as any).emailVerified) && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-3">
                      <div className="font-medium text-foreground">Two-Factor Authentication Method</div>
                      <Select value={twoFactorMethod} onValueChange={(value: 'sms' | 'email') => setTwoFactorMethod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sms" disabled={!(employee as any).phoneVerified}>
                            SMS {!(employee as any).phoneVerified && '(Phone not verified)'}
                          </SelectItem>
                          <SelectItem value="email" disabled={!(employee as any).emailVerified}>
                            Email {!(employee as any).emailVerified && '(Email not verified)'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {twoFactorMethod === 'sms' 
                          ? '📱 OTP will be sent via SMS to your phone' 
                          : '📧 OTP will be sent to your email address'}
                      </p>
                    </div>
                  </div>
                )}
                {/* 2FA Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-start gap-3 flex-1">
                        {twoFactorMethod === 'sms' ? (
                          <Smartphone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        ) : (
                          <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1">
                            <div className="font-medium text-foreground">Two-Factor Authentication</div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {twoFactorEnabled 
                                    ? `Enabled via ${twoFactorMethod === 'sms' ? `SMS to ${profile.phone || 'your phone'}` : `Email to ${profile.email}`}`
                                    : 'Add an extra layer of security to your account'}
                            </p>
                            {employee && !(employee as any).phoneVerified && !(employee as any).emailVerified && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                                    ⚠️ Please verify your phone number or email address above to enable 2FA
                                </p>
                            )}
                            {twoFactorMethod === 'sms' && employee && (employee as any).phoneVerified && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    ⚠️ Twilio trial: Only verified numbers can receive SMS
                                </p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant={twoFactorEnabled ? "destructive" : "default"}
                        size="sm"
                        onClick={handleToggleTwoFactor}
                        disabled={isTogglingTwoFactor || (employee && !(employee as any).phoneVerified && !(employee as any).emailVerified)}
                        className="ml-4"
                    >
                        {isTogglingTwoFactor ? 'Updating...' : twoFactorEnabled ? 'Disable' : 'Enable'}
                    </Button>
                </div>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/manager/change-password')}
                >
                    Change Password
                </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}