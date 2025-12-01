const Request = require('../models/requestModel');
const Employee = require('../models/employeeModel');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const catchAsync = require('../Utilities/catchAsync');
const AppError = require('../Utilities/appError');
const { generateWorkflowWithSuggestions } = require('../Utilities/workflowGenerator');
const { suggestEmployeesForTask } = require('../Utilities/employeeSuggestion');

// Simple department normalizer mirroring front-end logic (strict canonical form)
const normalizeDept = d => (d || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
// Alias map to align with front-end (Development ≡ Engineering, QA ≡ Testing, etc.)
const ALIASES = {
  qa: ['qualityassurance', 'testing', 'qatesting', 'qatest'],
  qualityassurance: ['qa', 'testing'],
  testing: ['qa', 'qualityassurance'],
  research: ['rnd', 'r&d', 'researchanddevelopment', 'randd'],
  development: ['dev', 'softwaredevelopment', 'engineering'],
  engineering: ['development', 'dev', 'softwaredevelopment'],
  design: ['uiux', 'ui', 'ux', 'uiandux'],
};
const expandAliases = (term) => {
  const n = normalizeDept(term);
  const set = new Set([n]);
  for (const [k, vals] of Object.entries(ALIASES)) {
    if (n === k || vals.includes(n)) {
      set.add(k);
      vals.forEach(v => set.add(v));
    }
  }
  return Array.from(set);
};
const expandList = (list) => (Array.isArray(list) ? list : [])
  .flatMap(expandAliases)
  .map(normalizeDept);

// Get client's own requests (client-only endpoint)
exports.getMyRequests = catchAsync(async (req, res, next) => {
  // Ensure user is a client
  if (req.user.role && req.user.role !== 'client') {
    return next(new AppError('This endpoint is for clients only', 403));
  }

  const requests = await Request.find({ client: req.user.id })
    .select('title requestType status createdAt updatedAt')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: requests.length,
    data: {
      requests
    }
  });
});

// Get all requests (filtered by role)
exports.getAllRequests = catchAsync(async (req, res, next) => {
  let filter = {};
  
  // If user has no role or is a client, only show their requests
  if (!req.user.role || req.user.role === 'client') {
    filter.client = req.user.id;
  }
  // Managers can see all requests

  const requests = await Request.find(filter)
    .populate('client', 'client_name contact_email')
    .populate('convertedToProject', 'project_name')
    .sort('-createdAt');

  // Hide workflow from clients
  const isClient = !req.user.role || req.user.role === 'client';
  const sanitizedRequests = isClient 
    ? requests.map(req => {
        const reqObj = req.toObject();
        delete reqObj.generatedWorkflow;
        return reqObj;
      })
    : requests;

  res.status(200).json({
    status: 'success',
    results: requests.length,
    data: {
      requests: sanitizedRequests
    }
  });
});

// Get single request
exports.getRequest = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id)
    .populate('client', 'client_name contact_email')
    .populate({
      path: 'generatedWorkflow.taskBreakdown.suggestedEmployees.employee',
      select: 'name email role department skills availability'
    })
    .populate({
      path: 'approvalsByDepartment.approvedBy',
      select: 'name email role department'
    })
    .populate({
      path: 'approvalsByDepartment.rejectedBy',
      select: 'name email role department'
    })
    .populate('convertedToProject');

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  // Populate task assignments separately
  if (request.taskAssignments && request.taskAssignments.size > 0) {
    await request.populate({
      path: 'taskAssignments.$*',
      select: 'name email role department skills'
    });
  }

  // Check authorization: only the request owner or privileged roles can access
  if ((req.user.role === 'client' || !req.user.role) && request.client._id.toString() !== req.user.id) {
    return next(new AppError('You do not have permission to access this request', 403));
  }

  // Hide workflow from clients
  const isClient = !req.user.role || req.user.role === 'client';
  let sanitizedRequest;
  if (isClient) {
    const reqObj = request.toObject();
    delete reqObj.generatedWorkflow;
    delete reqObj.taskAssignments;
    sanitizedRequest = reqObj;
  } else {
    // Merge populated task assignments into taskBreakdown for display
    const reqObj = request.toObject();
    const populatedAssignments = {};
    if (request.taskAssignments && request.taskAssignments.size > 0) {
      for (const [taskId, employees] of request.taskAssignments.entries()) {
        populatedAssignments[taskId] = Array.isArray(employees)
          ? employees.map(emp => (emp && emp._id ? emp.toObject ? emp.toObject() : emp : emp))
          : [];
      }
    }
    if (reqObj.generatedWorkflow && Array.isArray(reqObj.generatedWorkflow.taskBreakdown)) {
      reqObj.generatedWorkflow.taskBreakdown = reqObj.generatedWorkflow.taskBreakdown.map(task => {
        const taskId = task._id.toString();
        const assignedEmployees = populatedAssignments[taskId] || [];
        return {
          ...task,
          assignedEmployees,
          suggestedEmployees: task.suggestedEmployees || []
        };
      });
    }
    sanitizedRequest = reqObj;
  }
  res.status(200).json({
    status: 'success',
    data: {
      request: sanitizedRequest
    }
  });
});

