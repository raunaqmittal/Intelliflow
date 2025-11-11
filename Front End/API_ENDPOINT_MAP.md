# API Endpoint Map - Intelliflow Backend

## 🗺️ Complete API Routes Overview

### Base URL: `http://localhost:5000/api`

---

## 1️⃣ Authentication Routes (`/api/auth`)

```
POST   /api/auth/register              Create new user account
POST   /api/auth/login                 Login with credentials
POST   /api/auth/logout                Logout current user
POST   /api/auth/refresh-token         Refresh JWT token
POST   /api/auth/forgot-password       Request password reset
POST   /api/auth/reset-password/:token Reset password with token
GET    /api/auth/verify-email/:token   Verify email address
GET    /api/auth/me                    Get current user profile
```

**Request Bodies**:

```javascript
// Register
{
  email: "user@example.com",
  password: "SecurePass123!",
  role: "client" | "employee" | "manager",
  profileData: { ... } // Role-specific profile data
}

// Login
{
  email: "user@example.com",
  password: "SecurePass123!"
}

// Response
{
  success: true,
  data: {
    token: "jwt_token_here",
    user: { userId, email, role }
  }
}
```

---

## 2️⃣ Client Routes (`/api/clients`)

```
GET    /api/clients/profile            Get client profile
PUT    /api/clients/profile            Update client information
GET    /api/clients/projects           List all client projects
GET    /api/clients/projects/:id       Get specific project details
POST   /api/clients/requests           Submit new project request
GET    /api/clients/requests           List all submitted requests
GET    /api/clients/requests/:id       Get request details
PUT    /api/clients/requests/:id       Update pending request
DELETE /api/clients/requests/:id       Cancel request
GET    /api/clients/dashboard          Dashboard statistics
```

**Key Request Bodies**:

```javascript
// Submit Request
POST /api/clients/requests
{
  title: "Mobile App Redesign",
  description: "We need a complete UI/UX redesign...",
  category: "UI/UX Design",
  expectedDeadline: "2025-12-31",
  budget: 50000,
  attachments: ["url1", "url2"]
}

// Update Profile
PUT /api/clients/profile
{
  clientName: "DesignX Ltd",
  contactPerson: "John Doe",
  phone: "+91 123 456 7890",
  address: "Mumbai, India"
}
```

---

## 3️⃣ Employee Routes (`/api/employees`)

```
GET    /api/employees/profile                Get employee profile
PUT    /api/employees/profile                Update profile info
PUT    /api/employees/availability           Update availability status
GET    /api/employees/tasks                  List all assigned tasks
GET    /api/employees/tasks/:id              Get task details
PUT    /api/employees/tasks/:id/status       Update task status
POST   /api/employees/tasks/:id/comments     Add task comment
GET    /api/employees/dashboard              Dashboard with stats
GET    /api/employees/projects               Projects involved in
```

**Key Request Bodies**:

```javascript
// Update Availability
PUT /api/employees/availability
{
  availability: "Available" | "Busy" | "On Leave"
}

// Update Task Status
PUT /api/employees/tasks/:id/status
{
  status: "Pending" | "In Progress" | "Done",
  actualHours: 5
}

// Add Comment
POST /api/employees/tasks/:id/comments
{
  comment: "Completed the wireframe design"
}
```

---

## 4️⃣ Manager Routes (`/api/managers`)

```
GET    /api/managers/profile                     Get manager profile
PUT    /api/managers/profile                     Update profile
GET    /api/managers/dashboard                   Dashboard with approvals
GET    /api/managers/requests                    Pending client requests
GET    /api/managers/requests/:id                Request for review
POST   /api/managers/requests/:id/review         Approve/reject request
POST   /api/managers/requests/:id/convert        Convert to project
```

**Key Request Bodies**:

