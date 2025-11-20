# Architecture Decision: Supabase vs Custom Backend

**Status:** Supabase is the official backend solution. The `backend/` folder is DEPRECATED and not in use.

---

## Current Architecture

```
┌─────────────────────────────────────────────────┐
│          Frontend (Next.js 14)                  │
│  ✅ Running at http://localhost:3000            │
│  ✅ All features implemented                    │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────▼─────────┐
        │  Supabase Cloud  │
        │  ✅ IN USE       │
        │  ✅ PostgreSQL   │
        │  ✅ Auth         │
        │  ✅ Real-time    │
        │  ✅ Functions    │
        └──────────────────┘

┌─────────────────────────────────────────────────┐
│   backend/ folder (DEPRECATED)                  │
│   ❌ NOT IN USE                                 │
│   ❌ Fastify + Prisma (old design)              │
│   ℹ️  Kept for reference only                   │
└─────────────────────────────────────────────────┘
```

---

## Why Supabase Instead of Custom Backend?

### Decision Rationale

| Factor | Supabase | Custom Backend |
|--------|----------|----------------|
| **Time to MVP** | 2 weeks | 4-6 weeks |
| **Maintenance** | Managed service | Self-hosted |
| **Authentication** | Built-in | Manual implementation |
| **Real-time** | Native support | Complex setup |
| **Cost** | Free tier generous | Infrastructure costs |
| **DevOps** | Zero config | Full responsibility |
| **Database** | PostgreSQL (managed) | PostgreSQL (manual) |

### What Supabase Provides
✅ PostgreSQL database (11 tables, 6 enums, 5 triggers, 8 functions)  
✅ Row Level Security (RLS) - 20+ policies  
✅ Authentication with JWT tokens  
✅ Real-time subscriptions  
✅ Edge functions for cron jobs  
✅ Built-in API endpoints  
✅ Database webhooks  

### What We Didn't Need
❌ Custom Fastify server  
❌ Prisma ORM (using direct SQL instead)  
❌ Manual authentication logic  
❌ Custom session management  

---

## Backend Folder Structure (DEPRECATED)

If you ever need to reference the original plan, here's what's in the `backend/` folder:

```
backend/
├── src/
│   ├── index.ts              # Fastify server entry
│   ├── routes/
│   │   ├── auth.ts           # Auth endpoints
│   │   ├── goals.ts          # Goal CRUD
│   │   └── enrollments.ts    # Enrollment logic
│   ├── middleware/
│   │   └── auth.ts           # JWT validation
│   ├── utils/
│   │   └── auth.ts           # Auth helpers
│   └── types/
│       └── fastify.d.ts      # Type definitions
├── prisma/
│   └── schema.prisma         # ORM schema (SUPERSEDED by SQL)
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
└── .gitignore
```

**Note:** This folder should be kept for historical reference but is NOT used in the current deployment.

---

## What Changed

### Original Plan
- Frontend (Next.js) + Backend (Fastify) + Database (PostgreSQL)

### Current Reality
- Frontend (Next.js) + Backend (Supabase) → Unified architecture

---

## Migration Impact

### What Works Now
✅ All authentication flows (Supabase auth)  
✅ All data operations (Supabase API + functions)  
✅ Real-time updates (Supabase subscriptions)  
✅ Admin operations (Supabase RLS)  
✅ Notifications (Supabase triggers)  

### What Doesn't Apply
❌ Fastify routes (use Supabase instead)  
❌ Prisma schema (use Supabase SQL)  
❌ Express middleware (use RLS policies)  

---

## Future Considerations

### When Might You Need a Custom Backend?

1. **Complex Business Logic** - If calculations exceed Supabase Functions capability
2. **Third-party Integrations** - Multiple external APIs needing orchestration
3. **Machine Learning** - Custom ML models requiring dedicated compute
4. **Legacy System Integration** - Connecting to external enterprise systems
5. **Performance Optimization** - If Supabase becomes a bottleneck

### Migration Path If Needed

```
Phase 1: Add Node.js backend alongside Supabase
Phase 2: Gradually move business logic to backend
Phase 3: Keep Supabase for auth and real-time
Phase 4: Decommission Supabase endpoints (or hybrid)
```

**Current Status:** Not needed yet. Stay with Supabase.

---

## Cleanup Recommendations

### Option 1: Keep for Reference (RECOMMENDED)
- ✅ Keep `backend/` folder in git
- ✅ Add note to README
- ✅ Tag as "deprecated"
- **Reason:** Historical context for future team members

### Option 2: Archive to Branch
```bash
git checkout -b archive/fastify-backend
# Keep the backend folder
# Commit with message: "archive: Old Fastify backend design (superseded by Supabase)"
git checkout main
```

### Option 3: Delete (NOT RECOMMENDED)
```bash
rm -rf backend/
git commit -m "remove: Delete deprecated Fastify backend (using Supabase instead)"
```

---

## For New Team Members

If you're confused about the `backend/` folder:

1. ✅ The app uses **Supabase for all backend functionality**
2. ❌ The `backend/` folder is **OLD and not used**
3. 📍 All database operations happen in Supabase
4. 🚀 The frontend communicates directly with Supabase via:
   - `@supabase/supabase-js` client
   - Direct SQL queries
   - Supabase Functions (TypeScript on Supabase)

---

## Configuration Reference

### Current Setup
- **Frontend:** Next.js 14 at `./frontend`
- **Backend:** Supabase cloud service
- **Database:** Supabase PostgreSQL
- **ORM:** Direct SQL queries (no Prisma in production)

### Environment Variables
```bash
# Used (Frontend only)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...

# Deprecated (Old Fastify backend)
DATABASE_URL=postgresql://...  # NOT USED
FASTIFY_PORT=3001              # NOT USED
JWT_SECRET=...                 # NOT USED
```

---

## Deployment

### Current Deployment Stack
```
Vercel (Next.js Frontend)
    ↓
Supabase Cloud (PostgreSQL + Auth)
    ↓
GitHub (Source Control)
```

### Not Used
```
AWS ECS (Backend servers) ❌
AWS RDS (Database) ❌
Docker containers ❌
Load balancers ❌
```

This is why deployment is simple and cost-effective!

---

## Questions?

- **Q: Can we use the backend folder?**  
  A: Yes, if you need custom server logic in the future. Supabase Functions are usually sufficient.

- **Q: Should we delete it?**  
  A: Recommend keeping it for now as documentation of the original architecture decision.

- **Q: How do we add new features?**  
  A: All new features go in `frontend/` (Next.js pages/components) and Supabase SQL files.

- **Q: What if Supabase isn't enough?**  
  A: Add a Node.js backend later. Supabase will still handle auth and real-time.

---

**Last Updated:** November 20, 2025  
**Status:** Supabase is production-ready ✅
