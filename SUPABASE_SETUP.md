# Supabase Backend Setup Guide

## Step 1: Create Supabase Project (5 minutes)

1. **Go to**: https://supabase.com
2. **Sign in** with GitHub (or create account)
3. **Click**: "New Project"
4. **Configure**:
   ```
   Organization: (select or create)
   Name: dailygoaltracker
   Database Password: (generate strong password - SAVE THIS!)
   Region: East US (closest to you)
   Pricing Plan: Free
   ```
5. **Click**: "Create new project"
6. **Wait**: 2-3 minutes for project to provision

## Step 2: Get Your API Keys

Once project is ready:

1. **Go to**: Project Settings (gear icon) → API
2. **Copy these values**:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc... (keep secret!)
   ```

## Step 3: Set Up Database Schema

1. **Go to**: SQL Editor (in left sidebar)
2. **Click**: "+ New query"
3. **Paste the SQL** from `supabase/schema.sql` (see file below)
4. **Click**: "Run" (or press Ctrl+Enter)
5. **Verify**: Check "Table Editor" to see tables created

## Step 4: Configure Authentication

1. **Go to**: Authentication → Providers
2. **Enable Email** (should be enabled by default)
3. **Configure settings**:
   ```
   Confirm email: Disable (for testing)
   Enable email confirmations: Off (for now)
   ```
4. **Save**

## Step 5: Update Vercel Environment Variables

1. **Go to**: Vercel Dashboard → Your Project → Settings → Environment Variables
2. **Add**:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
   ```
3. **Click**: "Save"
4. **Redeploy**: Go to Deployments → Redeploy

## Step 6: Test Locally (Optional)

1. **Create** `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

2. **Run frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test**:
   - Visit http://localhost:3000/auth/register
   - Try creating an account
   - Check Supabase Dashboard → Authentication → Users

## Troubleshooting

### Can't create users?
- Check Authentication is enabled
- Check email confirmations are disabled
- Check RLS policies allow inserts

### Environment variables not working?
- Make sure they start with `NEXT_PUBLIC_`
- Restart dev server after adding .env.local
- Redeploy on Vercel after adding env vars

### Database errors?
- Check SQL ran successfully
- Check Table Editor shows all tables
- Check for SQL syntax errors

## Quick Links

- **Supabase Dashboard**: https://app.supabase.com
- **Documentation**: https://supabase.com/docs
- **Table Editor**: Check your data
- **SQL Editor**: Run queries
- **Authentication**: View users

---

**Ready!** Once you complete these steps, your app will have:
- ✅ User registration
- ✅ User login
- ✅ Database for goals
- ✅ Ready to add features
