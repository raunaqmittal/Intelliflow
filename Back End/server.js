const mongoose = require('mongoose');
const dotenv = require('dotenv');
require('dotenv').config({ path: './config.env' });

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION!!');
  console.log(err.name, err.message); // Fixed comma to dot
  process.exit(1);
});

const app = require('./app');

mongoose.connect(process.env.DATABASE, {
  // Removed deprecated options
}).then(() => {
  console.log('DB connection successful');
}).catch(err => {
  console.error('DB connection error:', err);
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! Shutting down..');
  console.log(err.name, err.message); // Fixed comma to dot
  server.close(() => {
    process.exit(1);
  });
});