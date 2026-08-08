const Employee = require('../models/employeeModel');
const Task = require('../models/taskModel');
const catchAsync = require('../Utilities/catchAsync');
const AppError = require('../Utilities/appError');
const OTPService = require('../Utilities/otp');
const { normalizePhone, normalizeDept, expandDeptAliases } = require('../Utilities/controllerUtils');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllEmployees = catchAsync(async (req, res, next) => {

  const filter = {};

  if (req.query.availability) {
    filter.availability = req.query.availability;
  }

  if (req.query.q) {
    const q = String(req.query.q).trim();
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
  }

  const allEmployees = await Employee.find(filter);

  let employees = allEmployees;
  if (req.query.departments) {
    const list = String(req.query.departments)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const normalizedTerms = list.flatMap(expandDeptAliases);
    const uniqueTerms = Array.from(new Set(normalizedTerms));

    employees = allEmployees.filter(emp => {
      const dept = emp.department || '';
      if (!dept) return false;
      const empKey = normalizeDept(dept);
      if (uniqueTerms.includes(empKey)) return true;
      for (const term of uniqueTerms) {
        if (term && (term.includes(empKey) || empKey.includes(term))) return true;
      }
      return false;
    });
  }

  res.status(200).json({
    status: 'success',
    results: employees.length,
    data: {
      employees
    }
  });
});

exports.getEmployee = catchAsync(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    return next(new AppError('No employee found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      employee
    }
  });
});

exports.createEmployee = catchAsync(async (req, res, next) => {
  const newEmployee = await Employee.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      employee: newEmployee
    }
  });
});

exports.updateEmployee = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'name',
    'email',
    'role',
    'department',
    'skills',
    'availability',
    'phone',
    'phoneVerified',
    'isApprover',
    'approvesDepartments'
  );
  const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true
  });
  if (!updatedEmployee) {
    return next(new AppError('No employee found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      employee: updatedEmployee
    }
  });
});

exports.deleteEmployee = catchAsync(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    return next(new AppError('No employee found with that ID', 404));
  }

  const manager = await Employee.findById(req.user.id);
  const managerDepartment = (manager.approvesDepartments && manager.approvesDepartments.length > 0) 
    ? manager.approvesDepartments[0] 
    : manager.department;
  
  if (employee.department !== managerDepartment) {
    return next(new AppError('You can only delete employees from your own department', 403));
  }

  const pendingTasks = await Task.find({
    $or: [
      { assignedTo: employee.employee_id },
      { assigned_to: employee.employee_id }
    ],
    status: { $nin: ['Completed', 'Done'] }
  });

  if (pendingTasks.length > 0) {
    return next(new AppError(`Cannot delete employee with ${pendingTasks.length} pending task(s). Please reassign or complete these tasks first.`, 400));
  }

  await Employee.findByIdAndDelete(req.params.id);

  await Task.updateMany(
    {
      $or: [
        { assignedTo: employee.employee_id },
        { assigned_to: employee.employee_id }
      ]
    },
    { 
      $pull: { 
        assignedTo: employee.employee_id,
        assigned_to: employee.employee_id
      }
    }
  );

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
  }
  
  const filteredBody = filterObj(req.body, 'name', 'availability', 'phone', 'twoFactorEnabled', 'twoFactorMethod');
  
  if (filteredBody.phone) {
    filteredBody.phone = normalizePhone(filteredBody.phone);
  }
  
  if (filteredBody.phone) {
    const employee = await Employee.findById(req.user.id);
    
    if (employee.phone !== filteredBody.phone) {
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
    const employee = await Employee.findById(req.user.id);
    const twoFactorMethod = req.body.twoFactorMethod || employee.twoFactorMethod;
    
    if (twoFactorMethod === 'sms') {
      const phoneToUse = filteredBody.phone || employee.phone;
      if (!phoneToUse) {
        return next(new AppError('Please add a phone number before enabling SMS 2FA', 400));
      }
      
      if (filteredBody.phone && filteredBody.phone !== employee.phone) {
        return next(new AppError('Please verify your new phone number before enabling SMS 2FA', 400));
      }
      
      if (!employee.phoneVerified) {
        return next(new AppError('Please verify your phone number before enabling SMS 2FA', 400));
      }
    } else if (twoFactorMethod === 'email') {
      if (!employee.emailVerified) {
        return next(new AppError('Please verify your email before enabling email 2FA', 400));
      }
    }
  }
  
  const updatedEmployee = await Employee.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      employee: updatedEmployee
    }
  });
});

