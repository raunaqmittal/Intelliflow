import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { loadEmployees } from '@/utils/dataParser'
import { useUser } from '@/contexts/UserContext'

export default function ManageEmployees() {
  const { employee: manager } = useUser()
  const { toast } = useToast()

  const [nextId, setNextId] = useState<number | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [customRole, setCustomRole] = useState<string>('')
  const defaultDept = useMemo(() => {
    // Prefer manager.approvesDepartments[0]; fallback to manager.department
    const list = (manager?.approvesDepartments || []) as string[]
    return (list && list.length > 0 ? list[0] : manager?.department) || ''
  }, [manager])

  const [form, setForm] = useState({
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
  const [submitting, setSubmitting] = useState(false)

  // Delete employee state
  const [departmentEmployees, setDepartmentEmployees] = useState<any[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    // Prepopulate department from manager context
    setForm((f) => ({ ...f, department: defaultDept }))
  }, [defaultDept])

  useEffect(() => {
    // Compute next employee_id and derive dynamic role set
    ;(async () => {
      try {
        const employees = await loadEmployees()
        const maxId = employees.reduce((m, e) => Math.max(m, e.employee_id), 0)
        setNextId(maxId + 1)
        const foundRoles = Array.from(
          new Set(
            employees
              .map(e => (e.role || '').trim())
              .filter(r => r.length > 0)
          )
        )
        // Normalize duplicates with case differences (e.g., Developer vs developer)
        const normalizedMap = new Map<string, string>()
        foundRoles.forEach(r => {
          const key = r.toLowerCase()
          if (!normalizedMap.has(key)) normalizedMap.set(key, r)
        })
        const finalRoles = Array.from(normalizedMap.values()).sort((a,b) => a.localeCompare(b))
        setRoles(finalRoles)
      } catch {
        setNextId(null)
        setRoles([])
      }
    })()
  }, [])

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [key]: e.target.value })
  }

  const submit = async () => {
    if (!nextId) {
      toast({ title: 'Unable to assign new ID', description: 'Could not compute next employee_id', variant: 'destructive' })
      return
    }
    if (!form.name || !form.email || !form.phone || !form.password || !form.passwordConfirm) {
      toast({ title: 'Missing fields', description: 'Name, email, phone and password are required', variant: 'destructive' })
      return
    }
    // Determine role from selection or custom input or fallback
    const roleToUse = (selectedRole === 'CUSTOM' ? customRole.trim() : selectedRole.trim()) || form.role.trim() || 'Employee'
    if (selectedRole === 'CUSTOM' && !customRole.trim()) {
      toast({ title: 'Role required', description: 'Enter a custom role name', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        employee_id: nextId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: roleToUse,
        department: form.department || defaultDept,
        availability: form.availability,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        password: form.password,
        passwordConfirm: form.passwordConfirm,
      }
      await api.post('/employees/signup', payload)
      toast({ title: 'Employee created', description: `${form.name} was added to ${payload.department}.` })
      // Reset name/email/skills; keep dept preselected
      setForm({ ...form, name: '', email: '', phone: '', role: '', skills: '', password: '', passwordConfirm: '' })
      setSelectedRole('')
      setCustomRole('')
      // Refresh next ID
      const employees = await loadEmployees()
      const maxId = employees.reduce((m, e) => Math.max(m, e.employee_id), 0)
      setNextId(maxId + 1)
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      const msg = err?.response?.data?.message || 'Failed to create employee'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const loadDepartmentEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const response = await api.get('/employees')
      const allEmployees = response.data.data.employees
      const filtered = allEmployees.filter((e: any) => e.department === defaultDept)
      setDepartmentEmployees(filtered)
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load employees', variant: 'destructive' })
      setDepartmentEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return
    }
    setDeletingId(employeeId)
    try {
      await api.delete(`/employees/${employeeId}`)
      toast({ title: 'Employee deleted', description: 'Employee has been removed successfully.' })
      // Reload employee list
      await loadDepartmentEmployees()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      const msg = err?.response?.data?.message || 'Failed to delete employee'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Manage Employees</h1>
        <p className="text-muted-foreground">Add new employees or delete existing ones from your department.</p>
      </div>

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="add">Add New Employee</TabsTrigger>
          <TabsTrigger value="delete" onClick={loadDepartmentEmployees}>Delete Employee</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="mt-6">
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={form.name} onChange={handleChange('name')} placeholder="Jane Doe" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={handleChange('email')} placeholder="jane.doe@company.com" />
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
                    <Input value={form.role} onChange={handleChange('role')} placeholder="Enter role" />
                  )}
                  {selectedRole === 'CUSTOM' && (
                    <div className="mt-2">
                      <Input value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="e.g. Data Analyst" />
                      <p className="text-xs text-muted-foreground mt-1">Provide a new role not in the predefined list.</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={handleChange('phone')} placeholder="+91 90000 00000" required />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={form.department} disabled readOnly />
                  <p className="text-xs text-muted-foreground mt-1">Department is set from your manager access.</p>
                </div>
                <div>
                  <Label>Availability</Label>
                  <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v as 'Available' | 'Busy' | 'On Leave' })}>
                    <SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Busy">Busy</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="skills">Skills (comma separated)</Label>
                  <Input id="skills" value={form.skills} onChange={handleChange('skills')} placeholder="React, Testing Tools, API/DB" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={form.password} onChange={handleChange('password')} />
                </div>
                <div>
                  <Label htmlFor="passwordConfirm">Confirm Password</Label>
                  <Input id="passwordConfirm" type="password" value={form.passwordConfirm} onChange={handleChange('passwordConfirm')} />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button onClick={submit} disabled={submitting}>Add Employee{nextId ? ` (#${nextId})` : ''}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delete" className="mt-6">
          <Card className="max-w-5xl">
            <CardHeader>
              <CardTitle>Delete Employee from {defaultDept}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEmployees ? (
                <p className="text-muted-foreground">Loading employees...</p>
              ) : departmentEmployees.length === 0 ? (
                <p className="text-muted-foreground">No employees found in your department.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentEmployees.map((emp) => (
                      <TableRow key={emp._id}>
                        <TableCell>{emp.employee_id}</TableCell>
                        <TableCell>{emp.name}</TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>{emp.role || 'N/A'}</TableCell>
                        <TableCell>{emp.availability || 'N/A'}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(emp._id)}
                            disabled={deletingId === emp._id}
                          >
                            {deletingId === emp._id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
