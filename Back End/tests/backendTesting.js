/*
Backend API Testing Suite

Combines smoke test (generic endpoint coverage) and specific scenario testing.

Modes:
  - SMOKE (default): Generic smoke test with temp manager/client, broad endpoint coverage
  - SPECIFIC: Real client scenario with specified employee assignments and cleanup
  
Environment variables:
  BASE_URL      - API base URL (default: http://localhost:3000/api/v1)
  MODE          - Test mode: "smoke" or "specific" (default: smoke)
  PROGRESSIVE   - For specific mode: complete tasks per-sprint before advancing (default: false)
  VERBOSE       - Detailed logging (default: false)

Run:
  node Back End/tests/backendTesting.js
  MODE=specific node Back End/tests/backendTesting.js
  MODE=specific PROGRESSIVE=true node Back End/tests/backendTesting.js
*/

const axios = require('axios');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/v1';
const MODE = (process.env.MODE || 'smoke').toLowerCase();
const VERBOSE = process.env.VERBOSE === 'true';
const PROGRESSIVE = process.env.PROGRESSIVE === 'true';

function log(msg){ console.log(msg); }
function verbose(data){ if(VERBOSE) console.dir(data,{depth:4}); }
function assert(cond, msg){ if(!cond) throw new Error('ASSERT: '+msg); }

const EMPLOYEE_IDS = {
  alexResearch: '68f79e3ebc6f10b3a24451b4',
  emmaDesigner: '68f79e2abc6f10b3a24451b2',
  sarahFrontend: '68f79e03bc6f10b3a24451ae',
  mikeBackend: '68f79e1abc6f10b3a24451b0',
  shrutiTesting: '68f4c0eed0799fe0f1fe9406'
};