// Create new request (client only)
exports.createRequest = catchAsync(async (req, res, next) => {

  const newRequest = await Request.create({
    client: req.user.id,
    requestType: req.body.requestType,
    title: req.body.title,
    description: req.body.description,
    requirements: req.body.requirements
  });

  res.status(201).json({
    status: 'success',
    data: {
      request: newRequest
    }
  });
});

// Update request (before workflow generation)
exports.updateRequest = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  // Check authorization
  if ((req.user.role === 'client' || !req.user.role) && request.client.toString() !== req.user.id) {
    return next(new AppError('You do not have permission to update this request', 403));
  }

  // Only allow updates if workflow hasn't been generated yet
  if (request.status !== 'submitted') {
    return next(new AppError('Cannot update request after workflow has been generated', 400));
  }

  const updatedRequest = await Request.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      description: req.body.description,
      requirements: req.body.requirements,
      requestType: req.body.requestType
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      request: updatedRequest
    }
  });
});

// Delete request
exports.deleteRequest = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  // Check authorization
  if ((req.user.role === 'client' || !req.user.role) && request.client.toString() !== req.user.id) {
    return next(new AppError('You do not have permission to delete this request', 403));
  }

  // Cannot delete if already converted to project
  if (request.status === 'converted') {
    return next(new AppError('Cannot delete request that has been converted to a project', 400));
  }

  await Request.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Generate workflow with employee suggestions
exports.generateWorkflow = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  if (request.status !== 'submitted') {
    return next(new AppError('Workflow has already been generated for this request', 400));
  }

  // Generate workflow with automatic employee suggestions
  const generatedWorkflow = await generateWorkflowWithSuggestions(
    request.requestType,
    request.description,
    request.requirements
  );

  request.generatedWorkflow = generatedWorkflow;

  // Derive required departments from task breakdown teams
  const deptSet = new Set(
    Array.isArray(generatedWorkflow.taskBreakdown)
      ? generatedWorkflow.taskBreakdown
          .map(t => (t && t.team ? t.team : null))
          .filter(Boolean)
      : []
  );
  const uniqueDepartments = Array.from(deptSet);
  request.requiredDepartments = uniqueDepartments;
  request.approvalsByDepartment = uniqueDepartments.map(d => ({
    department: d,
    approved: false
  }));

  request.status = 'workflow_generated';
  await request.save();

  // Populate employee details
  await request.populate({
    path: 'generatedWorkflow.taskBreakdown.suggestedEmployees.employee',
    select: 'name email role department skills availability'
  });

  res.status(200).json({
    status: 'success',
    data: {
      request
    }
  });
});

