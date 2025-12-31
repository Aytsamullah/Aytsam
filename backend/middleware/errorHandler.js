const { validationResult } = require('express-validator');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle MongoDB Cast Errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle MongoDB Duplicate Field Errors
const handleDuplicateFieldsDB = (err) => {
  // In Mongoose 6+, err.errmsg might not exist for duplicate key errors.
  // Extract value from err.message if err.errmsg is not available.
  let value = 'Unknown';
  if (err.errmsg) {
    const match = err.errmsg.match(/(["'])(\\?.)*?\1/);
    if (match && match[0]) {
      value = match[0];
    }
  } else if (err.message) {
    const match = err.message.match(/dup key: { (.+?) : "(.+?)" }/);
    if (match && match[2]) {
      value = match[2];
    }
  }

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle Mongoose Validation Errors
const handleMongooseValidationError = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle Express-Validator Validation Errors
const handleExpressValidatorError = (err) => {
  // Assumes err is the result of validationResult(req).array()
  const errorMessages = err.array().map(error => error.msg).join(', ');
  const message = `Validation failed: ${errorMessages}`;
  return new AppError(message, 400);
};

// Handle JWT Errors
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

// Send error in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Send error in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
  // Ensure err exists (Express error handlers must have 4 parameters)
  if (!err) {
    return res.status(500).json({
      success: false,
      message: 'An unknown error occurred'
    });
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };

    // Check if it's an express-validator error first
    if (Array.isArray(error.errors) && error.errors[0] && error.errors[0].msg) {
      error = handleExpressValidatorError(error);
    } else if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    } else if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    } else if (error.name === 'ValidationError') {
      // Mongoose Validation Error
      error = handleMongooseValidationError(error);
    } else if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    } else if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    } else {
      // Generic error handling for unhandled errors
      error.message = err.message; // Use original message for generic errors
    }

    sendErrorProd(error, res);
  }
};

module.exports = {
  AppError,
  globalErrorHandler
};
