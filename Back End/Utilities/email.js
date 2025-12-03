const nodemailer = require('nodemailer');

// Create a reusable transporter (connection pooling for better performance)
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // true for 465, false for other ports
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
        
        // Send the email with timeout handling
        const info = await transporter.sendMail(mailOptions);
        
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Email sent successfully:', info.messageId);
        }
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        throw error;
    }
};

module.exports = sendEmail; 
