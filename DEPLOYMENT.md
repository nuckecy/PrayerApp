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
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## Backend Setup (Supabase)

**Current Implementation**: This project uses Supabase as the backend, providing authentication, database, and real-time capabilities out of the box.

### Setup Steps

Follow the comprehensive guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

**Quick Summary**:

1. **Create Supabase Project** (5 minutes):
   - Go to [supabase.com](https://supabase.com)
   - Sign in and create new project
   - Save your database password

2. **Run Database Schema**:
   - Open SQL Editor in Supabase Dashboard
   - Copy and run `supabase/schema.sql`
   - Copy and run `supabase/rls-policies.sql`

3. **Get API Keys**:
   - Go to Project Settings → API
   - Copy Project URL and anon public key

4. **Configure Vercel**:
   - Add environment variables in Vercel Dashboard:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Redeploy your app

### Alternative: Fastify Backend (Not Currently Used)

If you prefer a self-hosted backend, the repository includes a complete Fastify implementation in the `backend/` directory. To use it instead of Supabase:

1. Deploy backend to Railway, Render, or Heroku (see instructions below)
2. Update frontend to use the API client instead of Supabase
3. Set `NEXT_PUBLIC_API_URL` environment variable

<details>
<summary>Click to expand Fastify backend deployment options</summary>

#### Railway (Recommended for Quick Testing)

```bash
cd backend
railway init
railway add --database postgresql
railway variables set JWT_SECRET="your-secret"
railway up
railway run npx prisma migrate deploy
```

#### Render

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Set Root Directory: `backend`
4. Build Command: `npm install && npx prisma generate && npm run build`
5. Start Command: `npm start`
6. Add PostgreSQL database

#### Heroku

```bash
cd backend
heroku create dailygoaltracker-api
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set JWT_SECRET="your-secret"
git subtree push --prefix backend heroku main
```

</details>

---

## Testing the Deployment

### 1. Test Supabase Connection

In Supabase Dashboard:
- Go to Authentication → Users
- Should show empty list (ready for signups)
- Go to Table Editor
- Should show all tables (profiles, goals, enrollments, etc.)

### 2. Test Frontend

Visit your Vercel URL: `https://your-app.vercel.app`

### 3. Test Full Flow

1. **Register**: Create a new account at `/auth/register`
2. **Verify User**: Check Supabase → Authentication → Users (should show new user)
3. **Verify Profile**: Check Supabase → Table Editor → profiles (should show auto-created profile)
4. **Login**: Sign in with your credentials
5. **Dashboard**: Should load successfully (empty initially)
6. **Browse Goals**: Visit `/goals` (will be empty until you add some)

---

## Quick Deploy Commands (Summary)

### 1. Setup Supabase (One-time):
```bash
# Follow SUPABASE_SETUP.md guide
# 1. Create project at supabase.com
# 2. Run schema.sql in SQL Editor
# 3. Run rls-policies.sql in SQL Editor
# 4. Copy Project URL and anon key
```

### 2. Deploy Frontend to Vercel:
```bash
cd /home/user/PrayerApp
vercel --prod
```

### 3. Configure Environment Variables:
```bash
# In Vercel Dashboard → Settings → Environment Variables
# Add:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 4. Redeploy:
```bash
# After adding env vars, trigger a new deployment
vercel --prod
```

---

## Troubleshooting

### Environment Variables Not Working
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding environment variables
- Check Vercel deployment logs for env var issues

### Supabase Connection Issues
- Verify Project URL is correct (format: `https://xxxxx.supabase.co`)
- Verify anon key is the **anon public** key, not the service_role key
- Check Supabase project status (should be "Active")

### RLS Policy Errors
- Ensure both `schema.sql` and `rls-policies.sql` were run successfully
- Check SQL Editor for any error messages
- Verify tables have RLS enabled in Table Editor

### Authentication Errors
- Check Authentication is enabled in Supabase Dashboard
- Verify email confirmations are disabled for testing
- Check user was created in Authentication → Users

### Build Failures
- Check Node version compatibility (use Node 20+)
- Verify all dependencies are in package.json
- Check build logs for specific errors
- Ensure @supabase/supabase-js is installed

---

## Cost Estimates (Free Tiers)

- **Vercel**: Free for hobby projects (unlimited deployments)
- **Supabase**: Free tier includes:
  - 500MB database
  - 50,000 monthly active users
  - 2GB file storage
  - Perfect for MVP and testing!

---

## Next Steps After Deployment

1. Set up custom domain (optional)
2. Configure production database backups
3. Set up monitoring (Sentry, DataDog)
4. Enable HTTPS (automatic on Vercel/Railway/Render)
5. Set up CI/CD pipelines

---

**Ready to deploy!** Choose your preferred backend hosting option and follow the steps above.
