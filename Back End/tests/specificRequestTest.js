/*
Specific Request Workflow Test

Scenario:
- Use existing client credentials (contact@designx.com / password123)
- Create provided web_dev request body
- Generate workflow
- Assign specified employees to each task:
  research  -> Alex Research (68f79e3ebc6f10b3a24451b4)
  design    -> Emma Designer new (68f79e2abc6f10b3a24451b2)
  development (Frontend Development) -> Sarah Frontend (68f79e03bc6f10b3a24451ae)
  development (Backend Development)  -> Mike Backend (68f79e1abc6f10b3a24451b0)
  testing   -> Shruti Bansal (68f4c0eed0799fe0f1fe9406)
- Approve all required departments (using a temporary omnidept manager account)
- Final approve request (project + tasks creation)
- Mark all tasks Completed sprint-wise
- Advance sprints until project status becomes Completed or no further advancement possible
- Delete the created project (and its tasks) and the temporary manager user

NOTE: Existing managers do not have known passwords. Script creates a temporary manager user with approvesDepartments for required departments.

Run:
  node Back End/tests/specificRequestTest.js

Env:
  BASE_URL (default http://localhost:3000/api/v1)
  VERBOSE=true for detailed logging
*/

const axios = require('axios');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/v1';
const VERBOSE = process.env.VERBOSE === 'true';

function log(msg){ console.log(msg); }
function verbose(data){ if(VERBOSE) console.dir(data,{depth:4}); }
function assert(cond, msg){ if(!cond) throw new Error('ASSERT: '+msg); }

// Employee ObjectIds (Mongo) for assignments
const EMPLOYEE_IDS = {
  alexResearch: '68f79e3ebc6f10b3a24451b4',
  emmaDesigner: '68f79e2abc6f10b3a24451b2',
  sarahFrontend: '68f79e03bc6f10b3a24451ae',
  mikeBackend: '68f79e1abc6f10b3a24451b0',
  shrutiTesting: '68f4c0eed0799fe0f1fe9406'
};

// Request body
const REQUEST_BODY = {
  requestType: 'web_dev',
  title: 'testing web dev request ',
  description: 'Build an MVP customer portal with authentication, user dashboard, and ticketing.',
  requirements: ['UI/UX','Frontend','Backend','Auth','Dashboard']
};

