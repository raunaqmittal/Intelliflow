const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/employeeModel');
const Client = require('./models/clientModel');

// Load environment variables
dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Connect to database
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'))
  .catch(err => console.error('DB connection error:', err));

// Create test users
const createTestUsers = async () => {
  try {
    console.log('Creating test users...');

    // Check if test employee already exists
    const existingEmployee = await Employee.findOne({ email: 'test@intelliflow.com' });
    if (!existingEmployee) {
      const testEmployee = await Employee.create({
        employee_id: 9999,
        name: 'Test Employee',
        email: 'test@intelliflow.com',
        password: 'test1234',
        passwordConfirm: 'test1234',
        role: 'Developer',
        department: 'Engineering',
        skills: ['JavaScript', 'Node.js', 'React'],
        availability: 'Available',
        phone: '555-0100'
      });
      console.log('✓ Test employee created successfully!');
      console.log('  Email: test@intelliflow.com');
      console.log('  Password: test1234');
    } else {
      console.log('⚠ Test employee already exists');
    }

    // Check if test client already exists
    const existingClient = await Client.findOne({ contact_email: 'testclient@company.com' });
    if (!existingClient) {
      const testClient = await Client.create({
        client_id: 9999,
        client_name: 'Test Client Corp',
        contact_email: 'testclient@company.com',
        password: 'test1234',
        passwordConfirm: 'test1234',
        phone: '555-0200',
        industry: 'Technology',
        address: '123 Test Street'
      });
      console.log('✓ Test client created successfully!');
      console.log('  Email: testclient@company.com');
      console.log('  Password: test1234');
    } else {
      console.log('⚠ Test client already exists');
    }

    console.log('\n✅ Test users setup complete!');
    console.log('\nYou can now login with:');
    console.log('Employee: test@intelliflow.com / test1234');
    console.log('Client: testclient@company.com / test1234');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    process.exit();
  }
};

// Run the function
createTestUsers();