// Get workflow
exports.getWorkflow = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id)
    .populate({
      path: 'generatedWorkflow.taskBreakdown.suggestedEmployees.employee',
      select: 'name email role department skills availability'
    });

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  if (!request.generatedWorkflow) {
    return next(new AppError('Workflow has not been generated for this request yet', 400));
  }

  // Populate task assignments
  if (request.taskAssignments && request.taskAssignments.size > 0) {
    await request.populate({
      path: 'taskAssignments.$*',
      select: 'name email role department skills'
    });
  }

  // Merge assignments into workflow for response
  const workflow = request.generatedWorkflow.toObject();
  if (Array.isArray(workflow.taskBreakdown)) {
    workflow.taskBreakdown = workflow.taskBreakdown.map(task => {
      const taskId = task._id.toString();
      const assignedEmployees = request.taskAssignments && request.taskAssignments.get(taskId)
        ? request.taskAssignments.get(taskId)
        : [];
      return {
        ...task,
        assignedEmployees
      };
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      workflow
    }
  });
});

// Refresh employee suggestions (manager only)
exports.refreshEmployeeSuggestions = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  if (!request.generatedWorkflow) {
    return next(new AppError('No workflow to refresh suggestions for', 400));
  }

  // Refresh suggestions for all tasks
  const updatedTaskBreakdown = await Promise.all(
    request.generatedWorkflow.taskBreakdown.map(async (task) => {
      const suggestedEmployees = await suggestEmployeesForTask(task);
      return {
        ...task.toObject(),
        suggestedEmployees
      };
    })
  );

  request.generatedWorkflow.taskBreakdown = updatedTaskBreakdown;
  await request.save();

  await request.populate({
    path: 'generatedWorkflow.taskBreakdown.suggestedEmployees.employee',
    select: 'name email role department skills availability'
  });

  res.status(200).json({
    status: 'success',
    data: {
      request
    }
  });
});

// Modify workflow (manager can change assignments)
exports.modifyWorkflow = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  if (!request.generatedWorkflow) {
    return next(new AppError('No workflow to modify', 400));
  }

  // Update task assignments or other workflow details
  if (req.body.taskBreakdown) {
    // Merge incoming updates with existing tasks to preserve all fields
    request.generatedWorkflow.taskBreakdown = request.generatedWorkflow.taskBreakdown.map(existingTask => {
      const update = req.body.taskBreakdown.find(t => t._id && t._id.toString() === existingTask._id.toString());
      if (update) {
        // Merge update fields with existing task, preserving all original fields
        return {
          ...existingTask.toObject(),
          ...update,
          // Ensure we preserve critical fields if not explicitly updated
          taskName: update.taskName || existingTask.taskName,
          team: update.team || existingTask.team,
          estimatedHours: update.estimatedHours || existingTask.estimatedHours,
          requiredSkills: update.requiredSkills || existingTask.requiredSkills,
          suggestedEmployees: update.suggestedEmployees || existingTask.suggestedEmployees,
          assignedEmployees: update.assignedEmployees !== undefined ? update.assignedEmployees : existingTask.assignedEmployees
        };
      }
      return existingTask;
    });
  }

  if (req.body.estimatedDuration) {
    request.generatedWorkflow.estimatedDuration = req.body.estimatedDuration;
  }

  request.status = 'under_review';
  request.reviewNotes = req.body.reviewNotes || request.reviewNotes;
  await request.save();

  await request.populate({
    path: 'generatedWorkflow.taskBreakdown.suggestedEmployees.employee',
    select: 'name email role department skills availability'
  });

  res.status(200).json({
    status: 'success',
    data: {
      request
    }
  });
});

