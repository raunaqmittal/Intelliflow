const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  task_id: {
    type: Number,
    required: [true, 'A task must have an ID.'],
    unique: true
  },
  task_name: {
    type: String,
    required: [true, 'A task must have a name.'],
    trim: true
  },
  // Sprint as string (name) instead of reference
  sprint: {
    type: String,
    trim: true
  },
  sprint_number: {
    type: Number
  },
  // Project reference
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  project_id: {
    type: Number
  },
  // Assigned to reference (store employee_id numbers)
  assignedTo: [{
    type: Number
  }],
  assigned_to: [{
    type: Number
  }],
  status: {
    type: String,
    enum: ['Pending', 'To Do', 'In Progress', 'Done', 'Completed'],
    default: 'Pending'
  },
  // Dependencies as array of task IDs
  dependencies: [{
    type: Number  // Task IDs that this task depends on
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  description: String,
  dueDate: Date
}, {
  timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;