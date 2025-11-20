# Complete Supabase Setup Guide for PrayerApp/DailyGoalTracker

## 🚀 Quick Setup (10 minutes)

### Step 1: Create Supabase Project

1. **Go to**: https://supabase.com
2. **Sign up** (or login) with GitHub
3. **Click**: "New Project"
4. **Configure**:
   ```
   Organization: (select or create one)
   Project Name: dailygoaltracker
   Database Password: (auto-generated - SAVE THIS!)
   Region: East US (or closest to you)
   Pricing Plan: Free ✅
   ```
5. **Click**: "Create new project"
6. **Wait**: 2-3 minutes for provisioning ⏳

### Step 2: Get Your API Credentials

Once the project is ready (you'll see the dashboard):

1. **Click**: ⚙️ **Settings** (bottom left)
2. **Click**: **API** (left sidebar)
3. **Copy these values to a safe place**:
   ```
   Project URL:
   https://xxxxxxxxxxxxx.supabase.co
   
   Anon Public Key:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   Service Role Key:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
   ```

**These are your magic keys! 🔑**

---

## 📊 Step 3: Set Up Database Schema

The database needs tables for users, goals, enrollments, etc.

### Option A: Quick Setup (Recommended)

1. **Go to**: SQL Editor (left sidebar)
2. **Click**: "New Query" (or "+ New")
3. **Paste this SQL**:

```sql
-- Create profiles table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'author', 'user')),
  timezone TEXT DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  min_days INT DEFAULT 5,
  total_days INT NOT NULL,
  approval_status TEXT DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending', 'published', 'archived')),
  version INT DEFAULT 1,
  tags TEXT[],
  chat_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create goal_days table
CREATE TABLE IF NOT EXISTS goal_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  day_index INT NOT NULL,
  title TEXT NOT NULL,
  brief_preview TEXT,
  content_type TEXT CHECK (content_type IN ('text', 'exercise', 'checklist')),
  content_payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(goal_id, day_index)
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  current_day_index INT DEFAULT 1,
  last_completed_at TIMESTAMP,
  streak_count INT DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  start_date TIMESTAMP DEFAULT NOW(),
  projected_end_date TIMESTAMP,
  actual_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, goal_id)
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  invite_code CHAR(6) UNIQUE,
  privacy_setting TEXT DEFAULT 'private' CHECK (privacy_setting IN ('public', 'private')),
  member_visibility BOOLEAN DEFAULT TRUE,
  chat_enabled BOOLEAN DEFAULT TRUE,
  max_members INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can read their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can read published goals" ON goals FOR SELECT USING (approval_status = 'published');
CREATE POLICY "Users can read their own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own enrollments" ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
```

4. **Click**: ▶️ **Run** button (or Ctrl+Enter)
5. **Check**: The SQL ran successfully (no red errors)
6. **Verify**: Go to **Table Editor** - should see new tables ✅

---

## 🔐 Step 4: Configure Authentication

1. **Go to**: Authentication (left sidebar)
2. **Click**: "Providers"
3. **Email** should be enabled by default (✅)
4. **Go to**: "Email Templates" tab
5. **Optional**: Customize welcome email (or leave default)

### For Local Testing:
1. **Go to**: "Settings" (in Authentication)
2. **Disable email confirmations**:
   - Find: "Enable email confirmations"
   - Set to: OFF
   - This lets you test without confirming emails

---

## 🌐 Step 5: Connect to Vercel

### Add Environment Variables to Vercel:

1. **Go to**: https://vercel.com/dashboard
2. **Select**: Your PrayerApp project
3. **Click**: **Settings** → **Environment Variables**
4. **Add these TWO variables**:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxxxxxx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

5. **Click**: "Save"
6. **Go to**: **Deployments** tab
7. **Click**: Latest deployment → **"Redeploy"**

**Wait 2-3 minutes for the build** ⏳

---

## 💻 Step 6: Test Locally (Optional)

### Create `.env.local` in frontend folder:

```bash
cd frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
```

### Install dependencies & run:

```bash
npm install
npm run dev
```

Visit: http://localhost:3000 ✅

---

## ✅ Step 7: Verify Everything Works

### Test Registration:

1. **Visit**: Your Vercel URL or http://localhost:3000
2. **Click**: "Get Started" or "Sign Up"
3. **Fill in**:
   ```
   Email: testuser@example.com
   Password: TestPassword123!
   Name: Test User
   ```
4. **Click**: "Sign Up"

### Check in Supabase:

1. **Go to**: https://app.supabase.com
2. **Select**: Your project
3. **Go to**: **Authentication** → **Users**
4. **Should see**: Your test user ✅
5. **Go to**: **Table Editor** → **profiles**
6. **Should see**: User profile auto-created ✅

---

## 🧪 Complete User Flow Test

After setup, test the full flow:

```
1. ✅ Register new account at /auth/register
2. ✅ Check Supabase → Authentication → Users (user created)
3. ✅ Check Supabase → profiles table (profile created)
4. ✅ Login at /auth/login
5. ✅ Dashboard loads (should show "No active goals" or similar)
6. ✅ Navigate to /goals
7. ✅ See goals list (empty for now)
```

---

## 📋 Troubleshooting

### "Can't sign up - error creating user"
- **Check**: Authentication is enabled
- **Check**: Email confirmations disabled
- **Fix**: Go to Authentication → Settings, turn off email confirmations

### "Dashboard is blank / 404 error"
- **Check**: Supabase env vars set in Vercel
- **Fix**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Action**: Redeploy on Vercel

### "Table doesn't exist error"
- **Check**: SQL queries ran successfully
- **Check**: Table Editor shows tables
- **Fix**: Run SQL again, check for syntax errors

### "Environment variables not working?"
- **Rule 1**: Must start with `NEXT_PUBLIC_` to be accessible in browser
- **Rule 2**: Restart dev server after adding `.env.local`
- **Rule 3**: Redeploy on Vercel after adding env vars

### "Can't connect from localhost"
- **Check**: `.env.local` has correct Supabase URL
- **Check**: Anon key is correct (starts with `eyJ...`)
- **Fix**: Copy keys directly from Supabase Settings → API

---

## 🎯 What You Now Have

✅ **Supabase Project**: Database + Auth + API  
✅ **Vercel Deployment**: Frontend hosted and connected  
✅ **User Registration**: Working auth system  
✅ **Database Schema**: Ready for goals and enrollments  
✅ **Environment Variables**: Frontend can access Supabase  

---

## 🚀 Next Steps After Setup

1. **Create Test Goals**
   - Log in as admin
   - Create a sample 5-day goal
   - Test the goal player flow

2. **Implement Goal Creation UI**
   - Author can create new goals
   - Rich text editor for content
   - Multi-day setup

3. **Build Enrollment System**
   - Users can enroll in goals
   - Track daily progress
   - Implement The Midnight Rule

4. **Add Notifications**
   - Daily reminders
   - Streak tracking
   - Push notifications

---

## 📚 Useful Links

| Resource | URL |
|----------|-----|
| **Supabase Dashboard** | https://app.supabase.com |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Supabase Docs** | https://supabase.com/docs |
| **Your API Settings** | https://app.supabase.com → Settings → API |
| **Auth Users** | https://app.supabase.com → Authentication → Users |

---

## 🔑 Reference: Environment Variables Explained

```
NEXT_PUBLIC_SUPABASE_URL
├─ What: Your Supabase project URL
├─ Where: From Supabase Settings → API → Project URL
├─ Used by: Frontend to connect to database
└─ Format: https://xxxxx.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
├─ What: Public key for frontend access
├─ Where: From Supabase Settings → API → Anon public key
├─ Used by: Frontend to authenticate requests
└─ Security: Safe to expose (RLS policies protect data)
```

---

**You're all set! 🎉 Your app is ready to go live!**
