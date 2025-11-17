import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit3, Mail, Building, Save, X, Phone, MapPin, Briefcase } from "lucide-react";
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
  industry?: string;
  address?: string;
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<Partial<ClientProfile>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/clients/me');
        const client: ClientProfile = res.data?.data?.client || null;
        setProfile(client);
        setEditForm(client || {});
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
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
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
                  onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email Address</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={editForm.contact_email || ''}
                  onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+919876543210"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Enter phone in international format (e.g., +919876543210)</p>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
