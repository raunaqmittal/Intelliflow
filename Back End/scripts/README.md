# Backend Maintenance Scripts

This directory contains one-off administrative and maintenance scripts for the Intelliflow backend.

## Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `createTestUser.js` | Creates default test employee (`test@intelliflow.com`) and client (`testclient@company.com`) with preset passwords for testing purposes. | `node createTestUser.js` |
| `diagnoseEmail.js` | Comprehensive diagnostic tool that tests SMTP connection, environment variables, and sends a test email. Extremely useful for debugging Render.com email issues. | `node diagnoseEmail.js` |
| `fixPhoneNumbers.js` | Normalizes all client and employee phone numbers to a target Indian format (`+91...`). Modifies production data. | `node fixPhoneNumbers.js` |
| `importData.js` | Imports or deletes the dummy JSON data (from `../../Data/JSON data/`) into the MongoDB database. | `node importData.js --import` or `--delete` |
| `normalizeAllDepartments.js` | Standardizes department names (e.g., merging "ux / research", "r&d" into "Research") across all employees and historical requests. | `node normalizeAllDepartments.js` |
| `normalizeDepartments.js` | A lighter version of department normalization focusing only on employees. | `node normalizeDepartments.js` |
| `removeProjectManagementEmployees.js` | Cleans up dummy employees that were created under the old "Project Management" department, reassigning them. | `node removeProjectManagementEmployees.js` |
| `setPhoneVerifiedFalse.js` | Mass updates all employee and client records to set `phoneVerified` flag to `false`. | `node setPhoneVerifiedFalse.js` |
| `testEmail.js` | A simple script to fire off a quick test email to verify Nodemailer setup. (`diagnoseEmail.js` is more robust). | `node testEmail.js` |
| `updateProjectStatuses.js` | Admin script to mass-update active projects' statuses based on their underlying tasks and sprints. | `node updateProjectStatuses.js` |

## Environment

All scripts use the database and email configuration defined in `../config.env`.

**Note:** Always run scripts from the `scripts/` directory or specify the path properly (e.g. `cd Back End/scripts && node diagnoseEmail.js`).
