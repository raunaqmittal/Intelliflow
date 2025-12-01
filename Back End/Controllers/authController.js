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

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // No cookies - using Authorization header only (immune to CSRF attacks)
  // Frontend stores token in localStorage and sends via Authorization header

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
  // Security: Only allow role assignment if user is a manager
  let assignedRole = 'employee'; // Default role
  
  if (req.body.role && req.user && req.user.role === 'manager') {
    // Only managers can assign roles during signup
    assignedRole = req.body.role;
  }
  
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
    phone: req.body.phone,
    phoneVerified: req.body.phone ? true : false // Auto-enable OTP if phone provided
  });
  createSendToken(newEmployee, 201, res);
});

// Client signup
exports.signupClient = catchAsync(async (req, res, next) => {
  const newClient = await Client.create({
    client_id: req.body.client_id,
    client_name: req.body.client_name,
    contact_email: req.body.contact_email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    phone: req.body.phone,
    phoneVerified: req.body.phone ? true : false, // Auto-enable OTP if phone provided
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
  if (employee.twoFactorEnabled && employee.phone && employee.phoneVerified) {
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

    // Send OTP via SMS
    console.log(`📱 Sending login OTP to ${employee.phone}...`);
    const smsResult = await OTPService.sendSMS(employee.phone, otp);
    console.log('SMS Result:', smsResult);
    
    if (!smsResult.success && !smsResult.devMode) {
      // SMS failed, clear OTP
      console.error('❌ Failed to send login OTP');
      employee.otpCode = undefined;
      employee.otpExpires = undefined;
      await employee.save({ validateBeforeSave: false });
      
      return next(new AppError('Failed to send OTP. Please try again or contact support.', 500));
    }
    
    console.log('✅ Login OTP sent successfully');

    return res.status(200).json({
      status: 'otp_required',
      message: 'OTP sent to your registered phone number',
      email: employee.email,
      maskedPhone: OTPService.maskPhone(employee.phone),
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
  if (client.twoFactorEnabled && client.phone && client.phoneVerified) {
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

    // Send OTP via SMS
    console.log(`📱 Sending login OTP to ${client.phone}...`);
    const smsResult = await OTPService.sendSMS(client.phone, otp);
    console.log('SMS Result:', smsResult);
    
    if (!smsResult.success && !smsResult.devMode) {
      // SMS failed, clear OTP
      console.error('❌ Failed to send login OTP');
      client.otpCode = undefined;
      client.otpExpires = undefined;
      await client.save({ validateBeforeSave: false });
      
      return next(new AppError('Failed to send OTP. Please try again or contact support.', 500));
    }
    
    console.log('✅ Login OTP sent successfully');

    return res.status(200).json({
      status: 'otp_required',
      message: 'OTP sent to your registered phone number',
      email: client.contact_email,
      maskedPhone: OTPService.maskPhone(client.phone),
      expiresIn: process.env.OTP_EXPIRY_MINUTES || 5
    });
  }

  // 4) If 2FA not enabled, log in normally
  createSendToken(client, 200, res);
});

// Logout - client-side will clear localStorage
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

  // 2) Check if user has a phone number (OTP PATH)
  // Note: We don't require phoneVerified here because OTP verification itself proves phone ownership
  if (user.phone) {
    // ========== OTP PATH (SECURE - OTP PROVES PHONE OWNERSHIP) ==========
    
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
    await user.save({ validateBeforeSave: false });

    // Send OTP via SMS
    const smsResult = await OTPService.sendSMS(user.phone, otp);
    
    if (!smsResult.success && !smsResult.devMode) {
      // SMS failed, clear OTP and fallback to email
      user.otpCode = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      return next(new AppError('Failed to send OTP. Please try again or contact support.', 500));
    }

    return res.status(200).json({
      status: 'success',
      method: 'otp',
      message: 'OTP sent to your registered phone number',
      maskedPhone: OTPService.maskPhone(user.phone),
      expiresIn: process.env.OTP_EXPIRY_MINUTES || 5
    });
  } else {
    // ========== EMAIL PATH (LEGACY - FOR USERS WITHOUT VERIFIED PHONES) ==========
    
    // Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/${userType}/resetPassword/${resetToken}`;

    const emailAddress = user.email || user.contact_email;
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    // In development, return token directly; in production, send email
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        status: 'success',
        method: 'email',
        message: 'Token generated! (Development mode - token included in response)',
        resetToken,
        resetURL
      });
    }

    try {
      await sendEmail({
        email: emailAddress,
        subject: 'Your password reset token (valid for 10 min)',
        message
      });

      res.status(200).json({
        status: 'success',
        method: 'email',
        message: 'Token sent to email!'
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError('There was an error sending the email. Try again later!', 500)
      );
    }
  }
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
