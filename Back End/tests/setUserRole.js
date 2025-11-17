/**
 * Utility script to set a user's role directly in the database
 * Used for testing purposes to create managers
 * 
 * Usage: node tests/setUserRole.js <userId> <role>
 * Example: node tests/setUserRole.js 691a6f6ee21f9408481367a6 manager
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const Employee = require('../models/employeeModel');

const userId = process.argv[2];
const newRole = process.argv[3] || 'manager';

if (!userId) {
  console.error('Usage: node tests/setUserRole.js <userId> <role>');
  process.exit(1);
}

async function setRole() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log('Connected to database');

    const user = await Employee.findById(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      process.exit(1);
    }

    console.log(`Current role: ${user.role}`);
    user.role = newRole;
    await user.save({ validateBeforeSave: false });
    
    console.log(`✓ Updated user ${userId} to role: ${newRole}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

setRole();
