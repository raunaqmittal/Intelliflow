const nodemailer = require('nodemailer');

const sendEmail = async options => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_PORT === '465',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        if (process.env.NODE_ENV === 'development') {
            console.log('📨 Sending email via SMTP to:', options.email);
        }

        const info = await transporter.sendMail({
            from: 'Intelliflow <raunaqmittal2004@gmail.com>',
            to: options.email,
            subject: options.subject,
            text: options.message
        });

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
