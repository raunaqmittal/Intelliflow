You are working on my existing Intelliflow project.

Your task is to perform a COMPLETE REPOSITORY CLEANUP, ORGANIZATION, SIMPLIFICATION, AND SAFE REFACTORING.

IMPORTANT:

This is an already working project.

Your highest priority is:

1. DO NOT BREAK EXISTING FUNCTIONALITY.
2. DO NOT BREAK API contracts.
3. DO NOT BREAK frontend-backend communication.
4. DO NOT BREAK authentication/authorization.
5. DO NOT BREAK the AI workflow.
6. DO NOT BREAK deployment.
7. DO NOT change behavior unnecessarily.
8. Prefer small, understandable, reversible refactors.
9. Preserve functionality while making the codebase cleaner, simpler, shorter and more maintainable.

The goal is NOT to rewrite the project.

The goal is to clean the existing project intelligently.

==================================================
PHASE 0 — READ PROJECT CONTEXT FIRST
==================================================

Before touching ANY file:

1. Read:

   context.md

2. Treat context.md as the current project source of truth.

3. Understand:
   - current architecture
   - frontend
   - Node.js backend
   - Python AI service
   - database structure
   - API contracts
   - deployment
   - important technical decisions
   - known issues
   - legacy compatibility requirements
   - current roadmap

4. Do NOT assume that a file is unnecessary simply because it looks old.

5. Inspect actual imports, references, routes, scripts, package.json files, deployment configuration and Git history where useful.

The current architecture is approximately:

React/Vite frontend
        ↓
Node.js/Express backend
        ↓
Python FastAPI + LangGraph AI service
        ↓
Groq

MongoDB is used by the Node backend.

The AI service is currently deployed separately on Render.

==================================================
PHASE 1 — COMPLETE REPOSITORY AUDIT
==================================================

DO NOT MODIFY FILES YET.

First perform a complete repository audit.

Create a detailed cleanup/refactoring plan.

Inspect:

- every directory
- every source file
- every configuration file
- every README
- every .gitignore
- package.json files
- requirements.txt
- Dockerfile
- deployment files
- environment examples
- test files
- utility files
- controllers
- routes
- models
- frontend components
- frontend pages
- contexts
- hooks
- services
- AI service files

Search the entire repository for:

- duplicate functions
- duplicate components
- duplicate constants
- duplicate schemas
- duplicate validation logic
- duplicate API calls
- duplicate formatting logic
- duplicate fallback data
- unused imports
- unused variables
- unused functions
- unreachable code
- dead files
- dead routes
- obsolete configuration
- old deployment files
- redundant comments
- repeated helper logic
- repeated UI logic
- repeated error handling
- repeated API logic
- unnecessary wrapper functions
- unnecessary abstraction layers
- overly complex functions
- overly long functions
- unnecessary nested conditions
- unnecessary state
- unnecessary useEffect usage
- duplicated environment configuration
- duplicate documentation
- duplicate dependency declarations

Also inspect Git history when useful to determine whether a suspicious file is legacy, intentionally retained, or still required.

==================================================
PHASE 1A — FILE/DIRECTORY INVENTORY
==================================================

Create an inventory like:

FILE/DIRECTORY
PURPOSE
REFERENCED BY
SAFE TO DELETE?
SAFE TO MOVE?
REASON
DEPENDENCIES
RISK LEVEL

Categorize each suspicious item as:

A. KEEP
B. MOVE
C. MERGE
D. DELETE
E. SIMPLIFY
F. NEEDS MANUAL REVIEW

Do NOT delete anything during this phase.

==================================================
PHASE 1B — DOCUMENTATION CLEANUP
==================================================

I noticed that the repository may contain multiple README files.

Do NOT blindly delete them.

Find every README file.

For each README determine:

- What information does it contain?
- Is it specific to a subproject?
- Is it duplicated elsewhere?
- Is it still accurate?
- Is it required for deployment?
- Is it useful for developers?

Then decide whether it should:

1. remain where it is,
2. be merged into root README.md,
3. be renamed/moved into a relevant directory,
4. be deleted because it is redundant/outdated.

Example:

If the repository has:

README.md
AI Service/README.md
Data/README.md

do NOT assume all three are unnecessary.

Instead:

README.md
→ Main project documentation

AI Service/README.md
→ Keep only if it contains AI-service-specific setup/deployment information that is genuinely useful.

Data/README.md
→ Keep only if Data/ contains meaningful dataset/setup/documentation information.

If two READMEs contain essentially the same information, consolidate them.

The final repository should have a clear documentation hierarchy.

