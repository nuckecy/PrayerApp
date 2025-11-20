-- Sample Data Seed Script for DailyGoalTracker
-- Run this in Supabase SQL Editor to create test data
-- WARNING: Only run in development/testing environments!

-- ============================================================================
-- STEP 1: Create Test Author
-- ============================================================================

-- First, you need to create a test user account through the app's registration
-- Then find the user ID and insert author record manually, or use this after registration:

DO $$
DECLARE
    test_user_id UUID;
    test_author_id UUID;
    mindfulness_goal_id UUID;
    productivity_goal_id UUID;
    fitness_goal_id UUID;
BEGIN
    -- Get the first user who doesn't have an author profile
    -- (You should create a test user via the registration page first)
    SELECT id INTO test_user_id
    FROM profiles
    WHERE id NOT IN (SELECT user_id FROM authors)
    ORDER BY created_at DESC
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No user found without author profile. Please register a user first via /auth/register';
        RETURN;
    END IF;

    RAISE NOTICE 'Using user ID: %', test_user_id;

    -- Create author profile
    INSERT INTO authors (user_id, bio, status, approval_date)
    VALUES (
        test_user_id,
        'I am a mindfulness coach and productivity expert with over 10 years of experience helping people achieve their personal development goals through structured daily practices.',
        'active',
        NOW()
    )
    RETURNING id INTO test_author_id;

    RAISE NOTICE 'Created author ID: %', test_author_id;

    -- ============================================================================
    -- STEP 2: Create Sample Goal #1 - 7-Day Mindfulness Journey
    -- ============================================================================

    INSERT INTO goals (
        author_id,
        title,
        description,
        citation,
        total_days,
        tags,
        chat_enabled,
        approval_status
    )
    VALUES (
        test_author_id,
        '7-Day Mindfulness Journey',
        'Learn to practice daily mindfulness through guided exercises and meditation techniques. This program will help you reduce stress, increase awareness, and develop a sustainable mindfulness practice.',
        'Based on Jon Kabat-Zinn''s MBSR (Mindfulness-Based Stress Reduction) program',
        7,
        ARRAY['Mindfulness', 'Health', 'Spirituality'],
        true,
        'published'
    )
    RETURNING id INTO mindfulness_goal_id;

    -- Day 1: Introduction
    INSERT INTO goal_days (goal_id, day_index, title, brief_preview, content_type, content_payload)
    VALUES (
        mindfulness_goal_id,
        1,
        'Introduction to Mindful Breathing',
        'Learn the basics of mindful breathing and why it''s fundamental to mindfulness practice',
        'text',
        jsonb_build_object(
            'text',
            E'Welcome to your mindfulness journey!\n\nMindful breathing is the foundation of all mindfulness practices. It''s simple, yet profound. Today, you''ll learn how to use your breath as an anchor to the present moment.\n\nThe Practice:\n1. Find a comfortable seated position\n2. Close your eyes or soften your gaze\n3. Notice your natural breath without trying to change it\n4. Count each exhale from 1 to 10, then start over\n5. When your mind wanders (and it will), gently return to counting\n\nPractice this for 5 minutes today. Notice how your mind behaves - does it wander? That''s completely normal and expected.\n\nRemember: The goal isn''t to stop thinking. It''s to notice when you''re thinking and gently return to the breath.'
        )
    );

    -- Day 2: Body Scan
    INSERT INTO goal_days (goal_id, day_index, title, brief_preview, content_type, content_payload)
    VALUES (
        mindfulness_goal_id,
        2,
        'Body Scan Meditation',
        'Develop body awareness through systematic attention to physical sensations',
        'text',
        jsonb_build_object(
            'text',
            E'The body scan is a powerful technique for developing body awareness and releasing tension.\n\nHow to Practice:\n1. Lie down or sit comfortably\n2. Bring attention to your left foot\n3. Notice any sensations - warmth, tingling, pressure, or nothing at all\n4. Slowly move your attention up through each part of your body\n5. Spend 30 seconds to 1 minute on each area\n6. If you notice tension, breathe into it and let it soften\n\nBody areas to scan:\n- Left foot → left leg → left hip\n- Right foot → right leg → right hip\n- Lower back → upper back\n- Stomach → chest\n- Left hand → left arm → left shoulder\n- Right hand → right arm → right shoulder\n- Neck → face → top of head\n\nTake 10-15 minutes for your first body scan. You might fall asleep - that''s okay! Your body might need the rest.'
        )
    );

    -- Day 3: Mindful Walking
    INSERT INTO goal_days (goal_id, day_index, title, brief_preview, content_type, content_payload)
    VALUES (
        mindfulness_goal_id,
        3,
        'Mindful Walking Exercise',
        'Bring mindfulness into movement and daily activities',
        'exercise',
        jsonb_build_object(
            'instructions',
            E'Today, practice mindful walking for 10 minutes.\n\nInstructions:\n1. Find a quiet space where you can walk back and forth (10-20 steps)\n2. Stand still and feel your feet on the ground\n3. Begin walking very slowly\n4. Notice the sensation of lifting your foot, moving it through space, and placing it down\n5. Pay attention to the shifting of weight from one foot to the other\n6. When your mind wanders, gently return attention to the sensations of walking\n7. Walk to the end of your space, pause, turn around mindfully, and walk back\n\nAfter your walk, reflect: What did you notice? How did it feel different from regular walking?'
        )
    );

    -- Day 4: Mindfulness Checklist
    INSERT INTO goal_days (goal_id, day_index, title, brief_preview, content_type, content_payload)
    VALUES (
        mindfulness_goal_id,
        4,
        'Daily Mindfulness Integration',
        'Bring mindfulness into everyday activities throughout your day',
        'checklist',
        jsonb_build_object(
            'items', ARRAY[
                'Take 3 mindful breaths before getting out of bed',
                'Eat one meal without any distractions (no phone, TV, or reading)',
                'Notice 5 things you can see, 4 you can hear, 3 you can touch, 2 you can smell, 1 you can taste',
                'Take a 5-minute mindful walking break',
                'Practice 10 minutes of sitting meditation',
                'Before bed, reflect on 3 things you''re grateful for today'
            ]
        )
    );

    -- Day 5: Observing Thoughts
    INSERT INTO goal_days (goal_id, day_index, title, brief_preview, content_type, content_payload)
    VALUES (
        mindfulness_goal_id,
        5,
        'Observing Thoughts Without Judgment',
        'Learn to watch your thoughts like clouds passing in the sky',
        'text',
        jsonb_build_object(
            'text',
            E'Today''s practice focuses on observing thoughts without getting caught in them.\n\nThe Thought-Watching Practice:\n1. Sit comfortably and close your eyes\n2. Imagine your mind as a vast sky\n3. Thoughts are like clouds passing through\n4. As each thought arises, notice it: "There''s a thought about work" or "There''s a worry"\n5. Don''t try to push thoughts away or hold onto them\n6. Simply observe and let them pass\n7. Return attention to your breath\n\nKey Insight:\nYou are not your thoughts. You are the awareness that notices thoughts. This distinction is powerful - it means you don''t have to believe or act on every thought that enters your mind.\n\nPractice this for 15 minutes today. Count how many thoughts arise - don''t judge, just notice. Some people have 50+ thoughts in 15 minutes. That''s normal!'
        )
    );

    -- Day 6: Gratitude Practice
    INSERT INTO goal_days (goal_id, day_index, title, brief_preview, content_type, content_payload)
    VALUES (
        mindfulness_goal_id,
        6,
        'Mindful Gratitude Practice',
        'Cultivate appreciation and positive emotions through gratitude meditation',
        'exercise',
        jsonb_build_object(
            'instructions',
            E'Gratitude is a powerful mindfulness practice that shifts focus from what''s lacking to what''s present.\n\nGratitude Meditation (15 minutes):\n1. Sit comfortably and close your eyes\n2. Take 5 deep breaths to settle\n3. Bring to mind someone who has been kind to you\n4. Visualize their face and feel appreciation for them\n5. Say silently: "Thank you for your kindness"\n6. Notice how gratitude feels in your body\n7. Repeat with 2-3 more people\n8. Expand gratitude to simple things: your breath, your home, food, nature\n9. Rest in the feeling of gratitude for 5 minutes\n\nJournal Prompt:\nWrite about 3 specific things you''re grateful for today and WHY they matter to you. Go deeper than "I''m grateful for my family" - what specifically about your family brings you joy?'
        )
    );

    -- Day 7: Integration and Next Steps
    INSERT INTO goal_days (goal_id, day_index, title, brief_preview, content_type, content_payload)
    VALUES (
        mindfulness_goal_id,
        7,
        'Integration and Your Ongoing Practice',
        'Reflect on your journey and create a sustainable mindfulness practice',
        'text',
        jsonb_build_object(
            'text',
            E'Congratulations! You''ve completed 7 days of mindfulness practice.\n\nReflection Questions:\n1. What practice resonated most with you?\n2. What challenges did you face?\n3. What differences have you noticed in your stress levels, awareness, or reactivity?\n4. Which practices can you realistically continue?\n\nCreating Your Ongoing Practice:\nDon''t try to do everything. Pick 1-2 practices that felt most valuable:\n\n- Daily option: 10-15 minutes of sitting meditation\n- Minimal option: 3 mindful breaths, 3 times per day\n- Integration option: One mindful meal per day\n- Movement option: 10 minutes of mindful walking\n\nRemember: Consistency beats intensity. It''s better to practice 5 minutes daily than 30 minutes once a week.\n\nNext Steps:\n- Consider joining a meditation group or app community\n- Read "Wherever You Go, There You Are" by Jon Kabat-Zinn\n- Explore other mindfulness programs\n- Most importantly: Keep practicing!\n\nThe journey continues. Thank you for these 7 days of practice. 🙏'
        )
    );

    RAISE NOTICE 'Created Mindfulness goal with 7 days';

    -- ============================================================================
    -- STEP 3: Create Sample Goal #2 - 5-Day Productivity Boost
    -- ============================================================================

    INSERT INTO goals (
        author_id,
        title,
        description,
        citation,
        total_days,
        tags,
        chat_enabled,
        approval_status
    )
    VALUES (
        test_author_id,
        '5-Day Productivity Boost',
        'Transform your daily productivity with proven techniques from the world''s top performers. Learn time management, focus strategies, and energy optimization to achieve more in less time.',
        'Based on principles from "Deep Work" by Cal Newport and "Atomic Habits" by James Clear',
        5,
        ARRAY['Productivity', 'Career', 'Learning'],
        true,
        'published'
    )
    RETURNING id INTO productivity_goal_id;

    -- Productivity Goal Days (abbreviated for brevity)
    INSERT INTO goal_days (goal_id, day_index, title, brief_preview, content_type, content_payload)
    VALUES
        (productivity_goal_id, 1, 'The Power of Time Blocking', 'Learn to structure your day for maximum productivity', 'text',
         jsonb_build_object('text', E'Time blocking is the practice of dividing your day into blocks of time, each dedicated to a specific task or type of work. Today you''ll learn how to implement this powerful system.')),
        (productivity_goal_id, 2, 'Deep Work Sessions', 'Master the art of focused, distraction-free work', 'exercise',
         jsonb_build_object('instructions', E'Today, schedule two 90-minute deep work sessions. Eliminate all distractions: turn off notifications, close email, and focus on your most important task.')),
        (productivity_goal_id, 3, 'Energy Management', 'Align your tasks with your natural energy rhythms', 'text',
         jsonb_build_object('text', E'Productivity isn''t just about time management - it''s about energy management. Learn to identify your peak energy hours and schedule your most important work accordingly.')),
        (productivity_goal_id, 4, 'Morning Routine Optimization', 'Design a morning routine that sets you up for success', 'checklist',
         jsonb_build_object('items', ARRAY['Wake up at consistent time', 'No phone for first hour', 'Hydrate (2 glasses water)', 'Exercise or stretching (20 min)', 'Review daily priorities', 'Eat nutritious breakfast'])),
        (productivity_goal_id, 5, 'Weekly Review System', 'Implement a weekly review to maintain momentum', 'text',
         jsonb_build_object('text', E'A weekly review is essential for continuous improvement. Learn how to reflect on what worked, what didn''t, and plan for the week ahead.'));

    RAISE NOTICE 'Created Productivity goal with 5 days';

    -- ============================================================================
    -- STEP 4: Create Sample Goal #3 - 10-Day Fitness Kickstart
    -- ============================================================================

    INSERT INTO goals (
        author_id,
        title,
        description,
        citation,
        total_days,
        tags,
        chat_enabled,
        approval_status
    )
    VALUES (
        test_author_id,
        '10-Day Fitness Kickstart',
        'Start your fitness journey with this beginner-friendly program. No gym required! Build strength, flexibility, and cardiovascular health with bodyweight exercises you can do anywhere.',
        'Designed by certified personal trainers',
        10,
        ARRAY['Fitness', 'Health'],
        true,
        'published'
    )
    RETURNING id INTO fitness_goal_id;

    -- Fitness Goal Days (abbreviated)
    INSERT INTO goal_days (goal_id, day_index, title, brief_preview, content_type, content_payload)
    VALUES
        (fitness_goal_id, 1, 'Introduction & Assessment', 'Set your baseline and understand proper form', 'text',
         jsonb_build_object('text', E'Welcome to your fitness journey! Today is about assessment and learning proper form for basic exercises.')),
        (fitness_goal_id, 2, 'Upper Body Basics', 'Push-ups, planks, and arm exercises', 'checklist',
         jsonb_build_object('items', ARRAY['10 push-ups (modify as needed)', '30-second plank (3 sets)', '15 arm circles each direction', '10 tricep dips', 'Stretch: 5 minutes'])),
        (fitness_goal_id, 3, 'Lower Body Power', 'Squats, lunges, and leg strength', 'checklist',
         jsonb_build_object('items', ARRAY['20 bodyweight squats', '10 lunges each leg', '15 glute bridges', '20 calf raises', 'Stretch: 5 minutes'])),
        (fitness_goal_id, 4, 'Core Strength', 'Build a strong, stable core', 'checklist',
         jsonb_build_object('items', ARRAY['30-second plank (3 sets)', '15 bicycle crunches', '10 leg raises', '20 russian twists', 'Stretch: 5 minutes'])),
        (fitness_goal_id, 5, 'Active Recovery', 'Light movement and stretching', 'text',
         jsonb_build_object('text', E'Recovery is just as important as training. Today focus on gentle movement, stretching, and allowing your body to adapt.')),
        (fitness_goal_id, 6, 'Full Body Circuit', 'Combine everything you''ve learned', 'exercise',
         jsonb_build_object('instructions', E'Complete 3 rounds of: 10 push-ups, 15 squats, 10 lunges each leg, 30-second plank, 15 bicycle crunches. Rest 90 seconds between rounds.')),
        (fitness_goal_id, 7, 'Cardio Blast', 'Get your heart rate up', 'text',
         jsonb_build_object('text', E'Today is all about cardiovascular health. Choose from: 20-minute brisk walk, 15-minute jog, or 10-minute jumping jacks/burpees.')),
        (fitness_goal_id, 8, 'Strength Progression', 'Level up your exercises', 'checklist',
         jsonb_build_object('items', ARRAY['15 push-ups', '25 squats', '12 lunges each leg', '45-second plank', '20 bicycle crunches'])),
        (fitness_goal_id, 9, 'Challenge Day', 'Test your progress', 'exercise',
         jsonb_build_object('instructions', E'Complete as many rounds as possible in 15 minutes: 5 push-ups, 10 squats, 5 lunges each leg, 15-second plank. Track your score!')),
        (fitness_goal_id, 10, 'Celebration & Next Steps', 'Reflect and plan your ongoing fitness journey', 'text',
         jsonb_build_object('text', E'Congratulations! You''ve completed 10 days. Reflect on your progress and plan how to continue your fitness journey.'));

    RAISE NOTICE 'Created Fitness goal with 10 days';

    -- ============================================================================
    -- Summary
    -- ============================================================================
    RAISE NOTICE '=======================================';
    RAISE NOTICE 'Sample data created successfully!';
    RAISE NOTICE '=======================================';
    RAISE NOTICE 'Author ID: %', test_author_id;
    RAISE NOTICE 'Goals created:';
    RAISE NOTICE '  1. 7-Day Mindfulness Journey (ID: %)', mindfulness_goal_id;
    RAISE NOTICE '  2. 5-Day Productivity Boost (ID: %)', productivity_goal_id;
    RAISE NOTICE '  3. 10-Day Fitness Kickstart (ID: %)', fitness_goal_id;
    RAISE NOTICE '=======================================';
    RAISE NOTICE 'Visit http://localhost:3000/goals to see them!';
    RAISE NOTICE '=======================================';

END $$;