// Assign employees to tasks (manager only, scoped to their departments)
exports.assignEmployees = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  if (!request.generatedWorkflow) {
    return next(new AppError('No workflow to assign employees to', 400));
  }

  // req.body.assignments should be: { "taskId": ["employeeId1", "employeeId2"], ... }
  if (!req.body.assignments || typeof req.body.assignments !== 'object') {
    return next(new AppError('Please provide task assignments in the format: { "taskId": ["employeeId1", ...] }', 400));
  }

  // Validate that all task IDs exist in the workflow
  const validTaskIds = request.generatedWorkflow.taskBreakdown.map(t => t._id.toString());
  const invalidTaskIds = Object.keys(req.body.assignments).filter(taskId => !validTaskIds.includes(taskId));
  
  if (invalidTaskIds.length > 0) {
    return next(new AppError(`Invalid task IDs: ${invalidTaskIds.join(', ')}`, 400));
  }

  // Enforce department scope: manager can only assign tasks for their managed departments
  const managerDeptsRaw = Array.isArray(req.user.approvesDepartments) ? req.user.approvesDepartments : [];
  const managerDepts = expandList(managerDeptsRaw);
  const taskMap = new Map(request.generatedWorkflow.taskBreakdown.map(t => [t._id.toString(), t.team]));
  const mgrSet = new Set(managerDepts);
  const unauthorizedTasks = Object.keys(req.body.assignments).filter(taskId => {
    const team = taskMap.get(taskId);
    return team && !mgrSet.has(normalizeDept(team));
  });

  if (unauthorizedTasks.length > 0) {
    const teams = unauthorizedTasks.map(tid => taskMap.get(tid)).filter(Boolean);
  return next(new AppError(`You are not authorized to assign tasks for: ${teams.join(', ')}. You can only assign for: ${(managerDeptsRaw || []).join(', ')}`, 403));
  }

  // Update task assignments by merging with existing entries instead of overwriting all
  if (!request.taskAssignments || !(request.taskAssignments instanceof Map)) {
    request.taskAssignments = new Map();
  }
  for (const [taskId, employees] of Object.entries(req.body.assignments)) {
    request.taskAssignments.set(taskId, employees);
  }
  request.markModified('taskAssignments');
  request.status = 'under_review';
  await request.save();

  // Populate all data for response
  await request.populate('client', 'client_name contact_email');
  await request.populate({
    path: 'generatedWorkflow.taskBreakdown.suggestedEmployees.employee',
    select: 'name email role department skills availability'
  });
  
  // Populate task assignments
  if (request.taskAssignments && request.taskAssignments.size > 0) {
    await request.populate({
      path: 'taskAssignments.$*',
      select: 'name email role department skills'
    });
  }

  // Merge assignments into taskBreakdown for response, using populated values
  const reqObj = request.toObject();
  const populatedAssignments = {};
  if (request.taskAssignments && request.taskAssignments.size > 0) {
    for (const [taskId, employees] of request.taskAssignments.entries()) {
      populatedAssignments[taskId] = Array.isArray(employees)
        ? employees.map(emp => (emp && emp._id ? emp.toObject ? emp.toObject() : emp : emp))
        : [];
    }
  }
  if (reqObj.generatedWorkflow && Array.isArray(reqObj.generatedWorkflow.taskBreakdown)) {
    reqObj.generatedWorkflow.taskBreakdown = reqObj.generatedWorkflow.taskBreakdown.map(task => {
      const taskId = task._id.toString();
      const assignedEmployees = populatedAssignments[taskId] || [];
      return {
        ...task,
        assignedEmployees
      };
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      request: reqObj
    }
  });
});

