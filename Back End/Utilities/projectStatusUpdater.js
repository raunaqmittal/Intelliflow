const Project = require('../models/projectModel');
const Task = require('../models/taskModel');

/**
 * Check if all tasks for a project are completed and update project status accordingly
 * @param {ObjectId} projectId - The MongoDB ObjectId of the project
 * @returns {Promise<Object>} - Returns updated project status info
 */
const updateProjectStatusIfComplete = async (projectId) => {
  try {
    if (!projectId) {
      return { updated: false, message: 'No project ID provided' };
    }

    // Get all tasks for this project
    const tasks = await Task.find({ project: projectId });
    
    if (tasks.length === 0) {
      return { updated: false, message: 'No tasks found for this project' };
    }

    // Check if all tasks are done
    const allDone = tasks.every(t => t.status === 'Done' || t.status === 'Completed');
    
    if (allDone) {
      // Update project to Completed
      const project = await Project.findByIdAndUpdate(
        projectId, 
        { status: 'Completed' },
        { new: true }
      );
      
      return { 
        updated: true, 
        message: `Project "${project.project_title}" updated to Completed`,
        project 
      };
    }

    return { 
      updated: false, 
      message: 'Not all tasks are completed yet' 
    };
  } catch (error) {
    console.error('Error updating project status:', error);
    throw error;
  }
};

/**
 * Batch update all projects in the database
 * Useful for migration or data correction
 */
const updateAllProjectStatuses = async () => {
  try {
    const projects = await Project.find({});
    let updatedCount = 0;

    for (const project of projects) {
      const result = await updateProjectStatusIfComplete(project._id);
      if (result.updated) {
        updatedCount++;
        console.log(`✓ ${result.message}`);
      }
    }

    return { 
      total: projects.length, 
      updated: updatedCount,
      message: `Updated ${updatedCount} of ${projects.length} projects` 
    };
  } catch (error) {
    console.error('Error in batch update:', error);
    throw error;
  }
};

module.exports = {
  updateProjectStatusIfComplete,
  updateAllProjectStatuses
};
