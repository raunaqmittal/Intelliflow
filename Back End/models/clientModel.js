const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const clientSchema = new mongoose.Schema({
  // ADDED: To store the original numeric ID
  client_id: {
    type: Number,
    required: [true, 'A client must have an original ID.'],
    unique: true
  },
  // RENAMED: To match JSON
  client_name: {
    type: String,
    required: [true, 'A client must have a name.'],
    trim: true
  },
  // RENAMED: To match JSON
  contact_email: {
    type: String,
    required: [true, 'Please provide a client email.'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email.']
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    // unique: true, // DISABLED FOR TESTING - Enable in production
    // sparse: true,
    validate: {
      validator: function(v) {
        if (!v) return false; // Phone is now required
        return /^\+?[1-9]\d{9,14}$/.test(v); // E.164 format
      },
      message: 'Please provide a valid phone number in international format (e.g., +919876543210)'
    }
  },
  phoneVerified: {
    type: Boolean,
    default: false // Must verify phone before enabling 2FA
  },
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorMethod: {
    type: String,
    enum: ['sms', 'email'],
    default: 'sms'
  },
  // OTP fields for password reset and 2FA
  otpCode: {
    type: String,
    select: false // Don't include in queries by default
  },
  otpExpires: Date,
  otpAttempts: {
    type: Number,
    default: 0
  },
  otpLastSent: Date,
  otpPhone: {
    type: String,
    select: false // Phone number OTP was sent to
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    minlength: 8,
    select: false,
    default: 'password123'
  },
  passwordConfirm: {
    type: String,
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// --- Security Middleware and Methods (No Changes Needed Here) ---

clientSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

clientSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

clientSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});

clientSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

clientSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

clientSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;