// Approve request (manager only)
exports.approveRequest = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  if (!request.generatedWorkflow) {
    return next(new AppError('Cannot approve request without generated workflow', 400));
  }

  // Only managers of involved departments can finalize approval
  const mgrDeptsRaw = Array.isArray(req.user.approvesDepartments) ? req.user.approvesDepartments : [];
  const mgrDepts = expandList(mgrDeptsRaw);
  const involvedDeptsRaw = Array.isArray(request.requiredDepartments) ? request.requiredDepartments : [];
  const involvedDepts = expandList(involvedDeptsRaw);
  if (involvedDepts.length > 0) {
    const intersects = mgrDepts.some(d => involvedDepts.includes(d));
    if (!intersects) {
      return next(
        new AppError(
          `Only managers of involved departments can approve this request. Involved: ${involvedDeptsRaw.join(', ')}`,
          403
        )
      );
    }
  }

  // Verify all department approvals completed (if any departments required)
  if (Array.isArray(request.requiredDepartments) && request.requiredDepartments.length > 0) {
    const pending = (Array.isArray(request.approvalsByDepartment) ? request.approvalsByDepartment : [])
      .filter(entry => !entry.approved)
      .map(entry => entry.department);
    if (pending.length > 0) {
      return next(new AppError(`Cannot approve: pending department approvals for: ${pending.join(', ')}`, 400));
    }
  }

  // Check if all tasks have assigned employees
  const unassignedTasks = request.generatedWorkflow.taskBreakdown.filter(task => {
    const taskId = task._id.toString();
    const assignments = request.taskAssignments && request.taskAssignments.get(taskId);
    return !assignments || assignments.length === 0;
  });

  if (unassignedTasks.length > 0) {
    return next(
      new AppError(
        `Cannot approve: ${unassignedTasks.length} task(s) still need employee assignment`,
        400
      )
    );
  }

  request.status = 'approved';
  request.reviewNotes = req.body.reviewNotes || request.reviewNotes;
  await request.save();

  // --- Automatically convert to project after approval ---
  // Populate client for project creation
  await request.populate('client');

  // Create project
  const newProject = await Project.create({
    project_id: Date.now(),
    project_title: request.title,
    client: request.client._id,
    client_name: request.client.client_name || '',
    category: request.requestType === 'web_dev' ? 'Web Dev' : 
              request.requestType === 'app_dev' ? 'App Dev' :
              request.requestType === 'prototype' ? 'Prototyping' : 'Research',
    // Mark as Approved on creation; frontend maps Approved -> In Progress for display
    status: 'Approved',
    framework: 'Agile',
    requirements: request.requirements ? request.requirements.join(', ') : ''
  });

  // Create tasks from workflow
  // Stabilize task IDs so dependencies can reference them deterministically
  const baseTaskId = Date.now();
  const tasks = await Promise.all(
    request.generatedWorkflow.taskBreakdown.map(async (task, index) => {
      const workflowTaskId = task._id.toString();
      const assignedList = request.taskAssignments && request.taskAssignments.get(workflowTaskId)
        ? request.taskAssignments.get(workflowTaskId)
        : [];

      // Resolve all assigned employees to their numeric employee_id values
      let assignedToNumbers = [];
      if (Array.isArray(assignedList) && assignedList.length > 0) {
        const ids = assignedList.map(a => (a && a._id) ? a._id : a);
        const empDocs = await Employee.find({ _id: { $in: ids } }).select('employee_id');
        assignedToNumbers = empDocs
          .map(e => e && typeof e.employee_id === 'number' ? e.employee_id : undefined)
          .filter(v => typeof v === 'number');
      }

      const thisTaskId = baseTaskId + index;
      const dependencyId = index > 0 ? baseTaskId + (index - 1) : undefined;
      const sprintNumber = Math.floor(index / 2) + 1;

      return await Task.create({
        task_id: thisTaskId,
        task_name: task.taskName,
        description: `Generated from client request: ${request.title}`,
        assigned_to: assignedToNumbers,
        project: newProject._id,
        project_id: newProject.project_id,
        sprint: `Sprint ${sprintNumber}`,
        sprint_number: sprintNumber,
        status: 'Pending',
        priority: index === 0 ? 'high' : 'medium',
        // estimated_hours not in schema; omit to avoid validation issues
        dependencies: dependencyId ? [dependencyId] : []
      });
    })
  );

  // Calculate total sprints from created tasks
  const sprintNumbers = tasks.map(t => t.sprint_number || 1);
  const totalSprints = Math.max(...sprintNumbers);
  
  // Update project with sprint information
  newProject.totalSprints = totalSprints;
  newProject.activeSprintNumber = 1;
  await newProject.save();

  // Update request with project reference
  request.convertedToProject = newProject._id;
  request.status = 'converted';
  await request.save();

  res.status(201).json({
    status: 'success',
    data: {
      project: newProject,
      tasks
    }
  });
});