async function main(){
  const summary = [];
  const push = (step, success, info) => summary.push({step, success, info});
  let clientToken, managerToken, requestId, projectId;
  const unique = Date.now();

  try {
    // 1. Login existing client
    log('1. Client login');
    const clientLogin = await axios.post(`${BASE_URL}/clients/login`, { email: 'contact@designx.com', password: 'password123' });
    assert(clientLogin.data.status === 'success','Client login failed');
    clientToken = clientLogin.data.token;
    push('client_login', true, clientLogin.data.data.user._id);

    // 2. Create request
    log('2. Create request');
    const createReq = await axios.post(`${BASE_URL}/requests`, REQUEST_BODY, { headers:{ Authorization: `Bearer ${clientToken}` }});
    assert(createReq.data.status === 'success','Request creation failed');
    requestId = createReq.data.data.request._id;
    push('create_request', true, requestId);

    // 3. Generate workflow
    log('3. Generate workflow');
    const wfRes = await axios.post(`${BASE_URL}/requests/${requestId}/generate-workflow`, {}, { headers:{ Authorization: `Bearer ${clientToken}` }});
    assert(wfRes.data.status === 'success','Workflow generation failed');
    const taskBreakdown = wfRes.data.data.request.generatedWorkflow.taskBreakdown || [];
    push('generate_workflow', true, taskBreakdown.length);

    // 4. Create temporary manager (omnidept) for approvals & assignments
    log('4. Create temporary manager');
    const tempManagerEmail = `temp.manager.${unique}@example.com`;
    const password = 'TempManager123!';
    const signupManager = await axios.post(`${BASE_URL}/employees/signup`, {
      employee_id: unique % 1000000,
      name: 'Temp Omni Manager',
      email: tempManagerEmail,
      password,
      passwordConfirm: password,
      role: 'manager',
      department: 'Development',
      availability: 'Available',
      skills: ['leadership'],
    });
    assert(signupManager.data.status==='success','Temp manager signup failed');
    managerToken = signupManager.data.token;
    const managerObjectId = signupManager.data.data.user._id;
    push('temp_manager_signup', true, managerObjectId);

    // 5. Patch manager approvesDepartments (unprotected updateEmployee route) to cover all required
    log('5. Extend manager approvesDepartments');
    const requiredDepartments = ['research','design','development','testing'];
    const patchMgr = await axios.patch(`${BASE_URL}/employees/${managerObjectId}`, {
      approvesDepartments: ['Research','Design','Development','Testing']
    });
    assert(patchMgr.data.status==='success','Manager patch approvesDepartments failed');
    push('patch_manager_departments', true, requiredDepartments);

    // 6. Assign specified employees to tasks based on team + taskName
    log('6. Assign employees to tasks');
    const assignments = {};
    for(const t of taskBreakdown){
      const team = (t.team||'').toLowerCase();
      if(team==='research') assignments[t._id] = [EMPLOYEE_IDS.alexResearch];
      else if(team==='design') assignments[t._id] = [EMPLOYEE_IDS.emmaDesigner];
      else if(team==='development') {
        if(/frontend/i.test(t.taskName)) assignments[t._id] = [EMPLOYEE_IDS.sarahFrontend];
        else if(/backend/i.test(t.taskName)) assignments[t._id] = [EMPLOYEE_IDS.mikeBackend];
        else assignments[t._id] = [EMPLOYEE_IDS.sarahFrontend];
      } else if(team==='testing') assignments[t._id] = [EMPLOYEE_IDS.shrutiTesting];
    }
    const assignRes = await axios.patch(`${BASE_URL}/requests/${requestId}/assign-employees`, { assignments }, { headers:{ Authorization: `Bearer ${managerToken}` }});
    assert(assignRes.data.status==='success','Assign employees failed');
    // Verify all tasks assigned
    const assignedCount = Object.values(assignments).filter(a=>Array.isArray(a)&&a.length>0).length;
    assert(assignedCount === taskBreakdown.length, 'Not all tasks assigned');
    push('assign_employees', true, assignedCount);

    // 7. Department approvals loop
    log('7. Department approvals');
    for(const dept of ['research','design','development','testing']){
      const approveDept = await axios.post(`${BASE_URL}/requests/${requestId}/department-approve`, { department: dept }, { headers:{ Authorization: `Bearer ${managerToken}` }});
      assert(approveDept.data.status==='success', `Department approve failed for ${dept}`);
    }
    push('department_approvals', true, 'All required departments approved');

    // 8. Final approval converting to project
    log('8. Final approve request');
    const approveRes = await axios.post(`${BASE_URL}/requests/${requestId}/approve`, {}, { headers:{ Authorization: `Bearer ${managerToken}` }});
    assert(approveRes.data.status==='success','Final approval failed');
    projectId = approveRes.data.data.project._id;
    const projectTasks = approveRes.data.data.tasks || [];
    assert(projectTasks.length>0,'Project tasks missing after approval');
    push('final_approve', true, { projectId, tasks: projectTasks.length });

    const PROGRESSIVE = process.env.PROGRESSIVE === 'true';
    if(!PROGRESSIVE){
      // Batch-complete all tasks then advance repeatedly
      log('9. Complete all tasks (batch mode)');
      for(const task of projectTasks){
        const completeRes = await axios.patch(`${BASE_URL}/tasks/${task._id}/status`, { status: 'Completed' }, { headers:{ Authorization: `Bearer ${managerToken}` }});
        assert(completeRes.data.status==='success','Task completion failed');
      }
      push('complete_tasks', true, projectTasks.length);

      log('10. Advance sprints (batch mode)');
      let advances = 0;
      for(let i=0;i<10;i++){ // safety limit
        try {
          const adv = await axios.patch(`${BASE_URL}/projects/${projectId}/advance-sprint`, {}, { headers:{ Authorization: `Bearer ${managerToken}` }});
          if(adv.data.status==='success'){
            advances++;
            verbose(adv.data.data.message);
            if(adv.data.data.project.status==='Completed') break;
          } else break;
        } catch(e){
          break;
        }
      }
      push('advance_sprints', true, advances);
    } else {
      // Progressive mode: complete sprint tasks then advance one sprint at a time
      log('9. Progressive sprint completion');
      // Refresh tasks from API (in case schema populates sprint numbers)
      const tasksByProject = await axios.get(`${BASE_URL}/tasks/project/${projectId}`, { headers:{ Authorization: `Bearer ${managerToken}` }});
      assert(tasksByProject.data.status==='success','Fetch project tasks failed');
      const liveTasks = tasksByProject.data.data.tasks || [];
      // Group by sprint_number
      const sprintMap = new Map();
      liveTasks.forEach(t => {
        const sn = t.sprint_number || 1;
        if(!sprintMap.has(sn)) sprintMap.set(sn, []);
        sprintMap.get(sn).push(t);
      });
      const orderedSprints = Array.from(sprintMap.keys()).sort((a,b)=>a-b);
      let advances = 0;
      for(const sn of orderedSprints){
        log(`  - Completing Sprint ${sn}`);
        for(const task of sprintMap.get(sn)){
          const completeRes = await axios.patch(`${BASE_URL}/tasks/${task._id}/status`, { status: 'Completed' }, { headers:{ Authorization: `Bearer ${managerToken}` }});
          assert(completeRes.data.status==='success',`Task completion failed (Sprint ${sn})`);
        }
        // Attempt single advance after sprint completion
        try {
          const adv = await axios.patch(`${BASE_URL}/projects/${projectId}/advance-sprint`, {}, { headers:{ Authorization: `Bearer ${managerToken}` }});
          if(adv.data.status==='success'){
            advances++;
            verbose(adv.data.data.message);
            if(adv.data.data.project.status==='Completed') break;
          } else {
            log('  ! Advance failed after sprint completion');
            break;
          }
        } catch(e){
          log('  ! Advance error: '+(e.response?e.response.data.message:e.message));
          break;
        }
      }
      push('complete_tasks_progressive', true, liveTasks.length);
      push('advance_sprints_progressive', true, advances);
    }

    // 11. Delete project (cleanup)
    log('11. Delete project (cleanup)');
    const delProj = await axios.delete(`${BASE_URL}/projects/${projectId}`);
    assert(delProj.status===204,'Project deletion failed');
    push('delete_project', true, projectId);

    // 12. Delete temp manager (soft delete via deleteMe after login) or hard delete route
    log('12. Delete temp manager');
    const deleteManager = await axios.delete(`${BASE_URL}/employees/${managerObjectId}`);
    assert(deleteManager.status===204,'Manager deletion failed');
    push('delete_temp_manager', true, managerObjectId);

  } catch(err){
    const info = err.response ? err.response.data : err.stack;
    log('FATAL ERROR\n'+JSON.stringify(info,null,2));
    push('fatal', false, err.message);
  }

  log('\nTEST SUMMARY');
  for(const s of summary){
    log(`${s.success?'✔':'✖'} ${s.step}: ${typeof s.info==='object'?JSON.stringify(s.info):s.info}`);
  }
  const failed = summary.filter(s=>!s.success);
  if(failed.length){
    log(`\nFailures: ${failed.length}`);
    process.exitCode = 1;
  } else {
    log('\nScenario completed successfully.');
  }
}

main();