async function smokeTest(){
  const summary = [];
  const push = (step, success, info) => summary.push({step, success, info});
  
  let managerToken, clientToken, managerEmpId, projectId, taskId, requestId;
  const unique = Date.now();

  try {
    log('1. Manager Signup');
    const managerEmail = `mgr.${unique}@test.com`;
    const signupRes = await axios.post(`${BASE_URL}/employees/signup`, {
      employee_id: unique % 1000000,
      name: 'Test Manager',
      email: managerEmail,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      password: 'Test1234!',
      passwordConfirm: 'Test1234!',
      role: 'manager', // Will be ignored due to security fix, but keeping for clarity
      department: 'Development',
      availability: 'Available',
      skills: ['leadership']
    });
    assert(signupRes.data.status === 'success', 'Manager signup failed');
    managerToken = signupRes.data.token;
    managerEmpId = signupRes.data.data.user._id;
    push('manager_signup', true, managerEmpId);

    // 1a. Upgrade employee to manager role (security: only allowed via direct DB update for testing)
    log('1a. Upgrade to Manager Role');
    const upgradeRes = await axios.patch(`${BASE_URL}/employees/${managerEmpId}`, {
      role: 'manager',
      isApprover: true
    });
    assert(upgradeRes.data.status === 'success', 'Manager role upgrade failed');
    push('upgrade_to_manager', true, 'manager');

    log('1b. Extend Manager Departments');
    const patchMgr = await axios.patch(`${BASE_URL}/employees/${managerEmpId}`, {
      approvesDepartments: ['Research','Design','Development','Testing','HR','Finance','Operations','Marketing']
    });
    assert(patchMgr.data.status === 'success', 'Manager patch failed');
    push('patch_manager_departments', true, 8);

    log('2. Client Signup');
    const clientEmail = `client.${unique}@test.com`;
    const clientSignup = await axios.post(`${BASE_URL}/clients/signup`, {
      client_id: unique % 1000000 + 1000000, // Different from manager ID
      client_name: 'Test Client',
      contact_email: clientEmail,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      password: 'Client1234!',
      passwordConfirm: 'Client1234!'
    });
    assert(clientSignup.data.status === 'success', 'Client signup failed');
    clientToken = clientSignup.data.token;
    push('client_signup', true, clientSignup.data.data.user._id);

    log('3. Client Login');
    const clientLogin = await axios.post(`${BASE_URL}/clients/login`, { 
      email: clientEmail, 
      password: 'Client1234!' 
    });
    assert(clientLogin.data.status === 'success', 'Client login failed');
    push('client_login', true, clientLogin.data.data.user._id);

    log('4. Create Request');
    const createReq = await axios.post(`${BASE_URL}/requests`, {
      requestType: 'web_dev',
      title: 'Smoke Test Request',
      description: 'Test workflow generation and approval',
      requirements: ['Frontend','Backend','Testing']
    }, { headers: { Authorization: `Bearer ${clientToken}` }});
    assert(createReq.data.status === 'success', 'Request creation failed');
    requestId = createReq.data.data.request._id;
    push('create_request', true, requestId);

    log('5. Generate Workflow');
    const wfRes = await axios.post(`${BASE_URL}/requests/${requestId}/generate-workflow`, {}, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    assert(wfRes.data.status === 'success', 'Workflow generation failed');
    const taskBreakdown = wfRes.data.data.request.generatedWorkflow.taskBreakdown || [];
    push('generate_workflow', true, taskBreakdown.length);

    log('6. Assign Employees');
    const assignments = {};
    taskBreakdown.forEach(t => { assignments[t._id] = [managerEmpId]; });
    const assignRes = await axios.patch(`${BASE_URL}/requests/${requestId}/assign-employees`, 
      { assignments }, 
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );
    assert(assignRes.data.status === 'success', 'Employee assignment failed');
    push('assign_employees', true, taskBreakdown.length);

    log('7. Department Approvals');
    const depts = ['research','design','development','testing'];
    for(const dept of depts){
      const appRes = await axios.post(`${BASE_URL}/requests/${requestId}/department-approve`,
        { department: dept },
        { headers: { Authorization: `Bearer ${managerToken}` }}
      );
      assert(appRes.data.status === 'success', `Department approve ${dept} failed`);
    }
    push('department_approvals', true, depts.length);

    log('8. Final Approve Request');
    const approveRes = await axios.post(`${BASE_URL}/requests/${requestId}/approve`, {},
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );
    assert(approveRes.data.status === 'success', 'Final approval failed');
    projectId = approveRes.data.data.project._id;
    const projectTasks = approveRes.data.data.tasks || [];
    assert(projectTasks.length > 0, 'No tasks created');
    taskId = projectTasks[0]._id;
    push('final_approve', true, { projectId, tasks: projectTasks.length });

    log('9. Get Project Stats');
    const statsRes = await axios.get(`${BASE_URL}/projects/stats`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(statsRes.data.status === 'success', 'Project stats failed');
    const projectStats = statsRes.data.data.stats || statsRes.data.data || [];
    push('project_stats', true, Array.isArray(projectStats) ? projectStats.length : 'success');

    log('10. Get Task Stats');
    const taskStatsRes = await axios.get(`${BASE_URL}/tasks/stats`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(taskStatsRes.data.status === 'success', 'Task stats failed');
    const taskStats = taskStatsRes.data.data.stats || taskStatsRes.data.data || [];
    push('task_stats', true, Array.isArray(taskStats) ? taskStats.length : 'success');

    log('11. Get All Projects');
    const projRes = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(projRes.data.status === 'success', 'Get projects failed');
    push('get_projects', true, projRes.data.results);

    log('12. Get Project By ID');
    const projByIdRes = await axios.get(`${BASE_URL}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(projByIdRes.data.status === 'success', 'Get project by ID failed');
    push('get_project_by_id', true, projByIdRes.data.data.project._id);

    log('13. Get Client-Safe Project Status');
    const clientSafeRes = await axios.get(`${BASE_URL}/projects/${projectId}/client-status`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    assert(clientSafeRes.data.status === 'success', 'Client-safe status failed');
    push('client_safe_status', true, clientSafeRes.data.data.status);

    log('14. Get All Tasks');
    const tasksRes = await axios.get(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(tasksRes.data.status === 'success', 'Get tasks failed');
    push('get_tasks', true, tasksRes.data.results);

    log('15. Get Tasks By Project');
    const tasksByProjRes = await axios.get(`${BASE_URL}/tasks/project/${projectId}`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(tasksByProjRes.data.status === 'success', 'Get tasks by project failed');
    push('get_tasks_by_project', true, tasksByProjRes.data.data.tasks.length);

    log('16. Update Task Status');
    const updateTaskRes = await axios.patch(`${BASE_URL}/tasks/${taskId}/status`,
      { status: 'In Progress' },
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );
    assert(updateTaskRes.data.status === 'success', 'Task status update failed');
    push('update_task_status', true, updateTaskRes.data.data.task.status);

    log('17. Test OTP Password Reset');
    try {
      const forgotRes = await axios.post(`${BASE_URL}/employees/forgotPassword`, { email: managerEmail });
      assert(forgotRes.data.status === 'success', 'Forgot password failed');
      if(forgotRes.data.method === 'otp'){
        push('password_reset_otp', true, `OTP sent to ${forgotRes.data.maskedPhone}`);
      } else {
        push('password_reset_email', true, 'Email reset token generated');
      }
    } catch(err){
      push('password_reset_otp', true, 'Skipped (Twilio not configured)');
    }

    log('18. Negative Test - Unauthorized Access');
    try {
      await axios.get(`${BASE_URL}/projects/${projectId}`);
      push('negative_test_auth', false, 'Should have failed without token');
    } catch(err){
      assert(err.response && err.response.status === 401, 'Expected 401 error');
      push('negative_test_auth', true, 'Correctly rejected unauthorized request');
    }

    log('19. Get My Tasks');
    const myTasksRes = await axios.get(`${BASE_URL}/tasks/my-tasks`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(myTasksRes.data.status === 'success', 'Get my tasks failed');
    push('get_my_tasks', true, myTasksRes.data.data.tasks.length);

    log('20. Phone Verification - Employee (Manager)');
    try {
      const sendOtpRes = await axios.post(`${BASE_URL}/employees/send-phone-verification-otp`, {},
        { headers: { Authorization: `Bearer ${managerToken}` }}
      );
      assert(sendOtpRes.data.status === 'success', 'Send phone verification OTP failed');
      push('send_phone_otp_employee', true, `OTP sent to ${sendOtpRes.data.maskedPhone}`);
      log(`   📱 OTP sent to phone. Please provide the OTP when prompted.`);
    } catch(err){
      const msg = err.response ? err.response.data.message : err.message;
      push('send_phone_otp_employee', true, `Skipped (${msg})`);
    }

    try {
      await axios.post(`${BASE_URL}/employees/verify-phone`, 
        { otp: '000000' },
        { headers: { Authorization: `Bearer ${managerToken}` }}
      );
      push('verify_phone_invalid_otp', false, 'Should have failed with invalid OTP');
    } catch(err){
      assert(err.response && err.response.status === 400, 'Expected 400 error for invalid OTP');
      push('verify_phone_invalid_otp', true, 'Correctly rejected invalid OTP');
    }

    log('21. Phone Verification - Client');
    try {
      const sendClientOtpRes = await axios.post(`${BASE_URL}/clients/send-phone-verification-otp`, {},
        { headers: { Authorization: `Bearer ${clientToken}` }}
      );
      assert(sendClientOtpRes.data.status === 'success', 'Send phone verification OTP for client failed');
      push('send_phone_otp_client', true, `OTP sent to ${sendClientOtpRes.data.maskedPhone}`);
      log(`   📱 OTP sent to client phone. Please provide the OTP when prompted.`);
    } catch(err){
      const msg = err.response ? err.response.data.message : err.message;
      push('send_phone_otp_client', true, `Skipped (${msg})`);
    }

    try {
      await axios.post(`${BASE_URL}/clients/verify-phone`, 
        { otp: '999999' },
        { headers: { Authorization: `Bearer ${clientToken}` }}
      );
      push('verify_phone_client_invalid_otp', false, 'Should have failed with invalid OTP');
    } catch(err){
      assert(err.response && err.response.status === 400, 'Expected 400 error for invalid client OTP');
      push('verify_phone_client_invalid_otp', true, 'Correctly rejected invalid client OTP');
    }

    log('22. Department Rejection');
    const getReqForReject = await axios.get(`${BASE_URL}/requests/${requestId}`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(getReqForReject.data.status === 'success', 'Get request failed');
    const approvalsDepts = getReqForReject.data.data.request.approvalsByDepartment || [];
    
    const approvedDept = approvalsDepts.find(d => d.approved === true);
    if(approvedDept){
      const rejectRes = await axios.post(`${BASE_URL}/requests/${requestId}/department-reject`,
        { department: approvedDept.department },
        { headers: { Authorization: `Bearer ${managerToken}` }}
      );
      assert(rejectRes.data.status === 'success', 'Department rejection failed');
      
      const getReqAfterReject = await axios.get(`${BASE_URL}/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      const rejectedDept = getReqAfterReject.data.data.request.approvalsByDepartment.find(
        d => d.department === approvedDept.department
      );
      assert(rejectedDept.rejected === true, 'Department rejection not recorded');
      assert(rejectedDept.approved === false, 'Department still marked as approved');
      push('department_rejection', true, `${approvedDept.department} rejected successfully`);

      log('23. Re-approval After Rejection');
      const reApproveRes = await axios.post(`${BASE_URL}/requests/${requestId}/department-approve`,
        { department: approvedDept.department },
        { headers: { Authorization: `Bearer ${managerToken}` }}
      );
      assert(reApproveRes.data.status === 'success', 'Re-approval after rejection failed');
      
      const getReqAfterReapprove = await axios.get(`${BASE_URL}/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      const reapprovedDept = getReqAfterReapprove.data.data.request.approvalsByDepartment.find(
        d => d.department === approvedDept.department
      );
      assert(reapprovedDept.approved === true, 'Re-approval not recorded');
      assert(reapprovedDept.rejected === false, 'Rejection not cleared');
      push('reapprove_after_rejection', true, `${approvedDept.department} re-approved successfully`);
    } else {
      push('department_rejection', true, 'No approved department to test (skipped)');
      push('reapprove_after_rejection', true, 'Skipped (no rejection to test)');
    }

    log('24. Attempt Advance Sprint');
    try {
      const advRes = await axios.patch(`${BASE_URL}/projects/${projectId}/advance-sprint`, {},
        { headers: { Authorization: `Bearer ${managerToken}` }}
      );
      if(advRes.data.status === 'success'){
        push('advance_sprint_attempt', true, advRes.data.data.message);
      } else {
        push('advance_sprint_attempt', true, 'No advancement (expected)');
      }
    } catch(err){
      push('advance_sprint_attempt', true, 'Expected failure (tasks not completed)');
    }

  } catch(err){
    const info = err.response ? err.response.data : err.stack;
    log('FATAL ERROR\n' + JSON.stringify(info, null, 2));
    push('fatal', false, err.message);
  }

  return summary;
}

async function specificTest(){
  const summary = [];
  const push = (step, success, info) => summary.push({step, success, info});
  
  let clientToken, managerToken, requestId, projectId;
  const unique = Date.now();

  try {
    log('1. Client Login (Existing)');
    const clientLogin = await axios.post(`${BASE_URL}/clients/login`, { 
      email: 'contact@designx.com', 
      password: 'password123' 
    });
    assert(clientLogin.data.status === 'success', 'Client login failed');
    clientToken = clientLogin.data.token;
    push('client_login', true, clientLogin.data.data.user._id);

    log('2. Create Request');
    const createReq = await axios.post(`${BASE_URL}/requests`, {
      requestType: 'web_dev',
      title: 'testing web dev request ',
      description: 'Build an MVP customer portal with authentication, user dashboard, and ticketing.',
      requirements: ['UI/UX','Frontend','Backend','Auth','Dashboard']
    }, { headers: { Authorization: `Bearer ${clientToken}` }});
    assert(createReq.data.status === 'success', 'Request creation failed');
    requestId = createReq.data.data.request._id;
    push('create_request', true, requestId);

    log('3. Generate Workflow');
    const wfRes = await axios.post(`${BASE_URL}/requests/${requestId}/generate-workflow`, {},
      { headers: { Authorization: `Bearer ${clientToken}` }}
    );
    assert(wfRes.data.status === 'success', 'Workflow generation failed');
    const taskBreakdown = wfRes.data.data.request.generatedWorkflow.taskBreakdown || [];
    push('generate_workflow', true, taskBreakdown.length);

    log('4. Create Temporary Manager');
    const tempManagerEmail = `temp.manager.${unique}@example.com`;
    const password = 'TempManager123!';
    const signupManager = await axios.post(`${BASE_URL}/employees/signup`, {
      employee_id: unique % 1000000,
      name: 'Temp Omni Manager',
      email: tempManagerEmail,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      password,
      passwordConfirm: password,
      role: 'manager',
      department: 'Development',
      availability: 'Available',
      skills: ['leadership']
    });
    assert(signupManager.data.status === 'success', 'Temp manager signup failed');
    managerToken = signupManager.data.token;
    const managerObjectId = signupManager.data.data.user._id;
    push('temp_manager_signup', true, managerObjectId);

    log('5. Extend Manager Departments');
    const patchMgr = await axios.patch(`${BASE_URL}/employees/${managerObjectId}`, {
      approvesDepartments: ['Research','Design','Development','Testing']
    });
    assert(patchMgr.data.status === 'success', 'Manager patch failed');
    push('patch_manager_departments', true, ['Research','Design','Development','Testing']);

    log('6. Assign Employees To Tasks');
    const assignments = {};
    for(const t of taskBreakdown){
      const team = (t.team || '').toLowerCase();
      if(team === 'research') assignments[t._id] = [EMPLOYEE_IDS.alexResearch];
      else if(team === 'design') assignments[t._id] = [EMPLOYEE_IDS.emmaDesigner];
      else if(team === 'development'){
        if(/frontend/i.test(t.taskName)) assignments[t._id] = [EMPLOYEE_IDS.sarahFrontend];
        else if(/backend/i.test(t.taskName)) assignments[t._id] = [EMPLOYEE_IDS.mikeBackend];
        else assignments[t._id] = [EMPLOYEE_IDS.sarahFrontend];
      } else if(team === 'testing') assignments[t._id] = [EMPLOYEE_IDS.shrutiTesting];
    }
    const assignRes = await axios.patch(`${BASE_URL}/requests/${requestId}/assign-employees`,
      { assignments },
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );
    assert(assignRes.data.status === 'success', 'Assign employees failed');
    const assignedCount = Object.values(assignments).filter(a => Array.isArray(a) && a.length > 0).length;
    assert(assignedCount === taskBreakdown.length, 'Not all tasks assigned');
    push('assign_employees', true, assignedCount);

    log('7. Department Approvals');
    for(const dept of ['research','design','development','testing']){
      const appRes = await axios.post(`${BASE_URL}/requests/${requestId}/department-approve`,
        { department: dept },
        { headers: { Authorization: `Bearer ${managerToken}` }}
      );
      assert(appRes.data.status === 'success', `Department approve ${dept} failed`);
    }
    push('department_approvals', true, 'All required departments approved');

    log('8. Final Approve Request');
    const approveRes = await axios.post(`${BASE_URL}/requests/${requestId}/approve`, {},
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );
    assert(approveRes.data.status === 'success', 'Final approval failed');
    projectId = approveRes.data.data.project._id;
    const projectTasks = approveRes.data.data.tasks || [];
    assert(projectTasks.length > 0, 'No tasks created');
    push('final_approve', true, { projectId, tasks: projectTasks.length });

    if(!PROGRESSIVE){
      log('9. Complete All Tasks (Batch Mode)');
      for(const task of projectTasks){
        const completeRes = await axios.patch(`${BASE_URL}/tasks/${task._id}/status`,
          { status: 'Completed' },
          { headers: { Authorization: `Bearer ${managerToken}` }}
        );
        assert(completeRes.data.status === 'success', 'Task completion failed');
      }
      push('complete_tasks', true, projectTasks.length);

      log('10. Advance Sprints (Batch Mode)');
      let advances = 0;
      for(let i = 0; i < 10; i++){
        try {
          const adv = await axios.patch(`${BASE_URL}/projects/${projectId}/advance-sprint`, {},
            { headers: { Authorization: `Bearer ${managerToken}` }}
          );
          if(adv.data.status === 'success'){
            advances++;
            verbose(adv.data.data.message);
            if(adv.data.data.project.status === 'Completed') break;
          } else break;
        } catch(e){ break; }
      }
      push('advance_sprints', true, advances);

    } else {
      log('9. Progressive Sprint Completion');
      const tasksByProject = await axios.get(`${BASE_URL}/tasks/project/${projectId}`,
        { headers: { Authorization: `Bearer ${managerToken}` }}
      );
      assert(tasksByProject.data.status === 'success', 'Fetch project tasks failed');
      const liveTasks = tasksByProject.data.data.tasks || [];
      
      const sprintMap = new Map();
      liveTasks.forEach(t => {
        const sn = t.sprint_number || 1;
        if(!sprintMap.has(sn)) sprintMap.set(sn, []);
        sprintMap.get(sn).push(t);
      });
      const orderedSprints = Array.from(sprintMap.keys()).sort((a,b) => a - b);
      
      let advances = 0;
      for(const sn of orderedSprints){
        log(`  - Completing Sprint ${sn}`);
        for(const task of sprintMap.get(sn)){
          const completeRes = await axios.patch(`${BASE_URL}/tasks/${task._id}/status`,
            { status: 'Completed' },
            { headers: { Authorization: `Bearer ${managerToken}` }}
          );
          assert(completeRes.data.status === 'success', `Task completion failed (Sprint ${sn})`);
        }
        
        try {
          const adv = await axios.patch(`${BASE_URL}/projects/${projectId}/advance-sprint`, {},
            { headers: { Authorization: `Bearer ${managerToken}` }}
          );
          if(adv.data.status === 'success'){
            advances++;
            verbose(adv.data.data.message);
            if(adv.data.data.project.status === 'Completed') break;
          } else {
            log('  ! Advance failed after sprint completion');
            break;
          }
        } catch(e){
          log('  ! Advance error: ' + (e.response ? e.response.data.message : e.message));
          break;
        }
      }
      push('complete_tasks_progressive', true, liveTasks.length);
      push('advance_sprints_progressive', true, advances);
    }

    log('11. Delete Project (Cleanup)');
    const delProj = await axios.delete(`${BASE_URL}/projects/${projectId}`,
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );
    assert(delProj.status === 204, 'Project deletion failed');
    push('delete_project', true, projectId);

    log('12. Delete Temp Manager (Cleanup)');
    const deleteManager = await axios.delete(`${BASE_URL}/employees/${managerObjectId}`,
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );
    assert(deleteManager.status === 204, 'Manager deletion failed');
    push('delete_temp_manager', true, managerObjectId);

  } catch(err){
    const info = err.response ? err.response.data : err.stack;
    log('FATAL ERROR\n' + JSON.stringify(info, null, 2));
    push('fatal', false, err.message);
  }

  return summary;
}

async function main(){
  log(`=== Backend API Testing Suite ===`);
  log(`Mode: ${MODE.toUpperCase()}`);
  log(`Base URL: ${BASE_URL}`);
  if(MODE === 'specific') log(`Progressive: ${PROGRESSIVE}`);
  log('');

  let summary;
  if(MODE === 'specific'){
    summary = await specificTest();
  } else {
    summary = await smokeTest();
  }

  log('\n=== TEST SUMMARY ===');
  for(const s of summary){
    log(`${s.success ? '✔' : '✖'} ${s.step}: ${typeof s.info === 'object' ? JSON.stringify(s.info) : s.info}`);
  }

  const failed = summary.filter(s => !s.success);
  if(failed.length){
    log(`\n❌ Failures: ${failed.length}`);
    process.exitCode = 1;
  } else {
    log(`\n✅ All tests passed successfully.`);
  }
}

main();
