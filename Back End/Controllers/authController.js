const jwt = require('jsonwebtoken');
const Employee = require('./../models/employeeModel');
const Client = require('./../models/clientModel');
const catchAsync = require('./../Utilities/catchAsync');
const AppError = require('./../Utilities/appError');
const {promisify} = require('util');
const sendEmail = require('./../Utilities/email');
const crypto = require('crypto');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    // converting days to milliseconds
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true // so that cookie cannot be accessed or modified by the browser
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; 
  // this will only work on https

  res.cookie('jwt', token, cookieOptions);

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
  const newEmployee = await Employee.create({
    employee_id: req.body.employee_id,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    department: req.body.department,
    skills: req.body.skills,
    availability: req.body.availability,
    phone: req.body.phone
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

  // 3) If everything ok, send token to client
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

  // 3) If everything ok, send token to client
  createSendToken(client, 200, res);
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

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/${userType}/resetPassword/${resetToken}`;

  const emailAddress = user.email || user.contact_email;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  // In development, return token directly; in production, send email
  if (process.env.NODE_ENV === 'development') {
    return res.status(200).json({
      status: 'success',
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