==================================================
PHASE 1C — .gitignore CLEANUP
==================================================

Find every:

.gitignore

file.

Do NOT automatically merge/delete them.

Determine their scope.

For example:

Root:
.gitignore

Back End/.gitignore
AI Service/.gitignore
Front End/.gitignore

Check whether nested .gitignore files contain rules that are actually required.

The goal is:

- avoid duplicated rules
- avoid contradictory rules
- keep root-level rules centralized where appropriate
- preserve directory-specific ignore rules when they are genuinely useful

Do not accidentally allow:

.env
config.env
secrets
API keys
credentials
node_modules
Python virtual environments
build output
cache files

to enter Git.

After cleanup verify Git ignore behavior.

==================================================
PHASE 1D — DIRECTORY ORGANIZATION
==================================================

Look for files that are currently sitting in inappropriate directories.

If multiple files clearly belong to the same category, group them into a meaningful subdirectory.

Examples:

Backend:

Utilities/
  otp.js
  email.js
  appError.js
  catchAsync.js
  APIFeatures.js

If there are many files that naturally belong to more specific categories, consider structures such as:

Utilities/
    auth/
    validation/
    ai/
    email/
    common/

OR another structure that better matches the existing codebase.

But DO NOT create folders simply for the sake of having more folders.

Prefer:

- fewer directories
- clear responsibility
- predictable imports
- meaningful grouping

For frontend, similarly inspect whether repeated components, hooks, API clients, utilities, constants, etc. should be grouped.

For example:

src/
  components/
  hooks/
  services/
  utils/
  constants/

Only create these if the existing project actually benefits from them.

==================================================
PHASE 1E — DUPLICATE CODE ANALYSIS
==================================================

Search for duplicate or near-duplicate code.

Examples:

If this logic appears in multiple files:

function formatSomething(...) {
   ...
}

extract it into an appropriate utility.

Then replace duplicate implementations with imports.

Example:

Before:

fileA.js:
function formatDate(date) { ... }

fileB.js:
function formatDate(date) { ... }

fileC.js:
function formatDate(date) { ... }

After:

utils/dateUtils.js:
export function formatDate(date) { ... }

and:

fileA → import
fileB → import
fileC → import

IMPORTANT:

Only extract genuinely reusable logic.

Do NOT create meaningless one-function utility files for trivial code.

Avoid over-abstraction.

Prefer simple reusable functions.

==================================================
PHASE 1F — SPECIFIC INTELLIFLOW DUPLICATION
==================================================

Pay special attention to known duplication in this project.

There are currently duplicated fallback workflow definitions:

- Back End/Utilities/aiWorkflowAgent.js
- Back End/Utilities/workflowGenerator.js

Analyze whether these can safely be converted into a single source of truth.

However:

DO NOT remove fallback behavior.

The fallback workflow must continue working if:

- Groq fails
- Python service fails
- timeout occurs
- malformed LLM output occurs

If consolidating the fallback definitions, make sure every existing caller continues receiving exactly the same data shape.

==================================================
PHASE 1G — DEAD CODE / UNUSED FILES
==================================================

Identify files that are not used.

A file is NOT considered unused merely because no obvious import exists.

Check:

- dynamic imports
- route mounting
- package scripts
- deployment configuration
- environment variables
- frontend routing
- backend routing
- test references
- build configuration
- Docker configuration
- Render configuration
- documentation references

Only delete a file when you have high confidence it is dead.

Before deleting a file, search the entire repository for:

- filename
- exported functions
- exported classes
- exported constants
- routes
- imports
- references

Record why it is safe to delete.

==================================================
PHASE 1H — LEGACY / DEPLOYMENT FILES
==================================================

Be especially careful with deployment-related files.

The project previously considered Hugging Face Spaces for the AI service but now uses:

Python FastAPI
+
Render Free Tier
+
UptimeRobot

Therefore inspect files such as:

Dockerfile
HF-related README instructions
deployment configuration
old environment variables
old startup commands

Determine whether they are:

1. still required,
2. useful for future deployment,
3. outdated,
4. completely unused.

Do NOT delete Dockerfile merely because Render currently uses Python runtime.

First determine whether it has any current or intended purpose.

If it is genuinely obsolete, document why before deleting it.

Also remove obsolete environment variables only if the codebase no longer references them.

==================================================
PHASE 1I — CODE SIMPLIFICATION
==================================================

After the audit, identify unnecessarily complicated code.

Simplify code while preserving behavior.

Examples:

Before:

if (condition === true) {
    return true;
} else {
    return false;
}

After:

return condition;

Another example:

Before:

const result = items
    .filter(...)
    .map(...)
    .filter(...)
    .map(...);

