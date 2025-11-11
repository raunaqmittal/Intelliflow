const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load models
const Client = require('./models/clientModel');
const Employee = require('./models/employeeModel');
const Project = require('./models/projectModel');
const Task = require('./models/taskModel');

// Load environment variables
dotenv.config({ path: './config.env' });

// Connect to database
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
}).then(() => {
  console.log('DB connection successful');
}).catch(err => {
  console.error('DB connection error:', err);
});

// Import data files
const clients = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/Clients.json`, 'utf-8'));
const employees = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/Employee.json`, 'utf-8'));
const projects = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/Projects.json`, 'utf-8'));
const tasks = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/Tasks.json`, 'utf-8'));

// Import function
async function importData() {
  try {
    console.log('--- Starting data import ---');
    await Client.create(clients.map(c => ({
      client_id: c.client_id,
      client_name: c.client_name,
      contact_email: c.contact_email,
      password: 'password123',
      passwordConfirm: 'password123'
    })));
    console.log('✅ Clients imported.');

    await Employee.create(employees.map(e => ({
      ...e,
      password: 'password123',
      passwordConfirm: 'password123'
    })));
    console.log('✅ Employees imported.');


    // Lookup client ObjectId for each project
    const clientDocs = await Client.find();
    const projectsWithClient = projects.map(p => {
      // Find client by client_id
      const clientDoc = clientDocs.find(c => c.client_id === p.client_id);
      return {
        ...p,
        client: clientDoc ? clientDoc._id : undefined // Set ObjectId or undefined
      };
    });
    await Project.create(projectsWithClient);
    console.log('✅ Projects imported.');

    await Task.create(tasks);
    console.log('✅ Tasks imported.');

    console.log('\n🎉 All data successfully loaded!');
  } catch (err) {
    console.error('❌ Error importing data:', err);
  } finally {
    mongoose.connection.close();
  }
}

// Delete function
async function deleteData() {
  try {
    console.log('--- Deleting all data ---');
    await Client.deleteMany();
    await Employee.deleteMany();
    await Project.deleteMany();
    await Task.deleteMany();
    console.log('--- Data successfully deleted! ---');
  } catch (err) {
    console.log(err);
  }
  process.exit();
}

// CLI interface
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