```javascript
// Review Request
POST /api/managers/requests/:id/review
{
  action: "approve" | "reject",
  reviewNotes: "Looks good, approved for Sprint planning",
  suggestedFramework: "Agile",
  estimatedDuration: 60 // days
}

// Convert to Project
POST /api/managers/requests/:id/convert
{
  projectTitle: "Dashboard UI Redesign",
  framework: "Agile",
  sprints: [
    {
      sprintName: "Sprint 0 - Discovery",
      tasks: [
        {
          taskName: "Gather requirements",
          departmentId: 1,
          roleId: 1,
          assignedTo: 1
        }
      ]
    }
  ]
}
```

---

## 5️⃣ Project Routes (`/api/projects`)

```
GET    /api/projects                      List all projects (filtered by role)
GET    /api/projects/:id                  Get project details
POST   /api/projects                      Create new project
PUT    /api/projects/:id                  Update project
DELETE /api/projects/:id                  Delete/cancel project
GET    /api/projects/:id/sprints          Get project sprints
GET    /api/projects/:id/tasks            Get all project tasks
GET    /api/projects/:id/team             Get team members
PUT    /api/projects/:id/status           Update project status
GET    /api/projects/:id/statistics       Project statistics
```

**Key Request Bodies**:

```javascript
// Create Project
POST /api/projects
{
  clientId: "client_object_id",
  projectTitle: "IoT Smart Home Prototype",
  description: "Build a working prototype...",
  category: "Hardware Prototype",
  framework: "Hybrid",
  estimatedDuration: 90,
  startDate: "2025-11-01",
  priority: "High"
}

// Update Status
PUT /api/projects/:id/status
{
  status: "In Progress" | "Completed" | "Cancelled",
  completionNotes: "All sprints completed successfully"
}
```

---

## 6️⃣ Sprint Routes (`/api/sprints`)

```
GET    /api/sprints/:id              Get sprint details
POST   /api/sprints                  Create new sprint
PUT    /api/sprints/:id              Update sprint
DELETE /api/sprints/:id              Delete sprint
GET    /api/sprints/:id/tasks        Get sprint tasks
PUT    /api/sprints/:id/status       Update sprint status
```

**Key Request Bodies**:

```javascript
// Create Sprint
POST /api/sprints
{
  projectId: "project_object_id",
  sprintName: "Sprint 1 - Wireframes",
  description: "Create wireframes for all screens",
  startDate: "2025-11-01",
  endDate: "2025-11-14",
  goals: ["Complete 5 wireframes", "User testing"],
  order: 1
}

// Update Status
PUT /api/sprints/:id/status
{
  status: "Pending" | "In Progress" | "Completed"
}
```

---

## 7️⃣ Task Routes (`/api/tasks`)

```
GET    /api/tasks/:id                       Get task details
POST   /api/tasks                           Create new task
PUT    /api/tasks/:id                       Update task
DELETE /api/tasks/:id                       Delete task
PUT    /api/tasks/:id/assign                Assign to employee
PUT    /api/tasks/:id/status                Update task status
POST   /api/tasks/:id/comments              Add comment
GET    /api/tasks/:id/comments              Get all comments
POST   /api/tasks/:id/attachments           Upload file
POST   /api/tasks/:id/dependencies          Add dependency
DELETE /api/tasks/:id/dependencies/:depId   Remove dependency
```

**Key Request Bodies**:

```javascript
// Create Task
POST /api/tasks
{
  sprintId: "sprint_object_id",
  taskName: "Draft wireframes",
  description: "Create wireframes for home screen",
  departmentId: 3,
  roleId: 3,
  priority: "High",
  estimatedHours: 8,
  dueDate: "2025-11-10"
}

// Assign Task
PUT /api/tasks/:id/assign
{
  assignedTo: "employee_object_id",
  assignedBy: "manager_object_id"
}

// Add Dependency
POST /api/tasks/:id/dependencies
{
  dependsOnTaskId: "previous_task_id",
  dependencyType: "finish-to-start"
}
```

---

## 8️⃣ Team Routes (`/api/teams`)

