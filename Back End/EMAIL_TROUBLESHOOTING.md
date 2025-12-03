# Email Troubleshooting Guide for Deployed Site

## Issues Fixed

### 1. **Background Email Sending (Non-Blocking)**

- ✅ Forgot password now sends email in background (instant response)
- ✅ 2FA login OTP via email now sends in background (instant response)
- ✅ Only SMS OTP sends synchronously (user needs code immediately)

### 2. **Loading States Added**

- ✅ Login page shows "⏳ Sending OTP..." when 2FA is triggered
- ✅ Forgot password page shows "⏳ Sending Email..." or "⏳ Sending OTP..."

### 3. **Enhanced Error Logging**

All email operations now have comprehensive logging:

- Email recipient
- Email subject
- Error messages
- Error codes
- Stack traces

## How to Diagnose Email Issues in Production

### Step 1: Check Backend Logs

After attempting to send an email, check your Render.com logs for these messages:

**Success indicators:**

```
📧 Email transporter created with pooling
📨 Sending email to: user@example.com
📧 Subject: Your Verification Code
✅ Email sent successfully: <message-id>
```

**Error indicators:**

```
❌ Email sending failed:
  To: user@example.com
  Subject: Your Verification Code
  Error: <error message>
  Code: <error code>
```

### Step 2: Common Email Issues

#### Issue: "Email environment variables not configured"

**Solution:** Verify in Render.com dashboard that these are set:

- `EMAIL_HOST` = smtp.gmail.com
- `EMAIL_PORT` = 587
- `EMAIL_USERNAME` = raunaqmittal2004@gmail.com
- `EMAIL_PASSWORD` = qazvgdecwjweevva

#### Issue: "Invalid login" or "535 Authentication failed"

**Solutions:**

1. Gmail app password might have expired
2. Generate new app password at: https://myaccount.google.com/apppasswords
3. 2-step verification must be enabled on Gmail account
4. Update `EMAIL_PASSWORD` in Render.com environment variables

#### Issue: Emails taking too long

**Expected behavior:**

- API responds immediately (1-2 seconds)
- Email arrives in inbox 10-30 seconds later
- If email doesn't arrive after 2 minutes, check spam folder

#### Issue: "Connection timeout"

**Solutions:**

1. Verify Render.com allows outbound SMTP connections
2. Check if port 587 is blocked
3. Try port 465 with `secure: true` as alternative

### Step 3: Test Email Locally

Run this command on your deployment server:

```bash
cd "Back End"
node testEmail.js
```

This will:

- Verify SMTP connection
- Send a test email to your Gmail
- Show detailed error messages if anything fails

### Step 4: Gmail-Specific Checks

1. **Check Gmail Activity:**

   - Go to: https://myaccount.google.com/device-activity
   - Look for "Intelliflow" or "Node.js" app access

2. **Less Secure Apps:**

   - Gmail might block app passwords from new locations
   - Check: https://myaccount.google.com/lesssecureapps
   - Or generate a new app-specific password

3. **Spam Folder:**
   - Automated emails often go to spam initially
   - Check recipient's spam/junk folder
   - Mark as "Not Spam" to whitelist

### Step 5: Environment Variables in Production

**CRITICAL:** Ensure these are set in Render.com:

```
NODE_ENV=production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=raunaqmittal2004@gmail.com
EMAIL_PASSWORD=qazvgdecwjweevva
FRONTEND_URL=https://your-frontend-url.com
OTP_EXPIRY_MINUTES=5
```

## Changes Made Summary

### Backend Files Modified:

1. **`Controllers/authController.js`**

   - Line ~172-210: Employee login 2FA email now async
   - Line ~268-306: Client login 2FA email now async
   - Line ~460-475: Forgot password email improved logging

2. **`Utilities/email.js`**

   - Added environment variable validation
   - Enhanced error logging with recipient/subject
   - Added development mode logging

3. **`Utilities/otp.js`**
   - Improved OTP email sending error logging
   - Added attempt logging

### Frontend Files Modified:

4. **`src/pages/Login.tsx`**

   - Line ~35: Added support for `maskedEmail`
   - Line ~221: Changed button text to "⏳ Sending OTP..." during loading

5. **`src/pages/ForgotPassword.tsx`**
   - Already has loading states from previous update

## Expected Behavior After Deploy

### Forgot Password Flow:

1. User enters email and clicks "Send Reset Link to Email"
2. Button shows "⏳ Sending Email... Please wait"
3. API responds in ~1-2 seconds with success
4. Email arrives in inbox 10-30 seconds later
5. **No timeout errors!**

### 2FA Login Flow:

1. User enters credentials and clicks "Sign in"
2. If 2FA enabled, button shows "⏳ Sending OTP..."
3. API responds immediately (~1-2 seconds)
4. OTP screen appears
5. Email OTP arrives in inbox 10-30 seconds later
6. User enters OTP and completes login

## Testing Checklist

After deploying to Render.com:

- [ ] Test forgot password with email method
- [ ] Check backend logs for email sending success
- [ ] Verify email arrives in inbox (check spam)
- [ ] Test 2FA login with email OTP
- [ ] Verify no timeout errors (should respond in <5 seconds)
- [ ] Check that emails arrive within 1-2 minutes
- [ ] Test with different email addresses

## If Emails Still Don't Arrive

### Option 1: Use SendGrid (Recommended for Production)

SendGrid is faster and more reliable than Gmail SMTP.

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Get API key
3. Update environment variables:
   ```
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USERNAME=apikey
   EMAIL_PASSWORD=<your-sendgrid-api-key>
   ```

### Option 2: Use Mailgun

Another reliable alternative:

1. Sign up at https://www.mailgun.com
2. Get SMTP credentials
3. Update environment variables accordingly

### Option 3: Debug Mode

Set this temporarily to see OTP codes in logs:

```
NODE_ENV=development
```

**WARNING:** Remove this in production! It logs sensitive OTPs.

## Contact Information

If issues persist after following this guide:

1. Check Render.com logs for detailed error messages
2. Verify Gmail account hasn't blocked the app
3. Try generating a new Gmail app password
4. Consider switching to SendGrid for production

---

**Last Updated:** December 3, 2025
**Changes:** Background email sending, enhanced logging, loading states
