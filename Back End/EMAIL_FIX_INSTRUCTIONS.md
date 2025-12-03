# Email Fix Instructions for Render.com

## Problem

Emails work locally but not on Render.com because:

1. `config.env` file doesn't exist on Render.com (env vars are set in dashboard)
2. Gmail might be blocking access from Render.com's IP addresses
3. Need to diagnose the exact error on the server

## Fixes Applied

### 1. Updated Environment Variable Loading

Modified `server.js` and `app.js` to:

- Check if `config.env` exists before loading it
- Use system environment variables on Render.com (set in dashboard)
- Work seamlessly in both local and production environments

### 2. Created Diagnostic Tool

Added `diagnoseEmail.js` to identify the exact issue on Render.com

## Step-by-Step Instructions

### Step 1: Deploy Updated Code

1. Commit and push these changes to GitHub:

   ```bash
   git add .
   git commit -m "Fix env loading for Render.com and add email diagnostics"
   git push
   ```

2. Render.com will auto-deploy (or manually trigger deploy)

### Step 2: Run Diagnostic (EASIEST METHOD)

**Simply visit this URL in your browser:**

```
https://your-backend-url.onrender.com/api/diagnostic/email
```

Replace `your-backend-url` with your actual Render.com backend URL.

This will show you a JSON response with diagnostic results:

- ✅ `overall_status: "ALL TESTS PASSED"` = Email is working!
- ❌ `overall_status: "SOME TESTS FAILED"` = See the error details

**Example Response (Success):**

```json
{
  "overall_status": "ALL TESTS PASSED ✅",
  "checks": [
    {
      "name": "Environment Variables",
      "status": "passed"
    },
    {
      "name": "SMTP Connection",
      "status": "passed",
      "details": {
        "message": "Successfully connected to SMTP server"
      }
    },
    {
      "name": "Send Test Email",
      "status": "passed",
      "details": {
        "recipient": "raunaqmittal2004@gmail.com",
        "note": "Check your inbox/spam folder"
      }
    }
  ]
}
```

**Example Response (Failed):**

```json
{
  "overall_status": "SOME TESTS FAILED ❌",
  "checks": [
    {
      "name": "SMTP Connection",
      "status": "failed",
      "details": {
        "error_code": "EAUTH",
        "solution": "Gmail app password is invalid. Generate new one at https://myaccount.google.com/apppasswords"
      }
    }
  ]
}
```

### Alternative: Run Diagnostic via Terminal (If you have Shell access)

**Option A: Via Render.com Shell**

1. Go to your Render.com dashboard
2. Click on your backend service
3. Click "Shell" tab
4. Run:
   ```bash
   cd Back\ End
   node diagnoseEmail.js
   ```

**Option B: Temporarily Add to Start Script**

1. In Render.com dashboard, go to your service
2. Under "Build & Deploy" → "Start Command", temporarily change to:
   ```bash
   cd Back\ End && node diagnoseEmail.js
   ```
3. Check logs for diagnostic output
4. **IMPORTANT:** Change start command back to:
   ```bash
   cd Back\ End && node server.js
   ```

### Step 3: Analyze Diagnostic Results

#### If you see: `✅ ALL TESTS PASSED!`

- Email is working! Check spam folder for test email
- The issue might be timing-related or already fixed

#### If you see: `❌ SMTP Connection FAILED` with `EAUTH`

**Problem:** Gmail is rejecting your app password

**Solution:**

1. Go to: https://myaccount.google.com/apppasswords
2. Delete any existing "Intelliflow" or "Node.js" app passwords
3. Create a NEW app password:
   - Select "Mail" as the app
   - Copy the 16-character password (no spaces)
4. In Render.com dashboard:
   - Go to Environment → Add/Edit
   - Update `EMAIL_PASSWORD` with the new password
   - Click "Save Changes"
5. Redeploy the service

#### If you see: `ETIMEDOUT` or `ECONNECTION`

**Problem:** Render.com firewall or network blocking SMTP

**Solutions:**

**Option 1: Try Port 465 (SSL)**
In Render.com Environment Variables, add/update:

- `EMAIL_PORT` = `465`
- `EMAIL_SECURE` = `true`

**Option 2: Switch to SendGrid (RECOMMENDED)**
SendGrid is designed for production and more reliable:

1. Sign up at: https://sendgrid.com (Free: 100 emails/day)
2. Create API Key (Settings → API Keys → Create API Key)
3. In Render.com Environment Variables, update:
   ```
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USERNAME=apikey
   EMAIL_PASSWORD=<your-sendgrid-api-key>
   ```
4. Redeploy

### Step 4: Check Gmail Security

1. **Check Recent Security Events:**

   - Go to: https://myaccount.google.com/notifications
   - Look for blocked sign-in attempts
   - If blocked, click "This was me" to allow

2. **Check Device Activity:**

   - Go to: https://myaccount.google.com/device-activity
   - Look for "Intelliflow" or suspicious activity
   - Approve if needed

3. **Check 2-Step Verification:**
   - Must be ENABLED to use app passwords
   - Go to: https://myaccount.google.com/security
   - Enable if not already on

### Step 5: Verify Environment Variables

In Render.com dashboard, verify these are ALL set correctly:

```
NODE_ENV=production
DATABASE=mongodb+srv://raunaq2004:6Tchk9s12@cluster0.nezj3dq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=raunaqmittal2004@gmail.com
EMAIL_PASSWORD=qazvgdecwjweevva
FRONTEND_URL=https://intelliflow-sable.vercel.app
JWT_SECRET=your_jwt_secret_key_here_is_very_long_and_secure
JWT_EXPIRES_IN=90d
OTP_EXPIRY_MINUTES=5
```

**⚠️ CRITICAL:** Make sure there are NO extra spaces before/after values!

## Quick Test After Fix

Once diagnostic passes, test the actual features:

### Test 1: Forgot Password

1. Go to: https://intelliflow-sable.vercel.app/forgot-password
2. Enter your email: raunaqmittal2004@gmail.com
3. Click "Send Reset Link to Email"
4. Check Render.com logs - should see:
   ```
   📨 Sending email to: raunaqmittal2004@gmail.com
   ✅ Email sent successfully
   ✅ Password reset email sent successfully
   ```
5. Check inbox/spam for reset link (within 1-2 minutes)

### Test 2: 2FA Login OTP

1. Enable 2FA on a test user (via profile settings)
2. Logout and try to login
3. Should see OTP screen
4. Check Render.com logs - should see:
   ```
   📧 Attempting to send OTP email
   ✅ OTP email sent successfully
   ```
5. Check inbox/spam for OTP code

## Most Likely Solution

Based on your symptoms, the issue is probably:

1. **Gmail App Password Invalid** (70% likely)

   - Generate new app password
   - Update on Render.com
   - Redeploy

2. **Environment Variables Not Loading** (20% likely)

   - Fixed by our code changes
   - Deploy and test

3. **Gmail Blocking New Location** (10% likely)
   - Check Gmail security events
   - Approve access

## Alternative: Switch to SendGrid Now

If you want to skip diagnostics and use a production-ready solution:

1. Sign up: https://sendgrid.com
2. Get API key
3. Update env vars (see above)
4. Deploy
5. Done! ✅

---

**Need Help?**
Run the diagnostic first, then share the output if you need assistance.
