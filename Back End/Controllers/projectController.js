const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const Employee = require('../models/employeeModel');
const catchAsync = require('../Utilities/catchAsync');
const AppError = require('../Utilities/appError');
const APIFeatures = require('../Utilities/APIFeatures');

// GET all projects with filtering, sorting, pagination
exports.getAllProjects = catchAsync(async (req, res, next) => {
  // Build query
  const features = new APIFeatures(Project.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const projects = await features.query.populate('client', 'name email');

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects
    }
  });
});

// GET single project by ID
exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('client', 'name email company');

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  // Get all tasks for this project
  const tasks = await Task.find({ project: project._id })
    .sort('sprint_number task_id');

  // Get all unique employee IDs from tasks
  const employeeIds = new Set();
  tasks.forEach(task => {
    if (task.assigned_to && Array.isArray(task.assigned_to)) {
      task.assigned_to.forEach(id => employeeIds.add(id));
    }
  });

  // Fetch employee details
  const employees = await Employee.find({ 
    employee_id: { $in: Array.from(employeeIds) } 
  }).select('employee_id name email role department availability');

  // Create a map for quick lookup
  const employeeMap = new Map();
  employees.forEach(emp => {
    employeeMap.set(emp.employee_id, emp);
  });

  // Enrich tasks with employee details
  const tasksWithEmployees = tasks.map(task => {
    const taskObj = task.toObject();
    if (taskObj.assigned_to && Array.isArray(taskObj.assigned_to)) {
      taskObj.assignedEmployees = taskObj.assigned_to
        .map(id => employeeMap.get(id))
        .filter(emp => emp); // Filter out any undefined values
    }
    return taskObj;
  });

  res.status(200).json({
    status: 'success',
    data: {
      project,
      tasks: tasksWithEmployees
    }
  });
});

// NOTE: Projects are created automatically when requests are approved
// See requestController.approveRequest() for project creation logic

// UPDATE project
exports.updateProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('client', 'name email company');

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// DELETE project
exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndDelete(req.params.id);

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  // Optional: Also delete all tasks associated with this project
  await Task.deleteMany({ project: req.params.id });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// GET projects by client
exports.getProjectsByClient = catchAsync(async (req, res, next) => {
  const projects = await Project.find({ client: req.params.clientId })
    .populate('client', 'name email company')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects
    }
  });
});

// GET projects by status
exports.getProjectsByStatus = catchAsync(async (req, res, next) => {
  const { status } = req.params;
  
  const projects = await Project.find({ status })
    .populate('client', 'name email company')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects
    }
  });
});

// GET project statistics (for dashboard)
exports.getProjectStats = catchAsync(async (req, res, next) => {
  const stats = await Project.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        projects: { $push: '$project_title' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Get total count
  const totalProjects = await Project.countDocuments();

  // Get projects by category
  const categoryStats = await Project.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalProjects,
      byStatus: stats,
      byCategory: categoryStats
    }
  });
});

// UPDATE project status
exports.updateProjectStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new AppError('Please provide a status', 400));
  }

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { status },
    {
      new: true,
      runValidators: true
    }
  ).populate('client', 'name email company');

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// GET client-safe project status (task breakdown without employee details)
exports.getClientProjectStatus = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('client', 'client_name contact_email');

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  // Authorization: ensure client can only see their own projects
  // (req.user is set by protect middleware)
  const isClient = !req.user.role || req.user.role === 'client';
  if (isClient && project.client._id.toString() !== req.user.id) {
    return next(new AppError('You do not have permission to view this project', 403));
  }

  // Get all tasks with only safe fields
  const tasks = await Task.find({ project: project._id })
    .select('task_name status sprint priority description')
    .sort('sprint_number task_id');

  // Compute task stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'To Do').length;

  res.status(200).json({
    status: 'success',
    data: {
      project: {
        _id: project._id,
        project_title: project.project_title,
        category: project.category,
        framework: project.framework,
        status: project.status,
        requirements: project.requirements,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      taskSummary: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks
      },
      tasks: tasks.map(t => ({
        _id: t._id,
        task_name: t.task_name,
        status: t.status,
        sprint: t.sprint,
        priority: t.priority,
        description: t.description
      }))
    }
  });
});

// ADVANCE sprint (manager only, checks department authorization)
exports.advanceSprint = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  // Verify user is a manager
  if (!req.user.role || req.user.role !== 'manager') {
    return next(new AppError('Only managers can advance sprints', 403));
  }

  const currentSprint = project.activeSprintNumber;
  const totalSprints = project.totalSprints;

  // Check if we're already past the last sprint
  if (currentSprint > totalSprints) {
    return next(new AppError('All sprints have already been completed', 400));
  }

  // Get tasks for current sprint
  const currentSprintTasks = await Task.find({ 
    project: project._id, 
    sprint_number: currentSprint 
  });

  if (currentSprintTasks.length === 0) {
    return next(new AppError('No tasks found for current sprint', 404));
  }

  // Verify ALL current sprint tasks are Done or Completed
  const allComplete = currentSprintTasks.every(t => 
    t.status === 'Done' || t.status === 'Completed'
  );

  if (!allComplete) {
    const incompleteTasks = currentSprintTasks.filter(t => 
      t.status !== 'Done' && t.status !== 'Completed'
    );
    return next(new AppError(
      `Cannot advance sprint: ${incompleteTasks.length} task(s) still incomplete in Sprint ${currentSprint}`, 
      400
    ));
  }

  // Check manager authorization for CURRENT sprint (the one being completed)
  const managerDepts = Array.isArray(req.user.approvesDepartments) 
    ? req.user.approvesDepartments.map(d => d.toLowerCase())
    : [];

  // Extract unique departments from CURRENT sprint tasks
  const currentSprintDepts = new Set();
  for (const task of currentSprintTasks) {
    // Tasks are created with assigned employees who belong to departments
    // We need to check employee departments for authorization
    if (task.assigned_to && task.assigned_to.length > 0) {
      const employees = await Employee.find({ 
        employee_id: { $in: task.assigned_to } 
      }).select('department');
      
      employees.forEach(emp => {
        if (emp.department) {
          currentSprintDepts.add(emp.department.toLowerCase());
        }
      });
    }
  }

  // Manager must approve at least one department in the CURRENT sprint
  const hasAuthority = Array.from(currentSprintDepts).some(dept => 
    managerDepts.includes(dept)
  );

  if (!hasAuthority && currentSprintDepts.size > 0) {
    return next(new AppError(
      `You are not authorized to advance Sprint ${currentSprint}. Required departments: ${Array.from(currentSprintDepts).join(', ')}`, 
      403
    ));
  }

  // Advance sprint
  project.activeSprintNumber += 1;

  // If we've completed the final sprint, mark project as Completed
  if (project.activeSprintNumber > totalSprints) {
    project.status = 'Completed';
  }

  await project.save();

  res.status(200).json({
    status: 'success',
    data: {
      project,
      message: project.status === 'Completed' 
        ? 'Project completed successfully!' 
        : `Advanced to Sprint ${project.activeSprintNumber}`
    }
  });
});
