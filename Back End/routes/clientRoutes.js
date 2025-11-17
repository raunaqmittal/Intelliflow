const express = require('express');
const authController = require('../Controllers/authController');
const clientController = require('../Controllers/clientController');

const router = express.Router();

router.post('/signup', authController.signupClient);
router.post('/login', authController.loginClient);
router.post('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOTP);
router.post('/verify-login-otp', authController.verifyLoginOTP);
router.post('/send-phone-verification-otp', authController.protect, clientController.sendPhoneVerificationOTP);
router.post('/verify-phone', authController.protect, clientController.verifyPhone);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updateMyPassword', authController.protect, authController.updatePassword);

router.patch('/updateMe', authController.protect, clientController.updateMe);
router.delete('/deleteMe', authController.protect, clientController.deleteMe);
router.get('/me', authController.protect, clientController.getMe);
router.get('/me/dashboard', authController.protect, clientController.getMyDashboard);

router
  .route('/')
  .get(clientController.getAllClients)
  .post(clientController.createClient);

router
  .route('/:id')
  .get(clientController.getClient)
  .patch(clientController.updateClient)
  .delete(clientController.deleteClient);

module.exports = router;
