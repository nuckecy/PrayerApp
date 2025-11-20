# Phase 2 Testing Guide - Goal Management System

This guide walks you through testing the complete Phase 2 Goal Management features.

---

## Prerequisites

1. **Local Development Server Running**
   ```bash
   cd frontend
   npm run dev
   ```
   App should be available at: http://localhost:3000

2. **Supabase Project Connected**
   - Database schema applied (schema.sql, rls-policies.sql)
   - Environment variables configured in `.env.local`
   - SQL Editor open: https://supabase.com/dashboard

---

## Test Scenario 1: Author Application Flow

### Step 1: Register as New User
1. Navigate to http://localhost:3000/auth/register
2. Fill in:
   - Name: "Test Author"
   - Email: "testauthor@example.com"
   - Password: "TestPass123"
3. Click "Sign Up"
4. You should be redirected to `/dashboard`

### Step 2: Apply to Become Author
1. Click "Author Dashboard" button in the header
2. You'll be redirected to `/author/apply` (first-time authors)
3. Fill in:
   - Bio: (Write at least 50 characters about expertise)
   - Portfolio URL: "https://mywebsite.com" (optional)
4. Click "Submit Application"
5. Should see "Application Under Review" message on author dashboard

### Step 3: Approve Author (Manual - via Supabase)
1. Open Supabase SQL Editor
2. Run this query (replace email):
   ```sql
   UPDATE authors
   SET status = 'active', approval_date = NOW()
   WHERE user_id = (
     SELECT id FROM profiles WHERE email = 'testauthor@example.com'
   );
   ```
3. Refresh `/author/dashboard` in browser
4. Status badge should now show "Active" (green)
5. "Create New Goal" button should appear

**✅ Test 1 Complete: Author application and approval working**

---

## Test Scenario 2: Goal Creation

### Step 1: Start Creating a Goal
1. From Author Dashboard, click "Create New Goal"
2. You'll be at `/author/goals/new`

### Step 2: Fill Goal Metadata (Step 1)
Fill in:
- **Title**: "7-Day Mindfulness Journey"
- **Description**: "Learn to practice daily mindfulness through guided exercises and meditation techniques that will help you reduce stress and increase awareness." (50+ chars)
- **Duration**: 7 days
- **Tags**: Select 2-3 tags (e.g., Mindfulness, Health, Spirituality)
- **Citation**: "Based on Jon Kabat-Zinn's MBSR program" (optional)
- **Chat Enabled**: Check or uncheck

Click "Next: Add Daily Content"

### Step 3: Create Day 1 Content
Fill in:
- **Day Title**: "Introduction to Mindful Breathing"
- **Brief Preview**: "Learn the basics of mindful breathing and why it's fundamental to mindfulness practice"
- **Content Type**: Select "Text Lesson"
- **Content**: Write 2-3 paragraphs about mindful breathing (at least 100 words)

Click "Add Day 1"

You should see Day 1 appear in the "Created Days" list above.

### Step 4: Create Days 2-7
Repeat Step 3 for the remaining days. Here are suggestions:

**Day 2**: "Body Scan Meditation" (Text Lesson)
**Day 3**: "Mindful Walking Exercise" (Interactive Exercise)
**Day 4**: "Daily Mindfulness Checklist" (Checklist - add 5-7 items)
**Day 5**: "Observing Thoughts Without Judgment" (Text Lesson)
**Day 6**: "Gratitude Practice" (Interactive Exercise)
**Day 7**: "Integration and Reflection" (Text Lesson)

### Step 5: Submit Goal
1. Once all 7 days are created, click "Submit for Approval"
2. You should be redirected to `/author/dashboard?goalCreated=pending`
3. Your goal should appear with status badge "pending" (yellow)

**✅ Test 2 Complete: Goal creation with 7 days of content**

---

## Test Scenario 3: Goal Approval & Publishing

### Step 1: Approve Goal (Manual - via Supabase)
1. Open Supabase SQL Editor
2. Run this query:
   ```sql
   UPDATE goals
   SET approval_status = 'published'
   WHERE title = '7-Day Mindfulness Journey'
   AND approval_status = 'pending';
   ```
3. Refresh Author Dashboard
4. Goal status should now show "published" (blue badge)

### Step 2: Verify Goal in Marketplace
1. Navigate to http://localhost:3000/goals
2. Your "7-Day Mindfulness Journey" should appear in the list
3. Click "View Details"
4. You should see:
   - Full goal information
   - Author bio
   - All 7 days with previews
   - "Enroll in This Goal" button

**✅ Test 3 Complete: Goal approval and publishing**

---

## Test Scenario 4: User Enrollment

### Option A: Use Same User (Author enrolling in own goal)
1. On the goal detail page, click "Enroll in This Goal"
2. Should redirect to goal player

### Option B: Create New User (Recommended for full test)
1. Logout (from dashboard)
2. Register new user:
   - Email: "testuser@example.com"
   - Name: "Test User"
   - Password: "TestPass123"
3. Navigate to `/goals`
4. Click on "7-Day Mindfulness Journey"
5. Click "Enroll in This Goal"

### Verify Enrollment
1. After enrollment, you should be at: `/goals/[goal-id]/play/[enrollment-id]`
2. You should see:
   - Goal title at top
   - "Day 1 of 7" indicator
   - Progress bar at 0% (or ~14% after Day 1)
   - Streak counter (0 initially)
   - Day 1 content displayed
   - "Complete Day 1" button at bottom

**✅ Test 4 Complete: User enrollment successful**

---

## Test Scenario 5: Daily Content Completion

