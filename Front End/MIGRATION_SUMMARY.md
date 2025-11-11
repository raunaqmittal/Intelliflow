# Intelliflow Front End - Unified Portal Structure

## ✅ Migration Complete

This folder contains the unified codebase that merges Client_Portal_Intelliflow, Employee_Portal_Intelliflow, and Manager_Portal_Intelliflow into a single application with role-based routing.

---

## 📁 Folder Structure

```
Intelliflow_Front_End/
├── public/                    # Static assets & CSV data
│   ├── *.csv                  # All data files (Projects, Tasks, Employees, etc.)
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── common/            # Shared across all portals
│   │   │   ├── dashboard/     # ProfileCard, TaskSummary
│   │   │   ├── tasks/         # TaskCard
│   │   │   └── layout/        # PortalLayout
│   │   ├── ui/                # 50+ shadcn components (shared)
│   │   ├── client/            # Client-specific: ClientSidebar
│   │   ├── employee/          # Employee-specific: EmployeeSidebar
│   │   └── manager/           # Manager-specific: ManagerLayout, ManagerSidebar
│   ├── pages/
│   │   ├── client/            # Client portal pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── SubmitRequest.tsx
│   │   │   └── Profile.tsx
│   │   ├── employee/          # Employee portal pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Tasks.tsx
│   │   │   └── Profile.tsx
│   │   ├── manager/           # Manager portal pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Team.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── ProjectDetails.tsx
│   │   ├── Login.tsx          # Common login page
│   │   └── NotFound.tsx       # 404 page
│   ├── contexts/
│   │   └── UserContext.tsx    # Enhanced with role support
│   ├── hooks/                 # use-mobile, use-toast
│   ├── lib/                   # Shared utilities
│   ├── types/                 # Unified TypeScript types
│   ├── utils/
│   │   └── dataParser.ts      # Unified data parsing (all functions combined)
│   ├── App.tsx                # Main app with role-based routing
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── Configuration files (tsconfig, vite.config, etc.)
└── package.json               # All dependencies

```

---

## 🚀 Routes

### Landing

- `/` or `/login` → Login page (select role)

### Client Portal

- `/client` → Client Dashboard
- `/client/projects` → All Client Projects
- `/client/submit` → Submit New Request
- `/client/profile` → Client Profile

### Employee Portal

- `/employee` → Employee Dashboard
- `/employee/tasks` → Task Management
- `/employee/profile` → Employee Profile

### Manager Portal

- `/manager` → Manager Dashboard
- `/manager/projects` → Project Management
- `/manager/team` → Team Management
- `/manager/profile` → Manager Profile
- `/manager/projects/:projectId` → Project Details

---

## 🔑 Key Features

### Unified Data Layer

- Single `dataParser.ts` with all functions combined
- Standardized CSV paths (`/public/*.csv`)
- Functions support both object references and string properties for flexibility

### Role-Based Architecture

- User role stored in `UserContext`
- Different sidebars for each role
- Route protection based on user role
- Flexible layouts that accept sidebar as prop

### Merged Logic

- **TaskWithDetails** type: Combines both approaches (object reference + string properties)
- **Layouts**: Common PortalLayout + Manager-specific ManagerLayout
- **Components**: Shared UI components in `common/`, role-specific in separate folders

---

## 📦 Next Steps

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Run Development Server**

   ```bash
   npm run dev
   ```

3. **Test All Portals**

   - Login as Client → Navigate to /client routes
   - Login as Employee → Navigate to /employee routes
   - Login as Manager → Navigate to /manager routes

4. **Potential Updates Needed**
   - Update import paths in some page files if they reference old locations
   - Add authentication logic to Login page (currently demo mode)
   - Update ManagerLayout to use ManagerSidebar correctly

---

## 🔧 What Was Combined

### Identical Files (Used As-Is)

- All UI components (50+)
- Configuration files
- Hooks and utilities
- Base layout structure
- CSV data files

### Merged Files (Logic Combined)

- `types/index.ts` - Combined all type definitions
- `utils/dataParser.ts` - All functions from 3 portals
- `contexts/UserContext.tsx` - Added role support

### Portal-Specific Files (Organized by Role)

- Pages moved to role-specific folders
- Sidebars renamed and updated with correct routes
- Manager layout kept separate

---

## ⚠️ Important Notes

- **CSV Paths**: All standardized to `/public/*.csv`
- **Route Prefixes**: `/client/*`, `/employee/*`, `/manager/*`
- **Sidebar Exports**: Updated to role-specific names (ClientSidebar, EmployeeSidebar)
- **Import Paths**: Common components use `@/components/common/` prefix

---

## 🎯 Migration Success

✅ All 3 portals merged into single codebase
✅ Role-based routing implemented
✅ Common code deduplicated
✅ Portal-specific functionality preserved
✅ Flexible and maintainable structure
