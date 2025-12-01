const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const fs = require('fs');
const morgan = require('morgan');
const employeeRouter = require('./routes/employeeRoutes');
const clientRouter = require('./routes/clientRoutes');
const requestRouter = require('./routes/requestRoutes');
const projectRouter = require('./routes/projectRoutes');
const taskRouter = require('./routes/taskRoutes');
const AppError = require('./Utilities/appError');
const globalErrorHandler = require('./Controllers/errorController');
const cors = require('cors');

// Middlewares are the functions that can modify the incoming request data before it is sent to the final handler function
// Middlewares can also modify the outgoing response data before it is sent to the client
// Middlewares can also terminate the request-response cycle
// Middlewares can also call the next middleware in the stack

// Trust proxy - Required for Render, Heroku, and other platforms behind reverse proxies
// This allows rate limiting and other features to work correctly with X-Forwarded-For headers
// Using 1 instead of true to trust only the first proxy (Render's load balancer) for security
app.set('trust proxy', 1);

// 1) MIDDLEWARES

// for setting security http headers
app.use(helmet()); 

// Middleware to parse JSON bodies
app.use(cors({
  origin: process.env.FRONTEND_URL, // Allow requests only from frontend
  credentials: false // Not using cookies - using Authorization header
}));
app.use(express.json({ limit: '10kb' })); // Body limit is 10kb

// Enable CORS for all routes
// Normalize duplicate slashes in request URL to avoid routing mismatches like /api/v1//tasks/:id
app.use((req, res, next) => {
  if (req.url.includes('//')) {
    req.url = req.url.replace(/\/{2,}/g, '/');
  }
  next();
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS (Cross Site Scripting) attacks
app.use(xss());

// Preventing parameter pollution
app.use(hpp({
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}));

//To serve static files
app.use(express.static(`${__dirname}/public`));

// Third party middleware for logging
if(process.env.NODE_ENV==='development') app.use(morgan('dev'));  

// Self made requestTime middlewares
app.use((req,res,next) =>{  
  req.requestTime = new Date().toISOString();
  next();
});

// Rate limiting middleware 
const limiter = rateLimit({
  max : 100, // max number of requests
  windowMs : 60*60*1000, // therefore 100 req in one hour
  message: 'Too many requests from this IP, please try again in an hour!'
});

// Stricter rate limiting for authentication endpoints
// In development, use higher limits to allow testing
const authLimiter = rateLimit({
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // 50 in dev, 5 in prod
  windowMs: 15 * 60 * 1000, // per 15 minutes
  message: 'Too many authentication attempts, please try again after 15 minutes',
  skipSuccessfulRequests: false
});

app.use('/api', limiter); // applying the rate limiter to all the routes that start with /api (i.e. all the api routes
app.use('/api/v1/employees/login', authLimiter);
app.use('/api/v1/employees/signup', authLimiter);
app.use('/api/v1/clients/login', authLimiter);
app.use('/api/v1/clients/signup', authLimiter);
app.use('/api/v1/employees/forgotPassword', authLimiter);
app.use('/api/v1/clients/forgotPassword', authLimiter);


// 2) Setting up the routes

app.use('/api/v1/employees', employeeRouter);
app.use('/api/v1/clients', clientRouter);
app.use('/api/v1/requests', requestRouter);
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/tasks', taskRouter);

app.all('*', (req,res,next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

