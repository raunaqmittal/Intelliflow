const Client = require('../models/clientModel');
const catchAsync = require('../Utilities/catchAsync');
const AppError = require('../Utilities/appError');

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
  const filteredBody = filterObj(req.body, 'client_name', 'contact_email');
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
