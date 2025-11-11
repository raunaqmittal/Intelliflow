const Task = require('../models/taskModel');
const Employee = require('../models/employeeModel');
const Project = require('../models/projectModel');
const catchAsync = require('../Utilities/catchAsync');
const AppError = require('../Utilities/appError');
const APIFeatures = require('../Utilities/APIFeatures');
const { updateProjectStatusIfComplete } = require('../Utilities/projectStatusUpdater');

// GET all tasks with filtering, sorting, pagination
exports.getAllTasks = catchAsync(async (req, res, next) => {
  // Build query
  const features = new APIFeatures(Task.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tasks = await features.query.populate('project', 'project_title client_name status');

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks
    }
  });
});

// GET single task by ID
exports.getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('project', 'project_title client_name status requirements');

  if (!task) {
    return next(new AppError('No task found with that ID', 404));
  }

  // Get assigned employees details
  let assignedEmployees = [];
  if (task.assigned_to && task.assigned_to.length > 0) {
    assignedEmployees = await Employee.find({ 
      employee_id: { $in: task.assigned_to } 
    }).select('employee_id first_name last_name email role department');
  }

  res.status(200).json({
    status: 'success',
    data: {
      task,
      assignedEmployees
    }
  });
});

// NOTE: Tasks are created automatically when requests are approved and converted to projects
// See requestController.approveRequest() for task creation logic

// UPDATE task
exports.updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('project', 'project_title client_name status');

  if (!task) {
    return next(new AppError('No task found with that ID', 404));
  }

  // Auto-update project status if all tasks are now done
  if ((task.status === 'Done' || task.status === 'Completed') && task.project) {
    await updateProjectStatusIfComplete(task.project._id);
  }

  res.status(200).json({
    status: 'success',
    data: {
      task
    }
  });
});

// DELETE task
exports.deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndDelete(req.params.id);

  if (!task) {
    return next(new AppError('No task found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// GET tasks by project
exports.getTasksByProject = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({ project: req.params.projectId })
    .populate('project', 'project_title client_name status')
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
    results: tasks.length,
    data: {
      tasks: tasksWithEmployees
    }
  });
});

// GET tasks by employee (assigned to specific employee)
exports.getTasksByEmployee = catchAsync(async (req, res, next) => {
  const { employeeId } = req.params;
  
  // Convert to number if it's a string
  const empId = parseInt(employeeId);

  const tasks = await Task.find({ 
    assigned_to: empId 
  })
    .populate('project', 'project_title client_name status activeSprintNumber')
    .sort('-createdAt');

  // Filter tasks based on active sprint (only show tasks in active or past sprints)
  const visibleTasks = tasks.filter(task => {
    if (!task.project || !task.project.activeSprintNumber) {
      return true; // Show task if project data missing (safety fallback)
    }
    const taskSprintNum = task.sprint_number || 1;
    return taskSprintNum <= task.project.activeSprintNumber;
  });

  res.status(200).json({
    status: 'success',
    results: visibleTasks.length,
    data: {
      tasks: visibleTasks
    }
  });
});

// GET tasks by status
exports.getTasksByStatus = catchAsync(async (req, res, next) => {
  const { status } = req.params;
  
  const tasks = await Task.find({ status })
    .populate('project', 'project_title client_name status')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks
    }
  });
});

// UPDATE task status
exports.updateTaskStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new AppError('Please provide a status', 400));
  }

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { status },
    {
      new: true,
      runValidators: true
    }
  ).populate('project', 'project_title client_name status');

  if (!task) {
    return next(new AppError('No task found with that ID', 404));
  }

  // Auto-update project status if all tasks are now done
  if ((status === 'Done' || status === 'Completed') && task.project) {
    await updateProjectStatusIfComplete(task.project._id);
  }

  res.status(200).json({
    status: 'success',
    data: {
      task
    }
  });
});

// REASSIGN employees to task (for changes after project approval)
exports.reassignTask = catchAsync(async (req, res, next) => {
  const { employeeIds } = req.body; // Array of employee_id numbers

  if (!employeeIds || !Array.isArray(employeeIds)) {
    return next(new AppError('Please provide an array of employee IDs', 400));
  }

  // Verify all employees exist
  const employees = await Employee.find({ 
    employee_id: { $in: employeeIds } 
  });

  if (employees.length !== employeeIds.length) {
    return next(new AppError('One or more employee IDs are invalid', 400));
  }

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { assigned_to: employeeIds },
    {
      new: true,
      runValidators: true
    }
  ).populate('project', 'project_title client_name status');

  if (!task) {
    return next(new AppError('No task found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      task
    }
  });
});

// GET task statistics (for dashboard)
exports.getTaskStats = catchAsync(async (req, res, next) => {
  // Tasks grouped by status
  const stats = await Task.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        tasks: { $push: '$task_name' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Total task count
  const totalTasks = await Task.countDocuments();

  // Tasks grouped by priority
  const priorityStats = await Task.aggregate([
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Tasks grouped by sprint
  const sprintStats = await Task.aggregate([
    {
      $group: {
        _id: '$sprint',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalTasks,
      byStatus: stats,
      byPriority: priorityStats,
      bySprint: sprintStats
    }
  });
});

// GET my tasks (for logged-in employee)
exports.getMyTasks = catchAsync(async (req, res, next) => {
  // req.user is set by protect middleware
  const employee = await Employee.findById(req.user.id);
  
  if (!employee) {
    return next(new AppError('Employee not found', 404));
  }

  const tasks = await Task.find({ 
    assigned_to: employee.employee_id 
  })
    .populate('project', 'project_title client_name status activeSprintNumber')
    .sort('-createdAt');

  // Filter tasks based on active sprint (only show tasks in active or past sprints)
  const visibleTasks = tasks.filter(task => {
    if (!task.project || !task.project.activeSprintNumber) {
      return true; // Show task if project data missing (safety fallback)
    }
    const taskSprintNum = task.sprint_number || 1;
    return taskSprintNum <= task.project.activeSprintNumber;
  });

  res.status(200).json({
    status: 'success',
    results: visibleTasks.length,
    data: {
      tasks: visibleTasks
    }
  });
});