exports.sendPhoneVerificationOTP = catchAsync(async (req, res, next) => {
  const employee = await Employee.findById(req.user.id);
  
  if (!employee.phone) {
    return next(new AppError('Please add a phone number first', 400));
  }

  if (!OTPService.canSendOTP(employee.otpLastSent)) {
    return next(new AppError('Please wait before requesting another OTP', 429));
  }

  const otp = OTPService.generateOTP();
  
  employee.otpCode = OTPService.hashOTP(otp);
  employee.otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000);
  employee.otpAttempts = 0;
  employee.otpLastSent = Date.now();
  employee.otpPhone = employee.phone; // Store phone number OTP was sent to
  await employee.save({ validateBeforeSave: false });

  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 Sending phone verification OTP to ${employee.phone}...`);
  }
  const smsResult = await OTPService.sendSMS(employee.phone, otp);
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
    maskedPhone: OTPService.maskPhone(employee.phone)
  });
});

exports.verifyPhone = catchAsync(async (req, res, next) => {
  const { otp } = req.body;

  if (!otp) {
    return next(new AppError('Please provide the verification code', 400));
  }

  const employee = await Employee.findById(req.user.id).select('+otpCode +otpPhone');

  if (employee.otpPhone && employee.phone !== employee.otpPhone) {
    employee.otpCode = undefined;
    employee.otpExpires = undefined;
    employee.otpAttempts = 0;
    employee.otpPhone = undefined;
    await employee.save({ validateBeforeSave: false });
    return next(new AppError('Phone number has changed. Please request a new verification code for your current number.', 400));
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📱 Phone Verification Debug:');
    console.log('Provided OTP:', otp);
    console.log('Stored OTP Hash:', employee.otpCode);
    console.log('OTP Expires:', employee.otpExpires);
    console.log('OTP Attempts:', employee.otpAttempts);
  }

  const isValid = OTPService.verifyOTP(
    otp,
    employee.otpCode,
    employee.otpExpires,
    employee.otpAttempts
  );
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Validation Result:', isValid);
  }

  if (!isValid.valid) {
    if (isValid.reason === 'expired') {
      employee.otpCode = undefined;
      employee.otpExpires = undefined;
      employee.otpAttempts = 0;
      await employee.save({ validateBeforeSave: false });
      return next(new AppError('Verification code has expired. Please request a new one.', 400));
    } else if (isValid.reason === 'attempts') {
      employee.otpCode = undefined;
      employee.otpExpires = undefined;
      employee.otpAttempts = 0;
      await employee.save({ validateBeforeSave: false });
      return next(new AppError('Too many incorrect attempts. Please request a new code.', 400));
    } else {
      employee.otpAttempts += 1;
      await employee.save({ validateBeforeSave: false });
      return next(new AppError('Invalid verification code', 400));
    }
  }

  employee.phoneVerified = true;
  employee.otpCode = undefined;
  employee.otpExpires = undefined;
  employee.otpAttempts = 0;
  await employee.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Phone number verified successfully'
  });
});

exports.sendEmailVerificationOTP = catchAsync(async (req, res, next) => {
  const employee = await Employee.findById(req.user.id);
  
  if (!employee.email) {
    return next(new AppError('No email address found', 400));
  }

  if (!OTPService.canSendOTP(employee.otpLastSent)) {
    return next(new AppError('Please wait before requesting another OTP', 429));
  }

  const otp = OTPService.generateOTP();
  
  employee.otpCode = OTPService.hashOTP(otp);
  employee.otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000);
  employee.otpAttempts = 0;
  employee.otpLastSent = Date.now();
  await employee.save({ validateBeforeSave: false });

  if (process.env.NODE_ENV === 'development') {
    console.log(`📧 Sending email verification OTP to ${employee.email}...`);
  }
  
  try {
    await OTPService.sendEmail(employee.email, otp);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Email verification OTP sent successfully');
    }

    res.status(200).json({
      status: 'success',
      message: 'Verification code sent to your email',
      maskedEmail: OTPService.maskEmail(employee.email)
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

  const employee = await Employee.findById(req.user.id).select('+otpCode');

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email Verification Debug:');
    console.log('Provided OTP:', otp);
    console.log('Stored OTP Hash:', employee.otpCode);
    console.log('OTP Expires:', employee.otpExpires);
    console.log('OTP Attempts:', employee.otpAttempts);
  }

  const isValid = OTPService.verifyOTP(
    otp,
    employee.otpCode,
    employee.otpExpires,
    employee.otpAttempts
  );
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Validation Result:', isValid);
  }

  if (!isValid.valid) {
    if (isValid.reason === 'expired') {
      employee.otpCode = undefined;
      employee.otpExpires = undefined;
      employee.otpAttempts = 0;
      await employee.save({ validateBeforeSave: false });
      return next(new AppError('Verification code has expired. Please request a new one.', 400));
    } else if (isValid.reason === 'attempts') {
      employee.otpCode = undefined;
      employee.otpExpires = undefined;
      employee.otpAttempts = 0;
      await employee.save({ validateBeforeSave: false });
      return next(new AppError('Too many incorrect attempts. Please request a new code.', 400));
    } else {
      employee.otpAttempts += 1;
      await employee.save({ validateBeforeSave: false });
      return next(new AppError('Invalid verification code', 400));
    }
  }

  employee.emailVerified = true;
  employee.otpCode = undefined;
  employee.otpExpires = undefined;
  employee.otpAttempts = 0;
  await employee.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully'
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const employee = await Employee.findById(req.user.id);
  if (!employee) {
    return next(new AppError('Employee not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      employee
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await Employee.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getMyDashboard = catchAsync(async (req, res, next) => {
  const Task = require('../models/taskModel');
  const Project = require('../models/projectModel');

  const employee = await Employee.findById(req.user.id);
  if (!employee) {
    return next(new AppError('Employee not found', 404));
  }

  const tasks = await Task.find({ assigned_to: employee.employee_id });
  
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'To Do').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;

  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

  const recentTasks = await Task.find({ assigned_to: employee.employee_id })
    .sort('-createdAt')
    .limit(10)
    .populate('project', 'project_title client_name')
    .select('task_name status priority sprint createdAt');

  const projectIds = [...new Set(tasks.map(t => t.project).filter(p => p))];
  const projects = await Project.find({ _id: { $in: projectIds } })
    .select('project_title status client_name');

  res.status(200).json({
    status: 'success',
    data: {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      completionRate: parseFloat(completionRate),
      recentTasks,
      projects
    }
  });
});

exports.getMyProjects = catchAsync(async (req, res, next) => {
  const Task = require('../models/taskModel');
  const Project = require('../models/projectModel');

  const me = await Employee.findById(req.user.id);
  if (!me) return next(new AppError('Employee not found', 404));

  const tasks = await Task.find({ assigned_to: me.employee_id }).select('project');
  const projectIds = [...new Set(tasks.map(t => String(t.project)).filter(Boolean))];

  if (projectIds.length === 0) {
    return res.status(200).json({ status: 'success', results: 0, data: { projects: [] } });
  }

  const projects = await Project.find({ _id: { $in: projectIds } })
    .select('_id project_title status activeSprintNumber totalSprints requirements createdAt updatedAt')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: { projects }
  });
});

exports.getMyProjectDetails = catchAsync(async (req, res, next) => {
  const Task = require('../models/taskModel');
  const Project = require('../models/projectModel');

  const me = await Employee.findById(req.user.id);
  if (!me) return next(new AppError('Employee not found', 404));

  const { projectId } = req.params;

  const hasAccess = await Task.exists({ project: projectId, assigned_to: me.employee_id });
  if (!hasAccess) return next(new AppError('You are not authorized to view this project', 403));

  const project = await Project.findById(projectId)
    .select('_id project_title requirements status activeSprintNumber totalSprints createdAt updatedAt');
  if (!project) return next(new AppError('No project found with that ID', 404));

  const allTasks = await Task.find({ project: project._id })
    .select('_id task_id task_name status sprint sprint_number priority description')
    .sort('sprint_number task_id');

  const tasks = allTasks.filter(t => {
    const sn = typeof t.sprint_number === 'number'
      ? t.sprint_number
      : (typeof t.sprint === 'string'
          ? (t.sprint.match(/(\d+)/) ? parseInt(t.sprint.match(/(\d+)/)[1], 10) : 0)
          : (typeof t.sprint === 'number' ? t.sprint : 0));
    return sn > 0;
  });

  const sprintsMap = new Map();
  for (const t of tasks) {
    let sn = 0;
    if (typeof t.sprint_number === 'number') sn = t.sprint_number;
    else if (typeof t.sprint === 'string') {
      const m = t.sprint.match(/(\d+)/);
      sn = m ? parseInt(m[1], 10) : 0;
    } else if (typeof t.sprint === 'number') sn = t.sprint;
    if (sn <= 0) continue;
    if (!sprintsMap.has(sn)) {
      sprintsMap.set(sn, { sprintNumber: sn, total: 0, completed: 0, inProgress: 0, pending: 0 });
    }
    const entry = sprintsMap.get(sn);
    entry.total += 1;
    if (t.status === 'Done' || t.status === 'Completed') entry.completed += 1;
    else if (t.status === 'In Progress') entry.inProgress += 1;
    else entry.pending += 1;
  }

  const workflow = {
    totalSprints: project.totalSprints || 0,
    activeSprintNumber: project.activeSprintNumber || 0,
    sprints: Array.from(sprintsMap.values()).sort((a, b) => a.sprintNumber - b.sprintNumber)
  };

  res.status(200).json({
    status: 'success',
    data: {
      project,
      workflow,
      tasks
    }
  });
});
