const nodemailer = require('nodemailer');

// Create a reusable transporter (connection pooling for better performance)
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        // Verify environment variables are loaded
        if (!process.env.EMAIL_HOST || !process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
            console.error('❌ Email configuration is incomplete. Please check environment variables.');
            throw new Error('Email configuration is incomplete. Check environment variables.');
        }

        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            },
            pool: true, // Use pooled connections
            maxConnections: 5,
            maxMessages: 10,
            rateDelta: 1000,
            rateLimit: 5,
            connectionTimeout: 10000, // 10 second connection timeout
            greetingTimeout: 5000,
            socketTimeout: 20000 // 20 second socket timeout
        });
    }
    return transporter;
};

const sendEmail = async options => {
    try {
        const transporter = getTransporter();
        
        // Define the email options
        const mailOptions = {
            from: 'Intelliflow <raunaqmittal2004@gmail.com>',
            to: options.email,
            subject: options.subject,
            text: options.message
        };
        
        if (process.env.NODE_ENV === 'development') {
            console.log('📨 Sending email to:', options.email);
            console.log('📧 Subject:', options.subject);
        }
        
        // Send the email with timeout handling
        const info = await transporter.sendMail(mailOptions);
        
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Email sent successfully:', info.messageId);
        }
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:');
        console.error('  To:', options.email);
        console.error('  Subject:', options.subject);
        console.error('  Error:', error.message);
        if (error.code) console.error('  Code:', error.code);
        throw error;
    }
};

module.exports = sendEmail; 
