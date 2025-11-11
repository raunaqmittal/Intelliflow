const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/employeeModel');

dotenv.config({ path: require('path').join(__dirname, 'config.env') });

const DB = process.env.DATABASE?.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

async function run() {
  if (!DB) {
    console.error('DATABASE connection string missing in config.env');
    process.exit(1);
  }
  await mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('DB connected');

  // Find all Project Management employees (including inactive, so bypass default pre-find by using raw query then filtering)
  const all = await Employee.find({ department: 'Project Management' }).select('+active');
  console.log(`Found ${all.length} employees in Project Management`);

  if (!all.length) {
    console.log('No employees to deactivate.');
    process.exit(0);
  }

  let updated = 0;
  for (const emp of all) {
    if (emp.active !== false) {
      emp.active = false; // soft delete / deactivate
      await emp.save({ validateBeforeSave: false });
      updated++;
      console.log(`Deactivated: ${emp.name} (${emp.email})`);
    } else {
      console.log(`Already inactive: ${emp.name}`);
    }
  }

  console.log(`\nTotal deactivated now: ${updated}`);
  console.log('Completed removal of Project Management department employees.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
