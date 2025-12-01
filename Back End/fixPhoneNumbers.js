const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

const Employee = require('./models/employeeModel');
const Client = require('./models/clientModel');

// Normalize phone number function
const normalizePhone = (phone) => {
  if (!phone) return undefined;
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  if (!digits) return undefined;
  
  // If doesn't start with 91, add it
  if (!digits.startsWith('91')) {
    digits = '91' + digits;
  }
  
  // Always return with + prefix for consistency
  return `+${digits}`;
};

const fixPhoneNumbers = async () => {
  try {
    // Connect to MongoDB
    const DB = process.env.DATABASE.replace(
      '<PASSWORD>',
      process.env.DATABASE_PASSWORD
    );
    
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ DB connection successful!');
    
    const targetPhone = '+919625668733';
    
    // Fix Employee phone numbers
    console.log('\n📱 Updating Employee phone numbers...');
    const employees = await Employee.find({});
    let employeeCount = 0;
    
    for (const employee of employees) {
      if (employee.phone !== targetPhone) {
        console.log(`  Updating: ${employee.email}`);
        console.log(`    Old: ${employee.phone || 'Not set'}`);
        console.log(`    New: ${targetPhone}`);
        
        employee.phone = targetPhone;
        employee.phoneVerified = false; // Reset verification since number changed
        await employee.save({ validateBeforeSave: false });
        employeeCount++;
      }
    }
    
    console.log(`✅ Updated ${employeeCount} employee phone numbers\n`);
    
    // Fix Client phone numbers
    console.log('📱 Updating Client phone numbers...');
    const clients = await Client.find({});
    let clientCount = 0;
    
    for (const client of clients) {
      if (client.phone !== targetPhone) {
        console.log(`  Updating: ${client.contact_email}`);
        console.log(`    Old: ${client.phone || 'Not set'}`);
        console.log(`    New: ${targetPhone}`);
        
        client.phone = targetPhone;
        client.phoneVerified = false; // Reset verification since number changed
        await client.save({ validateBeforeSave: false });
        clientCount++;
      }
    }
    
    console.log(`✅ Updated ${clientCount} client phone numbers\n`);
    
    console.log(`🎉 Done! Updated ${employeeCount + clientCount} total phone numbers to ${targetPhone}`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixPhoneNumbers();
