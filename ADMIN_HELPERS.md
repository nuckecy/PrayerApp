# Admin Helper Guide - Manual Approvals

Until the Admin Panel (Phase 6) is built, use these SQL queries in the Supabase SQL Editor to manually approve authors and goals.

## Quick Links
- **Supabase Dashboard**: https://supabase.com/dashboard
- **SQL Editor**: Your Project → SQL Editor

---

## 1. Approve Author Applications

### View Pending Author Applications
```sql
SELECT
  a.id,
  a.user_id,
  p.name,
  p.email,
  a.bio,
  a.portfolio_url,
  a.status,
  a.created_at
FROM authors a
JOIN profiles p ON a.user_id = p.id
WHERE a.status = 'pending'
ORDER BY a.created_at DESC;
```

### Approve a Specific Author (by email)
```sql
UPDATE authors
SET
  status = 'active',
  approval_date = NOW(),
  approved_by = NULL  -- Set to admin user_id if you want to track who approved
WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'author@example.com'
)
AND status = 'pending';
```

### Approve All Pending Authors (use carefully!)
```sql
UPDATE authors
SET
  status = 'active',
  approval_date = NOW()
WHERE status = 'pending';
```

---

## 2. Approve Goal Publications

### View Goals Pending Approval
```sql
SELECT
  g.id,
  g.title,
  g.description,
  g.total_days,
  g.approval_status,
  p.name AS author_name,
  p.email AS author_email,
  g.created_at
FROM goals g
JOIN authors a ON g.author_id = a.id
JOIN profiles p ON a.user_id = p.id
WHERE g.approval_status = 'pending'
ORDER BY g.created_at DESC;
```

### Approve a Specific Goal (by title)
```sql
UPDATE goals
SET approval_status = 'published'
WHERE title = 'Your Goal Title Here'
AND approval_status = 'pending';
```

### Approve a Specific Goal (by ID)
```sql
UPDATE goals
SET approval_status = 'published'
WHERE id = 'your-goal-uuid-here'
AND approval_status = 'pending';
```

### Reject a Goal (with reason - future feature)
```sql
UPDATE goals
SET approval_status = 'archived'
WHERE id = 'your-goal-uuid-here';
```

---

## 3. Grant Admin Access to a User

### Make a user a super admin
```sql
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'admin@example.com';
```

### View all admin users
```sql
SELECT
  id,
  name,
  email,
  role,
  created_at
FROM profiles
WHERE role IN ('super_admin', 'author')
ORDER BY role, created_at DESC;
```

---

## 4. Monitor Platform Activity

### Count enrollments per goal
```sql
SELECT
  g.title,
  g.approval_status,
  COUNT(e.id) AS enrollment_count,
  COUNT(CASE WHEN e.status = 'active' THEN 1 END) AS active_enrollments,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) AS completed_enrollments
FROM goals g
LEFT JOIN enrollments e ON g.id = e.goal_id
WHERE g.approval_status = 'published'
GROUP BY g.id, g.title, g.approval_status
ORDER BY enrollment_count DESC;
```

### View recent day completions
```sql
SELECT
  p.name AS user_name,
  g.title AS goal_title,
  dc.day_index,
  dc.completed_at
FROM day_completions dc
JOIN enrollments e ON dc.enrollment_id = e.id
JOIN profiles p ON e.user_id = p.id
JOIN goals g ON e.goal_id = g.id
ORDER BY dc.completed_at DESC
LIMIT 20;
```

### Active users today
```sql
SELECT
  COUNT(DISTINCT e.user_id) AS active_users_today
FROM enrollments e
WHERE DATE(e.last_completed_at) = CURRENT_DATE;
```

---

## 5. Quick Testing Workflow

To test the complete Phase 2 flow:

1. **Create Test Author**
```sql
-- Run after registering a test user
UPDATE authors
SET status = 'active', approval_date = NOW()
WHERE user_id = (SELECT id FROM profiles WHERE email = 'test@example.com');
```

2. **Publish Test Goal**
```sql
-- After creating a goal through the UI
UPDATE goals
SET approval_status = 'published'
WHERE author_id IN (
  SELECT id FROM authors WHERE user_id = (
    SELECT id FROM profiles WHERE email = 'test@example.com'
  )
)
AND approval_status = 'draft';
```

---

## 6. Troubleshooting

### Check if a user can see published goals
```sql
SELECT
  id,
  title,
  approval_status,
  total_days
FROM goals
WHERE approval_status = 'published'
ORDER BY created_at DESC;
```

### Check user's enrollments
```sql
SELECT
  e.*,
  g.title AS goal_title
FROM enrollments e
JOIN goals g ON e.goal_id = g.id
WHERE e.user_id = (SELECT id FROM profiles WHERE email = 'user@example.com')
ORDER BY e.created_at DESC;
```

### Check goal days count
```sql
SELECT
  g.title,
  g.total_days,
  COUNT(gd.id) AS days_created
FROM goals g
LEFT JOIN goal_days gd ON g.id = gd.goal_id
GROUP BY g.id, g.title, g.total_days
HAVING COUNT(gd.id) != g.total_days
ORDER BY g.created_at DESC;
```

---

## 7. Data Cleanup (Use with Caution!)

### Delete a specific goal and all related data
```sql
-- This will cascade delete goal_days, enrollments, and completions
DELETE FROM goals WHERE id = 'your-goal-uuid-here';
```

### Reset a user's enrollment for testing
```sql
DELETE FROM enrollments
WHERE user_id = (SELECT id FROM profiles WHERE email = 'test@example.com')
AND goal_id = 'your-goal-uuid-here';
```

---

## Notes

- Always backup data before running DELETE or UPDATE queries
- Use `SELECT` first to verify what will be affected
- The admin panel (Phase 6) will provide a UI for all these operations
- Row Level Security (RLS) policies protect data from unauthorized access
- These queries should only be run by platform administrators

---

## Future: Phase 6 Admin Panel Features

When we build the Admin Panel, it will include:
- Author application review UI
- Goal approval workflow with feedback
- Platform analytics dashboard
- Content moderation tools
- User management
- Bulk operations
- Audit logs

For now, use these SQL helpers for manual administration.
