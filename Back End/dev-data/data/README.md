# Data Files Overview

## Current Files (Updated for MVP)

### Core Entity Files (Use These)

- **Employee_Updated.json** - Employee data with merged role, department, and skills
- **Tasks_Updated.json** - Tasks with sprint names and dependencies array
- **Projects_Updated.json** - Projects with client_id reference
- **Clients.json** - Client information (unchanged)

### Legacy Files (For Reference Only)

- **Employee.json** - Original employee data (before merge)
- **Tasks.json** - Original tasks data (before merge)
- **Projects.json** - Original projects data (before merge)

## Schema Changes Summary

### Employee → User

```javascript
{
  employee_id: Number,
  name: String,
  email: String,
  password: String,        // Added
  role: String,            // Merged from Roles.json
  department: String,      // Merged from Departments.json
  skills: [String],        // Merged from Skills.json
  availability: String,
  active: Boolean          // Added
}
```

### Tasks

```javascript
{
  task_id: Number,
  task_name: String,
  sprint: String,          // Merged from Sprint.json (name)
  sprint_number: Number,   // Added
  project_id: Number,      // Added
  assigned_to: Number,     // Employee/User ID
  status: String,
  dependencies: [Number],  // Merged from Task_Dependency.json
  priority: String,        // Added
  created_at: String       // Added
}
```

### Projects

```javascript
{
  project_id: Number,
  project_title: String,
  client_id: Number,       // Added
  client_name: String,
  category: String,
  framework: String,
  status: String,
  requirements: String,    // Added
  created_at: String,      // Added
  updated_at: String       // Added
}
```

### Clients (No Changes)

```javascript
{
  client_id: Number,
  client_name: String,
  contact_email: String
}
```

## Deleted Files (Data Merged)

- Departments.json → Merged into Employee_Updated.json
- Roles.json → Merged into Employee_Updated.json
- Skills.json → Merged into Employee_Updated.json
- Sprint.json → Merged into Tasks_Updated.json
- Task_Dependency.json → Merged into Tasks_Updated.json

## Next Steps

1. Update Mongoose models to match these schemas
2. Update importData.js to use \*\_Updated.json files
3. Test data import
4. Delete legacy JSON files once verified
