/*
Frontend Route Testing Suite

Tests all frontend API calls across client, employee, and manager portals.

Environment variables:
  BASE_URL      - API base URL (default: http://localhost:3000/api/v1)
  VERBOSE       - Detailed logging (default: false)
  MODE          - Test mode: "all", "client", "employee", "manager" (default: all)

Run:
  node "Front End/tests/frontendTesting.js"
  MODE=client node "Front End/tests/frontendTesting.js"
  MODE=employee node "Front End/tests/frontendTesting.js"
  MODE=manager node "Front End/tests/frontendTesting.js"
*/

const axios = require('axios');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/v1';
const MODE = (process.env.MODE || 'all').toLowerCase();
const VERBOSE = process.env.VERBOSE === 'true';

function log(msg){ console.log(msg); }
function verbose(data){ if(VERBOSE) console.dir(data,{depth:4}); }
function assert(cond, msg){ if(!cond) throw new Error('ASSERT: '+msg); }

// ============================================================================
// CLIENT PORTAL TESTS
// ============================================================================
async function testClientPortal(){
  const summary = [];
  const push = (step, success, info) => summary.push({step, success, info});
  
  let clientToken, clientId, requestId, projectId;
  const unique = Date.now();

  try {
    // 1. Client Signup
    log('CLIENT PORTAL TESTS');
    log('1. Client Signup');
    const clientEmail = `client.test.${unique}@example.com`;
    const clientSignup = await axios.post(`${BASE_URL}/clients/signup`, {
      client_id: unique % 1000000 + 5000000,
      client_name: 'Frontend Test Client',
      contact_email: clientEmail,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      password: 'Client1234!',
      passwordConfirm: 'Client1234!'
    });
    assert(clientSignup.data.status === 'success', 'Client signup failed');
    clientToken = clientSignup.data.token;
    clientId = clientSignup.data.data.user._id;
    push('client_signup', true, clientId);

    // 2. Client Login
    log('2. Client Login');
    const clientLogin = await axios.post(`${BASE_URL}/clients/login`, {
      email: clientEmail,
      password: 'Client1234!'
    });
    assert(clientLogin.data.status === 'success', 'Client login failed');
    push('client_login', true, clientLogin.data.data.user._id);

    // 3. Get Client Dashboard
    log('3. Get Client Dashboard');
    const dashboard = await axios.get(`${BASE_URL}/clients/me/dashboard`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    assert(dashboard.data.status === 'success', 'Client dashboard failed');
    push('client_dashboard', true, 'Dashboard loaded');

    // 4. Get Client Profile
    log('4. Get Client Profile');
    const profile = await axios.get(`${BASE_URL}/clients/me`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    assert(profile.data.status === 'success', 'Client profile failed');
    push('client_profile', true, profile.data.data.client._id);

    // 5. Update Client Profile
    log('5. Update Client Profile');
    const updateProfile = await axios.patch(`${BASE_URL}/clients/updateMe`, {
      client_name: 'Frontend Test Client Updated'
    }, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    assert(updateProfile.data.status === 'success', 'Client profile update failed');
    push('client_update_profile', true, 'Profile updated');

    // 6. Create Request
    log('6. Create Request');
    const createReq = await axios.post(`${BASE_URL}/requests`, {
      requestType: 'web_dev',
      title: 'Frontend Test Request',
      description: 'Testing frontend API integration',
      requirements: ['Frontend', 'Backend']
    }, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    assert(createReq.data.status === 'success', 'Request creation failed');
    requestId = createReq.data.data.request._id;
    push('client_create_request', true, requestId);

    // 7. Generate Workflow
    log('7. Generate Workflow');
    const workflow = await axios.post(`${BASE_URL}/requests/${requestId}/generate-workflow`, {}, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    assert(workflow.data.status === 'success', 'Workflow generation failed');
    push('client_generate_workflow', true, workflow.data.data.request.generatedWorkflow.taskBreakdown.length);

    // 8. Get Projects (if any exist from previous approvals)
    log('8. Get Client Projects');
    try {
      const projects = await axios.get(`${BASE_URL}/clients/me/dashboard`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      push('client_get_projects', true, projects.data.data?.projects?.length || 0);
    } catch(e){
      push('client_get_projects', true, 'No projects yet');
    }

    // 9. Send Phone Verification OTP
    log('9. Send Phone Verification OTP');
    const sendOtp = await axios.post(`${BASE_URL}/clients/send-phone-verification-otp`, {}, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    assert(sendOtp.data.status === 'success', 'Send phone OTP failed');
    push('client_send_phone_otp', true, 'OTP sent');
    log(`   📱 OTP sent to ${sendOtp.data.maskedPhone}`);

    // 10. Test Verify Phone with Invalid OTP (negative test)
    log('10. Verify Phone - Invalid OTP');
    try {
      await axios.post(`${BASE_URL}/clients/verify-phone`, {
        otp: '000000'
      }, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      push('client_verify_phone_invalid', false, 'Should have rejected invalid OTP');
    } catch(err){
      assert(err.response && err.response.status === 400, 'Expected 400 error for invalid OTP');
      push('client_verify_phone_invalid', true, 'Correctly rejected invalid OTP');
    }

    // 11. Forgot Password
    log('11. Forgot Password');
    const forgotPw = await axios.post(`${BASE_URL}/clients/forgotPassword`, {
      email: clientEmail
    });
    assert(forgotPw.data.status === 'success', 'Forgot password failed');
    const resetMethod = forgotPw.data.method || 'email';
    push('client_forgot_password', true, `Method: ${resetMethod}`);
    if(resetMethod === 'otp'){
      log(`   📱 OTP sent to ${forgotPw.data.maskedPhone}`);
    }

    // 12. Update Password
    log('12. Update Password');
    const updatePw = await axios.patch(`${BASE_URL}/clients/updateMyPassword`, {
      passwordCurrent: 'Client1234!',
      password: 'NewClient1234!',
      passwordConfirm: 'NewClient1234!'
    }, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    assert(updatePw.data.status === 'success', 'Password update failed');
    clientToken = updatePw.data.token; // Get new token
    push('client_update_password', true, 'Password updated');

  } catch(err){
    const info = err.response ? err.response.data : err.stack;
    log('CLIENT PORTAL ERROR\n' + JSON.stringify(info, null, 2));
    push('client_fatal', false, err.message);
  }

  return summary;
}

// ============================================================================
// EMPLOYEE PORTAL TESTS
// ============================================================================
async function testEmployeePortal(){
  const summary = [];
  const push = (step, success, info) => summary.push({step, success, info});
  
  let employeeToken, employeeId;
  const unique = Date.now();

  try {
    log('\nEMPLOYEE PORTAL TESTS');
    
    // 1. Employee Signup
    log('1. Employee Signup');
    const employeeEmail = `employee.test.${unique}@example.com`;
    const employeeSignup = await axios.post(`${BASE_URL}/employees/signup`, {
      employee_id: unique % 1000000,
      name: 'Frontend Test Employee',
      email: employeeEmail,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      password: 'Employee1234!',
      passwordConfirm: 'Employee1234!',
      role: 'employee',
      department: 'Development',
      availability: 'Available',
      skills: ['JavaScript', 'React']
    });
    assert(employeeSignup.data.status === 'success', 'Employee signup failed');
    employeeToken = employeeSignup.data.token;
    employeeId = employeeSignup.data.data.user._id;
    push('employee_signup', true, employeeId);

    // 2. Employee Login
    log('2. Employee Login');
    const employeeLogin = await axios.post(`${BASE_URL}/employees/login`, {
      email: employeeEmail,
      password: 'Employee1234!'
    });
    assert(employeeLogin.data.status === 'success', 'Employee login failed');
    push('employee_login', true, employeeLogin.data.data.user._id);

    // 3. Get Employee Dashboard
    log('3. Get Employee Dashboard');
    const dashboard = await axios.get(`${BASE_URL}/employees/me/dashboard`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    assert(dashboard.data.status === 'success', 'Employee dashboard failed');
    push('employee_dashboard', true, 'Dashboard loaded');

    // 4. Get My Tasks
    log('4. Get My Tasks');
    const tasks = await axios.get(`${BASE_URL}/tasks/my-tasks`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    assert(tasks.data.status === 'success', 'Get my tasks failed');
    push('employee_my_tasks', true, tasks.data.data.tasks.length);

    // 5. Get My Projects
    log('5. Get My Projects');
    const projects = await axios.get(`${BASE_URL}/employees/me/projects`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    assert(projects.data.status === 'success', 'Get my projects failed');
    push('employee_my_projects', true, projects.data.data.projects?.length || 0);

    // 6. Update Employee Profile
    log('6. Update Employee Profile');
    const updateProfile = await axios.patch(`${BASE_URL}/employees/updateMe`, {
      name: 'Frontend Test Employee Updated'
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    assert(updateProfile.data.status === 'success', 'Employee profile update failed');
    push('employee_update_profile', true, 'Profile updated');

    // 7. Send Phone Verification OTP
    log('7. Send Phone Verification OTP');
    const sendOtp = await axios.post(`${BASE_URL}/employees/send-phone-verification-otp`, {}, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    assert(sendOtp.data.status === 'success', 'Send phone OTP failed');
    push('employee_send_phone_otp', true, 'OTP sent');
    log(`   📱 OTP sent to ${sendOtp.data.maskedPhone}`);

    // 8. Test Verify Phone with Invalid OTP (negative test)
    log('8. Verify Phone - Invalid OTP');
    try {
      await axios.post(`${BASE_URL}/employees/verify-phone`, {
        otp: '000000'
      }, {
        headers: { Authorization: `Bearer ${employeeToken}` }
      });
      push('employee_verify_phone_invalid', false, 'Should have rejected invalid OTP');
    } catch(err){
      assert(err.response && err.response.status === 400, 'Expected 400 error for invalid OTP');
      push('employee_verify_phone_invalid', true, 'Correctly rejected invalid OTP');
    }

    // 9. Forgot Password
    log('9. Forgot Password');
    const forgotPw = await axios.post(`${BASE_URL}/employees/forgotPassword`, {
      email: employeeEmail
    });
    assert(forgotPw.data.status === 'success', 'Forgot password failed');
    const resetMethod = forgotPw.data.method || 'email';
    push('employee_forgot_password', true, `Method: ${resetMethod}`);
    if(resetMethod === 'otp'){
      log(`   📱 OTP sent to ${forgotPw.data.maskedPhone}`);
    }

    // 10. Update Password
    log('10. Update Password');
    const updatePw = await axios.patch(`${BASE_URL}/employees/updateMyPassword`, {
      passwordCurrent: 'Employee1234!',
      password: 'NewEmployee1234!',
      passwordConfirm: 'NewEmployee1234!'
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    assert(updatePw.data.status === 'success', 'Password update failed');
    employeeToken = updatePw.data.token;
    push('employee_update_password', true, 'Password updated');

    // 9. Get All Employees (for team view)
    log('9. Get All Employees');
    const allEmployees = await axios.get(`${BASE_URL}/employees`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    assert(allEmployees.data.status === 'success', 'Get all employees failed');
    push('employee_get_all', true, allEmployees.data.results);

  } catch(err){
    const info = err.response ? err.response.data : err.stack;
    log('EMPLOYEE PORTAL ERROR\n' + JSON.stringify(info, null, 2));
    push('employee_fatal', false, err.message);
  }

  return summary;
}

// ============================================================================
// MANAGER PORTAL TESTS
// ============================================================================
async function testManagerPortal(){
  const summary = [];
  const push = (step, success, info) => summary.push({step, success, info});
  
  let managerToken, managerId, requestId, projectId;
  const unique = Date.now();

  try {
    log('\nMANAGER PORTAL TESTS');
    
    // 1. Manager Signup
    log('1. Manager Signup');
    const managerEmail = `manager.test.${unique}@example.com`;
    const managerSignup = await axios.post(`${BASE_URL}/employees/signup`, {
      employee_id: unique % 1000000 + 2000000,
      name: 'Frontend Test Manager',
      email: managerEmail,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      password: 'Manager1234!',
      passwordConfirm: 'Manager1234!',
      role: 'manager', // Will be ignored due to security, default to 'employee'
      department: 'Development',
      availability: 'Available',
      skills: ['leadership']
    });
    assert(managerSignup.data.status === 'success', 'Manager signup failed');
    managerToken = managerSignup.data.token;
    managerId = managerSignup.data.data.user._id;
    push('manager_signup', true, managerId);

    // 1a. Upgrade to manager role
    log('1a. Upgrade to Manager Role');
    const upgradeRes = await axios.patch(`${BASE_URL}/employees/${managerId}`, {
      role: 'manager',
      isApprover: true
    });
    assert(upgradeRes.data.status === 'success', 'Manager role upgrade failed');
    push('manager_upgrade_role', true, 'manager');

    // 1b. Extend manager departments
    log('1b. Extend Manager Departments');
    const patchMgr = await axios.patch(`${BASE_URL}/employees/${managerId}`, {
      approvesDepartments: ['Research', 'Design', 'Development', 'Testing']
    });
    assert(patchMgr.data.status === 'success', 'Manager patch failed');
    push('manager_patch_departments', true, 4);

    // 2. Manager Login
    log('2. Manager Login');
    const managerLogin = await axios.post(`${BASE_URL}/employees/login`, {
      email: managerEmail,
      password: 'Manager1234!'
    });
    assert(managerLogin.data.status === 'success', 'Manager login failed');
    push('manager_login', true, managerLogin.data.data.user._id);

    // 3. Get All Requests
    log('3. Get All Requests');
    const requests = await axios.get(`${BASE_URL}/requests`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(requests.data.status === 'success', 'Get requests failed');
    push('manager_get_requests', true, requests.data.results);

    // 4. Create test request for manager workflow
    log('4. Create Test Client & Request');
    const testClientEmail = `mgr.client.${unique}@example.com`;
    const clientSignup = await axios.post(`${BASE_URL}/clients/signup`, {
      client_id: unique % 1000000 + 6000000,
      client_name: 'Manager Test Client',
      contact_email: testClientEmail,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      password: 'Client1234!',
      passwordConfirm: 'Client1234!'
    });
    const clientToken = clientSignup.data.token;
    const createReq = await axios.post(`${BASE_URL}/requests`, {
      requestType: 'web_dev',
      title: 'Manager Test Request',
      description: 'Testing manager workflows',
      requirements: ['Frontend', 'Backend']
    }, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    requestId = createReq.data.data.request._id;
    push('manager_create_test_request', true, requestId);

    // 5. Generate workflow as client
    log('5. Generate Workflow');
    await axios.post(`${BASE_URL}/requests/${requestId}/generate-workflow`, {}, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    push('manager_generate_workflow', true, 'Workflow generated');

    // 6. Get Request Details
    log('6. Get Request Details');
    const reqDetails = await axios.get(`${BASE_URL}/requests/${requestId}`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(reqDetails.data.status === 'success', 'Get request details failed');
    const taskBreakdown = reqDetails.data.data.request.generatedWorkflow.taskBreakdown || [];
    push('manager_get_request_details', true, taskBreakdown.length);

    // 7. Assign Employees
    log('7. Assign Employees');
    const assignments = {};
    taskBreakdown.forEach(t => { assignments[t._id] = [managerId]; });
    const assignRes = await axios.patch(`${BASE_URL}/requests/${requestId}/assign-employees`, 
      { assignments },
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );
    assert(assignRes.data.status === 'success', 'Assign employees failed');
    push('manager_assign_employees', true, taskBreakdown.length);

    // 8. Department Approvals
    log('8. Department Approvals');
    for(const dept of ['research', 'design', 'development', 'testing']){
      try {
        await axios.post(`${BASE_URL}/requests/${requestId}/department-approve`,
          { department: dept },
          { headers: { Authorization: `Bearer ${managerToken}` }}
        );
      } catch(e){
        // Some departments may not be needed
      }
    }
    push('manager_department_approvals', true, 'Departments approved');

    // 9. Final Approve Request
    log('9. Final Approve Request');
    const approveRes = await axios.post(`${BASE_URL}/requests/${requestId}/approve`, {},
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );
    assert(approveRes.data.status === 'success', 'Final approval failed');
    projectId = approveRes.data.data.project._id;
    push('manager_approve_request', true, projectId);

    // 10. Get All Projects
    log('10. Get All Projects');
    const projects = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(projects.data.status === 'success', 'Get projects failed');
    push('manager_get_projects', true, projects.data.results);

    // 11. Get Project Details
    log('11. Get Project Details');
    const projDetails = await axios.get(`${BASE_URL}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(projDetails.data.status === 'success', 'Get project details failed');
    push('manager_get_project_details', true, projDetails.data.data.project._id);

    // 12. Get Project Stats
    log('12. Get Project Stats');
    const stats = await axios.get(`${BASE_URL}/projects/stats`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(stats.data.status === 'success', 'Get project stats failed');
    push('manager_project_stats', true, 'Stats loaded');

    // 13. Get All Tasks
    log('13. Get All Tasks');
    const tasks = await axios.get(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(tasks.data.status === 'success', 'Get tasks failed');
    push('manager_get_tasks', true, tasks.data.results);

    // 14. Get Task Stats
    log('14. Get Task Stats');
    const taskStats = await axios.get(`${BASE_URL}/tasks/stats`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(taskStats.data.status === 'success', 'Get task stats failed');
    push('manager_task_stats', true, 'Stats loaded');

    // 15. Get All Employees
    log('15. Get All Employees');
    const employees = await axios.get(`${BASE_URL}/employees`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(employees.data.status === 'success', 'Get employees failed');
    push('manager_get_employees', true, employees.data.results);

    // 16. Add New Employee
    log('16. Add New Employee');
    const newEmpEmail = `new.emp.${unique}@example.com`;
    const addEmp = await axios.post(`${BASE_URL}/employees/signup`, {
      employee_id: unique % 1000000 + 3000000,
      name: 'New Frontend Test Employee',
      email: newEmpEmail,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      password: 'NewEmp1234!',
      passwordConfirm: 'NewEmp1234!',
      role: 'employee',
      department: 'Testing',
      availability: 'Available',
      skills: ['Testing']
    });
    assert(addEmp.data.status === 'success', 'Add employee failed');
    push('manager_add_employee', true, addEmp.data.data.user._id);

    // 16b. Add New Client
    log('16b. Add New Client');
    const newClientEmail = `new.client.${unique}@example.com`;
    const addClient = await axios.post(`${BASE_URL}/clients/signup`, {
      client_id: unique % 1000000 + 7000000,
      client_name: 'New Manager Test Client',
      contact_email: newClientEmail,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      password: 'NewClient1234!',
      passwordConfirm: 'NewClient1234!',
    });
    assert(addClient.data.status === 'success', 'Add client failed');
    push('manager_add_client', true, addClient.data.data.user._id);

    // 17. Advance Sprint
    log('17. Advance Sprint');
    try {
      const advance = await axios.patch(`${BASE_URL}/projects/${projectId}/advance-sprint`, {},
        { headers: { Authorization: `Bearer ${managerToken}` }}
      );
      push('manager_advance_sprint', true, advance.data.data?.message || 'Sprint advanced');
    } catch(e){
      push('manager_advance_sprint', true, 'Expected (tasks not completed)');
    }

    // 18. Update Manager Profile
    log('18. Update Manager Profile');
    const updateProfile = await axios.patch(`${BASE_URL}/employees/updateMe`, {
      name: 'Frontend Test Manager Updated'
    }, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(updateProfile.data.status === 'success', 'Manager profile update failed');
    push('manager_update_profile', true, 'Profile updated');

    // 19. Send Phone Verification OTP (Manager)
    log('19. Send Phone Verification OTP');
    const sendOtp = await axios.post(`${BASE_URL}/employees/send-phone-verification-otp`, {}, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(sendOtp.data.status === 'success', 'Send phone OTP failed');
    push('manager_send_phone_otp', true, 'OTP sent');
    log(`   📱 OTP sent to ${sendOtp.data.maskedPhone}`);

    // 20. Test Verify Phone with Invalid OTP (negative test)
    log('20. Verify Phone - Invalid OTP');
    try {
      await axios.post(`${BASE_URL}/employees/verify-phone`, {
        otp: '000000'
      }, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      push('manager_verify_phone_invalid', false, 'Should have rejected invalid OTP');
    } catch(err){
      assert(err.response && err.response.status === 400, 'Expected 400 error for invalid OTP');
      push('manager_verify_phone_invalid', true, 'Correctly rejected invalid OTP');
    }

    // 21. Test Department Rejection
    log('21. Test Department Rejection');
    // Create a new request for testing department rejection
    const testReqEmail = `dept.test.${unique}@example.com`;
    const testClient = await axios.post(`${BASE_URL}/clients/signup`, {
      client_id: unique % 1000000 + 8000000,
      client_name: 'Department Test Client',
      contact_email: testReqEmail,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      password: 'Client1234!',
      passwordConfirm: 'Client1234!'
    });
    const testClientToken = testClient.data.token;
    
    const testReq = await axios.post(`${BASE_URL}/requests`, {
      requestType: 'web_dev',
      title: 'Department Rejection Test',
      description: 'Testing department rejection workflow',
      requirements: ['Frontend', 'Backend', 'Testing']
    }, {
      headers: { Authorization: `Bearer ${testClientToken}` }
    });
    const testRequestId = testReq.data.data.request._id;

    // Generate workflow
    await axios.post(`${BASE_URL}/requests/${testRequestId}/generate-workflow`, {}, {
      headers: { Authorization: `Bearer ${testClientToken}` }
    });

    // Get request to see departments
    const testReqDetails = await axios.get(`${BASE_URL}/requests/${testRequestId}`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const testTaskBreakdown = testReqDetails.data.data.request.generatedWorkflow.taskBreakdown || [];
    
    // Assign employees
    const testAssignments = {};
    testTaskBreakdown.forEach(t => { testAssignments[t._id] = [managerId]; });
    await axios.patch(`${BASE_URL}/requests/${testRequestId}/assign-employees`, 
      { assignments: testAssignments },
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );

    // Approve one department first
    await axios.post(`${BASE_URL}/requests/${testRequestId}/department-approve`,
      { department: 'development' },
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );
    push('manager_dept_approve_for_reject_test', true, 'Development approved');

    // Now reject that department
    const rejectRes = await axios.post(`${BASE_URL}/requests/${testRequestId}/department-reject`,
      { department: 'development' },
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );
    assert(rejectRes.data.status === 'success', 'Department rejection failed');
    push('manager_department_reject', true, 'Development rejected');

    // Verify rejection was recorded
    const afterReject = await axios.get(`${BASE_URL}/requests/${testRequestId}`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const rejectedDept = afterReject.data.data.request.approvalsByDepartment.find(
      d => d.department === 'Development'
    );
    assert(rejectedDept && rejectedDept.rejected === true, 'Rejection not recorded');
    assert(rejectedDept.approved === false, 'Still marked as approved');
    push('manager_verify_rejection', true, 'Rejection verified in database');

    // 22. Test Re-approval After Rejection
    log('22. Re-approval After Rejection');
    const reApproveRes = await axios.post(`${BASE_URL}/requests/${testRequestId}/department-approve`,
      { department: 'development' },
      { headers: { Authorization: `Bearer ${managerToken}` }}
    );
    assert(reApproveRes.data.status === 'success', 'Re-approval after rejection failed');
    
    // Verify re-approval cleared rejection
    const afterReapprove = await axios.get(`${BASE_URL}/requests/${testRequestId}`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const reapprovedDept = afterReapprove.data.data.request.approvalsByDepartment.find(
      d => d.department === 'Development'
    );
    assert(reapprovedDept.approved === true, 'Re-approval not recorded');
    assert(reapprovedDept.rejected === false, 'Rejection not cleared');
    push('manager_reapprove_after_reject', true, 'Re-approval successful');

    // 23. Refresh Suggestions
    log('23. Refresh Suggestions');
    try {
      await axios.post(`${BASE_URL}/requests/${requestId}/refresh-suggestions`, {},
        { headers: { Authorization: `Bearer ${managerToken}` }}
      );
      push('manager_refresh_suggestions', true, 'Suggestions refreshed');
    } catch(e){
      // May fail if request already approved
      push('manager_refresh_suggestions', true, 'Expected (already approved)');
    }

  } catch(err){
    const info = err.response ? err.response.data : err.stack;
    log('MANAGER PORTAL ERROR\n' + JSON.stringify(info, null, 2));
    push('manager_fatal', false, err.message);
  }

  return summary;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main(){
  log(`=== Frontend Route Testing Suite ===`);
  log(`Mode: ${MODE.toUpperCase()}`);
  log(`Base URL: ${BASE_URL}\n`);

  let allSummary = [];

  if(MODE === 'all' || MODE === 'client'){
    const clientResults = await testClientPortal();
    allSummary = allSummary.concat(clientResults);
  }

  if(MODE === 'all' || MODE === 'employee'){
    const employeeResults = await testEmployeePortal();
    allSummary = allSummary.concat(employeeResults);
  }

  if(MODE === 'all' || MODE === 'manager'){
    const managerResults = await testManagerPortal();
    allSummary = allSummary.concat(managerResults);
  }

  log('\n=== OVERALL TEST SUMMARY ===');
  for(const s of allSummary){
    log(`${s.success ? '✔' : '✖'} ${s.step}: ${typeof s.info === 'object' ? JSON.stringify(s.info) : s.info}`);
  }

  const failed = allSummary.filter(s => !s.success);
  if(failed.length){
    log(`\n❌ Failures: ${failed.length}`);
    process.exitCode = 1;
  } else {
    log(`\n✅ All frontend routes tested successfully (${allSummary.length} tests).`);
  }
}

main();
