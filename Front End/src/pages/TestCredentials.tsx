import { Header } from "../components/landing/Header";
import { Footer } from "../components/landing/Footer";
import { User, UserCog, Users, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

const TestCredentials = () => {
  const [copiedText, setCopiedText] = useState<string>("");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const CredentialCard = ({ 
    email, 
    password, 
    label 
  }: { 
    email: string; 
    password: string; 
    label: string;
  }) => (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Email:</label>
            <button
              onClick={() => copyToClipboard(email, `${label}-email`)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Copy email"
            >
              {copiedText === `${label}-email` ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
          <code className="text-sm bg-white px-3 py-2 rounded border border-gray-300 block">
            {email}
          </code>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Password:</label>
            <button
              onClick={() => copyToClipboard(password, `${label}-password`)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Copy password"
            >
              {copiedText === `${label}-password` ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
          <code className="text-sm bg-white px-3 py-2 rounded border border-gray-300 block">
            {password}
          </code>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="flex-1 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Demo Portal Test Credentials
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Use these test accounts to explore the Intelliflow demo portal. Each account type has different permissions and views.
            </p>
          </div>

          {/* Client Accounts */}
          <section className="mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center gap-3 text-white">
                  <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Client Accounts</h2>
                    <p className="text-blue-100">Submit requests and track project progress</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">DesignX Ltd</h3>
                    <CredentialCard
                      email="contact@designx.com"
                      password="password123"
                      label="client-1"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">GreenTech Pvt</h3>
                    <CredentialCard
                      email="main@greentech.dev"
                      password="password123"
                      label="client-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Manager Accounts */}
          <section className="mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
                <div className="flex items-center gap-3 text-white">
                  <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <UserCog className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Manager Accounts</h2>
                    <p className="text-purple-100">Approve requests, assign tasks, manage teams</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4 bg-purple-50 border-l-4 border-purple-600 p-3 rounded-r">
                  <strong>Password for all managers:</strong> password123
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Department 1 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Client Success / Sales</h3>
                    <CredentialCard
                      email="simran.thakur@company.com"
                      password="password123"
                      label="manager-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Simran Thakur - Account Manager</p>
                  </div>

                  {/* Department 2 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Product Management</h3>
                    <CredentialCard
                      email="komal.aggarwal@company.com"
                      password="password123"
                      label="manager-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Komal Aggarwal - Product Owner</p>
                  </div>

                  {/* Department 3 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">UX / Research</h3>
                    <CredentialCard
                      email="priya.sharma@company.com"
                      password="password123"
                      label="manager-3"
                    />
                    <p className="text-xs text-gray-500 mt-1">Priya Sharma - UX Designer</p>
                  </div>

                  {/* Department 4 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">UI / Visual Design</h3>
                    <CredentialCard
                      email="sneha.dutta@company.com"
                      password="password123"
                      label="manager-4"
                    />
                    <p className="text-xs text-gray-500 mt-1">Sneha Dutta - UI Designer</p>
                  </div>

                  {/* Department 5 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Engineering</h3>
                    <CredentialCard
                      email="rohan.verma@company.com"
                      password="password123"
                      label="manager-5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Rohan Verma - Frontend Engineer</p>
                  </div>

                  {/* Department 6 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">QA / Testing</h3>
                    <CredentialCard
                      email="shruti.bansal@company.com"
                      password="password123"
                      label="manager-6"
                    />
                    <p className="text-xs text-gray-500 mt-1">Shruti Bansal - QA Tester</p>
                  </div>

                  {/* Department 7 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Project Management</h3>
                    <CredentialCard
                      email="neha.saxena@company.com"
                      password="password123"
                      label="manager-7"
                    />
                    <p className="text-xs text-gray-500 mt-1">Neha Saxena - Scrum Master</p>
                  </div>

                  {/* Department 8 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">DevOps / Handoff</h3>
                    <CredentialCard
                      email="vivek.nair@company.com"
                      password="password123"
                      label="manager-8"
                    />
                    <p className="text-xs text-gray-500 mt-1">Vivek Nair - DevOps Engineer</p>
                  </div>

                  {/* Department 9 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Industrial/Mechanical Engineering</h3>
                    <CredentialCard
                      email="meera.kapoor@company.com"
                      password="password123"
                      label="manager-9"
                    />
                    <p className="text-xs text-gray-500 mt-1">Meera Kapoor - Industrial Designer</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Member Accounts */}
          <section className="mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
                <div className="flex items-center gap-3 text-white">
                  <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Team Member Accounts</h2>
                    <p className="text-green-100">Update task status, view assignments</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4 bg-green-50 border-l-4 border-green-600 p-3 rounded-r">
                  <strong>Password for all team members:</strong> password123
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Department 1 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Client Success / Sales</h3>
                    <CredentialCard
                      email="pooja.sharma@company.com"
                      password="password123"
                      label="employee-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Pooja Sharma - Account Manager</p>
                  </div>

                  {/* Department 2 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Product Management</h3>
                    <CredentialCard
                      email="ishita.kaur@company.com"
                      password="password123"
                      label="employee-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ishita Kaur - Product Owner</p>
                  </div>

                  {/* Department 3 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">UX / Research</h3>
                    <CredentialCard
                      email="devansh.aggrawal@company.com"
                      password="password123"
                      label="employee-3"
                    />
                    <p className="text-xs text-gray-500 mt-1">Devansh Aggarwal - UX Researcher</p>
                  </div>

                  {/* Department 4 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">UI / Visual Design</h3>
                    <CredentialCard
                      email="divya.malhotra@company.com"
                      password="password123"
                      label="employee-4"
                    />
                    <p className="text-xs text-gray-500 mt-1">Divya Malhotra - UI Designer</p>
                  </div>

                  {/* Department 5 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Engineering</h3>
                    <CredentialCard
                      email="anjali.arora@company.com"
                      password="password123"
                      label="employee-5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Anjali Arora - Backend Engineer</p>
                  </div>

                  {/* Department 6 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">QA / Testing</h3>
                    <CredentialCard
                      email="manish.yadav@company.com"
                      password="password123"
                      label="employee-6"
                    />
                    <p className="text-xs text-gray-500 mt-1">Manish Yadav - Mechanical Engineer</p>
                  </div>

                  {/* Department 7 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Project Management</h3>
                    <CredentialCard
                      email="komal.iyer@company.com"
                      password="password123"
                      label="employee-7"
                    />
                    <p className="text-xs text-gray-500 mt-1">Komal Iyer - Scrum Master</p>
                  </div>

                  {/* Department 8 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">DevOps / Handoff</h3>
                    <CredentialCard
                      email="varun.mishra@company.com"
                      password="password123"
                      label="employee-8"
                    />
                    <p className="text-xs text-gray-500 mt-1">Varun Mishra - DevOps Engineer</p>
                  </div>

                  {/* Department 9 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Industrial/Mechanical Engineering</h3>
                    <CredentialCard
                      email="manish.yadav@company.com"
                      password="password123"
                      label="employee-9"
                    />
                    <p className="text-xs text-gray-500 mt-1">Manish Yadav - Mechanical Engineer</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
            <h3 className="font-bold text-blue-900 mb-3">Important Notes:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>All accounts use the password: <code className="bg-white px-2 py-0.5 rounded border border-gray-300">password123</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>These are demo accounts for testing purposes only</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>The system uses OTP-based 2FA authentication via SMS</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Click the copy icon next to any credential to copy it to your clipboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Each user type has different permissions - explore all three to see the full platform</span>
              </li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TestCredentials;