```
GET    /api/teams/employees              List all employees
GET    /api/teams/employees/:id          Get employee details
PUT    /api/teams/employees/:id          Update employee
GET    /api/teams/departments            List all departments
GET    /api/teams/roles                  List all roles
GET    /api/teams/workload               Team workload distribution
GET    /api/teams/availability           Team availability overview
```

**Query Parameters**:

```javascript
// Get employees with filters
GET /api/teams/employees?departmentId=3&availability=Available&roleId=5

// Get workload
GET /api/teams/workload?departmentId=7

// Response
{
  success: true,
  data: [
    {
      employeeId: 1,
      name: "Neha Saxena",
      taskCount: 5,
      availability: "Busy",
      currentProjects: 2
    }
  ]
}
```

---

## 9️⃣ System Routes (`/api/system`)

```
GET    /api/system/departments        List all departments
GET    /api/system/roles              List all roles
GET    /api/system/skills             List all skills
POST   /api/system/departments        Create department (Admin)
POST   /api/system/roles              Create role (Admin)
POST   /api/system/skills             Create skill (Admin)
```

**Key Request Bodies**:

```javascript
// Create Department
POST /api/system/departments
{
  departmentName: "AI/ML Engineering",
  description: "Artificial Intelligence and Machine Learning"
}

// Create Role
POST /api/system/roles
{
  roleName: "ML Engineer",
  departmentId: 10,
  requiredSkills: ["Python", "TensorFlow", "PyTorch"]
}
```

---

## 🔟 AI Workflow Routes (`/api/workflow`) - FUTURE

```
POST   /api/workflow/analyze-request      Analyze client request
POST   /api/workflow/generate-tasks       Generate task breakdown
POST   /api/workflow/suggest-team         Suggest team composition
POST   /api/workflow/estimate-duration    Estimate project duration
POST   /api/workflow/optimize-allocation  Optimize resource allocation
```

**Key Request Bodies**:

```javascript
// Analyze Request
POST /api/workflow/analyze-request
{
  requestText: "We need a mobile app with user authentication...",
  category: "Mobile Development"
}

// Response
{
  success: true,
  data: {
    summary: "Mobile app with auth, profile management...",
    extractedRequirements: [...],
    suggestedFramework: "Agile",
    estimatedDuration: 60,
    requiredSkills: ["React Native", "Node.js", "MongoDB"],
    confidenceScore: 0.87
  }
}

// Generate Tasks
POST /api/workflow/generate-tasks
{
  requestId: "request_object_id",
  framework: "Agile"
}

// Response
{
  success: true,
  data: {
    sprints: [
      {
        sprintName: "Sprint 0 - Discovery",
        tasks: [
          { taskName: "Requirements gathering", roleId: 1, departmentId: 1 },
          { taskName: "Create user stories", roleId: 2, departmentId: 2 }
        ]
      }
    ]
  }
}
```

---

## 1️⃣1️⃣ Notification Routes (`/api/notifications`)

```
GET    /api/notifications                 Get user notifications
PUT    /api/notifications/:id/read        Mark as read
PUT    /api/notifications/read-all        Mark all as read
DELETE /api/notifications/:id             Delete notification
```

**Response Example**:

```javascript
{
  success: true,
  data: [
    {
      _id: "notification_id",
      type: "task_assigned",
      title: "New Task Assigned",
      message: "You have been assigned task: Draft wireframes",
      relatedEntity: {
        entityType: "task",
        entityId: "task_id"
      },
      isRead: false,
      createdAt: "2025-10-16T10:30:00Z"
    }
  ]
}
```

---

## 1️⃣2️⃣ Analytics Routes (`/api/analytics`)

```
GET    /api/analytics/projects            Project analytics
GET    /api/analytics/employees/:id       Employee performance
GET    /api/analytics/team-performance    Team metrics
GET    /api/analytics/task-completion     Task completion rates
```

**Response Examples**:

```javascript
// Project Analytics
GET /api/analytics/projects
{
  success: true,
  data: {
    totalProjects: 15,
    activeProjects: 8,
    completedProjects: 5,
    averageCompletionTime: 45, // days
    onTimeCompletionRate: 87, // %
    byFramework: {
      Agile: 10,
      Waterfall: 3,
      Hybrid: 2
    }
  }
}

// Employee Performance
GET /api/analytics/employees/:id
{
  success: true,
  data: {
    employeeId: 1,
    name: "Neha Saxena",
    totalTasksCompleted: 45,
    averageCompletionTime: 3.5, // hours
    onTimeCompletionRate: 92, // %
    currentWorkload: 5,
    productivityScore: 8.7
  }
}
```

---

## 📊 Response Format Standards

### Success Response

```javascript
{
  success: true,
  data: { ... },
  message: "Operation successful",
  pagination: { // for list endpoints
    page: 1,
    limit: 10,
    total: 100,
    pages: 10
  }
}
```

### Error Response

```javascript
{
  success: false,
  error: {
    code: "AUTH_INVALID_CREDENTIALS",
    message: "Invalid email or password",
    statusCode: 401,
    details: { ... } // optional
  }
}
```

---

## 🔐 Authentication Headers

All protected endpoints require:

```javascript
headers: {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

---

## 🎯 Common Query Parameters

### Pagination

```
?page=1&limit=10
```

### Filtering

```
?status=In Progress&framework=Agile&departmentId=3
```

### Sorting

```
?sortBy=createdAt&order=desc
```

### Search

```
?search=wireframe&searchFields=taskName,description
```

### Date Range

```
?startDate=2025-01-01&endDate=2025-12-31
```

---

## 📝 HTTP Status Codes

| Code | Meaning      | Usage                                   |
| ---- | ------------ | --------------------------------------- |
| 200  | OK           | Successful GET, PUT, DELETE             |
| 201  | Created      | Successful POST                         |
| 204  | No Content   | Successful DELETE with no response body |
| 400  | Bad Request  | Validation error                        |
| 401  | Unauthorized | Authentication required                 |
| 403  | Forbidden    | Insufficient permissions                |
| 404  | Not Found    | Resource doesn't exist                  |
| 409  | Conflict     | Duplicate entry                         |
| 500  | Server Error | Internal server error                   |

---

## 🧪 Example API Calls (using fetch)

### Login

```javascript
const response = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "neha.saxena@company.com",
    password: "SecurePass123!",
  }),
});
const data = await response.json();
// Store token: localStorage.setItem('token', data.data.token);
```

### Get Employee Tasks

```javascript
const token = localStorage.getItem("token");
const response = await fetch("http://localhost:5000/api/employees/tasks", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
const data = await response.json();
// data.data contains array of tasks
```

### Update Task Status

```javascript
const response = await fetch(
  `http://localhost:5000/api/employees/tasks/${taskId}/status`,
  {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "In Progress",
      actualHours: 2,
    }),
  }
);
```

### Submit Client Request

```javascript
const response = await fetch("http://localhost:5000/api/clients/requests", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Mobile App Redesign",
    description: "Complete UI/UX overhaul...",
    category: "UI/UX Design",
    expectedDeadline: "2025-12-31",
    budget: 50000,
  }),
});
```

---

## 🔗 Frontend Integration Points

### Client Dashboard

```javascript
// Fetch projects
GET / api / clients / projects;

// Fetch dashboard stats
GET / api / clients / dashboard;

// Submit new request
POST / api / clients / requests;
```

### Employee Dashboard

```javascript
// Fetch profile
GET /api/employees/profile

// Fetch tasks
GET /api/employees/tasks

// Get dashboard stats
GET /api/employees/dashboard

// Update task status
PUT /api/employees/tasks/:id/status
```

### Manager Dashboard

```javascript
// Fetch pending requests
GET /api/managers/requests

// Get team workload
GET /api/teams/workload

// Approve request
POST /api/managers/requests/:id/review

// Create project
POST /api/projects

// Assign task
PUT /api/tasks/:id/assign
```

---

**Last Updated**: Current  
**Version**: 1.0  
**Total Endpoints**: 65+  
**Project**: Intelliflow Backend API
