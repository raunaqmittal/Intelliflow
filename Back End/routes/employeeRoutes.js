const express = require('express');
const authController = require('../Controllers/authController');
const employeeController = require('../Controllers/employeeController');

const router = express.Router();

router.post('/signup', authController.signupEmployee);
router.post('/login', authController.loginEmployee);
router.post('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOTP);
router.post('/verify-login-otp', authController.verifyLoginOTP);
router.post('/send-phone-verification-otp', authController.protect, employeeController.sendPhoneVerificationOTP);
router.post('/verify-phone', authController.protect, employeeController.verifyPhone);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updateMyPassword', authController.protect, authController.updatePassword);

router.patch('/updateMe', authController.protect, employeeController.updateMe);
router.delete('/deleteMe', authController.protect, employeeController.deleteMe);
router.get('/me', authController.protect, employeeController.getMe);
router.get('/me/dashboard', authController.protect, employeeController.getMyDashboard);
router.get('/me/projects', authController.protect, employeeController.getMyProjects);
router.get('/me/projects/:projectId', authController.protect, employeeController.getMyProjectDetails);

router
  .route('/')
  .get(employeeController.getAllEmployees)
  .post(employeeController.createEmployee);

router
  .route('/:id')
  .get(employeeController.getEmployee)
  .patch(employeeController.updateEmployee)
  .delete(employeeController.deleteEmployee);

module.exports = router;
