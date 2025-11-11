const Employee = require('../models/employeeModel');

// Helper function to calculate employee match score for a task
const calculateMatchScore = (employee, task) => {
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
    score += skillMatchPercentage * 0.6; // 60% weight for skills
    
    if (matchingSkills.length > 0) {
      reasons.push(`Has ${matchingSkills.length}/${requiredSkills.length} required skills: ${matchingSkills.join(', ')}`);
    }
  }

  // Check availability
  if (employee.availability === 'Available') {
    score += 30; // 30% weight for availability
    reasons.push('Currently available');
  } else if (employee.availability === 'Busy') {
    score += 10;
    reasons.push('Busy but can be assigned');
  } else {
    reasons.push('On leave');
  }

  // Check department/team match (bonus points)
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

  // Calculate match score for each employee
  const employeeMatches = employees.map(employee => {
    const { score, reason } = calculateMatchScore(employee, task);
    return {
      employee: employee._id,
      matchScore: score,
      reason
    };
  });

  // Sort by match score (highest first) and return top 3
  return employeeMatches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
};

module.exports = {
  calculateMatchScore,
  suggestEmployeesForTask
};
