const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/employeeModel');

dotenv.config({ path: './config.env' });

// Connect to MongoDB
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'));

// Normalization mapping - maps various department names to standard names
const DEPARTMENT_MAPPING = {
  // Research Department variations
  'research': 'Research',
  'ux / research': 'Research',
  'ux/research': 'Research',
  'uxresearch': 'Research',
  'r&d': 'Research',
  'rnd': 'Research',
  'r & d': 'Research',
  'research & development': 'Research',
  'research and development': 'Research',
  
  // QA/Testing Department variations
  'qa': 'Testing',
  'testing': 'Testing',
  'qa / testing': 'Testing',
  'qa/testing': 'Testing',
  'qatesting': 'Testing',
  'quality assurance': 'Testing',
  'qualityassurance': 'Testing',
  'q.a.': 'Testing',
  
  // Development/Engineering Department variations
  'development': 'Development',
  'dev': 'Development',
  'engineering': 'Development',
  'software development': 'Development',
  'software engineering': 'Development',
  
  // Design Department variations
  'design': 'Design',
  'ui / visual design': 'Design',
  'ui/visual design': 'Design',
  'uivisualdesign': 'Design',
  'ui/ux': 'Design',
  'ui-ux': 'Design',
  'uiux': 'Design',
  'ui & ux': 'Design',
  'graphic design': 'Design',
  'visual design': 'Design',
  
  // Project Management variations
  'project management': 'Project Management',
  'projectmanagement': 'Project Management',
  
  // Product Management variations
  'product management': 'Product Management',
  'productmanagement': 'Product Management',
  
  // Industrial/Mechanical Engineering variations
  'industrial/mechanical engineering': 'Industrial Engineering',
  'industrialmechanicalengineering': 'Industrial Engineering',
  'mechanical engineering': 'Industrial Engineering',
  'mechanicalengineering': 'Industrial Engineering',
  'industrial engineering': 'Industrial Engineering',
  'industrialengineering': 'Industrial Engineering',
  
  // DevOps variations
  'devops / handoff': 'DevOps',
  'devops/handoff': 'DevOps',
  'devopshandoff': 'DevOps',
  'devops': 'DevOps',
  
  // Sales/Client Success variations
  'client success / sales': 'Sales',
  'client success/sales': 'Sales',
  'clientsuccesssales': 'Sales',
  'sales': 'Sales',
  'client success': 'Sales',
  'clientsuccess': 'Sales',
};

// Function to normalize a department name
function normalizeDepartment(dept) {
  if (!dept) return dept;
  
  // Convert to lowercase and remove extra spaces/punctuation for matching
  const normalized = dept.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  // Check if we have a mapping for this department
  const standardName = DEPARTMENT_MAPPING[normalized] || 
                       DEPARTMENT_MAPPING[dept.toLowerCase().trim()];
  
  if (standardName) {
    return standardName;
  }
  
  // If no mapping found, return original with proper casing (capitalize first letter)
  return dept.charAt(0).toUpperCase() + dept.slice(1).toLowerCase();
}

// Main function to normalize all departments
const normalizeDepartments = async () => {
  try {
    console.log('Starting department normalization...\n');
    
    // Get all employees
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees\n`);
    
    let updatedCount = 0;
    const changes = [];
    
    for (const employee of employees) {
      const originalDept = employee.department;
      const normalizedDept = normalizeDepartment(originalDept);
      
      if (originalDept !== normalizedDept) {
        changes.push({
          name: employee.name,
          original: originalDept,
          normalized: normalizedDept
        });
        
        employee.department = normalizedDept;
        await employee.save({ validateBeforeSave: false });
        updatedCount++;
      }
    }
    
    // Also normalize approvesDepartments for managers
    const managers = await Employee.find({ isApprover: true });
    console.log(`\nFound ${managers.length} managers with approval rights\n`);
    
    for (const manager of managers) {
      if (manager.approvesDepartments && manager.approvesDepartments.length > 0) {
        const originalDepts = [...manager.approvesDepartments];
        const normalizedDepts = manager.approvesDepartments.map(dept => normalizeDepartment(dept));
        
        if (JSON.stringify(originalDepts) !== JSON.stringify(normalizedDepts)) {
          changes.push({
            name: manager.name,
            original: `approves: ${originalDepts.join(', ')}`,
            normalized: `approves: ${normalizedDepts.join(', ')}`
          });
          
          manager.approvesDepartments = normalizedDepts;
          await manager.save({ validateBeforeSave: false });
          updatedCount++;
        }
      }
    }
    
    console.log('\n=== NORMALIZATION COMPLETE ===\n');
    console.log(`Total updates made: ${updatedCount}\n`);
    
    if (changes.length > 0) {
      console.log('Changes made:');
      console.log('─'.repeat(80));
      changes.forEach(change => {
        console.log(`${change.name}:`);
        console.log(`  Before: ${change.original}`);
        console.log(`  After:  ${change.normalized}`);
        console.log('');
      });
    } else {
      console.log('No changes needed - all departments already normalized!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error normalizing departments:', error);
    process.exit(1);
  }
};

// Run the script
normalizeDepartments();

