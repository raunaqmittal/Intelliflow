import type { 
  Project, 
  Employee, 
  Task, 
  Sprint, 
  Role, 
  Department, 
  TaskWithDetails 
} from '@/types';
import api from '@/lib/api';

// Minimal API types
type ApiProject = {
  _id?: string;
  id?: string;
  project_id: number;
  project_title: string;
  client_name?: string;
  category?: string;
  framework?: 'Agile' | 'Hybrid' | 'Waterfall';
  status: string;
  activeSprintNumber?: number;
  totalSprints?: number;
};

type ApiEmployee = {
  employee_id: number;
  name: string;
  email: string;
  availability?: 'Available' | 'Busy' | 'On Leave';
  role?: string;
  department?: string;
};

type ApiTask = {
  _id?: string;
  task_id: number;
  task_name: string;
  assigned_to: number[] | number;
  assignedEmployees?: Array<{
    employee_id: number;
    name: string;
    email: string;
    role?: string;
    department?: string;
    availability?: string;
  }>;
  status: string;
  sprint_number?: number;
  project?: { project_title?: string; _id?: string };
};

const mapTaskStatus = (s: string): Task['status'] => {
  if (s === 'Completed' || s === 'Done') return 'Done';
  if (s === 'To Do' || s === 'Pending') return 'Pending';
  if (s === 'In Progress') return 'In Progress';
  return 'Pending';
};

const mapProjectStatus = (s: string): Project['status'] => {
  if (s === 'Approved') return 'In Progress';
  if (s === 'In Progress' || s === 'Completed' || s === 'Pending' || s === 'Cancelled') return s as Project['status'];
  return 'Pending';
};

/**
 * Generic CSV parser function - handles all CSV file parsing
 * Automatically converts numeric fields and removes BOM characters
 */
// CSV parsing removed; functions below now use backend API

// ============================================
// Basic Data Loaders - Standardized to /public/*.csv
// ============================================

export const loadProjects = async (): Promise<Project[]> => {
  try {
    const res = await api.get('/projects');
    const projects: ApiProject[] = res.data?.data?.projects || [];
    return projects.map((p) => ({
      project_id: p.project_id,
      client_name: p.client_name,
      project_title: p.project_title,
      category: p.category,
      framework: p.framework,
      status: mapProjectStatus(p.status),
      _id: p._id,
    } as Project));
  } catch (e) {
    console.error('Failed to load projects from API', e);
    return [];
  }
};

export const loadEmployees = async (): Promise<Employee[]> => {
  try {
    const res = await api.get('/employees');
    const employees: ApiEmployee[] = res.data?.data?.employees || [];
    return employees.map((u) => ({
      employee_id: u.employee_id,
      name: u.name,
      email: u.email,
      role_id: 0,
      department_id: 0,
      availability: u.availability || 'Available',
      role: u.role,
      department: u.department,
    } as Employee));
  } catch (e) {
    console.error('Failed to load employees from API', e);
    return [];
  }
};

export const loadTasks = async (): Promise<Task[]> => {
  try {
    const res = await api.get('/tasks');
    const tasks: ApiTask[] = res.data?.data?.tasks || [];
    return tasks.map((t) => ({
      task_id: t.task_id,
      sprint_id: 0,
      task_name: t.task_name,
      department_id: 0,
      role_id: 0,
      assigned_to: Array.isArray(t.assigned_to) ? (t.assigned_to[0] ?? 0) : (t.assigned_to ?? 0),
      status: mapTaskStatus(t.status),
      _id: t._id,
    } as Task));
  } catch (e) {
    console.error('Failed to load tasks from API', e);
    return [];
  }
};

export const loadSprints = async (): Promise<Sprint[]> => {
  // Not modeled in backend; return empty
  return [];
};

export const loadRoles = async (): Promise<Role[]> => {
  // Not modeled as a separate entity in backend; return empty
  return [];
};

export const loadDepartments = async (): Promise<Department[]> => {
  // Not modeled as a separate entity in backend; return empty
  return [] as Department[];
};

// ============================================
// Utility Functions
// ============================================

/**
 * Get a single employee by ID
 */