// Department-level approve (Managers only; must be manager of that department)
exports.departmentApprove = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id).populate('client');

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  if (!request.generatedWorkflow) {
    return next(new AppError('No workflow to approve for this request. Generate workflow first.', 400));
  }

  // Ensure caller is authorized: must be an employee with role 'manager'
  const user = req.user;
  const isEmployee = !!user && (user.employee_id !== undefined && user.employee_id !== null);
  const isManager = !!user && user.role === 'manager';
  if (!(isEmployee && isManager)) {
    return next(new AppError('You are not authorized to approve departments for this request', 403));
  }

  // Managers can only approve departments they manage per approvesDepartments
  const userDeptsRaw = Array.isArray(user.approvesDepartments) ? user.approvesDepartments : [];
  const userDepts = expandList(userDeptsRaw);
  const userSet = new Set(userDepts);
  const pendingEntries = (Array.isArray(request.approvalsByDepartment) ? request.approvalsByDepartment : [])
    .filter(e => !e.approved)
    .map(e => ({ ...e, _norm: normalizeDept(e.department) }));
  const pendingDepts = new Set(pendingEntries.map(e => e._norm));

  // Determine target department
  let targetDept = req.body && req.body.department ? req.body.department : undefined;
  const eligiblePending = userDepts.filter(d => pendingDepts.has(d));

  if (!targetDept) {
    if (eligiblePending.length === 0) {
      return next(new AppError('No pending departments match your approval permissions', 403));
    }
    if (eligiblePending.length > 1) {
      return next(new AppError(`Multiple pending departments match your permissions: ${eligiblePending.join(', ')}. Specify 'department' in request body.`, 400));
    }
    targetDept = eligiblePending[0];
  } else {
    const targetKeys = new Set(expandAliases(targetDept));
    const authorized = Array.from(targetKeys).some(k => userSet.has(k));
    if (!authorized) {
      return next(new AppError('You are not authorized to approve for this department', 403));
    }
    const isPending = Array.from(targetKeys).some(k => pendingDepts.has(k));
    if (!isPending) {
      return next(new AppError('This department is not pending approval or not required for this request', 400));
    }
  }

  // Mark approved
  const targetKeys = new Set(expandAliases(targetDept));
  const idx = request.approvalsByDepartment.findIndex(e => {
    const entryKeys = new Set(expandAliases(e.department));
    for (const k of targetKeys) if (entryKeys.has(k)) return true;
    return false;
  });
  if (idx === -1) {
    return next(new AppError('Department not required for this request', 400));
  }

  request.approvalsByDepartment[idx].approved = true;
  request.approvalsByDepartment[idx].rejected = false;
  request.approvalsByDepartment[idx].approvedBy = user._id;
  request.approvalsByDepartment[idx].approvedAt = new Date();
  request.approvalsByDepartment[idx].rejectedBy = undefined;
  request.approvalsByDepartment[idx].rejectedAt = undefined;

  // Move status to under_review if not already
  if (request.status === 'workflow_generated') {
    request.status = 'under_review';
  }
  await request.save();

  await request.populate({
    path: 'approvalsByDepartment.approvedBy',
    select: 'name email role department'
  });

  res.status(200).json({
    status: 'success',
    data: {
      approvalsByDepartment: request.approvalsByDepartment
    }
  });
});

