const express = require('express');
const taskController = require('../Controllers/taskController');
const authController = require('../Controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Get my tasks (for logged-in employee)
router.get('/my-tasks', taskController.getMyTasks);

// Statistics route (for dashboards)
router.get('/stats', taskController.getTaskStats);

// Get tasks by status
router.get('/status/:status', taskController.getTasksByStatus);

// Get tasks by project
router.get('/project/:projectId', taskController.getTasksByProject);

// Get tasks by employee
router.get('/employee/:employeeId', taskController.getTasksByEmployee);

// Standard routes (No POST - tasks are created automatically from approved requests)
router
  .route('/')
  .get(taskController.getAllTasks);

router
  .route('/:id')
  .get(taskController.getTask)
  .patch(taskController.updateTask)
  .delete(taskController.deleteTask);

// Update task status
router.patch('/:id/status', taskController.updateTaskStatus);

// Reassign employees to task (for changes after project approval)
router.patch('/:id/reassign', taskController.reassignTask);

module.exports = router;
