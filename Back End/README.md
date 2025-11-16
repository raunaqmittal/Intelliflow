# Intelliflow Backend

## API Smoke Test

A sequential lifecycle validation script lives at `Back End/tests/apiSmokeTest.js`.

### What It Covers

1. Manager employee signup
2. Client signup & login
3. Client request creation
4. Workflow generation
5. Department approval (manager)
6. Employee assignment to tasks
7. Request approval → auto project & tasks creation
8. Project & task stats retrieval
9. Project/task detail endpoints
10. Negative authorization (client tries manager-only action)
11. Sprint advance attempt (may fail if incomplete)

### Run

PowerShell (Windows):

```powershell
node "Back End/tests/apiSmokeTest.js"
```

Optional environment variables:

```powershell
$env:BASE_URL = "http://localhost:3000/api/v1"
$env:VERBOSE = "true"
node "Back End/tests/apiSmokeTest.js"
```

### Notes

- Script mutates the database: creates users, request, project, tasks.
- Use a dedicated test database or clean up manually afterwards.
- Some employee/client CRUD routes are currently unauthenticated; the script uses this to patch manager departments. Consider locking these down later.

### Next Improvements

- Add cleanup routine (delete created entities) when run with `CLEANUP=true`.
- Integrate with a test runner (Jest/Mocha) and add structured assertions.
- Add load/performance sampling for key endpoints.
