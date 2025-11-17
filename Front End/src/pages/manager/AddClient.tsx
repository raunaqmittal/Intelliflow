import { useEffect, useState } from 'react'
import type React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'

export default function AddClient() {
  const { toast } = useToast()

  const [nextId, setNextId] = useState<number | null>(null)
  const [form, setForm] = useState({
    client_name: '',
    contact_email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Compute next client_id
    ;(async () => {
      try {
        const res = await api.get('/clients')
        const clients = res.data?.data?.clients || []
        const maxId = clients.reduce((m: number, c: { client_id: number }) => Math.max(m, c.client_id), 0)
        setNextId(maxId + 1)
      } catch {
        setNextId(null)
      }
    })()
  }, [])

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [key]: e.target.value })
  }

  const submit = async () => {
    if (!nextId) {
      toast({ title: 'Unable to assign new ID', description: 'Could not compute next client_id', variant: 'destructive' })
      return
    }
    if (!form.client_name || !form.contact_email || !form.phone || !form.password || !form.passwordConfirm) {
      toast({ title: 'Missing fields', description: 'All fields are required', variant: 'destructive' })
      return
    }
    if (form.password !== form.passwordConfirm) {
      toast({ title: 'Password mismatch', description: 'Passwords do not match', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        client_id: nextId,
        client_name: form.client_name,
        contact_email: form.contact_email,
        phone: form.phone,
        password: form.password,
        passwordConfirm: form.passwordConfirm,
      }
      await api.post('/clients/signup', payload)
      toast({ title: 'Client created', description: `${form.client_name} was successfully added.` })
      // Reset form
      setForm({ client_name: '', contact_email: '', phone: '', password: '', passwordConfirm: '' })
      // Increment next ID
      setNextId(nextId + 1)
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      const msg = err?.response?.data?.message || 'Failed to create client'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Add New Client</h1>
        <p className="text-muted-foreground">Register a new client organization to the system.</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_name">Company Name</Label>
              <Input 
                id="client_name" 
                value={form.client_name} 
                onChange={handleChange('client_name')} 
                placeholder="DesignX Ltd" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input 
                id="contact_email" 
                type="email" 
                value={form.contact_email} 
                onChange={handleChange('contact_email')} 
                placeholder="contact@designx.com" 
                required 
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={form.phone} 
                onChange={handleChange('phone')} 
                placeholder="+919876543210" 
                required 
              />
              <p className="text-xs text-muted-foreground mt-1">Enter phone in international format (e.g., +919876543210)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={form.password} 
                onChange={handleChange('password')} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="passwordConfirm">Confirm Password</Label>
              <Input 
                id="passwordConfirm" 
                type="password" 
                value={form.passwordConfirm} 
                onChange={handleChange('passwordConfirm')} 
                required 
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={submit} disabled={submitting}>
              Add Client{nextId ? ` (#${nextId})` : ''}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
