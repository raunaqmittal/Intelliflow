const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  project_id: {
    type: Number,
    required: [true, 'A project must have an ID.'],
    unique: true
  },
  project_title: {
    type: String,
    required: [true, 'A project must have a title.'],
    trim: true
  },
  // Client reference
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: [true, 'A project must have a client.']
  },
  // For convenience, also store client_id from original data
  client_id: {
    type: Number
  },
  client_name: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'A project must have a category.'],
    trim: true
  },
  framework: {
    type: String,
    enum: ['Agile', 'Waterfall', 'Hybrid']
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  requirements: {
    type: String,
    trim: true
  },
  // Sprint management fields
  activeSprintNumber: {
    type: Number,
    default: 1
  },
  totalSprints: {
    type: Number
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;