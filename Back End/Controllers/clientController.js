const Client = require('../models/clientModel');
const catchAsync = require('../Utilities/catchAsync');
const AppError = require('../Utilities/appError');
const OTPService = require('../Utilities/otp');
const { normalizePhone } = require('../Utilities/controllerUtils');

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
  
  const filteredBody = filterObj(req.body, 'client_name', 'phone', 'twoFactorEnabled', 'twoFactorMethod');
  
  if (filteredBody.phone) {
    filteredBody.phone = normalizePhone(filteredBody.phone);
  }
  
  if (filteredBody.phone) {
    const client = await Client.findById(req.user.id);
    if (client.phone !== filteredBody.phone) {
      filteredBody.phoneVerified = false;
      filteredBody.twoFactorEnabled = false; // Disable 2FA until new number is verified
      filteredBody.otpCode = undefined;
      filteredBody.otpExpires = undefined;
      filteredBody.otpAttempts = 0;
      filteredBody.otpLastSent = undefined;
      filteredBody.otpPhone = undefined; // Clear phone OTP was sent to
    }
  }
  
  if (req.body.twoFactorEnabled === true) {
    const client = await Client.findById(req.user.id);
    const twoFactorMethod = req.body.twoFactorMethod || client.twoFactorMethod;
    
    if (twoFactorMethod === 'sms') {
      const phoneToUse = filteredBody.phone || client.phone;
      if (!phoneToUse) {
        return next(new AppError('Please add a phone number before enabling SMS 2FA', 400));
      }
      
      if (filteredBody.phone && filteredBody.phone !== client.phone) {
        return next(new AppError('Please verify your new phone number before enabling SMS 2FA', 400));
      }
      
      if (!client.phoneVerified) {
        return next(new AppError('Please verify your phone number before enabling SMS 2FA', 400));
      }
    } else if (twoFactorMethod === 'email') {
      if (!client.emailVerified) {
        return next(new AppError('Please verify your email before enabling email 2FA', 400));
      }
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

  if (!OTPService.canSendOTP(client.otpLastSent)) {
    return next(new AppError('Please wait before requesting another OTP', 429));
  }

  const otp = OTPService.generateOTP();
  
  client.otpCode = OTPService.hashOTP(otp);
  client.otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000);
  client.otpAttempts = 0;
  client.otpLastSent = Date.now();
  client.otpPhone = client.phone; // Store phone number OTP was sent to
  await client.save({ validateBeforeSave: false });

  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 Sending phone verification OTP to ${client.phone}...`);
  }
  const smsResult = await OTPService.sendSMS(client.phone, otp);
  if (process.env.NODE_ENV === 'development') {
    console.log('SMS Result:', smsResult);
  }
  
  if (!smsResult.success && !smsResult.devMode) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Failed to send phone verification OTP');
    }
    return next(new AppError('Failed to send verification code. Please try again.', 500));
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Phone verification OTP sent successfully');
  }

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

  if (client.otpPhone && client.phone !== client.otpPhone) {
    client.otpCode = undefined;
    client.otpExpires = undefined;
    client.otpAttempts = 0;
    client.otpPhone = undefined;
    await client.save({ validateBeforeSave: false });
    return next(new AppError('Phone number has changed. Please request a new verification code for your current number.', 400));
  }

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

exports.sendEmailVerificationOTP = catchAsync(async (req, res, next) => {
  const client = await Client.findById(req.user.id);
  
  if (!client.contact_email) {
    return next(new AppError('No email address found', 400));
  }

  if (!OTPService.canSendOTP(client.otpLastSent)) {
    return next(new AppError('Please wait before requesting another OTP', 429));
  }

  const otp = OTPService.generateOTP();
  
  client.otpCode = OTPService.hashOTP(otp);
  client.otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000);
  client.otpAttempts = 0;
  client.otpLastSent = Date.now();
  await client.save({ validateBeforeSave: false });

  if (process.env.NODE_ENV === 'development') {
    console.log(`📧 Sending email verification OTP to ${client.contact_email}...`);
  }
  
  try {
    await OTPService.sendEmail(client.contact_email, otp);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Email verification OTP sent successfully');
    }

    res.status(200).json({
      status: 'success',
      message: 'Verification code sent to your email',
      maskedEmail: OTPService.maskEmail(client.contact_email)
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Failed to send email verification OTP:', error);
    }
    return next(new AppError('Failed to send verification code. Please try again.', 500));
  }
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { otp } = req.body;

  if (!otp) {
    return next(new AppError('Please provide the verification code', 400));
  }

  const client = await Client.findById(req.user.id).select('+otpCode');

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email Verification Debug:');
    console.log('Provided OTP:', otp);
    console.log('Stored OTP Hash:', client.otpCode);
    console.log('OTP Expires:', client.otpExpires);
    console.log('OTP Attempts:', client.otpAttempts);
  }

  const isValid = OTPService.verifyOTP(
    otp,
    client.otpCode,
    client.otpExpires,
    client.otpAttempts
  );
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Validation Result:', isValid);
  }

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

  client.emailVerified = true;
  client.otpCode = undefined;
  client.otpExpires = undefined;
  client.otpAttempts = 0;
  await client.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully'
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

exports.getMyDashboard = catchAsync(async (req, res, next) => {
  const Project = require('../models/projectModel');
  const Request = require('../models/requestModel');

  const projects = await Project.find({ client: req.user.id });
  
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const pendingProjects = projects.filter(p => p.status === 'Pending').length;

  const recentProjects = await Project.find({ client: req.user.id })
    .sort('-createdAt')
    .limit(5)
    .select('project_title status category createdAt');

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
