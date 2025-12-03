const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Diagnostic endpoint - REMOVE THIS IN PRODUCTION!
// Access: GET /api/diagnostic/email
router.get('/email', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: []
  };

  // Check 1: Environment Variables
  const envCheck = {
    name: 'Environment Variables',
    status: 'unknown',
    details: {}
  };

  envCheck.details.EMAIL_HOST = process.env.EMAIL_HOST || '❌ NOT SET';
  envCheck.details.EMAIL_PORT = process.env.EMAIL_PORT || '❌ NOT SET';
  envCheck.details.EMAIL_USERNAME = process.env.EMAIL_USERNAME || '❌ NOT SET';
  envCheck.details.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD ? '✅ SET' : '❌ NOT SET';
  envCheck.details.FRONTEND_URL = process.env.FRONTEND_URL || '❌ NOT SET';

  if (process.env.EMAIL_HOST && process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) {
    envCheck.status = 'passed';
  } else {
    envCheck.status = 'failed';
  }

  results.checks.push(envCheck);

  // Check 2: SMTP Connection
  const smtpCheck = {
    name: 'SMTP Connection',
    status: 'unknown',
    details: {}
  };

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      },
      connectionTimeout: 10000,
      socketTimeout: 20000
    });

    await transporter.verify();
    smtpCheck.status = 'passed';
    smtpCheck.details.message = 'Successfully connected to SMTP server';
  } catch (error) {
    smtpCheck.status = 'failed';
    smtpCheck.details.error_code = error.code;
    smtpCheck.details.error_message = error.message;
    
    if (error.code === 'EAUTH') {
      smtpCheck.details.solution = 'Gmail app password is invalid. Generate new one at https://myaccount.google.com/apppasswords';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      smtpCheck.details.solution = 'Cannot reach Gmail servers. Try port 465 or switch to SendGrid.';
    }
  }

  results.checks.push(smtpCheck);

  // Check 3: Send Test Email (only if SMTP connection passed)
  if (smtpCheck.status === 'passed') {
    const emailCheck = {
      name: 'Send Test Email',
      status: 'unknown',
      details: {}
    };

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: false,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      const testRecipient = process.env.EMAIL_USERNAME;
      const startTime = Date.now();

      const info = await transporter.sendMail({
        from: `Intelliflow Diagnostic <${process.env.EMAIL_USERNAME}>`,
        to: testRecipient,
        subject: 'Diagnostic Test - ' + new Date().toLocaleString(),
        text: `This is a diagnostic test email.\n\nServer: ${process.env.NODE_ENV}\nTimestamp: ${new Date().toISOString()}\n\nEmail system is working!`
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      emailCheck.status = 'passed';
      emailCheck.details.message_id = info.messageId;
      emailCheck.details.recipient = testRecipient;
      emailCheck.details.duration_seconds = duration;
      emailCheck.details.note = 'Check your inbox/spam folder for the test email';

    } catch (error) {
      emailCheck.status = 'failed';
      emailCheck.details.error_code = error.code;
      emailCheck.details.error_message = error.message;
    }

    results.checks.push(emailCheck);
  }

  // Overall status
  const allPassed = results.checks.every(check => check.status === 'passed');
  results.overall_status = allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌';

  res.status(200).json(results);
});

module.exports = router;
