# Backend Quick Reference - Intelliflow

## 🎯 Project Overview

**Domain**: Product Design & Prototyping Workflow Management  
**Stack**: Node.js + Express + MongoDB + Mongoose  
**Purpose**: Intelligent workflow automation with AI-powered request analysis

---

## 📊 Database Collections (14 Total)

### Core Collections

1. **Users** - Authentication & user accounts
2. **Clients** - Client/company profiles
3. **Employees** - Employee profiles with skills
4. **Managers** - Manager-specific data
5. **Projects** - Project information
6. **Sprints** - Sprint/phase management
7. **Tasks** - Individual task items
8. **ClientRequests** - New request submissions (with AI analysis)

### System Collections

9. **Departments** - Organizational departments
10. **Roles** - Job roles
11. **Skills** - Skill catalog
12. **TaskDependencies** - Task relationships

### Support Collections

13. **Notifications** - User notifications
14. **ActivityLogs** - Audit trail

---

## 🛣️ API Routes Summary (65 Endpoints)

### Authentication (8 endpoints)

`POST /api/auth/register` - Register new user  
`POST /api/auth/login` - Login  
`POST /api/auth/logout` - Logout  
`GET /api/auth/me` - Get current user  
`POST /api/auth/forgot-password` - Request reset  
`POST /api/auth/reset-password/:token` - Reset password  
`POST /api/auth/refresh-token` - Refresh JWT  
`GET /api/auth/verify-email/:token` - Verify email

### Client Routes (9 endpoints)

`GET /api/clients/profile` - Get profile  
`PUT /api/clients/profile` - Update profile  
`GET /api/clients/projects` - List projects  
`GET /api/clients/projects/:id` - Project details  
`POST /api/clients/requests` - Submit request  
`GET /api/clients/requests` - List requests  
`GET /api/clients/requests/:id` - Request details  
`PUT /api/clients/requests/:id` - Update request  
`GET /api/clients/dashboard` - Dashboard stats

### Employee Routes (9 endpoints)

`GET /api/employees/profile` - Get profile  
`PUT /api/employees/profile` - Update profile  
`PUT /api/employees/availability` - Update availability  
`GET /api/employees/tasks` - List tasks  
`GET /api/employees/tasks/:id` - Task details  
`PUT /api/employees/tasks/:id/status` - Update task status  
`POST /api/employees/tasks/:id/comments` - Add comment  
`GET /api/employees/dashboard` - Dashboard stats  
`GET /api/employees/projects` - List projects

### Manager Routes (9 endpoints)

`GET /api/managers/profile` - Get profile  
`PUT /api/managers/profile` - Update profile  
`GET /api/managers/dashboard` - Dashboard with approvals  
`GET /api/managers/requests` - Pending requests  
`GET /api/managers/requests/:id` - Request for review  
`POST /api/managers/requests/:id/review` - Approve/reject  
`POST /api/managers/requests/:id/convert` - Convert to project

### Project Routes (10 endpoints)

`GET /api/projects` - List projects  
`GET /api/projects/:id` - Project details  
`POST /api/projects` - Create project  
`PUT /api/projects/:id` - Update project  
`DELETE /api/projects/:id` - Delete project  
`GET /api/projects/:id/sprints` - List sprints  
`GET /api/projects/:id/tasks` - List tasks  
`GET /api/projects/:id/team` - Team members  
`PUT /api/projects/:id/status` - Update status  
`GET /api/projects/:id/statistics` - Project stats

### Sprint Routes (6 endpoints)

`GET /api/sprints/:id` - Sprint details  
`POST /api/sprints` - Create sprint  
`PUT /api/sprints/:id` - Update sprint  
`DELETE /api/sprints/:id` - Delete sprint  
`GET /api/sprints/:id/tasks` - Sprint tasks  
`PUT /api/sprints/:id/status` - Update status

### Task Routes (10 endpoints)

`GET /api/tasks/:id` - Task details  
`POST /api/tasks` - Create task  
`PUT /api/tasks/:id` - Update task  
`DELETE /api/tasks/:id` - Delete task  
`PUT /api/tasks/:id/assign` - Assign employee  
`PUT /api/tasks/:id/status` - Update status  
`POST /api/tasks/:id/comments` - Add comment  
`GET /api/tasks/:id/comments` - Get comments  
`POST /api/tasks/:id/attachments` - Upload file  
`POST /api/tasks/:id/dependencies` - Add dependency

