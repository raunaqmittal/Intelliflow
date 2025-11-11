const express = require('express');
const projectController = require('../Controllers/projectController');
const authController = require('../Controllers/authController');

const router = express.Router();

// Public routes (if needed) - currently all protected

// Protect all routes after this middleware
router.use(authController.protect);

// Statistics route (for dashboards)
router.get('/stats', projectController.getProjectStats);

// Get projects by status
router.get('/status/:status', projectController.getProjectsByStatus);

// Get projects by client
router.get('/client/:clientId', projectController.getProjectsByClient);

// Standard routes (No POST - projects are created automatically from approved requests)
router
  .route('/')
  .get(projectController.getAllProjects);

router
  .route('/:id')
  .get(projectController.getProject)
  .patch(projectController.updateProject)
  .delete(projectController.deleteProject);

// Update project status
router.patch('/:id/status', projectController.updateProjectStatus);

// Advance sprint (manager only)
router.patch('/:id/advance-sprint', projectController.advanceSprint);

// Client-safe project status (task breakdown without employee details)
router.get('/:id/client-status', projectController.getClientProjectStatus);

module.exports = router;
