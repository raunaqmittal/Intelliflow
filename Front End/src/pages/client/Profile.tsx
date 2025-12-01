import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Edit3, Mail, Building, Save, X, Phone, MapPin, Briefcase, Shield, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

type ClientProfile = {
  _id?: string;
  client_id: number;
  client_name: string;
  contact_email: string;
  phone?: string;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  industry?: string;
  address?: string;
};

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<Partial<ClientProfile>>({});
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isTogglingTwoFactor, setIsTogglingTwoFactor] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
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
    const fetchProfile = async () => {
      try {
        const res = await api.get('/clients/me');
        const client: ClientProfile = res.data?.data?.client || null;
        setProfile(client);
        setEditForm(client || {});
        setTwoFactorEnabled(client?.twoFactorEnabled || false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Load Failed",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [toast]);

  const handleSave = async () => {
    try {
      const res = await api.patch('/clients/updateMe', {
        client_name: editForm.client_name,
        contact_email: editForm.contact_email,
        phone: editForm.phone,
      });
      const updated: ClientProfile = res.data?.data?.client;
      setProfile(updated);
      setTwoFactorEnabled(updated?.twoFactorEnabled || false);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: updated?.phoneVerified === false && profile?.phone !== editForm.phone
          ? "Phone number updated. Please verify your new number."
          : "Your profile information has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditForm(profile || {});
    setIsEditing(false);
  };

  const handleToggleTwoFactor = async () => {
    if (!profile) return;

    // Check if phone exists and is verified before enabling
    if (!twoFactorEnabled) {
      if (!profile.phone) {
        toast({
          title: "Phone Number Required",
          description: "Please add your phone number before enabling 2FA.",
          variant: "destructive",
        });
        return;
      }
      if (!profile.phoneVerified) {
        toast({
          title: "Phone Verification Required",
          description: "Please verify your phone number before enabling 2FA.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsTogglingTwoFactor(true);
    try {
      await api.patch('/clients/updateMe', {
        twoFactorEnabled: !twoFactorEnabled
      });
      
      setTwoFactorEnabled(!twoFactorEnabled);
      setProfile({ ...profile, twoFactorEnabled: !twoFactorEnabled });
      toast({
        title: twoFactorEnabled ? "2FA Disabled" : "2FA Enabled",
        description: twoFactorEnabled 
          ? "Two-factor authentication has been disabled." 
          : "Two-factor authentication is now active. You'll receive an OTP when logging in.",
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
      const res = await api.post('/clients/send-phone-verification-otp');
      setShowOTPInput(true);
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
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingPhone(true);
    try {
      await api.post('/clients/verify-phone', { otp: otpCode });
      setShowOTPInput(false);
      setOtpCode('');
      
      // Refresh profile data
      const res = await api.get('/clients/me');
      const updatedClient = res.data?.data?.client;
      setProfile(updatedClient);
      
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-lg text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
          <div className="text-lg font-semibold text-foreground">Profile Not Found</div>
          <div className="text-muted-foreground">Please try refreshing the page or logging in again.</div>
        </div>
      </div>
    );
  }

  const initials = profile.client_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Client Profile</h1>
        <div className="flex space-x-2">
          {!isEditing ? (
            <Button 
              variant="outline" 
              onClick={() => {
                setEditForm(profile);
                setIsEditing(true);
              }}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Information
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-primary">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${profile.contact_email}`} />
            <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{profile.client_name}</CardTitle>
          <CardDescription>Client ID: {profile.client_id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Company Name</Label>
                <Input
                  id="client_name"
                  value={editForm.client_name || ''}
                  disabled={true}
                  readOnly
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Company name cannot be changed. Contact support if needed.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email Address</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={editForm.contact_email || ''}
                  disabled={true}
                  readOnly
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Email address cannot be changed. Contact support if needed.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formatPhoneDisplay(editForm.phone || '')}
                  onChange={handlePhoneChange}
                />
                <p className="text-xs text-muted-foreground">Enter 10-digit mobile number (6-9 at start). +91 added automatically.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                <Building className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{profile.client_name}</span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{profile.contact_email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{profile.phone}</span>
                </div>
              )}
              {profile.industry && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{profile.industry}</span>
                </div>
              )}
              {profile.address && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{profile.address}</span>
                </div>
              )}

              {/* Security Settings - 2FA */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4" />
                  Security Settings
                </h3>
                <div className="space-y-3">
                {/* Phone Verification */}
                {profile.phone && !profile.phoneVerified && (
                  <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-3">
                      <Smartphone className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">Verify Phone Number</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {profile.phone} • Not verified
                        </p>
                        {!showOTPInput ? (
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
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              maxLength={6}
                              className="max-w-[200px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleVerifyPhone}
                                disabled={isVerifyingPhone || otpCode.length !== 6}
                              >
                                {isVerifyingPhone ? 'Verifying...' : 'Verify'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setShowOTPInput(false); setOtpCode(''); }}
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
                {/* 2FA Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-start gap-3 flex-1">
                    <Smartphone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">Two-Factor Authentication</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {twoFactorEnabled 
                          ? `Enabled via SMS to ${profile.phone || 'your phone'}`
                          : 'Add an extra layer of security to your account'}
                      </p>
                      {!profile.phone && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                          ⚠️ Please add your phone number to enable 2FA
                        </p>
                      )}
                      {profile.phone && !profile.phoneVerified && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                          ⚠️ Please verify your phone number above to enable 2FA
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={twoFactorEnabled ? "destructive" : "default"}
                    size="sm"
                    onClick={handleToggleTwoFactor}
                    disabled={isTogglingTwoFactor}
                    className="ml-4"
                  >
                    {isTogglingTwoFactor ? 'Updating...' : twoFactorEnabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/client/change-password')}
                >
                  Change Password
                </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