export async function getEmployeeById(id: number): Promise<Employee | null> {
  try {
    const res = await api.get('/employees');
  const employees: ApiEmployee[] = res.data?.data?.employees || [];
  const u = employees.find((e) => e.employee_id === id);
    return u ? ({
      employee_id: u.employee_id,
      name: u.name,
      email: u.email,
      role_id: 0,
      department_id: 0,
      availability: u.availability || 'Available',
      role: u.role,
      department: u.department,
    } as Employee) : null;
  } catch (e) {
    console.error('Failed to get employee by id', e);
    return null;
  }
}

/**
 * Get a single project by ID
 */
export async function getProjectById(id: number): Promise<Project | null> {
  try {
    const res = await api.get(`/projects`, { params: { project_id: id } });
  const list: ApiProject[] = res.data?.data?.projects || [];
  const p = list.find((p) => p.project_id === id);
    return p ? ({
      project_id: p.project_id,
      client_name: p.client_name,
      project_title: p.project_title,
      category: p.category,
      framework: p.framework,
      status: (p.status === 'Approved' ? 'In Progress' : p.status),
    } as Project) : null;
  } catch (e) {
    console.error('Failed to get project by id', e);
    return null;
  }
}

// ============================================
// Enhanced Data Functions with Relationships
// ============================================

/**
 * Load tasks with detailed information (unified approach)
 * Includes both object references AND string properties for flexibility
 */
export async function loadTasksWithDetails(): Promise<TaskWithDetails[]> {
  // Fallback to basic task list from API; enrich with project title if present
  const res = await api.get('/tasks');
  const tasks: ApiTask[] = res.data?.data?.tasks || [];
  return tasks.map((t) => ({
    task_id: t.task_id,
    sprint_id: 0,
    task_name: t.task_name,
    department_id: 0,
    role_id: 0,
    assigned_to: Array.isArray(t.assigned_to) ? (t.assigned_to[0] ?? 0) : (t.assigned_to ?? 0),
    status: mapTaskStatus(t.status),
    assigned_employee: null,
    employee_name: undefined,
    department_name: undefined,
    role_name: undefined,
    project_title: t.project?.project_title || '',
    sprint_name: '',
    _id: t._id,
  } as TaskWithDetails));
}

/**
 * Get all tasks assigned to a specific employee
 */
export async function getTasksForEmployee(employeeId: number): Promise<TaskWithDetails[]> {
  try {
    const res = await api.get(`/tasks/employee/${employeeId}`);
    const tasks: ApiTask[] = res.data?.data?.tasks || [];
    return tasks.map((t) => ({
      task_id: t.task_id,
      sprint_id: 0,
      task_name: t.task_name,
      department_id: 0,
      role_id: 0,
      assigned_to: Array.isArray(t.assigned_to) ? (t.assigned_to[0] ?? 0) : (t.assigned_to ?? 0),
      status: mapTaskStatus(t.status),
      assigned_employee: null,
      employee_name: undefined,
      department_name: undefined,
      role_name: undefined,
      project_title: t.project?.project_title || '',
      sprint_name: '',
      _id: t._id,
    } as TaskWithDetails));
  } catch (e) {
    console.error('Failed to get tasks for employee', e);
    return [];
  }
}

/**
 * Get all projects for a specific client
 */
export async function getProjectsForClient(clientName: string): Promise<Project[]> {
  const projects = await loadProjects();
  return projects.filter(p => p.client_name === clientName);
}

/**
 * Get comprehensive project details including sprints, tasks, and team
 * (Used by Manager portal)
 */
