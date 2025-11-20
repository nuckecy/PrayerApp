# DailyGoalTracker Deployment Guide

## Frontend Deployment (Vercel)

### Quick Deploy with Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from the frontend directory**:
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Follow the prompts**:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No**
   - Project name: `dailygoaltracker` (or your choice)
   - Framework will be auto-detected as Next.js
   - Accept default settings or override if needed

5. **Set Environment Variables in Vercel Dashboard**:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add:
     - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.com`
     - `NEXT_PUBLIC_APP_URL` = `https://your-vercel-app.vercel.app`

### Deploy with GitHub Integration

1. **Push to GitHub** (already done):
   ```bash
   git push origin claude/build-new-app-019yznBX7U4E2Y7qhAcCF68d
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Add New Project" or "Import Project"
   - Import your GitHub repository `nuckecy/PrayerApp`
   - **IMPORTANT**: Set "Root Directory" to `frontend`
   - Framework will be auto-detected as Next.js
   - Add environment variables (see below)
   - Click "Deploy"

### Quick Deploy Button

You can also use this one-click deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nuckecy/PrayerApp&project-name=dailygoaltracker&root-directory=frontend)

### Environment Variables for Production

In your Vercel project settings, add:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Backend Deployment Options

### Option 1: Railway (Recommended for Quick Testing)

Railway is great for Node.js backends with PostgreSQL.

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Initialize in backend directory**:
   ```bash
   cd backend
   railway init
   ```

4. **Add PostgreSQL**:
   ```bash
   railway add --database postgresql
   ```

5. **Set Environment Variables**:
   ```bash
   railway variables set JWT_SECRET="your-production-secret-here"
   railway variables set JWT_REFRESH_SECRET="your-refresh-secret-here"
   railway variables set FRONTEND_URL="https://your-vercel-app.vercel.app"
   railway variables set PORT=3001
   ```

6. **Deploy**:
   ```bash
   railway up
   ```

7. **Run Migrations**:
   ```bash
   railway run npx prisma migrate deploy
   ```

### Option 2: Render

1. Go to [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Add PostgreSQL database** from Render dashboard

5. Set environment variables in Render:
   ```
   DATABASE_URL=(auto-filled by Render PostgreSQL)
   JWT_SECRET=your-production-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   FRONTEND_URL=https://your-vercel-app.vercel.app
   NODE_ENV=production
   ```

### Option 3: Heroku

1. **Install Heroku CLI**:
   ```bash
   brew install heroku/brew/heroku  # macOS
   # or
   curl https://cli-assets.heroku.com/install.sh | sh  # Linux
   ```

2. **Login and Create App**:
   ```bash
   heroku login
   cd backend
   heroku create dailygoaltracker-api
   ```

3. **Add PostgreSQL**:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Set Environment Variables**:
   ```bash
   heroku config:set JWT_SECRET="your-production-secret"
   heroku config:set JWT_REFRESH_SECRET="your-refresh-secret"
   heroku config:set FRONTEND_URL="https://your-vercel-app.vercel.app"
   heroku config:set NODE_ENV=production
   ```

5. **Deploy**:
   ```bash
   git subtree push --prefix backend heroku main
   ```

6. **Run Migrations**:
   ```bash
   heroku run npx prisma migrate deploy
   ```

### Option 4: AWS ECS (Production - More Complex)

For production-grade deployment, refer to the infrastructure section in README.md.

---

## Testing the Deployment

### 1. Test Backend Health

```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-20T..."
}
```

### 2. Test Frontend

Visit your Vercel URL: `https://your-app.vercel.app`

### 3. Test Full Flow

1. Register a new account
2. Login
3. Browse goals (will be empty initially)
4. Check dashboard

---

## Quick Deploy Commands (Summary)

### Frontend to Vercel:
```bash
cd /home/user/PrayerApp
vercel --prod
```

### Backend to Railway:
```bash
cd /home/user/PrayerApp/backend
railway init
railway add --database postgresql
railway up
railway run npx prisma migrate deploy
```

### Get Backend URL:
```bash
railway status
```

### Update Vercel with Backend URL:
```bash
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-railway-url.railway.app
```

---

## Troubleshooting

### CORS Errors
Make sure your backend `.env` has:
```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Database Connection Issues
- Verify DATABASE_URL is set correctly
- Check that Prisma migrations have been run
- Ensure PostgreSQL database is accessible

### Build Failures
- Check Node version compatibility (use Node 20+)
- Verify all dependencies are in package.json
- Check build logs for specific errors

---

## Cost Estimates (Free Tiers)

- **Vercel**: Free for hobby projects
- **Railway**: $5/month credit free tier
- **Render**: Free tier available (sleeps after inactivity)
- **Heroku**: Free tier discontinued, starts at $7/month

---

## Next Steps After Deployment

1. Set up custom domain (optional)
2. Configure production database backups
3. Set up monitoring (Sentry, DataDog)
4. Enable HTTPS (automatic on Vercel/Railway/Render)
5. Set up CI/CD pipelines

---

**Ready to deploy!** Choose your preferred backend hosting option and follow the steps above.
