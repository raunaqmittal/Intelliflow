const jwt = require('jsonwebtoken');
const Employee = require('./../models/employeeModel');
const Client = require('./../models/clientModel');
const catchAsync = require('./../Utilities/catchAsync');
const AppError = require('./../Utilities/appError');
const {promisify} = require('util');
const sendEmail = require('./../Utilities/email');
const crypto = require('crypto');
const OTPService = require('./../Utilities/otp');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}

// Normalize phone number to ensure +91 prefix
const normalizePhone = (phone) => {
  if (!phone) return undefined; // Return undefined instead of empty value
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  if (!digits) return undefined; // If no digits after cleaning, return undefined
  
  // If doesn't start with 91, add it
  if (!digits.startsWith('91')) {
    digits = '91' + digits;
  }
  
  // Always return with + prefix for consistency
  return `+${digits}`;
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Using localStorage + Authorization header (cross-domain compatible)
  // No cookies needed - frontend stores token and sends via Authorization header

  //removing password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data:{
      user
    }
  });
};

// Employee signup
exports.signupEmployee = catchAsync(async (req, res, next) => {
  // Check if email already exists
  const existingEmployee = await Employee.findOne({ email: req.body.email });
  if (existingEmployee) {
    return next(new AppError('An account with this email already exists', 400));
  }

  // Security: Only allow role assignment if user is a manager
  let assignedRole = 'employee'; // Default role
  
  if (req.body.role) {
    // If user is authenticated as manager, use provided role
    if (req.user && req.user.role === 'manager') {
      assignedRole = req.body.role;
    } else {
      // Public signup - use the role they provided
      assignedRole = req.body.role;
    }
  }
  
  // Auto-detect if the role is a manager role and set approver fields
  const isManagerRole = /manager|lead|head|director|chief|supervisor/i.test(assignedRole);
  const approverFields = isManagerRole ? {
    isApprover: true,
    approvesDepartments: req.body.department ? [req.body.department] : []
  } : {
    isApprover: false,
    approvesDepartments: []
  };
  
  const newEmployee = await Employee.create({
    employee_id: req.body.employee_id,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: assignedRole,
    department: req.body.department,
    skills: req.body.skills,
    availability: req.body.availability,
    phone: normalizePhone(req.body.phone),
    phoneVerified: false, // User must verify phone number
    ...approverFields // Spread the auto-detected approver fields
  });
  createSendToken(newEmployee, 201, res);
});

// Client signup
exports.signupClient = catchAsync(async (req, res, next) => {
  // Check if email already exists
  const existingClient = await Client.findOne({ contact_email: req.body.contact_email });
  if (existingClient) {
    return next(new AppError('An account with this email already exists', 400));
  }

  const newClient = await Client.create({
    client_id: req.body.client_id,
    client_name: req.body.client_name,
    contact_email: req.body.contact_email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    phone: normalizePhone(req.body.phone),
    phoneVerified: false, // User must verify phone number
    industry: req.body.industry,
    address: req.body.address
  });
  createSendToken(newClient, 201, res);
});

// Employee login
exports.loginEmployee = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if employee exists && password is correct
  const employee = await Employee.findOne({ email }).select('+password');

  if (!employee || !(await employee.correctPassword(password, employee.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Check if 2FA is enabled
  if (employee.twoFactorEnabled) {
    // Verify appropriate verification based on 2FA method
    if (employee.twoFactorMethod === 'sms' && (!employee.phone || !employee.phoneVerified)) {
      return next(new AppError('SMS 2FA is enabled but phone is not verified. Please contact support.', 400));
    }
    if (employee.twoFactorMethod === 'email' && !employee.emailVerified) {
      return next(new AppError('Email 2FA is enabled but email is not verified. Please contact support.', 400));
    }

    // Rate limiting check
    if (!OTPService.canSendOTP(employee.otpLastSent)) {
      return next(new AppError('Please wait before requesting another OTP', 429));
    }

    // Generate and send OTP
    const otp = OTPService.generateOTP();
    employee.otpCode = OTPService.hashOTP(otp);
    employee.otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000);
    employee.otpAttempts = 0;
    employee.otpLastSent = Date.now();
    await employee.save({ validateBeforeSave: false });

    // Send OTP only via chosen 2FA method
    let otpSent = false;
    let sentMethod = '';
    let maskedDestination = '';

    if (employee.twoFactorMethod === 'sms') {
      // Send via SMS only
      const smsResult = await OTPService.sendSMS(employee.phone, otp);
      if (smsResult.success || smsResult.devMode) {
        otpSent = true;
        sentMethod = 'SMS';
        maskedDestination = OTPService.maskPhone(employee.phone);
      }
    } else if (employee.twoFactorMethod === 'email') {
      // Send via Email only
      try {
        await OTPService.sendEmail(employee.email, otp);
        otpSent = true;
        sentMethod = 'email';
        maskedDestination = OTPService.maskEmail(employee.email);
      } catch (error) {
        // Email send failed
      }
    }
    
    if (!otpSent) {
      // Failed to send OTP, clear it
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Failed to send login OTP via ${employee.twoFactorMethod}`);
      }
      employee.otpCode = undefined;
      employee.otpExpires = undefined;
      await employee.save({ validateBeforeSave: false });
      
      return next(new AppError('Failed to send OTP. Please try again or contact support.', 500));
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Login OTP sent via: ${sentMethod}`);
    }

    return res.status(200).json({
      status: 'otp_required',
      message: `OTP sent to your ${sentMethod}`,
      email: employee.email,
      maskedPhone: employee.twoFactorMethod === 'sms' ? OTPService.maskPhone(employee.phone) : undefined,
      maskedEmail: employee.twoFactorMethod === 'email' ? OTPService.maskEmail(employee.email) : undefined,
      expiresIn: process.env.OTP_EXPIRY_MINUTES || 5
    });
  }

  // 4) If 2FA not enabled, log in normally
  createSendToken(employee, 200, res);
});