If the chain can safely and clearly become simpler without changing behavior, simplify it.

However:

DO NOT optimize code merely to reduce line count.

The goal is:

READABILITY > SHORTNESS

Prefer code that a normal developer can understand quickly.

==================================================
PHASE 1J — CONTROLLER CLEANUP
==================================================

Pay special attention to:

Back End/Controllers/requestController.js

This is a large and important controller.

DO NOT perform a large rewrite.

First understand its complete request lifecycle:

submit
→ AI
→ workflow generation
→ employee suggestions
→ assignment
→ department approval
→ overall approval
→ project conversion

If there are clearly reusable helper functions inside it, consider extracting them.

For example:

requestController.js
    ↓
requestHelpers.js
    ↓
small reusable functions

But preserve:

- request statuses
- API response shape
- authentication
- authorization
- approval behavior
- department alias handling
- employee assignment
- project conversion

Make incremental changes.

==================================================
PHASE 1K — IMPORTANT DATA MODEL COMPATIBILITY
==================================================

DO NOT remove:

assignedTo

or

assigned_to

from Task.

Both currently exist for legacy compatibility.

Before changing anything involving these fields, verify every usage.

Do not perform a migration unless explicitly requested.

Similarly, do not change:

- MongoDB field names
- request statuses
- project statuses
- task statuses
- employee IDs
- API response structure

unless absolutely necessary.

==================================================
PHASE 1L — DEPARTMENT ALIASES
==================================================

The backend has department alias normalization.

For example:

QA
Quality Assurance
Testing

may map to the same department.

Do not remove or simplify this logic in a way that changes behavior.

Search for all department names before modifying related code.

==================================================
PHASE 1M — AI SERVICE
==================================================

The AI Service is:

AI Service/
    main.py
    agent.py
    prompts.py
    schemas.py
    fallbacks.py
    requirements.txt
    Dockerfile
    ...

Current architecture:

Node.js
    ↓
HTTP POST
    ↓
FastAPI
    ↓
LangGraph
    ↓
Groq

Do not merge the Python AI service into the Node backend.

Do not replace LangGraph.

Do not change the API contract between Node and Python.

Preserve:

POST /run-agent
GET /health

Preserve:

X-Internal-Key

authentication.

Preserve the current response structure:

{
    requestType,
    isOutOfScope,
    outOfScopeReason,
    aiConfidence,
    workflow,
    usedFallback,
    error
}

Do not simplify Pydantic schemas if doing so weakens validation.

Do not remove fallback workflows.

==================================================
PHASE 1N — FRONTEND DUPLICATION
==================================================

Inspect the React frontend for:

- repeated components
- repeated forms
- repeated buttons
- repeated modal structures
- repeated API calls
- repeated loading states
- repeated error handling
- repeated formatting
- repeated role checks
- repeated query logic

If the same component is implemented multiple times, extract it.

Example:

Before:

ManagerPage.tsx
    <button className="...">...</button>

RequestPage.tsx
    <button className="...">...</button>

EmployeePage.tsx
    <button className="...">...</button>

If they genuinely represent the same UI behavior:

components/ui/ActionButton.tsx

Use the shared component.

But DO NOT abstract components that are only superficially similar.

==================================================
PHASE 1O — COMMENTS
==================================================

Remove unnecessary comments.

Delete comments that simply explain obvious code.

Example:

// increment counter
counter++;

Remove.

Keep comments that explain:

- non-obvious business rules
- security decisions
- legacy compatibility
- unusual deployment behavior
- important architectural decisions
- intentionally strange code
- reasons something must NOT be changed

Example:

// Both assignedTo and assigned_to are retained for legacy task documents.
// Do not remove either field until data migration is completed.

KEEP this type of comment.

Do not replace useful comments with excessive documentation.

==================================================
PHASE 1P — IMPORT CLEANUP
==================================================

After every move, merge or refactor:

- update all imports
- update relative paths
- update exports
- update index/barrel files if they exist
- update dynamic imports
- update tests
- update configuration
- update documentation references

Then search for old paths.

There must be no broken imports.

==================================================
PHASE 1Q — PACKAGE DEPENDENCY CLEANUP
==================================================

Inspect:

Back End/package.json
Front End/package.json
AI Service/requirements.txt

Find dependencies that are:

- completely unused
- duplicated
- legacy
- only present because of removed functionality

Do NOT remove a dependency simply because you cannot find a direct import.

Check:

- package scripts
- build tools
- plugins
- configuration
- transitive usage where relevant

Only remove dependencies with high confidence.

After dependency cleanup:

