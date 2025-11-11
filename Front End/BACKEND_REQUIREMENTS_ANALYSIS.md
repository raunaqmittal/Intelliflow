# Backend Requirements Analysis for Intelliflow

## Product Design & Prototyping Workflow Management System

> **Project Domain**: Product Design and Prototyping  
> **Technology Stack**: MongoDB + Mongoose + Node.js + Express  
> **Frontend Framework**: React + TypeScript + Vite

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Frontend Analysis Overview](#frontend-analysis-overview)
3. [Database Schema Design](#database-schema-design)
4. [API Routes & Endpoints](#api-routes--endpoints)
5. [Controllers Structure](#controllers-structure)
6. [Middleware Requirements](#middleware-requirements)
7. [Business Logic & Services](#business-logic--services)
8. [Authentication & Authorization](#authentication--authorization)
9. [Intelligent Workflow Model Integration](#intelligent-workflow-model-integration)
10. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Executive Summary

### Project Purpose

Intelliflow is an intelligent workflow management system designed specifically for Product Design & Prototyping projects. It uses AI-powered workflow generation to analyze client requests, create structured Agile/Hybrid/Waterfall workflows, and automatically assign tasks to appropriate team members based on roles, skills, and availability.

### Key Features Identified from Frontend

- **Multi-Role Portal System**: Client, Employee, and Manager dashboards
- **Project Management**: Full project lifecycle from request to completion
- **Sprint/Task Management**: Agile-based task tracking with dependencies
- **Team Management**: Employee availability, skills, and workload tracking
- **Intelligent Request Processing**: AI-powered workflow generation (to be implemented)
- **Real-time Status Updates**: Task and project status tracking
- **Approval Workflows**: Manager review and approval system

---

## 2. Frontend Analysis Overview

### 2.1 User Roles & Access Levels

| Role         | Access Level  | Primary Functions                                             |
| ------------ | ------------- | ------------------------------------------------------------- |
| **Client**   | Read + Submit | View projects, submit requests, track progress                |
| **Employee** | Read + Update | View assigned tasks, update task status, manage profile       |
| **Manager**  | Full CRUD     | Review requests, approve workflows, assign tasks, manage team |

### 2.2 Current Frontend Pages & Functionalities

#### **CLIENT PORTAL**

1. **Dashboard** (`/client`)

   - View active and completed projects
   - Quick access to submit new requests
   - Project status overview

2. **Projects** (`/client/projects`)

   - Detailed list of all client projects
   - Filter and search functionality
   - Project status tracking

3. **Submit Request** (`/client/submit`)

   - Form to submit new product design requests
   - Currently shows placeholder - needs full implementation

4. **Profile** (`/client/profile`)
   - View/edit company information
   - Contact person details
   - Email management

#### **EMPLOYEE PORTAL**

1. **Dashboard** (`/employee`)

   - Personal profile card with role and department
   - Task summary with statistics
   - Recent tasks overview (up to 3 tasks)

2. **Tasks** (`/employee/tasks`)

   - Complete list of assigned tasks
   - Search and filter by status
   - Update task status (Pending → In Progress → Done)
   - View task details (project, sprint, role, department)

3. **Profile** (`/employee/profile`)
   - Personal information management
   - Availability status updates
   - Task completion statistics
   - Work overview and metrics

#### **MANAGER PORTAL**

1. **Dashboard** (`/manager`)

   - Pending project approvals
   - Active projects overview
   - Team workload distribution

2. **Projects** (`/manager/projects`)

   - Complete project list with search
   - View all projects across all clients
   - Access to project details

3. **Project Details** (`/manager/projects/:projectId`)

   - Full project breakdown
   - Sprint-wise task view
   - Team member assignments
   - Project status and framework

4. **Team** (`/manager/team`)

   - Team member cards with workload
   - Availability status
   - Task count per employee

5. **Profile** (`/manager/profile`)
   - Manager personal information
   - Edit profile details

---

## 3. Database Schema Design

### 3.1 MongoDB Collections & Mongoose Schemas

#### **1. Users Collection**

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  role: String (enum: ['client', 'employee', 'manager', 'admin']),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date,

  // Role-specific reference
  clientProfile: ObjectId (ref: 'Client'),
  employeeProfile: ObjectId (ref: 'Employee'),
  managerProfile: ObjectId (ref: 'Manager')
}
```

#### **2. Clients Collection**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', unique),
  clientName: String (required), // Company name
  contactPerson: String (required),
  email: String (required),
  phone: String,
  address: String,
  industry: String,
  avatarInitials: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### **3. Departments Collection**

```javascript
{
  _id: ObjectId,
  departmentId: Number (unique, required),
  departmentName: String (required),
  description: String,
  isActive: Boolean (default: true)
}
```

#### **4. Roles Collection**

```javascript
{
  _id: ObjectId,
  roleId: Number (unique, required),
  roleName: String (required),
  departmentId: Number (ref: 'Department'),
  description: String,
  requiredSkills: [String],
  isActive: Boolean (default: true)
}
```

#### **5. Employees Collection**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', unique),
  employeeId: Number (unique, auto-increment),
  name: String (required),
  email: String (required, unique),
  phone: String,
  roleId: Number (ref: 'Role', required),
  departmentId: Number (ref: 'Department', required),
  availability: String (enum: ['Available', 'Busy', 'On Leave'], default: 'Available'),
  skills: [String],
  avatarUrl: String,
  joiningDate: Date,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

#### **6. Managers Collection**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', unique),
  employeeId: ObjectId (ref: 'Employee', required),
  managedDepartments: [Number], // Array of department IDs
  permissions: [String], // Array of permission codes
  createdAt: Date,
  updatedAt: Date
}
```

#### **7. Projects Collection**

```javascript
{
  _id: ObjectId,
  projectId: Number (unique, auto-increment),
  clientId: ObjectId (ref: 'Client', required),
  clientName: String (denormalized),
  projectTitle: String (required),
  description: String,
  category: String (required), // e.g., "UI/UX Design", "Hardware Prototype"
  framework: String (enum: ['Agile', 'Hybrid', 'Waterfall'], required),
  status: String (enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], default: 'Pending'),

  // Intelligent workflow data
  originalRequest: String, // Raw client request
  aiGeneratedWorkflow: Object, // AI-analyzed workflow structure
  estimatedDuration: Number, // in days
  priority: String (enum: ['Low', 'Medium', 'High', 'Critical']),

  // Approval workflow
  approvedBy: ObjectId (ref: 'Manager'),
  approvalDate: Date,
  reviewNotes: String,

  // Dates
  startDate: Date,
  endDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### **8. Sprints Collection**

```javascript
{
  _id: ObjectId,
  sprintId: Number (unique, auto-increment),
  projectId: ObjectId (ref: 'Project', required),
  sprintName: String (required), // e.g., "Sprint 1 - Wireframes"
  description: String,
  status: String (enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending'),
  startDate: Date,
  endDate: Date,
  goals: [String],
  order: Number, // Sprint sequence in project
  createdAt: Date,
  updatedAt: Date
}
```

#### **9. Tasks Collection**

```javascript
{
  _id: ObjectId,
  taskId: Number (unique, auto-increment),
  sprintId: ObjectId (ref: 'Sprint', required),
  projectId: ObjectId (ref: 'Project', required), // Denormalized for faster queries
  taskName: String (required),
  description: String,

  // Assignment
  departmentId: Number (ref: 'Department', required),
  roleId: Number (ref: 'Role', required),
  assignedTo: ObjectId (ref: 'Employee'), // Can be null initially
  assignedBy: ObjectId (ref: 'Manager'),

  // Status and tracking
  status: String (enum: ['Pending', 'In Progress', 'Done'], default: 'Pending'),
  priority: String (enum: ['Low', 'Medium', 'High'], default: 'Medium'),
  estimatedHours: Number,
  actualHours: Number,

  // Dependencies
  dependsOn: [ObjectId], // Array of task IDs
  blockedBy: [ObjectId],

  // Dates
  startDate: Date,
  dueDate: Date,
  completedDate: Date,

  // Additional tracking
  comments: [{
    commentId: ObjectId,
    userId: ObjectId (ref: 'User'),
    comment: String,
    createdAt: Date
  }],

  attachments: [{
    fileUrl: String,
    fileName: String,
    uploadedBy: ObjectId (ref: 'User'),
    uploadedAt: Date
  }],

  createdAt: Date,
  updatedAt: Date
}
```

#### **10. Skills Collection**

```javascript
{
  _id: ObjectId,
  skillId: Number (unique, auto-increment),
  skillName: String (required, unique),
  category: String, // e.g., "Technical", "Design", "Management"
  description: String,
  relatedRoles: [Number], // Array of role IDs
  isActive: Boolean (default: true)
}
```

#### **11. TaskDependencies Collection**

```javascript
{
  _id: ObjectId,
  taskId: ObjectId (ref: 'Task', required),
  dependsOnTaskId: ObjectId (ref: 'Task', required),
  dependencyType: String (enum: ['finish-to-start', 'start-to-start', 'finish-to-finish']),
  isActive: Boolean (default: true),
  createdAt: Date
}
```

#### **12. ClientRequests Collection** (New - for AI workflow processing)

```javascript
{
  _id: ObjectId,
  requestId: Number (unique, auto-increment),
  clientId: ObjectId (ref: 'Client', required),

  // Request details
  title: String (required),
  description: String (required),
  category: String,
  expectedDeadline: Date,
  budget: Number,
  attachments: [String], // URLs

  // AI Processing
  aiAnalysis: {
    summary: String,
    extractedTasks: [Object],
    suggestedFramework: String,
    estimatedDuration: Number,
    requiredSkills: [String],
    suggestedTeam: [ObjectId],
    confidenceScore: Number
  },

  // Status tracking
  status: String (enum: ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Converted'], default: 'Submitted'),
  reviewedBy: ObjectId (ref: 'Manager'),
  reviewNotes: String,

  // Conversion
  convertedToProjectId: ObjectId (ref: 'Project'),
  conversionDate: Date,

  createdAt: Date,
  updatedAt: Date
}
```

#### **13. Notifications Collection**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  type: String (enum: ['task_assigned', 'status_update', 'approval_required', 'project_update']),
  title: String,
  message: String,
  relatedEntity: {
    entityType: String, // 'project', 'task', 'sprint'
    entityId: ObjectId
  },
  isRead: Boolean (default: false),
  createdAt: Date
}
```

#### **14. ActivityLogs Collection**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  action: String (required), // e.g., "task_status_changed", "project_created"
  entityType: String,
  entityId: ObjectId,
  oldValue: Object,
  newValue: Object,
  ipAddress: String,
  userAgent: String,
  createdAt: Date
}
```

---

## 4. API Routes & Endpoints

### 4.1 Authentication Routes (`/api/auth`)

| Method | Endpoint                          | Description            | Access        |
| ------ | --------------------------------- | ---------------------- | ------------- |
| POST   | `/api/auth/register`              | Register new user      | Public        |
| POST   | `/api/auth/login`                 | User login             | Public        |
| POST   | `/api/auth/logout`                | User logout            | Authenticated |
| POST   | `/api/auth/refresh-token`         | Refresh JWT token      | Authenticated |
| POST   | `/api/auth/forgot-password`       | Request password reset | Public        |
| POST   | `/api/auth/reset-password/:token` | Reset password         | Public        |
| GET    | `/api/auth/verify-email/:token`   | Verify email address   | Public        |
| GET    | `/api/auth/me`                    | Get current user info  | Authenticated |

### 4.2 Client Routes (`/api/clients`)

| Method | Endpoint                    | Description                      | Access |
| ------ | --------------------------- | -------------------------------- | ------ |
| GET    | `/api/clients/profile`      | Get client profile               | Client |
| PUT    | `/api/clients/profile`      | Update client profile            | Client |
| GET    | `/api/clients/projects`     | Get all client projects          | Client |
| GET    | `/api/clients/projects/:id` | Get specific project details     | Client |
| POST   | `/api/clients/requests`     | Submit new project request       | Client |
| GET    | `/api/clients/requests`     | Get all submitted requests       | Client |
| GET    | `/api/clients/requests/:id` | Get specific request details     | Client |
| PUT    | `/api/clients/requests/:id` | Update request (before approval) | Client |
| DELETE | `/api/clients/requests/:id` | Delete request (before review)   | Client |
| GET    | `/api/clients/dashboard`    | Get dashboard statistics         | Client |

### 4.3 Employee Routes (`/api/employees`)

| Method | Endpoint                            | Description                      | Access   |
| ------ | ----------------------------------- | -------------------------------- | -------- |
| GET    | `/api/employees/profile`            | Get employee profile             | Employee |
| PUT    | `/api/employees/profile`            | Update employee profile          | Employee |
| PUT    | `/api/employees/availability`       | Update availability status       | Employee |
| GET    | `/api/employees/tasks`              | Get all assigned tasks           | Employee |
| GET    | `/api/employees/tasks/:id`          | Get specific task details        | Employee |
| PUT    | `/api/employees/tasks/:id/status`   | Update task status               | Employee |
| POST   | `/api/employees/tasks/:id/comments` | Add comment to task              | Employee |
| GET    | `/api/employees/dashboard`          | Get dashboard statistics         | Employee |
| GET    | `/api/employees/projects`           | Get projects employee is part of | Employee |

### 4.4 Manager Routes (`/api/managers`)

| Method | Endpoint                             | Description                          | Access  |
| ------ | ------------------------------------ | ------------------------------------ | ------- |
| GET    | `/api/managers/profile`              | Get manager profile                  | Manager |
| PUT    | `/api/managers/profile`              | Update manager profile               | Manager |
| GET    | `/api/managers/dashboard`            | Get dashboard with pending approvals | Manager |
| GET    | `/api/managers/requests`             | Get pending client requests          | Manager |
| GET    | `/api/managers/requests/:id`         | Get request details for review       | Manager |
| POST   | `/api/managers/requests/:id/review`  | Approve/reject request               | Manager |
| POST   | `/api/managers/requests/:id/convert` | Convert request to project           | Manager |

### 4.5 Project Routes (`/api/projects`)

| Method | Endpoint                       | Description                         | Access        |
| ------ | ------------------------------ | ----------------------------------- | ------------- |
| GET    | `/api/projects`                | Get all projects (filtered by role) | Authenticated |
| GET    | `/api/projects/:id`            | Get project details                 | Authenticated |
| POST   | `/api/projects`                | Create new project manually         | Manager       |
| PUT    | `/api/projects/:id`            | Update project details              | Manager       |
| DELETE | `/api/projects/:id`            | Delete/cancel project               | Manager       |
| GET    | `/api/projects/:id/sprints`    | Get all sprints in project          | Authenticated |
| GET    | `/api/projects/:id/tasks`      | Get all tasks in project            | Authenticated |
| GET    | `/api/projects/:id/team`       | Get team members assigned           | Authenticated |
| PUT    | `/api/projects/:id/status`     | Update project status               | Manager       |
| GET    | `/api/projects/:id/statistics` | Get project statistics              | Manager       |

### 4.6 Sprint Routes (`/api/sprints`)

| Method | Endpoint                  | Description             | Access        |
| ------ | ------------------------- | ----------------------- | ------------- |
| GET    | `/api/sprints/:id`        | Get sprint details      | Authenticated |
| POST   | `/api/sprints`            | Create new sprint       | Manager       |
| PUT    | `/api/sprints/:id`        | Update sprint details   | Manager       |
| DELETE | `/api/sprints/:id`        | Delete sprint           | Manager       |
| GET    | `/api/sprints/:id/tasks`  | Get all tasks in sprint | Authenticated |
| PUT    | `/api/sprints/:id/status` | Update sprint status    | Manager       |

### 4.7 Task Routes (`/api/tasks`)

| Method | Endpoint                             | Description             | Access           |
| ------ | ------------------------------------ | ----------------------- | ---------------- |
| GET    | `/api/tasks/:id`                     | Get task details        | Authenticated    |
| POST   | `/api/tasks`                         | Create new task         | Manager          |
| PUT    | `/api/tasks/:id`                     | Update task details     | Manager          |
| DELETE | `/api/tasks/:id`                     | Delete task             | Manager          |
| PUT    | `/api/tasks/:id/assign`              | Assign task to employee | Manager          |
| PUT    | `/api/tasks/:id/status`              | Update task status      | Employee/Manager |
| POST   | `/api/tasks/:id/comments`            | Add comment             | Authenticated    |
| GET    | `/api/tasks/:id/comments`            | Get task comments       | Authenticated    |
| POST   | `/api/tasks/:id/attachments`         | Upload attachment       | Authenticated    |
| POST   | `/api/tasks/:id/dependencies`        | Add task dependency     | Manager          |
| DELETE | `/api/tasks/:id/dependencies/:depId` | Remove dependency       | Manager          |

### 4.8 Team Routes (`/api/teams`)

| Method | Endpoint                   | Description                    | Access  |
| ------ | -------------------------- | ------------------------------ | ------- |
| GET    | `/api/teams/employees`     | Get all employees              | Manager |
| GET    | `/api/teams/employees/:id` | Get employee details           | Manager |
| PUT    | `/api/teams/employees/:id` | Update employee                | Manager |
| GET    | `/api/teams/departments`   | Get all departments            | Manager |
| GET    | `/api/teams/roles`         | Get all roles                  | Manager |
| GET    | `/api/teams/workload`      | Get team workload distribution | Manager |
| GET    | `/api/teams/availability`  | Get team availability          | Manager |

### 4.9 Department & Role Routes (`/api/system`)

| Method | Endpoint                  | Description         | Access        |
| ------ | ------------------------- | ------------------- | ------------- |
| GET    | `/api/system/departments` | Get all departments | Authenticated |
| GET    | `/api/system/roles`       | Get all roles       | Authenticated |
| GET    | `/api/system/skills`      | Get all skills      | Authenticated |
| POST   | `/api/system/departments` | Create department   | Admin         |
| POST   | `/api/system/roles`       | Create role         | Admin         |
| POST   | `/api/system/skills`      | Create skill        | Admin         |

### 4.10 AI Workflow Routes (`/api/workflow`)

| Method | Endpoint                            | Description                  | Access  |
| ------ | ----------------------------------- | ---------------------------- | ------- |
| POST   | `/api/workflow/analyze-request`     | AI analyze client request    | Manager |
| POST   | `/api/workflow/generate-tasks`      | Generate task breakdown      | Manager |
| POST   | `/api/workflow/suggest-team`        | Suggest team assignment      | Manager |
| POST   | `/api/workflow/estimate-duration`   | Estimate project duration    | Manager |
| POST   | `/api/workflow/optimize-allocation` | Optimize resource allocation | Manager |

### 4.11 Notification Routes (`/api/notifications`)

| Method | Endpoint                      | Description               | Access        |
| ------ | ----------------------------- | ------------------------- | ------------- |
| GET    | `/api/notifications`          | Get user notifications    | Authenticated |
| PUT    | `/api/notifications/:id/read` | Mark notification as read | Authenticated |
| PUT    | `/api/notifications/read-all` | Mark all as read          | Authenticated |
| DELETE | `/api/notifications/:id`      | Delete notification       | Authenticated |

### 4.12 Analytics Routes (`/api/analytics`)

| Method | Endpoint                          | Description               | Access  |
| ------ | --------------------------------- | ------------------------- | ------- |
| GET    | `/api/analytics/projects`         | Get project analytics     | Manager |
| GET    | `/api/analytics/employees/:id`    | Get employee performance  | Manager |
| GET    | `/api/analytics/team-performance` | Get team metrics          | Manager |
| GET    | `/api/analytics/task-completion`  | Get task completion rates | Manager |

---

## 5. Controllers Structure

### 5.1 Controller Organization

```
src/
├── controllers/
│   ├── auth.controller.js
│   ├── client.controller.js
│   ├── employee.controller.js
│   ├── manager.controller.js
│   ├── project.controller.js
│   ├── sprint.controller.js
│   ├── task.controller.js
│   ├── team.controller.js
│   ├── system.controller.js
│   ├── workflow.controller.js
│   ├── notification.controller.js
│   └── analytics.controller.js
```

### 5.2 Controller Functions Breakdown

#### **auth.controller.js**

```javascript
-register() - // Register new user with role-specific profile
  login() - // Authenticate and return JWT
  logout() - // Invalidate token
  refreshToken() - // Refresh JWT
  forgotPassword() - // Send reset email
  resetPassword() - // Update password with token
  verifyEmail() - // Verify email with token
  getCurrentUser(); // Get authenticated user info
```

#### **client.controller.js**

```javascript
-getProfile() - // Get client profile
  updateProfile() - // Update client details
  getProjects() - // Get all client projects
  getProjectById() - // Get specific project
  submitRequest() - // Submit new project request
  getRequests() - // Get all submitted requests
  getRequestById() - // Get request details
  updateRequest() - // Update pending request
  deleteRequest() - // Cancel request
  getDashboard(); // Get dashboard stats (active/completed projects)
```

#### **employee.controller.js**

```javascript
-getProfile() - // Get employee profile
  updateProfile() - // Update personal info
  updateAvailability() - // Change availability status
  getTasks() - // Get all assigned tasks with filters
  getTaskById() - // Get task details
  updateTaskStatus() - // Update task progress
  addTaskComment() - // Add comment to task
  getDashboard() - // Get dashboard with recent tasks & stats
  getProjects() - // Get projects employee is involved in
  getTaskStatistics(); // Get personal task completion metrics
```

#### **manager.controller.js**

```javascript
-getProfile() - // Get manager profile
  updateProfile() - // Update manager info
  getDashboard() - // Get dashboard (pending approvals, active projects, team workload)
  getPendingRequests() - // Get requests needing review
  getRequestForReview() - // Get detailed request for approval
  reviewRequest() - // Approve or reject request
  convertRequestToProject() - // Convert approved request to project
  getTeamWorkload() - // Get team member task distribution
  getProjectsOverview(); // Get all projects under management
```

#### **project.controller.js**

```javascript
-getAllProjects() - // Get projects (role-filtered)
  getProjectById() - // Get full project details
  createProject() - // Create project manually
  updateProject() - // Update project info
  deleteProject() - // Cancel/delete project
  getProjectSprints() - // Get all sprints
  getProjectTasks() - // Get all tasks
  getProjectTeam() - // Get assigned team members
  updateProjectStatus() - // Change project status
  getProjectStatistics(); // Get project metrics
```

#### **sprint.controller.js**

```javascript
-getSprintById() - // Get sprint details
  createSprint() - // Create new sprint
  updateSprint() - // Update sprint info
  deleteSprint() - // Delete sprint
  getSprintTasks() - // Get tasks in sprint
  updateSprintStatus(); // Change sprint status
```

#### **task.controller.js**

```javascript
-getTaskById() - // Get task details with full info
  createTask() - // Create new task
  updateTask() - // Update task details
  deleteTask() - // Delete task
  assignTask() - // Assign to employee
  updateTaskStatus() - // Change status
  addComment() - // Add comment
  getComments() - // Get all comments
  addAttachment() - // Upload file
  addDependency() - // Add task dependency
  removeDependency() - // Remove dependency
  getAvailableEmployees(); // Get employees for assignment
```

#### **team.controller.js**

```javascript
-getAllEmployees() - // Get all team members
  getEmployeeById() - // Get employee details
  updateEmployee() - // Update employee info
  getDepartments() - // Get all departments
  getRoles() - // Get all roles
  getTeamWorkload() - // Get workload distribution
  getTeamAvailability() - // Get availability overview
  getEmployeesByDepartment() - // Filter by department
  getEmployeesByRole(); // Filter by role
```

#### **system.controller.js**

```javascript
-getDepartments() - // Get all departments
  getRoles() - // Get all roles
  getSkills() - // Get all skills
  createDepartment() - // Add new department
  createRole() - // Add new role
  createSkill() - // Add new skill
  updateDepartment() - // Update department
  updateRole(); // Update role
```

#### **workflow.controller.js** (AI Integration)

```javascript
-analyzeRequest() - // AI analyze client request text
  generateTaskBreakdown() - // AI generate tasks from analysis
  suggestTeamAssignment() - // AI suggest optimal team
  estimateDuration() - // AI estimate timeline
  optimizeAllocation() - // AI optimize resource distribution
  suggestFramework(); // AI recommend Agile/Waterfall/Hybrid
```

#### **notification.controller.js**

```javascript
-getUserNotifications() - // Get all notifications
  markAsRead() - // Mark single notification read
  markAllAsRead() - // Mark all read
  deleteNotification() - // Delete notification
  getUnreadCount(); // Get unread notification count
```

#### **analytics.controller.js**

```javascript
-getProjectAnalytics() - // Project performance metrics
  getEmployeePerformance() - // Employee productivity stats
  getTeamPerformance() - // Team-level metrics
  getTaskCompletionRates() - // Task completion analytics
  getSprintVelocity() - // Agile velocity metrics
  getDepartmentAnalytics(); // Department-wise analysis
```

---

## 6. Middleware Requirements

### 6.1 Authentication Middleware

#### **auth.middleware.js**

```javascript
-authenticate() - // Verify JWT token
  attachUser(); // Attach user to request object
```

### 6.2 Authorization Middleware

#### **authorize.middleware.js**

```javascript
-authorizeRole(roles) - // Check user role (e.g., ['manager', 'admin'])
  authorizeClient() - // Only clients
  authorizeEmployee() - // Only employees
  authorizeManager() - // Only managers
  authorizeOwnership(); // Check resource ownership (e.g., client can only view own projects)
```

### 6.3 Validation Middleware

#### **validate.middleware.js**

```javascript
-validateRequest(schema) - // Validate request body using Joi/Zod
  validateParams(schema) - // Validate URL parameters
  validateQuery(schema) - // Validate query strings
  sanitizeInput(); // Sanitize user inputs
```

### 6.4 Error Handling Middleware

#### **error.middleware.js**

```javascript
-asyncHandler() - // Wrap async functions
  errorHandler() - // Global error handler
  notFound() - // 404 handler
  validationErrorHandler(); // Handle validation errors
```

### 6.5 Request Processing Middleware

#### **requestLogger.middleware.js**

```javascript
-logRequest() - // Log all incoming requests
  logResponse() - // Log responses
  logToDatabase(); // Save activity logs
```

#### **rateLimiter.middleware.js**

```javascript
-generalLimiter() - // Rate limit general API calls
  authLimiter() - // Stricter limits for auth endpoints
  uploadLimiter(); // Limit file uploads
```

#### **cors.middleware.js**

```javascript
-configureCORS(); // Configure CORS policies
```

#### **upload.middleware.js**

```javascript
-uploadSingle() - // Single file upload
  uploadMultiple() - // Multiple files upload
  validateFileType() - // Check file types
  validateFileSize(); // Check file size
```

---

## 7. Business Logic & Services

### 7.1 Service Layer Structure

```
src/
├── services/
│   ├── auth.service.js
│   ├── user.service.js
│   ├── project.service.js
│   ├── task.service.js
│   ├── notification.service.js
│   ├── email.service.js
│   ├── workflow.service.js (AI Integration)
│   ├── analytics.service.js
│   └── file.service.js
```

### 7.2 Service Functions

#### **auth.service.js**

```javascript
-hashPassword() - // Hash password with bcrypt
  comparePassword() - // Verify password
  generateJWT() - // Create JWT token
  verifyJWT() - // Verify JWT token
  generateResetToken() - // Create password reset token
  generateVerificationToken(); // Create email verification token
```

#### **user.service.js**

```javascript
-createUser() - // Create user with role-specific profile
  getUserById() - // Fetch user by ID
  getUserByEmail() - // Fetch user by email
  updateUser() - // Update user details
  deactivateUser() - // Soft delete user
  assignRole(); // Assign/change user role
```

#### **project.service.js**

```javascript
-createProject() - // Create project with validation
  updateProject() - // Update project details
  assignTeamToProject() - // Assign team members
  generateProjectCode() - // Auto-generate project code
  calculateProjectProgress() - // Calculate completion %
  checkProjectDeadlines() - // Check for deadline alerts
  archiveProject(); // Archive completed projects
```

#### **task.service.js**

```javascript
-createTask() - // Create task with dependencies
  updateTask() - // Update task
  assignTask() - // Auto-assign or manual assign
  checkDependencies() - // Validate task dependencies
  updateTaskStatus() - // Change status with validation
  calculateTaskProgress() - // Calculate completion
  notifyTaskAssignment() - // Send notifications
  autoReassignTask(); // Reassign if employee unavailable
```

#### **notification.service.js**

```javascript
-createNotification() - // Create notification
  sendNotificationToUser() - // Send to specific user
  sendNotificationToRole() - // Send to all users with role
  sendTaskAssignmentNotification() -
  sendStatusUpdateNotification() -
  sendApprovalRequestNotification() -
  sendDeadlineReminderNotification();
```

#### **email.service.js**

```javascript
-sendEmail() - // Generic email sender
  sendWelcomeEmail() - // Welcome new user
  sendPasswordResetEmail() - // Password reset link
  sendTaskAssignmentEmail() - // Task assigned notification
  sendProjectApprovalEmail() - // Project approved notification
  sendDeadlineReminderEmail(); // Deadline reminder
```

#### **workflow.service.js** (AI Integration - Placeholder)

```javascript
-analyzeClientRequest() - // NLP analysis of request
  extractTasksFromRequest() - // Extract actionable tasks
  suggestProjectFramework() - // Suggest Agile/Waterfall/Hybrid
  generateWorkflowStructure() - // Create workflow structure
  assignRolesToTasks() - // Map tasks to roles
  suggestTeamComposition() - // Suggest optimal team
  estimateProjectDuration() - // AI-based estimation
  optimizeTaskAllocation(); // Optimize assignments
```

#### **analytics.service.js**

```javascript
-calculateEmployeeMetrics() - // Employee KPIs
  calculateProjectMetrics() - // Project KPIs
  calculateTeamMetrics() - // Team performance
  generateCompletionReport() - // Task completion report
  generateVelocityReport() - // Sprint velocity
  generateWorkloadReport() - // Team workload analysis
  calculateSprintBurndown(); // Burndown chart data
```

#### **file.service.js**

```javascript
-uploadFile() - // Upload to cloud storage
  deleteFile() - // Delete from storage
  generateSignedUrl() - // Generate temporary URL
  validateFile() - // Validate file type/size
  compressImage(); // Compress uploaded images
```

---

## 8. Authentication & Authorization

### 8.1 Authentication Strategy

**Technology**: JWT (JSON Web Tokens)

**Flow**:

1. User logs in with email + password
2. Server validates credentials
3. Server generates JWT with payload: `{ userId, role, email }`
4. Client stores JWT in localStorage/httpOnly cookie
5. Client sends JWT in Authorization header: `Bearer <token>`
6. Server validates JWT on each protected route

**Token Structure**:

```javascript
{
  userId: ObjectId,
  role: 'client' | 'employee' | 'manager',
  email: String,
  iat: timestamp,
  exp: timestamp (24 hours)
}
```

### 8.2 Authorization Matrix

| Endpoint               | Client | Employee | Manager | Admin |
| ---------------------- | ------ | -------- | ------- | ----- |
| **Authentication**     |
| Register, Login        | ✅     | ✅       | ✅      | ✅    |
| **Client Endpoints**   |
| View own projects      | ✅     | ❌       | ✅      | ✅    |
| Submit requests        | ✅     | ❌       | ❌      | ✅    |
| Update profile         | ✅     | ❌       | ❌      | ✅    |
| **Employee Endpoints** |
| View assigned tasks    | ❌     | ✅       | ✅      | ✅    |
| Update task status     | ❌     | ✅       | ✅      | ✅    |
| Update availability    | ❌     | ✅       | ✅      | ✅    |
| **Manager Endpoints**  |
| Review requests        | ❌     | ❌       | ✅      | ✅    |
| Create/edit projects   | ❌     | ❌       | ✅      | ✅    |
| Assign tasks           | ❌     | ❌       | ✅      | ✅    |
| View team workload     | ❌     | ❌       | ✅      | ✅    |
| **Admin Endpoints**    |
| Manage departments     | ❌     | ❌       | ❌      | ✅    |
| Manage roles           | ❌     | ❌       | ❌      | ✅    |
| System configuration   | ❌     | ❌       | ❌      | ✅    |

### 8.3 Password Security

- **Hashing**: bcrypt with salt rounds = 12
- **Password Requirements**:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character

### 8.4 Session Management

- **Access Token**: JWT, expires in 24 hours
- **Refresh Token**: Stored in httpOnly cookie, expires in 7 days
- **Token Refresh**: Automatic refresh before expiration
- **Logout**: Token blacklist (Redis) for invalidation

---

## 9. Intelligent Workflow Model Integration

### 9.1 AI Workflow Architecture

**Goal**: Automatically analyze client requests and generate structured workflows with task breakdowns and team assignments.

**Components**:

1. **Request Analysis Module** - NLP to extract requirements
2. **Task Generation Module** - Break down into actionable tasks
3. **Framework Recommendation Module** - Suggest Agile/Waterfall/Hybrid
4. **Team Assignment Module** - Match skills to tasks
5. **Duration Estimation Module** - Predict project timeline

### 9.2 AI Integration Points

#### **1. Client Request Submission**

- **Input**: Raw text description from client
- **Process**:
  1. NLP analysis to extract keywords, requirements, deliverables
  2. Categorize request (UI/UX, Hardware, Mechanical, etc.)
  3. Extract deadline, budget constraints
- **Output**: Structured request object with metadata

#### **2. Manager Review**

- **Input**: Structured request + AI analysis
- **Display**:
  - AI-generated summary
  - Suggested project framework (Agile/Waterfall/Hybrid)
  - Estimated duration
  - Required skills/roles
- **Action**: Manager can edit before approval

#### **3. Workflow Generation**

- **Input**: Approved request + AI recommendations
- **Process**:
  1. Generate sprint/phase breakdown
  2. Create task list with dependencies
  3. Assign roles to tasks
  4. Suggest team members based on availability & skills
- **Output**: Complete project structure with sprints and tasks

#### **4. Team Assignment**

- **Input**: Generated tasks + role requirements
- **Process**:
  1. Query available employees by department/role
  2. Check workload and availability
  3. Match skills to task requirements
  4. Optimize distribution
- **Output**: Task assignments

### 9.3 AI Service Implementation (Placeholder)

```javascript
// workflow.service.js

async function analyzeClientRequest(requestText) {
  // TODO: Integrate with OpenAI/Anthropic API or custom NLP model

  // Placeholder logic:
  const analysis = {
    summary: extractSummary(requestText),
    category: categorizeRequest(requestText),
    extractedRequirements: extractRequirements(requestText),
    suggestedFramework: determineFramework(requestText),
    estimatedDuration: estimateDuration(requestText),
    requiredSkills: identifySkills(requestText),
    confidence: 0.85,
  };

  return analysis;
}

async function generateTaskBreakdown(analysis, framework) {
  // TODO: AI-powered task generation

  const tasks = [];

  // Example logic based on framework
  if (framework === "Agile") {
    // Generate sprints and tasks
    tasks.push({
      sprint: "Sprint 0 - Discovery",
      tasks: [
        "Gather requirements from client",
        "Create product backlog",
        "Define user stories",
      ],
    });
  }

  return tasks;
}

async function suggestTeamComposition(requiredSkills, projectSize) {
  // TODO: AI recommendation for team structure

  const employees = await Employee.find({ isActive: true });

  // Match employees to required skills
  const suggestedTeam = employees.filter((emp) => {
    // Check skill match logic
    return emp.availability === "Available";
  });

  return suggestedTeam;
}
```

### 9.4 Data Flow: Request to Project

```
1. Client submits request (text description)
   ↓
2. AI analyzes request → generates structured data
   ↓
3. Manager reviews AI analysis
   ↓
4. Manager edits/approves
   ↓
5. AI generates workflow (sprints + tasks)
   ↓
6. AI suggests team assignments
   ↓
7. Manager finalizes assignments
   ↓
8. Project created with full structure
   ↓
9. Notifications sent to assigned employees
   ↓
10. Project execution begins
```

---

## 10. Implementation Roadmap

### Phase 1: Core Backend Setup (Week 1-2)

- [x] Setup Express.js server
- [ ] Configure MongoDB connection with Mongoose
- [ ] Create base schemas (Users, Employees, Clients, Managers)
- [ ] Implement authentication (JWT, bcrypt)
- [ ] Setup middleware (auth, error handling, validation)
- [ ] Create basic CRUD controllers

### Phase 2: User Management (Week 2-3)

- [ ] Complete authentication endpoints
- [ ] Implement role-based authorization
- [ ] Create client, employee, manager profile management
- [ ] Setup email service for notifications
- [ ] Implement password reset functionality

### Phase 3: Project & Task Management (Week 3-5)

- [ ] Create project schemas and controllers
- [ ] Implement sprint management
- [ ] Build task management system
- [ ] Add task dependency handling
- [ ] Implement status update workflows
- [ ] Create comment and attachment features

### Phase 4: Request Processing (Week 5-6)

- [ ] Build client request submission
- [ ] Create manager review/approval system
- [ ] Implement request-to-project conversion
- [ ] Add notification system
- [ ] Build activity logging

### Phase 5: Team Management (Week 6-7)

- [ ] Employee management endpoints
- [ ] Department and role management
- [ ] Workload calculation and distribution
- [ ] Availability tracking
- [ ] Team analytics

### Phase 6: Dashboard & Analytics (Week 7-8)

- [ ] Client dashboard endpoints
- [ ] Employee dashboard endpoints
- [ ] Manager dashboard endpoints
- [ ] Analytics and reporting
- [ ] Performance metrics

### Phase 7: AI Workflow Integration (Week 8-10)

- [ ] Setup AI service integration
- [ ] Implement request analysis
- [ ] Build task generation logic
- [ ] Create team suggestion algorithm
- [ ] Add framework recommendation
- [ ] Implement duration estimation

### Phase 8: Advanced Features (Week 10-12)

- [ ] Real-time notifications (WebSockets)
- [ ] File upload and management
- [ ] Advanced search and filtering
- [ ] Bulk operations
- [ ] Export functionality (PDF, CSV)
- [ ] Email templates and scheduling

### Phase 9: Security & Optimization (Week 12-13)

- [ ] Security audit and improvements
- [ ] Rate limiting implementation
- [ ] Database indexing optimization
- [ ] Caching strategy (Redis)
- [ ] API documentation (Swagger)
- [ ] Unit and integration tests

### Phase 10: Testing & Deployment (Week 13-14)

- [ ] Integration testing
- [ ] Load testing
- [ ] Frontend-backend integration testing
- [ ] Production environment setup
- [ ] CI/CD pipeline configuration
- [ ] Deployment and monitoring

---

## 11. Additional Considerations

### 11.1 Environment Variables (.env)

```
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/intelliflow
DB_NAME=intelliflow

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@intelliflow.com

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf

# Cloud Storage (Optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# AI Integration (Future)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Redis (Optional for caching)
REDIS_HOST=localhost
REDIS_PORT=6379

# Frontend URL
CLIENT_URL=http://localhost:5173
```

### 11.2 Database Indexing Strategy

```javascript
// Critical indexes for performance
User: email(unique);
Employee: employeeId(unique), departmentId, roleId, availability;
Client: userId(unique), email;
Project: projectId(unique), clientId, status, framework;
Task: taskId(unique), sprintId, projectId, assignedTo, status;
Sprint: sprintId(unique), projectId, status;
Notification: userId, isRead, createdAt;
ActivityLog: userId, entityType, createdAt;
```

### 11.3 Error Codes & Messages

```javascript
// Standardized error response format
{
  success: false,
  error: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    statusCode: 401
  }
}
```

**Common Error Codes**:

- `AUTH_INVALID_CREDENTIALS` - 401
- `AUTH_TOKEN_EXPIRED` - 401
- `AUTH_UNAUTHORIZED` - 403
- `RESOURCE_NOT_FOUND` - 404
- `VALIDATION_ERROR` - 400
- `DUPLICATE_ENTRY` - 409
- `SERVER_ERROR` - 500

### 11.4 API Response Format

```javascript
// Success response
{
  success: true,
  data: { ... },
  message: 'Operation successful',
  pagination: { // for list endpoints
    page: 1,
    limit: 10,
    total: 100,
    pages: 10
  }
}
```

### 11.5 Testing Strategy

- **Unit Tests**: Jest + Supertest
- **Integration Tests**: MongoDB Memory Server
- **API Testing**: Postman collections
- **Load Testing**: Artillery or k6
- **Coverage Target**: 80%+

### 11.6 Documentation

- **API Documentation**: Swagger/OpenAPI
- **Code Documentation**: JSDoc comments
- **README**: Setup instructions, API overview
- **CHANGELOG**: Version history
- **CONTRIBUTING**: Contribution guidelines

---

## 12. Summary: What to Build

### Immediate Backend Requirements (MVP):

1. **Authentication System**

   - User registration with role selection
   - Login with JWT
   - Password reset
   - Role-based access control

2. **User Profiles**

   - Client profile management
   - Employee profile with availability
   - Manager profile

3. **Project Management**

   - Create, read, update projects
   - Project status tracking
   - Client-to-project relationship

4. **Sprint Management**

   - Create sprints for projects
   - Sprint status tracking
   - Link tasks to sprints

5. **Task Management**

   - Create, assign, update tasks
   - Task status updates (Pending → In Progress → Done)
   - Task comments
   - Task dependencies

6. **Team Management**

   - Employee list with filters
   - Workload calculation
   - Availability tracking

7. **Dashboard APIs**

   - Client dashboard (projects summary)
   - Employee dashboard (tasks, stats)
   - Manager dashboard (approvals, team workload)

8. **Request System**

   - Client request submission
   - Manager review and approval
   - Convert request to project

9. **Notifications**
   - Task assignment notifications
   - Status update notifications
   - Approval request notifications

### Future Enhancements:

1. **AI Workflow Generation** (Phase 7)
2. **Real-time updates** (WebSockets)
3. **Advanced analytics** and reporting
4. **File uploads** and attachments
5. **Email notifications**
6. **Advanced search** and filtering
7. **Bulk operations**
8. **Export functionality**

---

## Conclusion

This comprehensive analysis provides a complete blueprint for building the Intelliflow backend. The system is designed to support an intelligent workflow management platform for Product Design & Prototyping, with future extensibility for AI-powered request analysis and team assignment.

**Key Technologies**:

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Future: AI Integration (OpenAI/Custom NLP)

**Next Steps**:

1. Setup MongoDB database
2. Create Mongoose schemas
3. Build authentication system
4. Implement core CRUD operations
5. Integrate with existing frontend
6. Add AI workflow generation

---

**Document Version**: 1.0  
**Last Updated**: Current  
**Author**: Backend Architecture Analysis  
**Project**: Intelliflow - Intelligent Workflow Management System