### System Routes (6 endpoints)

`GET /api/system/departments` - List departments  
`GET /api/system/roles` - List roles  
`GET /api/system/skills` - List skills  
`POST /api/system/departments` - Create department (Admin)  
`POST /api/system/roles` - Create role (Admin)  
`POST /api/system/skills` - Create skill (Admin)

### AI Workflow Routes (5 endpoints) - **Future**

`POST /api/workflow/analyze-request` - AI analyze  
`POST /api/workflow/generate-tasks` - Generate tasks  
`POST /api/workflow/suggest-team` - Suggest team  
`POST /api/workflow/estimate-duration` - Estimate time  
`POST /api/workflow/optimize-allocation` - Optimize

### Notification Routes (4 endpoints)

`GET /api/notifications` - List notifications  
`PUT /api/notifications/:id/read` - Mark read  
`PUT /api/notifications/read-all` - Mark all read  
`DELETE /api/notifications/:id` - Delete

### Analytics Routes (4 endpoints)

`GET /api/analytics/projects` - Project analytics  
`GET /api/analytics/employees/:id` - Employee stats  
`GET /api/analytics/team-performance` - Team metrics  
`GET /api/analytics/task-completion` - Completion rates

---

## 🎮 Controllers (12 files)

```
src/controllers/
├── auth.controller.js         (8 functions)
├── client.controller.js       (9 functions)
├── employee.controller.js     (10 functions)
├── manager.controller.js      (8 functions)
├── project.controller.js      (10 functions)
├── sprint.controller.js       (6 functions)
├── task.controller.js         (12 functions)
├── team.controller.js         (9 functions)
├── system.controller.js       (8 functions)
├── workflow.controller.js     (6 functions - AI)
├── notification.controller.js (5 functions)
└── analytics.controller.js    (6 functions)
```

---

## 🛡️ Middleware (6 categories)

### 1. Authentication

- `authenticate()` - Verify JWT
- `attachUser()` - Add user to request

### 2. Authorization

- `authorizeRole([roles])` - Check role
- `authorizeClient()` - Client only
- `authorizeEmployee()` - Employee only
- `authorizeManager()` - Manager only
- `authorizeOwnership()` - Resource ownership

### 3. Validation

- `validateRequest(schema)` - Body validation
- `validateParams(schema)` - Param validation
- `validateQuery(schema)` - Query validation
- `sanitizeInput()` - Input sanitization

### 4. Error Handling

- `asyncHandler()` - Async wrapper
- `errorHandler()` - Global errors
- `notFound()` - 404 handler
- `validationErrorHandler()` - Validation errors

### 5. Request Processing

- `logRequest()` - Log requests
- `logResponse()` - Log responses
- `logToDatabase()` - Activity logging

### 6. Security

- `rateLimiter()` - Rate limiting
- `cors()` - CORS configuration
- `uploadSingle()` - File upload
- `uploadMultiple()` - Multi-file upload

---

## 🔧 Services (8 files)

```
src/services/
├── auth.service.js        - Password hashing, JWT generation
├── user.service.js        - User CRUD operations
├── project.service.js     - Project logic, progress calculation
├── task.service.js        - Task assignment, dependencies
├── notification.service.js - Notification creation & sending
├── email.service.js       - Email templates & sending
├── workflow.service.js    - AI workflow generation (FUTURE)
└── analytics.service.js   - Metrics & reporting
```

---

## 🔐 Authentication & Authorization

### JWT Structure

```javascript
{
  userId: ObjectId,
  role: 'client' | 'employee' | 'manager',
  email: String,
  iat: timestamp,
  exp: 24h
}
```

### Authorization Matrix

| Feature             | Client | Employee | Manager |
| ------------------- | ------ | -------- | ------- |
| View own projects   | ✅     | ❌       | ✅      |
| Submit requests     | ✅     | ❌       | ❌      |
| View assigned tasks | ❌     | ✅       | ✅      |
| Update task status  | ❌     | ✅       | ✅      |
| Review requests     | ❌     | ❌       | ✅      |
| Create projects     | ❌     | ❌       | ✅      |
| Assign tasks        | ❌     | ❌       | ✅      |
| Manage team         | ❌     | ❌       | ✅      |