export async function getProjectDetails(projectId: number) {
  // Fetch single project by id with tasks via backend
  const res = await api.get(`/projects`, { params: { project_id: projectId } });
  const list: ApiProject[] = res.data?.data?.projects || [];
  const project = list.find((p) => p.project_id === projectId);
  if (!project) throw new Error('Project not found');

  // Fetch tasks by project (use _id) - backend now includes assignedEmployees
  const tasksRes = await api.get(`/tasks/project/${project._id || project.id || ''}`);
  const tasks: ApiTask[] = tasksRes.data?.data?.tasks || [];

  // Derive sprint groups from task.sprint (string) or sprint_number
  const sprintKeyToId = new Map<string, number>();
  let nextSprintId = 1;
  const sprints: Sprint[] = [];
  for (const t of tasks) {
    const sprintStr = (t as unknown as { sprint?: string }).sprint;
    const key = sprintStr || (typeof t.sprint_number === 'number' ? `Sprint ${t.sprint_number}` : 'Sprint 1');
    if (!sprintKeyToId.has(key)) {
      sprintKeyToId.set(key, nextSprintId);
      sprints.push({ sprint_id: nextSprintId, project_id: project.project_id, sprint_name: key, status: 'In Progress' });
      nextSprintId++;
    }
  }

  // Build team members from assignedEmployees in tasks (coming from backend)
  const teamMembersMap = new Map<number, Employee>();
  tasks.forEach(task => {
    if (task.assignedEmployees && Array.isArray(task.assignedEmployees)) {
      task.assignedEmployees.forEach(emp => {
        if (!teamMembersMap.has(emp.employee_id)) {
          teamMembersMap.set(emp.employee_id, {
            employee_id: emp.employee_id,
            name: emp.name,
            email: emp.email,
            role_id: 0,
            department_id: 0,
            availability: (emp.availability as 'Available' | 'Busy' | 'On Leave') || 'Available',
            role: emp.role || '',
            department: emp.department || '',
          });
        }
      });
    }
  });

  // Map tasks with computed sprint_id and employee names
  const tasksWithDetails: TaskWithDetails[] = tasks.map((t) => {
    const sprintStr = (t as unknown as { sprint?: string }).sprint;
    const key = sprintStr || (typeof t.sprint_number === 'number' ? `Sprint ${t.sprint_number}` : 'Sprint 1');
    const sprint_id = sprintKeyToId.get(key) || 1;
    
    // Get first assigned employee name if available
    const firstEmployee = t.assignedEmployees && t.assignedEmployees.length > 0 
      ? t.assignedEmployees[0] 
      : null;

    // Extract numeric sprint number from sprint string or use sprint_number
    const sprintNumber = (t as { sprint_number?: number }).sprint_number || 
                        (typeof t.sprint_number === 'number' ? t.sprint_number : sprint_id);

    return {
      task_id: t.task_id,
      sprint_id,
      task_name: t.task_name,
      department_id: 0,
      role_id: 0,
      assigned_to: Array.isArray(t.assigned_to) ? (t.assigned_to[0] ?? 0) : (t.assigned_to ?? 0),
      status: mapTaskStatus(t.status),
      assigned_employee: firstEmployee ? { 
        employee_id: firstEmployee.employee_id, 
        name: firstEmployee.name,
        department: firstEmployee.department,
        email: firstEmployee.email,
        role_id: 0,
        department_id: 0,
        availability: 'Available',
      } : null,
      project_title: project.project_title,
      sprint_name: key,
      sprint_number: sprintNumber,
      _id: t._id,
    } as TaskWithDetails;
  });

  return {
    project: {
      project_id: project.project_id,
      client_name: project.client_name,
      project_title: project.project_title,
      category: project.category,
      framework: project.framework,
      status: (project.status === 'Approved' ? 'In Progress' : mapProjectStatus(project.status)),
      _id: project._id,
      activeSprintNumber: project.activeSprintNumber,
      totalSprints: project.totalSprints,
    } as Project,
    sprints,
    tasks: tasksWithDetails,
    teamMembers: Array.from(teamMembersMap.values()),
  };
}

/**
 * Get team members by department (useful for Manager portal)
 */
export async function getTeamByDepartment(departmentId: number): Promise<Employee[]> {
  const employees = await loadEmployees();
  return employees.filter(emp => emp.department_id === departmentId);
}

/**
 * Get task statistics for an employee
 */
export async function getEmployeeTaskStats(employeeId: number) {
  const tasks = await getTasksForEmployee(employeeId);
  return {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'Done').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    pending: tasks.filter(t => t.status === 'Pending').length
  };
}

/**
 * Get project statistics
 */
export async function getProjectStats(projectId: number) {
  const details = await getProjectDetails(projectId);
  return {
    totalTasks: details.tasks.length,
    completedTasks: details.tasks.filter(t => t.status === 'Done').length,
    inProgressTasks: details.tasks.filter(t => t.status === 'In Progress').length,
    totalSprints: details.sprints.length,
    teamSize: details.teamMembers.length
  };
}
