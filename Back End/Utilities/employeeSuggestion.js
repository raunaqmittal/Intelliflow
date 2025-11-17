const Employee = require('../models/employeeModel');
const Task = require('../models/taskModel');

// Helper function to calculate employee match score for a task
const calculateMatchScore = async (employee, task) => {
  let score = 0;
  const reasons = [];

  // Check skill match (handle missing or empty requiredSkills array)
  const requiredSkills = Array.isArray(task.requiredSkills) ? task.requiredSkills : [];
  const matchingSkills = requiredSkills.filter(skill =>
    employee.skills.some(empSkill => 
      empSkill.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(empSkill.toLowerCase())
    )
  );
  
  if (requiredSkills.length > 0) {
    const skillMatchPercentage = (matchingSkills.length / requiredSkills.length) * 100;
    score += skillMatchPercentage * 0.5; // 50% weight for skills (reduced from 60%)
    
    if (matchingSkills.length > 0) {
      reasons.push(`Has ${matchingSkills.length}/${requiredSkills.length} required skills: ${matchingSkills.join(', ')}`);
    }
  }

  // Check current workload (pending tasks)
  const pendingTasks = await Task.countDocuments({
    $or: [
      { assignedTo: employee.employee_id },
      { assigned_to: employee.employee_id }
    ],
    status: { $in: ['Pending', 'To Do', 'In Progress'] }
  });

  // Workload scoring: fewer pending tasks = higher score (20% weight)
  let workloadScore = 0;
  if (pendingTasks === 0) {
    workloadScore = 20;
    reasons.push('No pending tasks');
  } else if (pendingTasks <= 2) {
    workloadScore = 15;
    reasons.push(`${pendingTasks} pending task${pendingTasks > 1 ? 's' : ''}`);
  } else if (pendingTasks <= 5) {
    workloadScore = 10;
    reasons.push(`${pendingTasks} pending tasks`);
  } else {
    workloadScore = 5;
    reasons.push(`${pendingTasks} pending tasks (heavy workload)`);
  }
  score += workloadScore;

  // Check availability (20% weight, reduced from 30%)
  if (employee.availability === 'Available') {
    score += 20;
    reasons.push('Currently available');
  } else if (employee.availability === 'Busy') {
    score += 8;
    reasons.push('Busy but can be assigned');
  } else {
    reasons.push('On leave');
  }

  // Check department/team match (10% weight, bonus points)
  if (task.team && employee.department) {
    if (employee.department.toLowerCase().includes(task.team.toLowerCase()) ||
        task.team.toLowerCase().includes(employee.department.toLowerCase())) {
      score += 10;
      reasons.push(`From ${employee.department} department`);
    }
  }

  return {
    score: Math.min(Math.round(score), 100),
    reason: reasons.join(', ')
  };
};

// Helper function to suggest employees for a task
const suggestEmployeesForTask = async (task) => {
  // Find all active employees
  const employees = await Employee.find({ active: true });

  // Calculate match score for each employee (now async)
  const employeeMatchesPromises = employees.map(async (employee) => {
    const { score, reason } = await calculateMatchScore(employee, task);
    return {
      employee: employee._id,
      matchScore: score,
      reason
    };
  });

  const employeeMatches = await Promise.all(employeeMatchesPromises);

  // Sort by match score (highest first) and return top 3
  return employeeMatches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
};

module.exports = {
  calculateMatchScore,
  suggestEmployeesForTask
};