Backend:
npm install

Frontend:
npm install

AI Service:
pip install -r requirements.txt

and verify builds/startup.

==================================================
PHASE 1R — ENVIRONMENT VARIABLE CLEANUP
==================================================

Search the entire repository for every environment variable.

Create a table:

VARIABLE
USED WHERE
PURPOSE
CURRENTLY REQUIRED?
SAFE TO REMOVE?

Do not expose secret values.

Do not put actual secret values into context.md.

Remove obsolete environment variables only after verifying that:

- backend doesn't use them
- frontend doesn't use them
- AI service doesn't use them
- deployment doesn't use them

==================================================
PHASE 1S — TEST AND BUILD DEPENDENCY MAP
==================================================

Before changing architecture, identify:

Frontend → Backend API dependencies
Backend → MongoDB dependencies
Backend → Python AI dependencies
Python → Groq dependencies
Frontend → authentication dependencies
Backend → authentication dependencies

Create a dependency map.

This is extremely important.

Never move/delete a file without checking this map.

==================================================
PHASE 1T — CREATE THE REFACTOR PLAN
==================================================

After completing the audit, create:

REPO_CLEANUP_PLAN.md

The plan must contain:

1. Executive summary

2. Current repository structure

3. Problems discovered

4. Files to delete

5. Files to move

6. Files to merge

7. Files to simplify

8. Duplicate code to consolidate

9. Documentation cleanup

10. .gitignore cleanup

11. Dependency cleanup

12. Environment cleanup

13. Backend refactoring

14. Frontend refactoring

15. AI service refactoring

16. Deployment considerations

17. Import changes

18. Risk analysis

19. Testing plan

20. Final expected repository structure

For every proposed change include:

FILE
CURRENT LOCATION
NEW LOCATION
ACTION
REASON
DEPENDENCIES
RISK
HOW IT WILL BE VERIFIED

Example:

--------------------------------------------------
CHANGE #1
--------------------------------------------------

Current:
Back End/Utilities/duplicateHelper.js

Action:
DELETE

Reason:
No imports or runtime references found.

Risk:
LOW

Verification:
Repository-wide search found zero references.
Backend tests pass.

--------------------------------------------------
CHANGE #2
--------------------------------------------------

Current:
Back End/Utilities/aiWorkflowAgent.js
Back End/Utilities/workflowGenerator.js

Action:
CONSOLIDATE fallback workflow definitions

Reason:
Same fallback definitions exist in two places.

Risk:
MEDIUM

Verification:
AI fallback tests + request workflow tests.

--------------------------------------------------
CHANGE #3
--------------------------------------------------

Current:
Front End/src/pages/Manager/X.tsx
Front End/src/pages/Manager/Y.tsx

Action:
Extract repeated component.

Risk:
LOW

Verification:
Frontend build + affected UI flows.

==================================================
PHASE 2 — EXECUTE THE PLAN
==================================================

ONLY AFTER THE PLAN IS COMPLETE:

Start executing the cleanup.

Work in small groups.

Recommended order:

1. Remove clearly dead files
2. Clean documentation
3. Clean .gitignore
4. Remove unused imports
5. Remove dead code
6. Extract obvious reusable utilities
7. Consolidate duplicate functions
8. Organize directories
9. Simplify safe code
10. Consolidate duplicate fallback/configuration
11. Clean dependencies
12. Clean environment configuration
13. Run tests/build
14. Inspect the final diff
15. Update context.md

==================================================
SAFETY RULES DURING EXECUTION
==================================================

NEVER:

- rewrite the entire project
- change architecture unnecessarily
- rename database fields casually
- change API response formats
- change endpoint names
- change authentication flow
- change JWT structure
- change task status values
- change request status values
- remove legacy compatibility fields
- remove fallback behavior
- remove security middleware
- remove authentication middleware
- remove deployment configuration without verification
- change environment variable names without updating all consumers
- change frontend/backend contracts unnecessarily

Avoid "improvements" that are unrelated to cleanup.

If something works and is already reasonably clean, leave it alone.

==================================================
RISK CLASSIFICATION
==================================================

Classify changes:

LOW RISK:
- unused imports
- unused local variables
- obvious dead code
- redundant comments
- obvious duplicate helper
- documentation cleanup
- formatting
- safe import organization

MEDIUM RISK:
- moving files
- extracting shared utilities
- merging duplicate modules
- changing directory structure
- dependency removal
- changing component structure

HIGH RISK:
- authentication changes
- API changes
- database schema changes
- request lifecycle changes
- AI workflow changes
- deployment changes
- environment variable changes
- large controller rewrites
- changing legacy compatibility behavior

