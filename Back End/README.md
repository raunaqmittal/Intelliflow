# Intelliflow Backend

## API Testing Suite

A comprehensive testing suite combining smoke tests and specific scenario validation lives at `Back End/tests/backendTesting.js`.

### Test Modes

**SMOKE Mode (default)**: Generic endpoint coverage with temporary test data

- Manager & client signup/login
- Request creation & workflow generation
- Department approvals & employee assignments
- Request approval → project/task creation
- Project & task stats, queries, updates
- Client-safe status endpoint
- Negative authorization tests
- Sprint advancement attempts

**SPECIFIC Mode**: Real client scenario with precise employee assignments

- Uses existing client (contact@designx.com)
- Creates temporary manager with full department access
- Assigns specific employees to tasks by team:
  - Research → Alex Research
  - Design → Emma Designer
  - Development (Frontend) → Sarah Frontend
  - Development (Backend) → Mike Backend
  - Testing → Shruti Bansal
- Completes tasks and advances sprints
- Full cleanup (deletes project and temp manager)

### Run

**Smoke Test (default):**

```powershell
node "Back End/tests/backendTesting.js"
```

**Specific Scenario:**

```powershell
$env:MODE = "specific"
node "Back End/tests/backendTesting.js"
```

**Specific with Progressive Sprint Completion:**

```powershell
$env:MODE = "specific"; $env:PROGRESSIVE = "true"
node "Back End/tests/backendTesting.js"
```

### Environment Variables

- `MODE` - Test mode: "smoke" or "specific" (default: smoke)
- `BASE_URL` - API base URL (default: http://localhost:3000/api/v1)
- `PROGRESSIVE` - For specific mode: complete tasks per-sprint before advancing (default: false)
- `VERBOSE` - Detailed logging (default: false)

Example with all options:

```powershell
$env:MODE = "specific"; $env:PROGRESSIVE = "true"; $env:VERBOSE = "true"
node "Back End/tests/backendTesting.js"
```

### Notes

- **Smoke mode** creates temporary test data (not cleaned up automatically)
- **Specific mode** includes automatic cleanup (deletes project and temp manager)
- Use a dedicated test database for smoke tests or clean up manually
- Some employee/client CRUD routes are currently unauthenticated; the script uses this to patch manager departments. Consider locking these down later.

### Next Improvements

- Add cleanup routine for smoke mode when run with `CLEANUP=true`
- Integrate with a test runner (Jest/Mocha) and add structured assertions
- Add load/performance sampling for key endpoints
