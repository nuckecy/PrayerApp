# 🧪 LOCAL TESTING - QUICK REFERENCE

## 🚀 Fastest Way to Test Locally (2 steps)

### Option 1: Using Automated Script (Easiest)

```bash
# From project root, run:
bash setup-local-testing.sh "https://xxxxx.supabase.co" "eyJhbGc..."
```

Replace the values with your Supabase credentials from Settings → API

The script will:
1. Create .env.local automatically
2. Install dependencies
3. Start dev server

Then visit: **http://localhost:3000**

---

### Option 2: Manual Setup (More Control)

**Step 1: Create .env.local**
```bash
cd frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
```

**Step 2: Install & Run**
```bash
npm install
npm run dev
```

**Step 3: Visit App**
```
http://localhost:3000
```

---

## ✅ What to Test

- [ ] Landing page loads
- [ ] "Get Started" button works
- [ ] Registration form appears
- [ ] Can enter email/password
- [ ] Sign up creates user
- [ ] User appears in Supabase Auth
- [ ] No console errors

---

## 🐛 Quick Fixes

| Error | Solution |
|-------|----------|
| "Module not found" | Run `npm install` again |
| "Port 3000 in use" | Run `npm run dev -- -p 3001` |
| "Env vars not set" | Restart server after creating .env.local |
| "Can't connect" | Check Supabase URL is correct |

---

## 📌 Important

⚠️ **Never commit .env.local to GitHub!**
- Git will ignore it automatically (.gitignore is configured)
- Delete it when done testing locally

---

## 🛑 Stop Dev Server

Press: **Ctrl+C** in the terminal

---

## ✨ After Successful Local Testing

1. Stop dev server (Ctrl+C)
2. Delete frontend/.env.local (or leave it, git ignores it)
3. Go to Vercel dashboard
4. Add NEXT_PUBLIC_SUPABASE_URL env var
5. Add NEXT_PUBLIC_SUPABASE_ANON_KEY env var
6. Redeploy
7. Done! 🚀
