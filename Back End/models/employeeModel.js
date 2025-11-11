const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');


const employeeSchema = new mongoose.Schema({
  employee_id: {
    type: Number,
    required: [true, 'An employee must have an ID.'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: String,
  role: {
    type: String,
    required: [true, 'An employee must have a role.'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'An employee must belong to a department.'],
    trim: true
  },
  // Optional flag for UI/reporting; authorization still based on role 'manager'
  isApprover: {
    type: Boolean,
    default: false
  },
  approvesDepartments: [
    {
      type: String,
      trim: true
    }
  ],
  skills: [{
    type: String,
    trim: true
  }],
  availability: {
    type: String,
    enum: ['Available', 'Busy', 'On Leave'],
    default: 'Available'
  },
  phone: {
    type: String
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
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

employeeSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password') ) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

employeeSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  //means if not modified then return next and if new then also return next
  this.passwordChangedAt = Date.now() - 1000;
  // subtracting 1 sec to make sure that the token is always created after the password has been changed
  next();
});

employeeSchema.pre(/^find/, function(next) { // /^find/ means all the find methods like find, findOne, findById etc.
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

employeeSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

employeeSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};
  
employeeSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};




const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;