const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/employeeModel');
const Request = require('./models/requestModel');

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

// Normalization mapping - MUST match workflow teams
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
  
  // Testing Department variations (matches workflow)
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

// Main function to normalize all departments across all collections
const normalizeAllDepartments = async () => {
  try {
    console.log('Starting comprehensive department normalization...\n');
    
    let totalUpdates = 0;
    const changes = [];
    
    // ========== 1. NORMALIZE EMPLOYEES ==========
    console.log('=== Normalizing Employee Departments ===\n');
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees\n`);
    
    for (const employee of employees) {
      const originalDept = employee.department;
      const normalizedDept = normalizeDepartment(originalDept);
      
      if (originalDept !== normalizedDept) {
        changes.push({
          collection: 'Employee',
          name: employee.name,
          field: 'department',
          original: originalDept,
          normalized: normalizedDept
        });
        
        employee.department = normalizedDept;
        await employee.save({ validateBeforeSave: false });
        totalUpdates++;
      }
    }
    
    // Normalize approvesDepartments for managers
    const managers = await Employee.find({ isApprover: true });
    console.log(`Found ${managers.length} managers with approval rights\n`);
    
    for (const manager of managers) {
      if (manager.approvesDepartments && manager.approvesDepartments.length > 0) {
        const originalDepts = [...manager.approvesDepartments];
        const normalizedDepts = manager.approvesDepartments.map(dept => normalizeDepartment(dept));
        
        if (JSON.stringify(originalDepts) !== JSON.stringify(normalizedDepts)) {
          changes.push({
            collection: 'Employee',
            name: manager.name,
            field: 'approvesDepartments',
            original: originalDepts.join(', '),
            normalized: normalizedDepts.join(', ')
          });
          
          manager.approvesDepartments = normalizedDepts;
          await manager.save({ validateBeforeSave: false });
          totalUpdates++;
        }
      }
    }
    
    // ========== 2. NORMALIZE REQUESTS ==========
    console.log('\n=== Normalizing Request Departments ===\n');
    const requests = await Request.find({});
    console.log(`Found ${requests.length} requests\n`);
    
    for (const request of requests) {
      let requestUpdated = false;
      
      // Normalize requiredDepartments
      if (request.requiredDepartments && request.requiredDepartments.length > 0) {
        const originalDepts = [...request.requiredDepartments];
        const normalizedDepts = request.requiredDepartments.map(dept => normalizeDepartment(dept));
        
        if (JSON.stringify(originalDepts) !== JSON.stringify(normalizedDepts)) {
          changes.push({
            collection: 'Request',
            name: `Request #${request._id}`,
            field: 'requiredDepartments',
            original: originalDepts.join(', '),
            normalized: normalizedDepts.join(', ')
          });
          
          request.requiredDepartments = normalizedDepts;
          requestUpdated = true;
        }
      }
      
      // Normalize approvalsByDepartment
      if (request.approvalsByDepartment && request.approvalsByDepartment.length > 0) {
        for (let i = 0; i < request.approvalsByDepartment.length; i++) {
          const approval = request.approvalsByDepartment[i];
          const originalDept = approval.department;
          const normalizedDept = normalizeDepartment(originalDept);
          
          if (originalDept !== normalizedDept) {
            changes.push({
              collection: 'Request',
              name: `Request #${request._id}`,
              field: `approvalsByDepartment[${i}].department`,
              original: originalDept,
              normalized: normalizedDept
            });
            
            request.approvalsByDepartment[i].department = normalizedDept;
            requestUpdated = true;
          }
        }
      }
      
      // Normalize generatedWorkflow.taskBreakdown.team
      if (request.generatedWorkflow && request.generatedWorkflow.taskBreakdown) {
        for (let i = 0; i < request.generatedWorkflow.taskBreakdown.length; i++) {
          const task = request.generatedWorkflow.taskBreakdown[i];
          if (task.team) {
            const originalTeam = task.team;
            const normalizedTeam = normalizeDepartment(originalTeam);
            
            if (originalTeam !== normalizedTeam) {
              changes.push({
                collection: 'Request',
                name: `Request #${request._id}`,
                field: `generatedWorkflow.taskBreakdown[${i}].team`,
                original: originalTeam,
                normalized: normalizedTeam
              });
              
              request.generatedWorkflow.taskBreakdown[i].team = normalizedTeam;
              requestUpdated = true;
            }
          }
        }
      }
      
      if (requestUpdated) {
        await request.save({ validateBeforeSave: false });
        totalUpdates++;
      }
    }
    
    // ========== SUMMARY ==========
    console.log('\n=== NORMALIZATION COMPLETE ===\n');
    console.log(`Total updates made: ${totalUpdates}\n`);
    
    if (changes.length > 0) {
      console.log('Changes made:');
      console.log('─'.repeat(100));
      
      // Group by collection
      const employeeChanges = changes.filter(c => c.collection === 'Employee');
      const requestChanges = changes.filter(c => c.collection === 'Request');
      
      if (employeeChanges.length > 0) {
        console.log('\n📊 EMPLOYEE COLLECTION:');
        employeeChanges.forEach(change => {
          console.log(`  ${change.name} - ${change.field}:`);
          console.log(`    Before: ${change.original}`);
          console.log(`    After:  ${change.normalized}\n`);
        });
      }
      
      if (requestChanges.length > 0) {
        console.log('\n📋 REQUEST COLLECTION:');
        requestChanges.forEach(change => {
          console.log(`  ${change.name} - ${change.field}:`);
          console.log(`    Before: ${change.original}`);
          console.log(`    After:  ${change.normalized}\n`);
        });
      }
    } else {
      console.log('No changes needed - all departments already normalized!');
    }
    
    console.log('\n✅ All collections normalized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error normalizing departments:', error);
    process.exit(1);
  }
};

// Run the script
normalizeAllDepartments();