// Client login
exports.loginClient = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if client exists && password is correct
  const client = await Client.findOne({ contact_email: email }).select('+password');

  if (!client || !(await client.correctPassword(password, client.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Check if 2FA is enabled
  if (client.twoFactorEnabled) {
    // Verify appropriate verification based on 2FA method
    if (client.twoFactorMethod === 'sms' && (!client.phone || !client.phoneVerified)) {
      return next(new AppError('SMS 2FA is enabled but phone is not verified. Please contact support.', 400));
    }
    if (client.twoFactorMethod === 'email' && !client.emailVerified) {
      return next(new AppError('Email 2FA is enabled but email is not verified. Please contact support.', 400));
    }

    // Rate limiting check
    if (!OTPService.canSendOTP(client.otpLastSent)) {
      return next(new AppError('Please wait before requesting another OTP', 429));
    }

    // Generate and send OTP
    const otp = OTPService.generateOTP();
    client.otpCode = OTPService.hashOTP(otp);
    client.otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000);
    client.otpAttempts = 0;
    client.otpLastSent = Date.now();
    await client.save({ validateBeforeSave: false });

    // Send OTP only via chosen 2FA method
    let otpSent = false;
    let sentMethod = '';
    let maskedDestination = '';

    if (client.twoFactorMethod === 'sms') {
      // Send via SMS only
      const smsResult = await OTPService.sendSMS(client.phone, otp);
      if (smsResult.success || smsResult.devMode) {
        otpSent = true;
        sentMethod = 'SMS';
        maskedDestination = OTPService.maskPhone(client.phone);
      }
    } else if (client.twoFactorMethod === 'email') {
      // Send via Email only
      try {
        await OTPService.sendEmail(client.contact_email, otp);
        otpSent = true;
        sentMethod = 'email';
        maskedDestination = OTPService.maskEmail(client.contact_email);
      } catch (error) {
        // Email send failed
      }
    }
    
    if (!otpSent) {
      // Failed to send OTP, clear it
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Failed to send client login OTP via ${client.twoFactorMethod}`);
      }
      client.otpCode = undefined;
      client.otpExpires = undefined;
      await client.save({ validateBeforeSave: false });
      
      return next(new AppError('Failed to send OTP. Please try again or contact support.', 500));
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Client login OTP sent via: ${sentMethod}`);
    }

    return res.status(200).json({
      status: 'otp_required',
      message: `OTP sent to your ${sentMethod}`,
      email: client.contact_email,
      maskedPhone: client.twoFactorMethod === 'sms' ? OTPService.maskPhone(client.phone) : undefined,
      maskedEmail: client.twoFactorMethod === 'email' ? OTPService.maskEmail(client.contact_email) : undefined,
      expiresIn: process.env.OTP_EXPIRY_MINUTES || 5
    });
  }

  // 4) If 2FA not enabled, log in normally
  createSendToken(client, 200, res);
});

// Logout - client handles token removal from localStorage
exports.logout = catchAsync(async (req, res, next) => {
  // No server-side cleanup needed for token-based auth
  // Frontend removes token from localStorage
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET) ;
  

  // 3) Check if user still exists (Employee or Client)
  let currentUser = await Employee.findById(decoded.id);
  if (!currentUser) currentUser = await Client.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // 4) Check if user changed password after the token was issued
  
  if(currentUser.changedPasswordAfter(decoded.iat)){
    return next(new AppError('User recently changed password! Please log in again.',401));
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
});


exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) { // we had defined req.user in protect middleware
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email (check Employee or Client)
  let user = await Employee.findOne({ email: req.body.email });
  let userType = 'employees';
  
  if (!user) {
    user = await Client.findOne({ contact_email: req.body.email });
    userType = 'clients';
  }
  
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  const emailAddress = user.email || user.contact_email;
  let otpSent = false;
  let emailSent = false;
  let smsError = null;
  let emailError = null;
  let otpEmailSent = false;

  // ========== DUAL PATH: SEND BOTH OTP (via SMS + Email) AND EMAIL RESET LINK ==========

  // 2) Send OTP via SMS and Email if user has phone number
  if (user.phone || emailAddress) {
    // Rate limiting check
    if (!OTPService.canSendOTP(user.otpLastSent)) {
      return next(new AppError('Please wait before requesting another OTP', 429));
    }

    // Generate 6-digit OTP
    const otp = OTPService.generateOTP();
    
    // Store hashed OTP in database
    user.otpCode = OTPService.hashOTP(otp);
    user.otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLastSent = Date.now();

    // Send OTP via both SMS and Email
    const otpResults = await OTPService.sendDualOTP(user.phone, emailAddress, otp);
    
    // Track SMS result
    if (otpResults.sms.success || otpResults.sms.devMode) {
      otpSent = true;
    } else if (user.phone) {
      smsError = otpResults.sms.error || 'Failed to send SMS';
    }
    
    // Track Email OTP result
    if (otpResults.email.success) {
      otpEmailSent = true;
      otpSent = true; // Mark OTP as sent if either method succeeded
    } else if (emailAddress) {
      // Don't set error yet, we'll try sending reset link next
    }
  }

  // 3) Generate and send password reset token via email
  const resetToken = user.createPasswordResetToken();
  
  // Save all changes (OTP and reset token)
  await user.save({ validateBeforeSave: false });

  // Construct reset URL using frontend URL from environment variable
  const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetURL = `${frontendURL}/reset-password/${resetToken}`;
  const message = `Forgot your password? You can reset it using any of these methods:\n\n1. Use the OTP sent to your phone${otpEmailSent ? ' and email' : ''} (if available)\n2. Click this link: ${resetURL}\n\nThe OTP and link are valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.\n\nIf you didn't request a password reset, please ignore this email!`;

  // Send email (always attempt, regardless of phone)
  try {
    await sendEmail({
      email: emailAddress,
      subject: 'Password Reset - Intelliflow',
      message
    });
    emailSent = true;
  } catch (err) {
    emailError = 'Failed to send email';
    if (process.env.NODE_ENV === 'development') {
      console.log('Email error:', err);
    }
  }

  // 4) Prepare response based on what was sent
  const methods = [];
  const messages = [];

  if (otpSent) {
    methods.push('otp');
    messages.push(`OTP sent to ${OTPService.maskPhone(user.phone)}`);
  }

  if (emailSent) {
    methods.push('email');
    messages.push(`Reset link sent to ${emailAddress}`);
  }

  // If nothing was sent successfully, return error
  if (!otpSent && !emailSent) {
    // Clear the tokens since we couldn't deliver them
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('Failed to send password reset. Please try again later.', 500));
  }

  // Success response
  const response = {
    status: 'success',
    methods: methods,
    message: messages.join(' and ')
  };

  if (otpSent) {
    response.maskedPhone = OTPService.maskPhone(user.phone);
    response.otpExpiresIn = process.env.OTP_EXPIRY_MINUTES || 5;
  }

  // In development mode, include additional debug info
  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      otpSent,
      emailSent,
      smsError,
      emailError,
      resetURL: emailSent ? resetURL : undefined
    };
  }

  res.status(200).json(response);
});


exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token (check Employee, Client, then User)
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  
  let user = await Employee.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    user = await Client.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
  }
  
  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
 

});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection (check Employee or Client based on req.user)
  let user = await Employee.findOne({ _id: req.user.id }).select('+password');
  
  if (!user) {
    user = await Client.findOne({ _id: req.user.id }).select('+password');
  }
  
  // we use .select('+password') because in models we have set select: false for password field
  // which means by default it will not be selected so to select it we have to use + sign
  if(!user){
    return next(new AppError('There is no user with that email address.', 404));
  }
  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // findByIdAndUpdate will NOT work as intended!
  // we have to use user.save() because we have to run the validators and the pre save middleware which is not possible with findByIdAndUpdate
  // also we have to make sure that the passwordConfirm field is not saved in the database so we have set it to undefined in the pre save middleware in the model
  // also we have to make sure that the password is hashed before saving it to the database which is also done in the pre save middleware in the model
  // so we have to use user.save() instead of findByIdAndUpdate
  // 4) Log user in, send JWT
  createSendToken(user, 200, res);

});

