const nodemailer = require('nodemailer');
require('dotenv').config({ path: './config.env' });

console.log('='.repeat(60));
console.log('EMAIL DIAGNOSTIC TOOL - Intelliflow');
console.log('='.repeat(60));
console.log('');

// Step 1: Check environment variables
console.log('STEP 1: Checking Environment Variables');
console.log('-'.repeat(60));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET');
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET');
console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME || '❌ NOT SET');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ SET (length: ' + process.env.EMAIL_PASSWORD.length + ')' : '❌ NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ NOT SET');
console.log('');

if (!process.env.EMAIL_HOST || !process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
  console.error('❌ CRITICAL: Email environment variables are missing!');
  console.error('Please set EMAIL_HOST, EMAIL_USERNAME, and EMAIL_PASSWORD');
  process.exit(1);
}

// Step 2: Test SMTP Connection
const testConnection = async () => {
  console.log('STEP 2: Testing SMTP Connection');
  console.log('-'.repeat(60));
  
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

    console.log('Attempting to connect to SMTP server...');
    await transporter.verify();
    console.log('✅ SMTP Connection successful!');
    console.log('');
    return transporter;
  } catch (error) {
    console.error('❌ SMTP Connection FAILED!');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('');
    console.error('Common Causes:');
    console.error('  1. Gmail App Password expired or invalid');
    console.error('  2. Gmail blocking access from this server location');
    console.error('  3. Firewall blocking port 587');
    console.error('  4. 2-Step Verification not enabled on Gmail');
    console.error('');
    console.error('Solutions:');
    console.error('  1. Generate new app password: https://myaccount.google.com/apppasswords');
    console.error('  2. Check Gmail "Less secure apps": https://myaccount.google.com/security');
    console.error('  3. Check recent security alerts: https://myaccount.google.com/notifications');
    console.error('');
    throw error;
  }
};

// Step 3: Send Test Email
const sendTestEmail = async (transporter) => {
  console.log('STEP 3: Sending Test Email');
  console.log('-'.repeat(60));
  
  const testRecipient = process.env.EMAIL_USERNAME; // Send to yourself
  
  try {
    console.log('Sending test email to:', testRecipient);
    console.log('Please wait (this may take 10-30 seconds)...');
    
    const startTime = Date.now();
    
    const info = await transporter.sendMail({
      from: `Intelliflow Test <${process.env.EMAIL_USERNAME}>`,
      to: testRecipient,
      subject: 'Test Email from Render.com - ' + new Date().toLocaleString(),
      text: `This is a diagnostic test email from Intelliflow backend.\n\nServer: ${process.env.NODE_ENV}\nTimestamp: ${new Date().toISOString()}\n\nIf you receive this, your email is working on the deployed server!`
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Duration:', duration + ' seconds');
    console.log('Check inbox:', testRecipient);
    console.log('');
    console.log('⚠️  Note: Email may take 30-60 seconds to arrive');
    console.log('⚠️  Check spam folder if not in inbox');
    console.log('');
    
  } catch (error) {
    console.error('❌ Email Send FAILED!');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Response:', error.response);
    console.error('');
    
    if (error.code === 'EAUTH') {
      console.error('Authentication Error - Your Gmail credentials are being rejected!');
      console.error('');
      console.error('IMMEDIATE ACTIONS REQUIRED:');
      console.error('  1. Go to: https://myaccount.google.com/apppasswords');
      console.error('  2. Delete old "Intelliflow" or "Node.js" app password');
      console.error('  3. Create NEW app password for "Mail"');
      console.error('  4. Update EMAIL_PASSWORD in Render.com with new password');
      console.error('  5. Redeploy your application');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.error('Connection Timeout - Cannot reach Gmail servers!');
      console.error('');
      console.error('POSSIBLE CAUSES:');
      console.error('  1. Render.com firewall blocking SMTP (port 587)');
      console.error('  2. Network connectivity issues');
      console.error('  3. Gmail temporarily blocking requests');
      console.error('');
      console.error('SOLUTIONS:');
      console.error('  1. Try using port 465 with secure: true');
      console.error('  2. Switch to SendGrid (recommended for production)');
      console.error('  3. Contact Render.com support about SMTP access');
    }
    
    throw error;
  }
};

// Run diagnostics
(async () => {
  try {
    const transporter = await testConnection();
    await sendTestEmail(transporter);
    
    console.log('='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('Email system is working correctly on this server.');
    console.log('='.repeat(60));
    process.exit(0);
    
  } catch (error) {
    console.log('='.repeat(60));
    console.log('❌ DIAGNOSTIC FAILED');
    console.log('Please fix the issues above and try again.');
    console.log('='.repeat(60));
    process.exit(1);
  }
})();