For HIGH RISK changes:

DO NOT perform them just because they look cleaner.

Only perform them if there is a strong cleanup reason and you can prove behavior is preserved.

==================================================
VALIDATION AFTER EVERY GROUP OF CHANGES
==================================================

After each logical refactoring group:

1. Check imports.
2. Search for old file paths.
3. Search for deleted function names.
4. Search for deleted exports.
5. Run relevant tests.
6. Check syntax/type/build errors.

Do not wait until the end to discover dozens of broken imports.

==================================================
BACKEND VALIDATION
==================================================

Run:

npm install

and the existing backend test suite:

Back End/tests/backendTesting.js

Verify:

- authentication
- login
- OTP
- request creation
- AI workflow generation
- workflow fallback
- employee suggestions
- approvals
- project conversion
- task retrieval
- task updates

==================================================
FRONTEND VALIDATION
==================================================

Run:

cd "Front End"
npm install
npm run build

Verify:

- build succeeds
- routing works
- authentication context works
- client portal works
- employee portal works
- manager portal works
- API requests point to correct endpoints

==================================================
AI SERVICE VALIDATION
==================================================

Run:

pip install -r requirements.txt

Start locally.

Verify:

GET /health

and:

POST /run-agent

Test:

1. valid request
2. out-of-scope request
3. malformed input
4. LLM failure/fallback
5. timeout/fallback
6. invalid internal key

Verify the output schema has not changed.

==================================================
DEPLOYMENT VALIDATION
==================================================

Do not break the current deployment.

Current deployment:

Frontend:
Vercel

Node backend:
Render

Python AI service:
Render Free Tier

AI service is kept awake using UptimeRobot.

Verify that cleanup does not break:

AI_AGENT_URL
AI_AGENT_INTERNAL_KEY
INTERNAL_API_KEY
Render startup
FastAPI startup
/health
/run-agent

Do not expose secrets.

==================================================
GIT DIFF REVIEW
==================================================

Before considering the cleanup complete:

Inspect:

git status
git diff
git diff --stat

Review every deleted file.

Review every moved file.

Review every modified API-related file.

Review every modified configuration file.

Review every modified environment/deployment file.

If a change cannot be clearly explained, revert it.

The final diff should represent CLEANUP, not an uncontrolled rewrite.

==================================================
FINAL REPOSITORY STRUCTURE
==================================================

After cleanup, produce the final repository tree.

Example:

Intelliflow/
│
├── Back End/
│   ├── Controllers/
│   ├── models/
│   ├── routes/
│   ├── Utilities/
│   └── ...
│
├── AI Service/
│   ├── main.py
│   ├── agent.py
│   ├── prompts.py
│   ├── schemas.py
│   ├── fallbacks.py
│   └── ...
│
├── Front End/
│   └── src/
│
├── Data/
│
├── README.md
├── context.md
└── .gitignore

The exact structure should be determined from the actual repository.

Do not force this exact structure if the repository has a better organization.

==================================================
UPDATE context.md
==================================================

After all successful changes:

Update context.md.

Update:

- repository structure
- deployment information
- important technical decisions
- known issues
- deprecated files
- current state
- change history
- next steps

Add a new change-history entry:

"Repository cleanup and structural refactoring"

Include:

- what was removed
- what was moved
- what was consolidated
- what was simplified
- important compatibility considerations
- tests performed
- deployment considerations

Do not put secrets in context.md.

==================================================
FINAL REPORT
==================================================

At the end provide:

1. Files deleted
2. Files moved
3. Files merged
4. Files created
5. Duplicate code removed
6. Utilities/components extracted
7. Documentation consolidated
8. .gitignore cleanup
9. Dependencies removed
10. Environment variables removed
11. Code simplified
12. Important things deliberately NOT changed
13. Tests executed
14. Build results
15. Deployment verification
16. Remaining technical debt
17. Final repository structure

For every potentially risky change explain why it is safe.

==================================================
MOST IMPORTANT PRINCIPLE
==================================================

DO NOT optimize for:

"fewest files"

or:

"fewest lines of code"

Optimize for:

CLEAN
+
SIMPLE
+
UNDERSTANDABLE
+
MAINTAINABLE
+
CORRECT
+
NO BROKEN INTEGRATIONS

A clean codebase is not necessarily the one with the fewest files.

A file should exist if it has a clear responsibility.

A utility should exist if it is genuinely reusable.

A README should exist if it contains unique useful information.

A .gitignore should exist if it provides meaningful scoped behavior.

Do not perform cleanup just to make numbers smaller.

Preserve working behavior above all else.