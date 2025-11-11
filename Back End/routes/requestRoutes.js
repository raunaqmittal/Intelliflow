const express = require('express');
const authController = require('../Controllers/authController');
const requestController = require('../Controllers/requestController');

const router = express.Router();

// Protect all routes - authentication required
router.use(authController.protect);

// Client endpoints
router
  .route('/')
  .get(requestController.getAllRequests) // Get all requests (filtered by role)
  .post(requestController.createRequest); // Client submits new request

router
  .route('/:id')
  .get(requestController.getRequest) // Get single request details
  .patch(requestController.updateRequest) // Update request before workflow generation
  .delete(requestController.deleteRequest); // Cancel/delete request

// Workflow-specific endpoints
router.get('/:id/workflow', requestController.getWorkflow); // Get generated workflow
router.post('/:id/generate-workflow', requestController.generateWorkflow); // Generate workflow from request

// Employee suggestion endpoint (manager can refresh suggestions)
router.post(
  '/:id/refresh-suggestions',
  authController.restrictTo('manager'),
  requestController.refreshEmployeeSuggestions
); // Refresh employee suggestions for all tasks

// Department approval endpoint (department approvers)
router.post(
  '/:id/department-approve',
  authController.restrictTo('manager'),
  requestController.departmentApprove
); // Manager approves their department for this request

// Manager review & actions (restrict to managers only)
router.patch(
  '/:id/workflow',
  authController.restrictTo('manager'),
  requestController.modifyWorkflow
); // Manager modifies workflow

router.patch(
  '/:id/assign-employees',
  authController.restrictTo('manager'),
  requestController.assignEmployees
); // Manager assigns employees to tasks

router.post(
  '/:id/approve',
  authController.restrictTo('manager'),
  requestController.approveRequest
); // Manager approves workflow

router.post(
  '/:id/reject',
  authController.restrictTo('manager'),
  requestController.rejectRequest
); // Manager rejects request

router.post(
  '/:id/convert-to-project',
  authController.restrictTo('manager'),
  requestController.convertToProject
); // Convert approved request to project with tasks

module.exports = router;
