const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  requestType: {
    type: String,
    enum: ['web_dev', 'app_dev', 'prototype', 'research'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  requirements: [String],
  // Departments involved in this request's workflow
  requiredDepartments: {
    type: [String],
    default: []
  },
  // Per-department approval tracking
  approvalsByDepartment: [
    {
      department: { type: String, required: true },
      approved: { type: Boolean, default: false },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      approvedAt: { type: Date }
    }
  ],
  generatedWorkflow: {
    estimatedDuration: Number,
    taskBreakdown: [
      {
        taskName: String,
        team: String, // e.g. research/design/dev
        estimatedHours: Number,
        requiredSkills: [String],
        suggestedEmployees: [
          {
            employee: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Employee'
            },
            matchScore: Number, // How well employee matches (0-100)
            reason: String // e.g. "Has React, Node.js skills, 20hrs available"
          }
        ]
      }
    ]
  },
  // Separate field for task assignments (prevents data loss during updates)
  taskAssignments: {
    type: Map,
    of: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }],
    default: {}
  },
  status: {
    type: String,
    enum: [
      'submitted',
      'workflow_generated',
      'under_review',
      'approved',
      'rejected',
      'converted'
    ],
    default: 'submitted'
  },
  reviewNotes: String,
  convertedToProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
