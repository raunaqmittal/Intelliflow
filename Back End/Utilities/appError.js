class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // Marking operational errors vs programming errors
    this.isOperational = true;
    // Capturing the stack trace will exclude this constructor function from the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;