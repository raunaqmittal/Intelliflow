const crypto = require('crypto');

class OTPService {
  /**
   * Generate a random 6-digit OTP
   * @returns {string} 6-digit OTP code
   */
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hash OTP for secure storage in database
   * @param {string} otp - Plain text OTP
   * @returns {string} Hashed OTP
   */
  static hashOTP(otp) {
    return crypto
      .createHash('sha256')
      .update(otp.toString())
      .digest('hex');
  }

  /**
   * Send OTP via SMS using Twilio
   * @param {string} phoneNumber - Recipient phone number in E.164 format
   * @param {string} otp - OTP code to send
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async sendSMS(phoneNumber, otp) {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      // In development without Twilio, log OTP to console
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 DEV MODE - OTP for ${phoneNumber}: ${otp}`);
        return { success: true, devMode: true };
      }
      
      return { 
        success: false, 
        error: 'SMS service not configured. Please add Twilio credentials to config.env' 
      };
    }

    try {
      // Lazy-load Twilio to avoid errors if not installed
      const twilio = require('twilio');
      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const message = `Your Intelliflow password reset OTP is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes. Do not share this code.`;

      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log(`✅ OTP sent to ${phoneNumber}`);
      return { success: true };
    } catch (error) {
      console.error('❌ SMS send error:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Verify OTP by comparing hashed versions
   * @param {string} providedOTP - OTP provided by user
   * @param {string} storedHashedOTP - Hashed OTP from database
   * @returns {boolean} True if OTP matches
   */
  static verifyOTP(providedOTP, storedHashedOTP) {
    if (!providedOTP || !storedHashedOTP) return false;
    const hashedProvided = this.hashOTP(providedOTP);
    return hashedProvided === storedHashedOTP;
  }

  /**
   * Check if OTP has expired
   * @param {Date} otpExpires - Expiry timestamp from database
   * @returns {boolean} True if expired
   */
  static isExpired(otpExpires) {
    if (!otpExpires) return true;
    return Date.now() > otpExpires.getTime();
  }

  /**
   * Check if user can request a new OTP (rate limiting)
   * @param {Date} lastSent - Last OTP sent timestamp
   * @returns {boolean} True if can send new OTP
   */
  static canSendOTP(lastSent) {
    if (!lastSent) return true;
    const rateLimitMinutes = parseInt(process.env.OTP_RATE_LIMIT_MINUTES || 2);
    const rateLimitMs = rateLimitMinutes * 60 * 1000;
    return Date.now() - lastSent.getTime() > rateLimitMs;
  }

  /**
   * Mask phone number for display (security)
   * @param {string} phone - Full phone number
   * @returns {string} Masked phone number
   * @example "+919876543210" => "+91***3210"
   */
  static maskPhone(phone) {
    if (!phone) return '';
    return phone.replace(/(\+\d{1,3})(\d+)(\d{4})/, '$1***$3');
  }
}

module.exports = OTPService;