// Department-level reject (Managers only; must be manager of that department)
exports.departmentReject = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id).populate('client');

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  if (!request.generatedWorkflow) {
    return next(new AppError('No workflow to reject for this request. Generate workflow first.', 400));
  }

  // Ensure caller is authorized: must be an employee with role 'manager'
  const user = req.user;
  const isEmployee = !!user && (user.employee_id !== undefined && user.employee_id !== null);
  const isManager = !!user && user.role === 'manager';
  if (!(isEmployee && isManager)) {
    return next(new AppError('You are not authorized to reject departments for this request', 403));
  }

  // Managers can only reject departments they manage per approvesDepartments
  const userDeptsRaw = Array.isArray(user.approvesDepartments) ? user.approvesDepartments : [];
  const userDepts = expandList(userDeptsRaw);
  const userSet = new Set(userDepts);
  const allEntries = (Array.isArray(request.approvalsByDepartment) ? request.approvalsByDepartment : [])
    .map(e => ({ ...e, _norm: normalizeDept(e.department) }));
  const allDepts = new Set(allEntries.map(e => e._norm));

  // Determine target department
  let targetDept = req.body && req.body.department ? req.body.department : undefined;
  const eligibleDepts = userDepts.filter(d => allDepts.has(d));

  if (!targetDept) {
    if (eligibleDepts.length === 0) {
      return next(new AppError('No departments match your approval permissions', 403));
    }
    if (eligibleDepts.length > 1) {
      return next(new AppError(`Multiple departments match your permissions: ${eligibleDepts.join(', ')}. Specify 'department' in request body.`, 400));
    }
    targetDept = eligibleDepts[0];
  } else {
    const targetKeys = new Set(expandAliases(targetDept));
    const authorized = Array.from(targetKeys).some(k => userSet.has(k));
    if (!authorized) {
      return next(new AppError('You are not authorized to reject for this department', 403));
    }
    const isRequired = Array.from(targetKeys).some(k => allDepts.has(k));
    if (!isRequired) {
      return next(new AppError('This department is not required for this request', 400));
    }
  }

  // Mark rejected
  const targetKeys = new Set(expandAliases(targetDept));
  const idx = request.approvalsByDepartment.findIndex(e => {
    const entryKeys = new Set(expandAliases(e.department));
    for (const k of targetKeys) if (entryKeys.has(k)) return true;
    return false;
  });
  if (idx === -1) {
    return next(new AppError('Department not required for this request', 400));
  }

  request.approvalsByDepartment[idx].rejected = true;
  request.approvalsByDepartment[idx].approved = false;
  request.approvalsByDepartment[idx].rejectedBy = user._id;
  request.approvalsByDepartment[idx].rejectedAt = new Date();
  request.approvalsByDepartment[idx].approvedBy = undefined;
  request.approvalsByDepartment[idx].approvedAt = undefined;

  // Move status to under_review if not already
  if (request.status === 'workflow_generated') {
    request.status = 'under_review';
  }
  await request.save();

  await request.populate({
    path: 'approvalsByDepartment.rejectedBy',
    select: 'name email role department'
  });

  res.status(200).json({
    status: 'success',
    data: {
      approvalsByDepartment: request.approvalsByDepartment
    }
  });
});

// Reject request (manager only)
exports.rejectRequest = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  request.status = 'rejected';
  request.reviewNotes = req.body.reviewNotes || 'Request rejected by manager';
  await request.save();

  res.status(200).json({
    status: 'success',
    data: {
      request
    }
  });
});

// Convert approved request to project with tasks
exports.convertToProject = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id).populate('client');

  if (!request) {
    return next(new AppError('No request found with that ID', 404));
  }

  if (request.status !== 'approved') {
    return next(new AppError('Only approved requests can be converted to projects', 400));
  }

  if (request.convertedToProject) {
    return next(new AppError('This request has already been converted to a project', 400));
  }

  // Create project
  const newProject = await Project.create({
    project_name: request.title,
    description: request.description,
    client: request.client._id,
    category: request.requestType === 'web_dev' ? 'Web Dev' : 
              request.requestType === 'app_dev' ? 'App Dev' :
              request.requestType === 'prototype' ? 'Prototyping' : 'Research',
    status: 'Planning',
    start_date: Date.now(),
    estimated_duration: request.generatedWorkflow.estimatedDuration
  });

  // Create tasks from workflow
  const tasks = await Promise.all(
    request.generatedWorkflow.taskBreakdown.map(async (task, index) => {
      const taskId = task._id.toString();
      const assignedEmployees = request.taskAssignments && request.taskAssignments.get(taskId) 
        ? request.taskAssignments.get(taskId) 
        : [];
      
      return await Task.create({
        task_id: Date.now() + index, // Simple task ID generation
        task_name: task.taskName,
        description: `Generated from client request: ${request.title}`,
        assigned_to: assignedEmployees,
        project: newProject._id,
        sprint: `Sprint ${Math.floor(index / 2) + 1}`, // Group tasks into sprints
        status: 'Pending',
        priority: index === 0 ? 'High' : 'Medium',
        estimated_hours: task.estimatedHours,
        dependencies: index > 0 ? [Date.now() + (index - 1)] : []
      });
    })
  );

  // Update request with project reference
  request.convertedToProject = newProject._id;
  request.status = 'converted';
  await request.save();

  res.status(201).json({
    status: 'success',
    data: {
      project: newProject,
      tasks,
      request
    }
  });
});
