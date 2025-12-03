const sendEmail = async options => {
    try {
        // Use Resend API if available (for Render.com), otherwise fall back to SMTP
        if (process.env.RESEND_API_KEY) {
            // Use Resend API (works on Render.com free tier)
            const fetch = (await import('node-fetch')).default;
            
            if (process.env.NODE_ENV === 'development') {
                console.log('📨 Sending email via Resend API to:', options.email);
                console.log('📧 Subject:', options.subject);
            }
            
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Intelliflow <onboarding@resend.dev>', // Resend's test domain
                    to: options.email,
                    subject: options.subject,
                    text: options.message
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send email via Resend');
            }

            if (process.env.NODE_ENV === 'development') {
                console.log('✅ Email sent successfully via Resend:', data.id);
            }

            return { success: true, messageId: data.id };
        } else {
            // Fall back to SMTP (for local development)
            const nodemailer = require('nodemailer');
            
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
                console.log('✅ Email sent successfully via SMTP:', info.messageId);
            }

            return { success: true, messageId: info.messageId };
        }
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