### Step 1: Complete Day 1
1. On the goal player page (Day 1)
2. Read the content
3. Scroll to bottom
4. Click "Complete Day 1"
5. Page should reload
6. You should now see Day 2 content
7. Progress bar should show ~14% (1/7)
8. Streak counter should show "1 day streak"

### Step 2: Verify Midnight Rule (Same Day)
1. Try to complete Day 2 immediately
2. Click "Complete Day 2"
3. You should see error: "You already completed a day today. Come back tomorrow!"
4. Button should be disabled
5. Yellow warning message should appear

**✅ Test 5 Complete: Day completion and Midnight Rule working**

---

## Test Scenario 6: Multi-Day Progression (Full Test)

To test the complete flow through all 7 days:

### Option 1: Manual Database Updates (for testing)
You can simulate the passage of days by updating `last_completed_at`:

```sql
-- Complete Day 2 (set last_completed_at to yesterday)
UPDATE enrollments
SET last_completed_at = NOW() - INTERVAL '1 day'
WHERE user_id = (SELECT id FROM profiles WHERE email = 'testuser@example.com')
AND goal_id = (SELECT id FROM goals WHERE title = '7-Day Mindfulness Journey');
```

Then refresh the goal player and complete Day 2.

### Option 2: Wait 24 Hours (Real-world test)
1. Come back tomorrow
2. Navigate to `/dashboard`
3. Click "Continue" on your active goal
4. Complete Day 2
5. Repeat until Day 7

### Day 7 Completion (Goal Complete)
1. When you complete Day 7, you should be redirected to `/dashboard?goalCompleted=true`
2. The goal should now appear in "Completed Goals" section
3. Status should show "completed" with checkmark ✅
4. Enrollment should show "Completed 7 days"

**✅ Test 6 Complete: Full goal completion flow**

---

## Test Scenario 7: Dashboard Views

### Test Active Goals View
1. Enroll in another goal (if available)
2. Navigate to `/dashboard`
3. Verify:
   - Active goals section shows enrolled goals
   - Progress bar reflects completed days
   - Streak counter is accurate
   - "Continue" button works

### Test Completed Goals View
1. After completing a goal
2. Navigate to `/dashboard`
3. Verify:
   - Completed goals section appears
   - Goal shows with checkmark
   - Shows total days completed
   - No "Continue" button (goal is done)

**✅ Test 7 Complete: Dashboard displays correctly**

---

## Test Scenario 8: Edge Cases & Validation

### Test: Goal with Insufficient Days
1. Try to create a goal with only 3 days
2. Try to submit
3. Should see error: "A goal must have at least 5 days"

### Test: Missing Required Fields
1. Try to skip Day Title or Brief Preview
2. Click "Add Day"
3. Should see error: "Please fill in the day title and preview"

### Test: Unapproved Author Creating Goals
1. Create a new author account
2. Don't approve in Supabase
3. Try to access `/author/goals/new`
4. Should see error or be blocked

### Test: Double Enrollment
1. Try to enroll in same goal twice
2. Should see error: "You are already enrolled in this goal"
3. Button should change to "View in Dashboard"

**✅ Test 8 Complete: Validations working correctly**

---

## Verification Checklist

After completing all tests, verify in Supabase:

### Authors Table
```sql
SELECT * FROM authors WHERE status = 'active';
```
Should show your test author.

### Goals Table
```sql
SELECT * FROM goals WHERE approval_status = 'published';
```
Should show your published goal.

### Goal Days Table
```sql
SELECT COUNT(*) as day_count, goal_id
FROM goal_days
GROUP BY goal_id;
```
Should show 7 days for your goal.

### Enrollments Table
```sql
SELECT
  e.*,
  g.title,
  p.name
FROM enrollments e
JOIN goals g ON e.goal_id = g.id
JOIN profiles p ON e.user_id = p.id;
```
Should show your test enrollment(s).

### Day Completions Table
```sql
SELECT
  dc.day_index,
  dc.completed_at,
  p.name
FROM day_completions dc
JOIN enrollments e ON dc.enrollment_id = e.id
JOIN profiles p ON e.user_id = p.id
ORDER BY dc.completed_at DESC;
```
Should show completed days.

---

## Known Limitations (Will be fixed in later phases)

1. **Midnight Rule**: Currently uses simple date comparison, not timezone-aware (Phase 3 will add timezone support)
2. **No Edit Goal**: Can't edit a goal after creation yet
3. **No Delete Goal**: Can't delete goals through UI
4. **No Admin Panel**: Approvals must be done via SQL (Phase 6)
5. **No Groups**: Solo enrollment only (Phase 4 will add groups)
6. **No Notifications**: No reminders yet (Phase 5)
7. **No Analytics**: Author analytics not yet implemented

---

## Troubleshooting

### "Goal not found or not published"
- Check that goal `approval_status` is 'published' in Supabase
- Verify goal exists with: `SELECT * FROM goals WHERE id = 'your-id';`

### "You must be an approved author to create goals"
- Check author status is 'active' in Supabase
- Run: `SELECT * FROM authors WHERE user_id = 'your-user-id';`

### Day completion not working
- Check if you already completed a day today
- Verify `last_completed_at` in enrollments table
- Check for errors in browser console

### Progress not showing correctly
- Verify day_completions records exist
- Check enrollment `current_day_index` value
- Refresh the page

---

## Next: Phase 3 Features

After confirming Phase 2 works:
1. Enhanced Midnight Rule with timezone support
2. Progress calendar visualization
3. Pause/resume functionality
4. Goal completion certificates
5. Badges & achievements

---

**Happy Testing! 🎯**

If you find any bugs, document them and we'll fix before Phase 3.
