const Client = require('../models/clientModel');
const catchAsync = require('../Utilities/catchAsync');
const AppError = require('../Utilities/appError');
const OTPService = require('../Utilities/otp');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllClients = catchAsync(async (req, res, next) => {
  const clients = await Client.find();
  res.status(200).json({
    status: 'success',
    results: clients.length,
    data: {
      clients
    }
  });
});

exports.getClient = catchAsync(async (req, res, next) => {
  const client = await Client.findById(req.params.id);
  if (!client) {
    return next(new AppError('No client found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      client
    }
  });
});

exports.createClient = catchAsync(async (req, res, next) => {
  const newClient = await Client.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      client: newClient
    }
  });
});

exports.updateClient = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, 'client_name', 'contact_email');
  const updatedClient = await Client.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true
  });
  if (!updatedClient) {
    return next(new AppError('No client found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      client: updatedClient
    }
  });
});

exports.deleteClient = catchAsync(async (req, res, next) => {
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) {
    return next(new AppError('No client found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
  }
  
  const filteredBody = filterObj(req.body, 'client_name', 'contact_email', 'phone', 'twoFactorEnabled', 'twoFactorMethod');
  
  // If phone is being updated, reset phoneVerified and disable 2FA
  if (filteredBody.phone) {
    const client = await Client.findById(req.user.id);
    if (client.phone !== filteredBody.phone) {
      filteredBody.phoneVerified = false;
      filteredBody.twoFactorEnabled = false; // Disable 2FA until new number is verified
      // Clear any existing OTP data
      filteredBody.otpCode = undefined;
      filteredBody.otpExpires = undefined;
      filteredBody.otpAttempts = 0;
      filteredBody.otpLastSent = undefined;
      filteredBody.otpPhone = undefined; // Clear phone OTP was sent to
    }
  }
  
  // Validate 2FA requirements
  if (req.body.twoFactorEnabled === true) {
    const client = await Client.findById(req.user.id);
    
    // Check if phone exists (either in DB or being updated)
    const phoneToUse = filteredBody.phone || client.phone;
    if (!phoneToUse) {
      return next(new AppError('Please add a phone number before enabling 2FA', 400));
    }
    
    // If phone is being changed, require verification of new number
    if (filteredBody.phone && filteredBody.phone !== client.phone) {
      return next(new AppError('Please verify your new phone number before enabling 2FA', 400));
    }
    
    // Always require phone verification for 2FA
    if (!client.phoneVerified) {
      return next(new AppError('Please verify your phone number before enabling 2FA', 400));
    }
  }
  
  const updatedClient = await Client.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      client: updatedClient
    }
  });
});

exports.sendPhoneVerificationOTP = catchAsync(async (req, res, next) => {
  const client = await Client.findById(req.user.id);
  
  if (!client.phone) {
    return next(new AppError('Please add a phone number first', 400));
  }

  // Rate limiting check
  if (!OTPService.canSendOTP(client.otpLastSent)) {
    return next(new AppError('Please wait before requesting another OTP', 429));
  }

  // Generate 6-digit OTP
  const otp = OTPService.generateOTP();
  
  // Store hashed OTP in database along with the phone number it was sent to
  client.otpCode = OTPService.hashOTP(otp);
  client.otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000);
  client.otpAttempts = 0;
  client.otpLastSent = Date.now();
  client.otpPhone = client.phone; // Store phone number OTP was sent to
  await client.save({ validateBeforeSave: false });

  // Send OTP via SMS
  console.log(`📱 Sending phone verification OTP to ${client.phone}...`);
  const smsResult = await OTPService.sendSMS(client.phone, otp);
  console.log('SMS Result:', smsResult);
  
  if (!smsResult.success && !smsResult.devMode) {
    console.error('❌ Failed to send phone verification OTP');
    return next(new AppError('Failed to send verification code. Please try again.', 500));
  }
  
  console.log('✅ Phone verification OTP sent successfully');

  res.status(200).json({
    status: 'success',
    message: smsResult.devMode 
      ? `Development mode: OTP is ${otp}` 
      : 'Verification code sent to your phone',
    devMode: smsResult.devMode,
    maskedPhone: OTPService.maskPhone(client.phone)
  });
});

exports.verifyPhone = catchAsync(async (req, res, next) => {
  const { otp } = req.body;

  if (!otp) {
    return next(new AppError('Please provide the verification code', 400));
  }

  const client = await Client.findById(req.user.id).select('+otpCode +otpPhone');

  // Check if phone number has changed since OTP was sent
  if (client.otpPhone && client.phone !== client.otpPhone) {
    // Phone changed - invalidate old OTP
    client.otpCode = undefined;
    client.otpExpires = undefined;
    client.otpAttempts = 0;
    client.otpPhone = undefined;
    await client.save({ validateBeforeSave: false });
    return next(new AppError('Phone number has changed. Please request a new verification code for your current number.', 400));
  }

  // Verify OTP
  const isValid = OTPService.verifyOTP(
    otp,
    client.otpCode,
    client.otpExpires,
    client.otpAttempts
  );

  if (!isValid.valid) {
    if (isValid.reason === 'expired') {
      client.otpCode = undefined;
      client.otpExpires = undefined;
      client.otpAttempts = 0;
      await client.save({ validateBeforeSave: false });
      return next(new AppError('Verification code has expired. Please request a new one.', 400));
    } else if (isValid.reason === 'attempts') {
      client.otpCode = undefined;
      client.otpExpires = undefined;
      client.otpAttempts = 0;
      await client.save({ validateBeforeSave: false });
      return next(new AppError('Too many incorrect attempts. Please request a new code.', 400));
    } else {
      client.otpAttempts += 1;
      await client.save({ validateBeforeSave: false });
      return next(new AppError('Invalid verification code', 400));
    }
  }

  // OTP is valid - mark phone as verified
  client.phoneVerified = true;
  client.otpCode = undefined;
  client.otpExpires = undefined;
  client.otpAttempts = 0;
  await client.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Phone number verified successfully'
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const client = await Client.findById(req.user.id);
  if (!client) {
    return next(new AppError('Client not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      client
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await Client.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get dashboard data for logged-in client
exports.getMyDashboard = catchAsync(async (req, res, next) => {
  const Project = require('../models/projectModel');
  const Request = require('../models/requestModel');

  // Get client's projects
  const projects = await Project.find({ client: req.user.id });
  
  // Count projects by status
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const pendingProjects = projects.filter(p => p.status === 'Pending').length;

  // Get recent projects (last 5)
  const recentProjects = await Project.find({ client: req.user.id })
    .sort('-createdAt')
    .limit(5)
    .select('project_title status category createdAt');

  // Get client's requests
  const requests = await Request.find({ client: req.user.id });
  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'under_review').length;

  res.status(200).json({
    status: 'success',
    data: {
      totalProjects,
      activeProjects,
      completedProjects,
      pendingProjects,
      pendingRequests,
      recentProjects
    }
  });
});