// Verify OTP for password reset
exports.verifyResetOTP = catchAsync(async (req, res, next) => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    return next(new AppError('Please provide email and OTP code', 400));
  }

  // 1) Find user by email (check Employee or Client)
  let user = await Employee.findOne({ email }).select('+otpCode');
  let userType = 'employees';
  
  if (!user) {
    user = await Client.findOne({ contact_email: email }).select('+otpCode');
    userType = 'clients';
  }

  if (!user) {
    return next(new AppError('Invalid request', 400));
  }

  // 2) Check if OTP exists and hasn't expired
  if (!user.otpCode || !user.otpExpires) {
    return next(new AppError('No OTP request found. Please request a new OTP.', 400));
  }

  if (OTPService.isExpired(user.otpExpires)) {
    // Clear expired OTP
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('OTP has expired. Please request a new one.', 400));
  }

  // 3) Check attempts (max 3)
  if (user.otpAttempts >= 3) {
    // Clear OTP after too many attempts
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('Too many invalid attempts. Please request a new OTP.', 429));
  }

  // 4) Verify OTP
  const isValid = OTPService.verifyOTP(otpCode, user.otpCode, user.otpExpires, user.otpAttempts);
  
  if (!isValid.valid) {
    if (isValid.reason === 'invalid') {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });
      
      const attemptsLeft = 3 - user.otpAttempts;
      return next(new AppError(`Invalid OTP. ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining.`, 401));
    } else if (isValid.reason === 'expired') {
      user.otpCode = undefined;
      user.otpExpires = undefined;
      user.otpAttempts = 0;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('OTP has expired. Please request a new one.', 400));
    } else if (isValid.reason === 'attempts') {
      user.otpCode = undefined;
      user.otpExpires = undefined;
      user.otpAttempts = 0;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Too many invalid attempts. Please request a new OTP.', 429));
    }
    return next(new AppError('Invalid OTP', 401));
  }

  // 5) OTP is valid - generate password reset token
  const resetToken = user.createPasswordResetToken();
  
  // Clear OTP fields
  user.otpCode = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  
  await user.save({ validateBeforeSave: false });

  // 6) Return reset token to frontend
  res.status(200).json({
    status: 'success',
    message: 'OTP verified successfully',
    resetToken,
    userType // Frontend needs this to know which endpoint to call for password reset
  });
});

// Verify OTP for 2FA login
exports.verifyLoginOTP = catchAsync(async (req, res, next) => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    return next(new AppError('Please provide email and OTP code', 400));
  }

  // 1) Find user by email (check Employee or Client)
  let user = await Employee.findOne({ email }).select('+otpCode');
  
  if (!user) {
    user = await Client.findOne({ contact_email: email }).select('+otpCode');
  }

  if (!user) {
    return next(new AppError('Invalid request', 400));
  }

  // 2) Check if OTP exists and hasn't expired
  if (!user.otpCode || !user.otpExpires) {
    return next(new AppError('No OTP request found. Please login again.', 400));
  }

  if (OTPService.isExpired(user.otpExpires)) {
    // Clear expired OTP
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('OTP has expired. Please login again.', 400));
  }

  // 3) Check attempts (max 3)
  if (user.otpAttempts >= 3) {
    // Clear OTP after too many attempts
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('Too many invalid attempts. Please login again.', 429));
  }

  // 4) Verify OTP
  const isValid = OTPService.verifyOTP(otpCode, user.otpCode, user.otpExpires, user.otpAttempts);
  
  if (!isValid.valid) {
    if (isValid.reason === 'invalid') {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });
      
      const attemptsLeft = 3 - user.otpAttempts;
      return next(new AppError(`Invalid OTP. ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining.`, 401));
    } else if (isValid.reason === 'expired') {
      user.otpCode = undefined;
      user.otpExpires = undefined;
      user.otpAttempts = 0;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('OTP has expired. Please login again.', 400));
    } else if (isValid.reason === 'attempts') {
      user.otpCode = undefined;
      user.otpExpires = undefined;
      user.otpAttempts = 0;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Too many invalid attempts. Please login again.', 429));
    }
    return next(new AppError('Invalid OTP', 401));
  }

  // 5) OTP is valid - clear OTP and log user in
  user.otpCode = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  await user.save({ validateBeforeSave: false });

  // 6) Log the user in, send JWT
  createSendToken(user, 200, res);
});
