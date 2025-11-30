import type { Employee } from '@/types';

type ApiEmployee = {
  employee_id?: number;
  name?: string;
  email?: string;
  availability?: 'Available' | 'Busy' | 'On Leave';
  role?: string;
  department?: string;
  phone?: string;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'email';
  _id?: string;
  isApprover?: boolean;
  approvesDepartments?: string[];
};

export function mapEmployeeFromApi(user: ApiEmployee): Employee {
  return {
    employee_id: user.employee_id ?? 0,
    name: user.name ?? '',
    email: user.email ?? '',
    role_id: 0,
    department_id: 0,
    availability: user.availability || 'Available',
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    twoFactorMethod: user.twoFactorMethod,
    role: user.role,
    department: user.department,
    _id: user._id,
    isApprover: user.isApprover,
    approvesDepartments: user.approvesDepartments,
  } as Employee;
}
