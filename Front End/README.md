# Intelliflow Front End - Unified Portal

This is the unified frontend application for Intelliflow, combining Client, Employee, and Manager portals into a single codebase with role-based routing.

## Project Structure

- `/src/pages/client/` - Client portal pages
- `/src/pages/employee/` - Employee portal pages
- `/src/pages/manager/` - Manager portal pages
- `/src/components/common/` - Shared components across all portals
- `/src/components/ui/` - shadcn UI components

## Getting Started

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Technologies

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query

## Frontend API Testing

A comprehensive testing suite for all frontend routes lives at `Front End/tests/frontendTesting.cjs`.

### Test Coverage

**Client Portal (10 tests):**

- Client signup & login
- Dashboard & profile management
- Request creation & workflow generation
- Password reset & update

**Employee Portal (9 tests):**

- Employee signup & login
- Dashboard & my tasks
- My projects
- Profile updates
- Team view
- Password management

**Manager Portal (20 tests):**

- Manager signup & login
- Request management (view, assign, approve)
- Department approvals
- Project management (view, details, stats)
- Task management & statistics
- Employee management (view, add)
- Sprint advancement
- Profile updates
- Workflow suggestions

### Run Tests

**Test All Portals (39 tests):**

```powershell
node ".\Front End\tests\frontendTesting.cjs"
```

**Test Specific Portal:**

```powershell
$env:MODE = "client"; node ".\Front End\tests\frontendTesting.cjs"
$env:MODE = "employee"; node ".\Front End\tests\frontendTesting.cjs"
$env:MODE = "manager"; node ".\Front End\tests\frontendTesting.cjs"
```

**With Verbose Logging:**

```powershell
$env:VERBOSE = "true"; node ".\Front End\tests\frontendTesting.cjs"
```

### Environment Variables

- `MODE` - Test mode: "all", "client", "employee", "manager" (default: all)
- `BASE_URL` - API base URL (default: http://localhost:3000/api/v1)
- `VERBOSE` - Detailed logging (default: false)

### Notes

- Tests create temporary users and data for validation
- Requires running backend server at BASE_URL
- Tests use real API endpoints matching frontend implementation
- All 39 tests should pass with a clean database
