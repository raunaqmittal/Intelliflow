const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { updateAllProjectStatuses } = require('./Utilities/projectStatusUpdater');

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

// Update project statuses based on task completion
const runUpdate = async () => {
  try {
    console.log('🔄 Checking all projects for completion status...\n');
    
    const result = await updateAllProjectStatuses();
    
    console.log(`\n✅ ${result.message}`);

  } catch (error) {
    console.error('❌ Error updating project statuses:', error);
  } finally {
    process.exit();
  }
};

// Run the update
runUpdate();
