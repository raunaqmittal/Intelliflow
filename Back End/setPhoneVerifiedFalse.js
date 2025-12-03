const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

const Employee = require('./models/employeeModel');
const Client = require('./models/clientModel');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ DB connection successful!'))
  .catch((err) => {
    console.error('❌ DB connection failed:', err);
    process.exit(1);
  });

const setPhoneVerifiedFalse = async () => {
  try {
    console.log('🔄 Starting to update phone verification status...\n');

    // Update all employees
    const employeeResult = await Employee.updateMany(
      {},
      {
        $set: {
          phoneVerified: false,
          twoFactorEnabled: false, // Disable 2FA since phone is not verified
        }
      }
    );

    console.log(`✅ Updated ${employeeResult.modifiedCount} employees`);
    console.log(`   - Set phoneVerified to false`);
    console.log(`   - Disabled 2FA\n`);

    // Update all clients
    const clientResult = await Client.updateMany(
      {},
      {
        $set: {
          phoneVerified: false,
          twoFactorEnabled: false, // Disable 2FA since phone is not verified
        }
      }
    );

    console.log(`✅ Updated ${clientResult.modifiedCount} clients`);
    console.log(`   - Set phoneVerified to false`);
    console.log(`   - Disabled 2FA\n`);

    console.log('🎉 All phone verification statuses have been reset!');
    console.log('📝 Note: Users will need to verify their phone numbers again to enable 2FA via SMS.');
    
  } catch (err) {
    console.error('❌ Error updating phone verification status:', err);
  } finally {
    process.exit();
  }
};

setPhoneVerifiedFalse();
