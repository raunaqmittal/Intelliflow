import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MapPin, Calendar, Edit3, Save, X, User, Briefcase, Clock, CircleDot } from 'lucide-react';
import { loadDepartments, loadRoles, getTasksForEmployee } from '@/utils/dataParser';
import type { Employee, Department, Role, TaskWithDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import api from '@/lib/api';

export default function Profile() {
  const { employee, loading, updateEmployee } = useUser();

  const [department, setDepartment] = useState<Department | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    availability: 'Available' as Employee['availability']
  });
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPageData() {
      if (employee) {
        setEditForm({
          name: employee.name,
          email: employee.email,
          availability: employee.availability,
        });

        const [departments, roles, employeeTasks] = await Promise.all([
          loadDepartments(),
          loadRoles(),
          getTasksForEmployee(employee.employee_id),
        ]);
        
        setDepartment(departments.find(d => d.department_id === employee.department_id) || null);
        setRole(roles.find(r => r.role_id === employee.role_id) || null);
        setTasks(employeeTasks);
      }
    }
    fetchPageData();
  }, [employee]);

  const handleSaveProfile = async () => {
    try {
      // Update in backend
      await api.patch('/employees/updateMe', {
        name: editForm.name,
        email: editForm.email,
        availability: editForm.availability
      });
      
      // Update local context
      updateEmployee({ 
        name: editForm.name, 
        email: editForm.email, 
        availability: editForm.availability 
      });
      
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

  const handleCancelEdit = () => {
    if (employee) {
      setEditForm({ 
        name: employee.name, 
        email: employee.email, 
        availability: employee.availability 
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-lg text-muted-foreground">Loading profile data...</div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
          <div className="text-lg font-semibold text-foreground">Profile Not Found</div>
          <div className="text-muted-foreground">Please try refreshing the page or logging in again.</div>
        </div>
      </div>
    );
  }

  const initials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const availabilityOptions: Employee['availability'][] = ['Available', 'Busy', 'On Leave'];
  
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Done').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    pending: tasks.filter(t => t.status === 'Pending').length
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and view your work statistics.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="flex items-center space-x-2">
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCancelEdit} className="flex items-center space-x-2">
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </Button>
                    <Button variant="default" size="sm" onClick={handleSaveProfile} className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture & Basic Info */}
              <div className="flex items-start space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={editForm.availability} onValueChange={(value: Employee['availability']) => setEditForm({ ...editForm, availability: value })}>
                          <SelectTrigger id="status" className="mt-1">
                            <SelectValue placeholder="Select your status" />
                          </SelectTrigger>
                          <SelectContent>
                            {availabilityOptions.map(option => (
                              <SelectItem key={option} value={option}>
                                <div className="flex items-center space-x-2">
                                  <CircleDot className="w-4 h-4" />
                                  <span>{option}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{employee.name}</h2>
                        <p className="text-lg text-muted-foreground">{role?.role_name || employee.role || '—'}</p>
                      </div>
                      <StatusBadge status={employee.availability} variant="availability" />
                    </div>
                  )}
                </div>
              </div>

              {/* === THE FOLLOWING SECTIONS WERE LIKELY MISSING === */}
              <Separator />

              {/* Contact & Work Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Contact Information</span>
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{employee.email}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center space-x-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Work Information</span>
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{department?.department_name || employee.department || '—'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">Employee ID: {employee.employee_id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Specialization</h3>
                <Badge variant="secondary" className="bg-accent text-accent-foreground text-sm px-3 py-1">
                  Product Design & Prototyping
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Work Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Task Overview */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Task Overview</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Tasks</span>
                    <Badge variant="outline">{taskStats.total}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <Badge className="bg-status-done-bg text-status-done border-status-done-border">
                      {taskStats.completed}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">In Progress</span>
                    <Badge className="bg-status-progress-bg text-status-progress border-status-progress-border">
                      {taskStats.inProgress}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <Badge className="bg-status-todo-bg text-status-todo border-status-todo-border">
                      {taskStats.pending}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Completion Percentage */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Completion Percentage</h4>
                <div className="text-center">
                  <div className="text-3xl font-bold text-status-done">
                    {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Tasks completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}