import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { loadEmployees } from '@/utils/dataParser'
import { Header } from '@/components/landing/Header'
import { Footer } from '@/components/landing/Footer'

type SignupType = 'employee' | 'client'

export default function Signup() {
  const { toast } = useToast()
  const [signupType, setSignupType] = useState<SignupType>('employee')
  
  // Employee-specific state
  const [nextEmployeeId, setNextEmployeeId] = useState<number | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [customRole, setCustomRole] = useState<string>('')
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    availability: 'Available' as 'Available' | 'Busy' | 'On Leave',
    skills: '',
    password: '',
    passwordConfirm: '',
  })

  // Client-specific state
  const [nextClientId, setNextClientId] = useState<number | null>(null)
  const [clientForm, setClientForm] = useState({
    client_name: '',
    contact_email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  })

  const [submitting, setSubmitting] = useState(false)

  // Load employee data for roles and departments
  useEffect(() => {
    if (signupType === 'employee') {
      (async () => {
        try {
          const employees = await loadEmployees()
          const maxId = employees.reduce((m, e) => Math.max(m, e.employee_id), 0)
          setNextEmployeeId(maxId + 1)
          
          // Extract unique roles
          const foundRoles = Array.from(
            new Set(
              employees
                .map(e => (e.role || '').trim())
                .filter(r => r.length > 0)
            )
          )
          const normalizedMap = new Map<string, string>()
          foundRoles.forEach(r => {
            const key = r.toLowerCase()
            if (!normalizedMap.has(key)) normalizedMap.set(key, r)
          })
          const finalRoles = Array.from(normalizedMap.values()).sort((a, b) => a.localeCompare(b))
          setRoles(finalRoles)

          // Extract unique departments
          const foundDepts = Array.from(
            new Set(
              employees
                .map(e => (e.department || '').trim())
                .filter(d => d.length > 0)
            )
          ).sort((a, b) => a.localeCompare(b))
          setDepartments(foundDepts)
        } catch {
          setNextEmployeeId(null)
          setRoles([])
          setDepartments([])
        }
      })()
    }
  }, [signupType])

  // Load client data for next ID
  useEffect(() => {
    if (signupType === 'client') {
      (async () => {
        try {
          const res = await api.get('/clients')
          const clients = res.data?.data?.clients || []
          const maxId = clients.reduce((m: number, c: { client_id: number }) => Math.max(m, c.client_id), 0)
          setNextClientId(maxId + 1)
        } catch {
          setNextClientId(null)
        }
      })()
    }
  }, [signupType])

  const handleEmployeeChange = (key: keyof typeof employeeForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmployeeForm({ ...employeeForm, [key]: e.target.value })
  }

  const handleClientChange = (key: keyof typeof clientForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientForm({ ...clientForm, [key]: e.target.value })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, formType: 'employee' | 'client') => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.startsWith('91')) {
      value = value.slice(2)
    }
    value = value.slice(0, 10)
    const phoneValue = value ? '91' + value : ''
    
    if (formType === 'employee') {
      setEmployeeForm({ ...employeeForm, phone: phoneValue })
    } else {
      setClientForm({ ...clientForm, phone: phoneValue })
    }
  }

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return ''
    const digits = phone.replace(/\D/g, '')
    const number = digits.startsWith('91') ? digits.slice(2) : digits
    if (number) {
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`
    }
    return ''
  }

  const submitEmployee = async () => {
    if (!nextEmployeeId) {
      toast({ title: 'Unable to assign new ID', description: 'Could not compute next employee_id', variant: 'destructive' })
      return
    }
    if (!employeeForm.name || !employeeForm.email || !employeeForm.phone || !employeeForm.password || !employeeForm.passwordConfirm) {
      toast({ title: 'Missing fields', description: 'Name, email, phone and password are required', variant: 'destructive' })
      return
    }
    if (!employeeForm.department) {
      toast({ title: 'Missing department', description: 'Please select a department', variant: 'destructive' })
      return
    }
    const phoneDigits = employeeForm.phone.replace(/\D/g, '')
    if (phoneDigits.length !== 12 || !phoneDigits.startsWith('91')) {
      toast({ title: 'Invalid phone number', description: 'Please enter a valid 10-digit Indian mobile number', variant: 'destructive' })
      return
    }
    const actualNumber = phoneDigits.slice(2)
    if (!/^[6-9]/.test(actualNumber)) {
      toast({ title: 'Invalid phone number', description: 'Indian mobile numbers must start with 6, 7, 8, or 9', variant: 'destructive' })
      return
    }
    if (employeeForm.password !== employeeForm.passwordConfirm) {
      toast({ title: 'Password mismatch', description: 'Passwords do not match', variant: 'destructive' })
      return
    }
    const roleToUse = (selectedRole === 'CUSTOM' ? customRole.trim() : selectedRole.trim()) || employeeForm.role.trim() || 'Employee'
    if (selectedRole === 'CUSTOM' && !customRole.trim()) {
      toast({ title: 'Role required', description: 'Enter a custom role name', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        employee_id: nextEmployeeId,
        name: employeeForm.name,
        email: employeeForm.email,
        phone: employeeForm.phone,
        role: roleToUse,
        department: employeeForm.department,
        availability: employeeForm.availability,
        skills: employeeForm.skills ? employeeForm.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        password: employeeForm.password,
        passwordConfirm: employeeForm.passwordConfirm,
      }
      await api.post('/employees/signup', payload)
      toast({ 
        title: 'Signup successful!', 
        description: `Welcome ${employeeForm.name}! Please login to continue.` 
      })
      // Reset form
      setEmployeeForm({ 
        name: '', 
        email: '', 
        phone: '', 
        role: '', 
        department: '', 
        availability: 'Available',
        skills: '', 
        password: '', 
        passwordConfirm: '' 
      })
      setSelectedRole('')
      setCustomRole('')
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      const msg = err?.response?.data?.message || 'Failed to create employee account'
      toast({ title: 'Signup failed', description: msg, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const submitClient = async () => {
    if (!nextClientId) {
      toast({ title: 'Unable to assign new ID', description: 'Could not compute next client_id', variant: 'destructive' })
      return
    }
    if (!clientForm.client_name || !clientForm.contact_email || !clientForm.phone || !clientForm.password || !clientForm.passwordConfirm) {
      toast({ title: 'Missing fields', description: 'All fields are required', variant: 'destructive' })
      return
    }
    const phoneDigits = clientForm.phone.replace(/\D/g, '')
    if (phoneDigits.length !== 12 || !phoneDigits.startsWith('91')) {
      toast({ title: 'Invalid phone number', description: 'Please enter a valid 10-digit Indian mobile number', variant: 'destructive' })
      return
    }
    const actualNumber = phoneDigits.slice(2)
    if (!/^[6-9]/.test(actualNumber)) {
      toast({ title: 'Invalid phone number', description: 'Indian mobile numbers must start with 6, 7, 8, or 9', variant: 'destructive' })
      return
    }
    if (clientForm.password !== clientForm.passwordConfirm) {
      toast({ title: 'Password mismatch', description: 'Passwords do not match', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        client_id: nextClientId,
        client_name: clientForm.client_name,
        contact_email: clientForm.contact_email,
        phone: clientForm.phone,
        password: clientForm.password,
        passwordConfirm: clientForm.passwordConfirm,
      }
      await api.post('/clients/signup', payload)
      toast({ 
        title: 'Signup successful!', 
        description: `Welcome ${clientForm.client_name}! Please login to continue.` 
      })
      // Reset form
      setClientForm({ 
        client_name: '', 
        contact_email: '', 
        phone: '', 
        password: '', 
        passwordConfirm: '' 
      })
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      const msg = err?.response?.data?.message || 'Failed to create client account'
      toast({ title: 'Signup failed', description: msg, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 py-12">
        <Card className="w-full max-w-2xl mx-4">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">Sign Up</CardTitle>
            <CardDescription>
              Create a new account to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Signup Type Selection */}
            <div className="space-y-2">
              <Label>I want to sign up as</Label>
              <Select value={signupType} onValueChange={(v) => setSignupType(v as SignupType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employee Signup Form */}
            {signupType === 'employee' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emp-name">Full Name</Label>
                    <Input 
                      id="emp-name" 
                      value={employeeForm.name} 
                      onChange={handleEmployeeChange('name')} 
                      placeholder="Jane Doe" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="emp-email">Email</Label>
                    <Input 
                      id="emp-email" 
                      type="email" 
                      value={employeeForm.email} 
                      onChange={handleEmployeeChange('email')} 
                      placeholder="jane.doe@company.com" 
                    />
                  </div>
                  <div>
                    <Label>Role/Title</Label>
                    {roles.length > 0 ? (
                      <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                          <SelectItem value="CUSTOM">Custom role…</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        value={employeeForm.role} 
                        onChange={handleEmployeeChange('role')} 
                        placeholder="Enter role" 
                      />
                    )}
                    {selectedRole === 'CUSTOM' && (
                      <div className="mt-2">
                        <Input 
                          value={customRole} 
                          onChange={(e) => setCustomRole(e.target.value)} 
                          placeholder="e.g. Data Analyst" 
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="emp-phone">Phone Number</Label>
                    <Input 
                      id="emp-phone" 
                      value={formatPhoneDisplay(employeeForm.phone)} 
                      onChange={(e) => handlePhoneChange(e, 'employee')} 
                      placeholder="+91 98765 43210" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">10-digit mobile (6-9 at start)</p>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Select 
                      value={employeeForm.department} 
                      onValueChange={(v) => setEmployeeForm({ ...employeeForm, department: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Availability</Label>
                    <Select 
                      value={employeeForm.availability} 
                      onValueChange={(v) => setEmployeeForm({ 
                        ...employeeForm, 
                        availability: v as 'Available' | 'Busy' | 'On Leave' 
                      })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Busy">Busy</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="emp-skills">Skills (comma separated)</Label>
                    <Input 
                      id="emp-skills" 
                      value={employeeForm.skills} 
                      onChange={handleEmployeeChange('skills')} 
                      placeholder="React, Testing Tools, API/DB" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="emp-password">Password</Label>
                    <Input 
                      id="emp-password" 
                      type="password" 
                      value={employeeForm.password} 
                      onChange={handleEmployeeChange('password')} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="emp-password-confirm">Confirm Password</Label>
                    <Input 
                      id="emp-password-confirm" 
                      type="password" 
                      value={employeeForm.passwordConfirm} 
                      onChange={handleEmployeeChange('passwordConfirm')} 
                    />
                  </div>
                </div>
                <Button onClick={submitEmployee} disabled={submitting} className="w-full">
                  Sign Up as Employee{nextEmployeeId ? ` (#${nextEmployeeId})` : ''}
                </Button>
              </div>
            )}

            {/* Client Signup Form */}
            {signupType === 'client' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client-name">Company Name</Label>
                    <Input 
                      id="client-name" 
                      value={clientForm.client_name} 
                      onChange={handleClientChange('client_name')} 
                      placeholder="DesignX Ltd" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-email">Contact Email</Label>
                    <Input 
                      id="client-email" 
                      type="email" 
                      value={clientForm.contact_email} 
                      onChange={handleClientChange('contact_email')} 
                      placeholder="contact@designx.com" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="client-phone">Phone Number</Label>
                    <Input 
                      id="client-phone" 
                      value={formatPhoneDisplay(clientForm.phone)} 
                      onChange={(e) => handlePhoneChange(e, 'client')} 
                      placeholder="+91 98765 43210" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">10-digit mobile (6-9 at start)</p>
                  </div>
                  <div>
                    <Label htmlFor="client-password">Password</Label>
                    <Input 
                      id="client-password" 
                      type="password" 
                      value={clientForm.password} 
                      onChange={handleClientChange('password')} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-password-confirm">Confirm Password</Label>
                    <Input 
                      id="client-password-confirm" 
                      type="password" 
                      value={clientForm.passwordConfirm} 
                      onChange={handleClientChange('passwordConfirm')} 
                    />
                  </div>
                </div>
                <Button onClick={submitClient} disabled={submitting} className="w-full">
                  Sign Up as Client{nextClientId ? ` (#${nextClientId})` : ''}
                </Button>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Login here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