---

## 🤖 AI Workflow Integration (Phase 7)

### AI Workflow Components

1. **Request Analysis** - NLP extraction of requirements
2. **Task Generation** - Break down into actionable items
3. **Framework Recommendation** - Suggest Agile/Waterfall/Hybrid
4. **Team Assignment** - Match skills to tasks
5. **Duration Estimation** - Predict timeline

### Data Flow

```
Client Request (text)
    ↓
AI Analysis → Structured Data
    ↓
Manager Review & Edit
    ↓
AI Generates Workflow (sprints + tasks)
    ↓
AI Suggests Team Assignments
    ↓
Manager Finalizes
    ↓
Project Created
    ↓
Notifications Sent
```

---

## 📦 Project Structure

```
backend/
├── src/
│   ├── controllers/        (12 files)
│   ├── middleware/         (6 categories)
│   ├── models/             (14 Mongoose schemas)
│   ├── routes/             (12 route files)
│   ├── services/           (8 service files)
│   ├── utils/              (helpers, validators)
│   ├── config/             (database, env)
│   └── app.js              (Express app)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env
├── .env.example
├── package.json
└── server.js
```

---

## 🚀 Implementation Phases (14 weeks)

### Phase 1: Core Setup (Week 1-2)

- Express + MongoDB setup
- Base schemas
- Authentication system

### Phase 2: User Management (Week 2-3)

- Profile management
- Role-based access
- Email service

### Phase 3: Project & Task (Week 3-5)

- Project CRUD
- Sprint management
- Task system with dependencies

### Phase 4: Request Processing (Week 5-6)

- Client request submission
- Manager approval workflow
- Request-to-project conversion

### Phase 5: Team Management (Week 6-7)

- Employee management
- Workload tracking
- Availability management

### Phase 6: Dashboards (Week 7-8)

- Dashboard APIs for all roles
- Analytics endpoints
- Performance metrics

### Phase 7: AI Integration (Week 8-10)

- AI service setup
- Request analysis
- Team suggestion algorithm

### Phase 8: Advanced Features (Week 10-12)

- Real-time notifications
- File uploads
- Advanced search

### Phase 9: Security (Week 12-13)

- Security audit
- Optimization
- Testing

### Phase 10: Deployment (Week 13-14)

- Integration testing
- Production setup
- CI/CD pipeline

---

## 🔑 Environment Variables

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/intelliflow

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=24h

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-password

# AI (Future)
OPENAI_API_KEY=your_key

# Frontend
CLIENT_URL=http://localhost:5173
```

---

## 📝 Key Features to Implement

### MVP (Minimum Viable Product)

✅ Authentication with JWT  
✅ Role-based access control  
✅ Client, Employee, Manager profiles  
✅ Project CRUD operations  
✅ Sprint management  
✅ Task assignment and status updates  
✅ Employee availability tracking  
✅ Dashboard APIs (all 3 roles)  
✅ Request submission & approval  
✅ Basic notifications

### Future Enhancements

🔮 AI-powered request analysis  
🔮 Automatic workflow generation  
🔮 Intelligent team assignment  
🔮 Real-time updates (WebSockets)  
🔮 File uploads & attachments  
🔮 Email notifications  
🔮 Advanced analytics  
🔮 Export functionality (PDF/CSV)

---

## 📚 Testing Strategy

- **Unit Tests**: Jest
- **Integration Tests**: Supertest + MongoDB Memory Server
- **API Tests**: Postman collections
- **Coverage Target**: 80%+

---

## 🎯 Quick Start Commands

```bash
# Install dependencies
npm install express mongoose bcryptjs jsonwebtoken dotenv cors

# Install dev dependencies
npm install -D nodemon jest supertest

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## 📖 Additional Resources

- Full documentation: `BACKEND_REQUIREMENTS_ANALYSIS.md`
- API documentation: Swagger UI (to be implemented)
- Frontend repo: Current workspace
- Database schema: See detailed analysis document

---

**Last Updated**: Current  
**Version**: 1.0  
**Project**: Intelliflow Backend
