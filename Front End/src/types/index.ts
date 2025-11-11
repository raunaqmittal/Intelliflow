export interface Department {
  department_id: number;
  department_name: string;
}

export interface Role {
  role_id: number;
  role_name: string;
  department_id: number;
}

export interface Employee {
  employee_id: number;
  name: string;
  email: string;
  role_id: number;
  department_id: number;
  availability: 'Available' | 'Busy' | 'On Leave';
  phone?: string;
  skills?: string[];
  // Optional fields when sourced from backend instead of CSV
  role?: string;
  department?: string;
  _id?: string; // Mongo id (optional)
  // Backend-driven approval fields
  isApprover?: boolean;
  approvesDepartments?: string[];
}

export interface Project {
  project_id: number;
  client_name: string;
  project_title: string;
  category: string;
  framework: 'Agile' | 'Hybrid' | 'Waterfall';
  status: 'In Progress' | 'Completed' | 'Pending' | 'Cancelled';
  _id?: string; // Mongo id (optional)
  activeSprintNumber?: number; // Current active sprint
  totalSprints?: number; // Total number of sprints
}

export interface Sprint {
  sprint_id: number;
  project_id: number;
  sprint_name: string;
  status: 'Completed' | 'In Progress' | 'Pending';
}

export interface Task {
  task_id: number;
  sprint_id: number;
  task_name: string;
  department_id: number;
  role_id: number;
  assigned_to: number;
  status: 'Done' | 'In Progress' | 'Pending';
  _id?: string; // Mongo id (optional)
}

// Unified TaskWithDetails - combines both approaches
// Includes both object reference (preferred) and string properties (for backwards compatibility)
export interface TaskWithDetails extends Task {
  // Object reference to employee (Manager's approach - more flexible)
  assigned_employee: Employee | null;
  
  // String properties (Client/Employee approach - for display)
  employee_name?: string;
  department_name?: string;
  role_name?: string;
  project_title?: string;
  sprint_name?: string;
  sprint_number?: number; // Numeric sprint identifier
  _id?: string; // Mongo id for the task (optional)
}

export type TaskStatus = 'Done' | 'In Progress' | 'Pending';
export type AvailabilityStatus = 'Available' | 'Busy' | 'On Leave';
export type UserRole = 'client' | 'employee' | 'manager' | 'admin';
export type ProjectStatus = 'In Progress' | 'Completed' | 'Pending' | 'Cancelled';
