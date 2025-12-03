const nodemailer = require('nodemailer');
require('dotenv').config({ path: './config.env' });

console.log('🔍 Testing Email Configuration...\n');
console.log('Email Host:', process.env.EMAIL_HOST);
console.log('Email Port:', process.env.EMAIL_PORT);
console.log('Email User:', process.env.EMAIL_USERNAME);
console.log('Email Password:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
console.log('');

const testEmailConnection = async () => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 10,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 20000
    });

    console.log('📧 Testing SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP Connection successful!\n');

    // Send test email
    console.log('📨 Sending test email...');
    const testEmail = process.env.EMAIL_USERNAME; // Send to yourself
    
    const info = await transporter.sendMail({
      from: `Intelliflow <${process.env.EMAIL_USERNAME}>`,
      to: testEmail,
      subject: 'Test Email from Intelliflow - ' + new Date().toLocaleString(),
      text: 'This is a test email from Intelliflow backend.\n\nIf you receive this, your email configuration is working correctly!\n\nTimestamp: ' + new Date().toISOString()
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Recipient:', testEmail);
    console.log('\n✨ Email configuration is working properly!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.command) console.error('Command:', error.command);
    console.error('\nFull error:', error);
    process.exit(1);
  }
};

testEmailConnection();
