# Production Deployment Guide for Intelliflow

## Prerequisites Checklist

- [ ] Code tested locally with `NODE_ENV=development`
- [ ] All critical test cases passed
- [ ] Git repository committed and pushed
- [ ] Production MongoDB database created (separate from dev)
- [ ] Domain name registered (optional but recommended)

---

## Step-by-Step Production Deployment

### Option 1: Deploy on Render (Recommended - Free Tier Available)

#### Backend Deployment:

1. **Create Render Account**

   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**

   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `Intelliflow` repository

3. **Configure Service**

   ```
   Name: intelliflow-backend
   Region: Choose closest to your users
   Branch: main
   Root Directory: Back End
   Runtime: Node
   Build Command: npm install
   Start Command: npm run prod
   Instance Type: Free
   ```

4. **Add Environment Variables**
   Click "Environment" → "Add Environment Variable"

   **Required variables:**

   ```
   NODE_ENV = production
   DATABASE = mongodb+srv://<YOUR_PROD_CLUSTER>
   JWT_SECRET = <GENERATE_NEW_64_CHAR_STRING>
   TWILIO_ACCOUNT_SID = <YOUR_TWILIO_ACCOUNT_SID>
   TWILIO_AUTH_TOKEN = <YOUR_TWILIO_AUTH_TOKEN>
   TWILIO_PHONE_NUMBER = <YOUR_TWILIO_PHONE_NUMBER>
   OTP_EXPIRY_MINUTES = 5
   OTP_RATE_LIMIT_MINUTES = 2
   FRONTEND_URL = https://YOUR_FRONTEND_URL (set after frontend deployed)
   ```

5. **Generate JWT Secret**
   Run locally:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   Copy the output and use as JWT_SECRET

6. **Deploy**
   - Click "Create Web Service"
   - Render automatically provides HTTPS! ✅
   - You'll get URL like: `https://intelliflow-backend.onrender.com`

#### Frontend Deployment:

1. **Create Static Site on Render**

   - Click "New +" → "Static Site"
   - Connect GitHub repository
   - Select `Intelliflow` repository

2. **Configure Static Site**

   ```
   Name: intelliflow-frontend
   Branch: main
   Root Directory: Front End
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

3. **Update API URL**
   Before deploying, update `Front End/src/lib/api.ts`:

   Change:

   ```typescript
   const API_URL = "http://localhost:3000/api/v1";
   ```

   To:

   ```typescript
   const API_URL =
     import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
   ```

4. **Add Environment Variable**
   In Render Static Site settings:

   ```
   VITE_API_URL = https://intelliflow-backend.onrender.com/api/v1
   ```

5. **Update Backend FRONTEND_URL**
   Go back to backend service → Environment → Update:

   ```
   FRONTEND_URL = https://intelliflow-frontend.onrender.com
   ```

6. **Deploy**
   - Commit and push changes
   - Render auto-deploys on push
   - You'll get URL like: `https://intelliflow-frontend.onrender.com`
   - **HTTPS automatically enabled!** ✅

---

### Option 2: Deploy on Vercel (Frontend) + Render (Backend)

#### Backend on Render:

Follow same steps as Option 1 above

#### Frontend on Vercel:

1. **Install Vercel CLI**

   ```powershell
   npm install -g vercel
   ```

2. **Deploy**

   ```powershell
   cd "Front End"
   vercel
   ```

3. **Add Environment Variable**

   ```powershell
   vercel env add VITE_API_URL production
   # Enter: https://intelliflow-backend.onrender.com/api/v1
   ```

4. **Set in Vercel Dashboard**

   - Go to vercel.com → Your Project → Settings → Environment Variables
   - Add: `VITE_API_URL = https://intelliflow-backend.onrender.com/api/v1`

5. **Redeploy**
   ```powershell
   vercel --prod
   ```

**HTTPS automatically enabled!** ✅

---

### Option 3: Railway (Both Frontend & Backend)

1. **Create Railway Account**: https://railway.app
2. **New Project** → Deploy from GitHub
3. **Add Backend Service**:
   - Root directory: `Back End`
   - Start command: `npm run prod`
   - Add all environment variables
4. **Add Frontend Service**:
   - Root directory: `Front End`
   - Build command: `npm run build`
   - Start command: `npm run preview` (or use static serving)
5. **Railway provides HTTPS automatically** ✅

---

## Environment Variables Reference

### Must Change for Production:

| Variable       | Development Value       | Production Value           | How to Generate                                                            |
| -------------- | ----------------------- | -------------------------- | -------------------------------------------------------------------------- |
| `NODE_ENV`     | `development`           | `production`               | Manual                                                                     |
| `DATABASE`     | Dev cluster URL         | **NEW production cluster** | Create separate MongoDB Atlas cluster                                      |
| `JWT_SECRET`   | `your_jwt_secret...`    | **NEW 64+ char random**    | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `FRONTEND_URL` | `http://localhost:8080` | `https://your-domain.com`  | Your hosting provider URL                                                  |

### Can Keep Same:

| Variable                 | Value | Notes                          |
| ------------------------ | ----- | ------------------------------ |
| `TWILIO_ACCOUNT_SID`     | Same  | Your existing account works    |
| `TWILIO_AUTH_TOKEN`      | Same  | Just ensure credits are loaded |
| `TWILIO_PHONE_NUMBER`    | Same  | Same number works              |
| `OTP_EXPIRY_MINUTES`     | `5`   | No change needed               |
| `OTP_RATE_LIMIT_MINUTES` | `2`   | No change needed               |

---

## Production Database Setup

### Create Production MongoDB Cluster:

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Create New Cluster**

   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select region closest to your hosting
   - Name: `intelliflow-production`

3. **Create Database User**

   - Security → Database Access → Add New User
   - Username: `intelliflow_prod`
   - Password: Generate strong password
   - Role: Read and write to any database

4. **Whitelist IPs**

   - Security → Network Access
   - Add IP: `0.0.0.0/0` (allow all - hosting platforms use dynamic IPs)
   - OR add specific IPs from your hosting provider

5. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Use this as `DATABASE` in production config

---

## HTTPS Setup (Automatic on Recommended Platforms)

### ✅ Platforms with Automatic HTTPS:

- **Render**: Free SSL, auto-renews
- **Vercel**: Free SSL, auto-renews
- **Railway**: Free SSL, auto-renews
- **Heroku**: Free SSL, auto-renews
- **Netlify**: Free SSL, auto-renews

### If Self-Hosting with VPS:

**Using Caddy (Easiest)**:

```bash
# Install Caddy
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo tee /etc/apt/trusted.gpg.d/caddy-stable.asc
sudo apt update
sudo apt install caddy

# Create Caddyfile
cat > Caddyfile << EOF
yourdomain.com {
    reverse_proxy localhost:3000
}
EOF

# Start Caddy (auto-gets SSL from Let's Encrypt)
sudo caddy run
```

**Using Certbot + Nginx**:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renews automatically
```

---

## Post-Deployment Checklist

### Immediately After Deployment:

- [ ] Test signup with new user
- [ ] Test login
- [ ] Test phone verification OTP (check SMS arrives)
- [ ] Test 2FA enable/disable
- [ ] Test password reset flow
- [ ] Check browser console for errors
- [ ] Verify cookies are set (Developer Tools → Application → Cookies)
- [ ] Test on mobile device
- [ ] Test on different browsers (Chrome, Firefox, Safari)

### Monitor First 24 Hours:

- [ ] Check error logs in hosting platform
- [ ] Monitor Twilio usage/credits
- [ ] Check MongoDB connection stats
- [ ] Test all critical user workflows
- [ ] Have test users try the system

### Security Verification:

- [ ] HTTPS lock icon shows in browser
- [ ] Cookies have `Secure` flag (check DevTools)
- [ ] API requests go to HTTPS endpoint
- [ ] No mixed content warnings
- [ ] CORS working correctly

---

## Troubleshooting Common Issues

### Issue: "Login not working in production"

**Cause**: Cookies not set due to HTTP instead of HTTPS
**Solution**: Ensure hosting provides HTTPS (all recommended platforms do)

### Issue: "CORS error"

**Cause**: `FRONTEND_URL` in backend doesn't match actual frontend URL
**Solution**: Update `FRONTEND_URL` environment variable in backend to exact frontend domain

### Issue: "OTP not received"

**Cause**: Twilio credits depleted or trial account restrictions
**Solution**:

- Check Twilio console for credits
- Add credits if depleted
- For trial: Verify recipient's phone number in Twilio console

### Issue: "Database connection failed"

**Cause**: IP not whitelisted or wrong credentials
**Solution**:

- Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access
- Double-check DATABASE connection string

### Issue: "JWT token expired immediately"

**Cause**: Server and client time mismatch
**Solution**: Usually not an issue with cloud hosting (auto-synced time)

---

## Cost Estimate (Monthly)

### Minimal Setup (Free Tier):

- **Hosting**: $0 (Render/Vercel/Railway free tiers)
- **Database**: $0 (MongoDB Atlas M0 free tier)
- **SSL/HTTPS**: $0 (Included)
- **Twilio**: ~$5-20 depending on SMS volume (pay-as-you-go)
  - 500 SMS = ~$5
  - 2000 SMS = ~$20

**Total: $5-20/month** (just Twilio SMS costs)

### Recommended Setup (Low Traffic):

- **Hosting**: $7-14/month (Render/Railway paid tier for better performance)
- **Database**: $0-9/month (M0 free or M2 shared)
- **Twilio**: $5-20/month
- **Domain**: $10-15/year (~$1/month)

**Total: $13-35/month**

---

## Quick Deploy Commands

### Generate JWT Secret:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Test Production Build Locally:

```powershell
# Backend
cd "Back End"
$env:NODE_ENV="production"; npm run prod

# Frontend
cd "Front End"
npm run build
npm run preview
```

### Check Environment Variables:

```powershell
# Backend
cd "Back End"
node -e "require('dotenv').config({path: './config.env'}); console.log(process.env.NODE_ENV, process.env.FRONTEND_URL)"
```

---

## Need Help?

Common deployment guides:

- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- MongoDB Atlas: https://www.mongodb.com/docs/atlas

---

**Remember**: Test everything on staging/preview environment before going live!
