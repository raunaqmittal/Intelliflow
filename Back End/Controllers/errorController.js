const AppError = require('../Utilities/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
  
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  const message = `Duplicate field values: ${value}. Please use another value!`
  
  return new AppError(message,400);
}

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid Input Data. ${errors.join('. ')}`;
  return new AppError(message, 400);
}

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    stack: err.stack,
    message: err.message
  });
}


const sendErrorProd = (err, res) => {
  if(err.isOperational){
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
}else{
  // Programming or other unknown error: don't leak error details
  // Only log in development to avoid performance issues in production
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥', err);
  }
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!'
  });
}
}


module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Create hard copy of error
    let error = JSON.parse(JSON.stringify(err));
    error.name = err.name; // Copy the name explicitly
    error.message = err.message; // Copy the message explicitly
    
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = new AppError('Invalid token. Please log in again!', 401);
    if (error.name === 'TokenExpiredError') error = new AppError('Your token has expired! Please log in again.', 401);
    
    sendErrorProd(error, res); // Pass the transformed error
  }
};