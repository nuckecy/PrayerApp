# DailyGoalTracker 🎯

> A Progressive Web App for structured habit formation and micro-learning through daily goal completion with community-driven accountability.

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-black)](https://ui.shadcn.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📋 Documentation

- **[Product Requirements Document (PRD)](./PRD.md)** - Comprehensive product specification including vision, features, architecture, and roadmap
- **[Project Status & Roadmap](./PROJECT_STATUS.md)** - Current development status, completed features, and what's coming next
- **[Quick Start Guide](./QUICK_START.md)** - Deploy to production in 20 minutes
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Pre-launch verification steps

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [UI Components](#ui-components)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

DailyGoalTracker revolutionizes habit formation through a unique "one day at a time" approach. Users must complete each day's content sequentially before progressing, with no ability to speed-run or skip ahead. The platform connects content authors with learners through structured programs that emphasize consistency over speed.

### 🚀 Current Status: MVP Phase - Authentication Complete ✅

**What's Ready:**
- ✅ User registration & login system
- ✅ Supabase authentication integrated
- ✅ Dashboard for authenticated users
- ✅ Beautiful landing page
- ✅ Responsive mobile design
- ✅ PWA installable app
- ✅ Local development environment

**What's Next:**
- 📋 Goal creation interface for authors
- 🎯 Goal browsing and discovery
- 📅 Daily progress tracking with The Midnight Rule
- 👥 Groups and collective accountability
- 🔔 Notifications and reminders

👉 **See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for complete feature breakdown and development roadmap.**

### 🚀 Core Philosophy

- **Forced Sequential Learning**: Complete Day 1 before accessing Day 2
- **Relative Time Tracking**: Progress adapts to actual engagement, not calendar dates
- **Social Accountability**: "12 members on track" instead of competitive leaderboards
- **The Midnight Rule**: Daily reset at user's local timezone

### 📊 Success Metrics

| Metric | Target |
|--------|--------|
| User Retention (30-day) | > 40% |
| Goal Completion Rate | > 60% |
| Daily Active Users | 25% of registered |
| Page Load Time | < 2s on 3G |

## Key Features

### For Users
- 📱 **PWA Mobile-First**: Installable, works offline
- 🎯 **Daily Goals**: One step per day, strict progression
- 👥 **Groups**: Join communities for shared accountability
- 🏆 **Achievements**: Badges, streaks, and certificates
- 📅 **Smart Calendar**: Visual progress tracking
- 🔔 **Notifications**: Customizable daily reminders

### For Authors
- ✍️ **Content Creation**: Text, exercises, checklists
- 📊 **Analytics Dashboard**: Track engagement metrics
- 💬 **Community Tools**: Enable discussions per goal
- 🔄 **Version Control**: Update content with approval workflow
- 📈 **Growth Insights**: Subscriber and completion analytics

### For Admins
- 🛡️ **Content Moderation**: Approval workflow system
- 📊 **Platform Analytics**: Health and engagement metrics
- 👥 **User Management**: Author and user administration
- 🔒 **Policy Enforcement**: Content and behavior moderation

## Quick Start

### Local Development (3 minutes)

```bash
# Clone the repo
git clone https://github.com/nuckecy/PrayerApp.git
cd PrayerApp

# Install dependencies
cd frontend && npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start dev server
npm run dev

# Open http://localhost:3000
```

### Deploy to Production (10 minutes)

👉 **See [QUICK_START.md](./QUICK_START.md)** for step-by-step Vercel deployment guide.

## Tech Stack

### Frontend
```yaml
Framework: Next.js 14 (App Router)
Language: TypeScript 5.0
Styling: TailwindCSS 3.4
UI Components: shadcn/ui
State Management: Zustand
Forms: React Hook Form + Zod
PWA: Workbox 7.0
Animations: Framer Motion
Charts: Recharts
```

### Backend
```yaml
Runtime: Node.js 20 LTS
Framework: Fastify 4.x
Database: PostgreSQL 15
Cache: Redis 7
Queue: Bull Queue
File Storage: AWS S3
Auth: JWT + Refresh Tokens
Validation: Zod
ORM: Prisma 5
```

### Infrastructure
```yaml
Hosting: Vercel (Frontend) + AWS ECS (Backend)
CDN: CloudFlare
Monitoring: Sentry + DataDog
Analytics: PostHog
CI/CD: GitHub Actions
Testing: Vitest + Playwright
```

## Getting Started

### Prerequisites

- Node.js 20+ 
- PostgreSQL 15+
- Redis 7+
- npm or yarn or pnpm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/dailygoaltracker.git
cd dailygoaltracker
```

2. **Install dependencies**
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. **Set up environment variables**

Create `.env.local` in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
```

Create `.env` in the backend directory:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dailygoaltracker
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=dailygoaltracker-assets

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

4. **Set up the database**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

5. **Initialize shadcn/ui**
```bash
cd frontend
npx shadcn-ui@latest init
# Follow the prompts to configure your components
```

6. **Run development servers**

Terminal 1 (Frontend):
```bash
cd frontend
npm run dev
```

Terminal 2 (Backend):
```bash
cd backend
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
dailygoaltracker/
├── frontend/                 # Next.js PWA application
│   ├── app/                 # App router pages
│   │   ├── (auth)/         # Authentication pages
│   │   ├── (dashboard)/    # Protected dashboard
│   │   ├── goals/          # Goal browsing/viewing
│   │   └── admin/          # Admin panel
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── goals/         # Goal-specific components
│   │   ├── groups/        # Group components
│   │   └── shared/        # Shared components
│   ├── lib/               # Utilities and helpers
│   │   ├── api/          # API client
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utility functions
│   │   └── validators/   # Zod schemas
│   ├── public/           # Static assets
│   └── styles/           # Global styles
│
├── backend/              # Fastify API server
│   ├── src/
│   │   ├── modules/     # Feature modules
│   │   │   ├── auth/   # Authentication
│   │   │   ├── goals/  # Goals management
│   │   │   ├── users/  # User management
│   │   │   └── groups/ # Groups functionality
│   │   ├── common/     # Shared code
│   │   │   ├── guards/ # Auth guards
│   │   │   ├── pipes/  # Validation pipes
│   │   │   └── utils/  # Utilities
│   │   ├── config/     # Configuration
│   │   └── database/   # Database setup
│   ├── prisma/         # Prisma schema & migrations
│   └── tests/          # Test files
│
├── docs/               # Documentation
├── scripts/           # Build and deployment scripts
└── docker/            # Docker configurations
```

## Development

### UI Components with shadcn/ui

Install and use shadcn/ui components:

```bash
# Install specific components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add tabs
```

Example component usage:

```tsx
// app/goals/[id]/page.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"

export default function GoalPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>30-Day Mindfulness Journey</CardTitle>
        <CardDescription>Day 5 of 30</CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={17} className="mb-4" />
        <div className="flex gap-2 mb-4">
          <Badge>Streak: 5 days</Badge>
          <Badge variant="outline">12 members on track</Badge>
        </div>
        <Button className="w-full" size="lg">
          Mark Day 5 Complete
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Custom Theme Configuration

Configure your theme in `tailwind.config.ts`:

```ts
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### The Midnight Rule Implementation

```typescript
// lib/utils/midnight-rule.ts
import { format, startOfDay, isAfter, isSame } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export interface EnrollmentProgress {
  lastCompletedAt: Date | null;
  currentDayIndex: number;
  userTimezone: string;
}

export function canCompleteToday(enrollment: EnrollmentProgress): {
  canComplete: boolean;
  reason: string;
  nextAvailable?: Date;
} {
  const { lastCompletedAt, userTimezone } = enrollment;
  
  if (!lastCompletedAt) {
    return { canComplete: true, reason: "No previous completion" };
  }

  const now = new Date();
  const userNow = toZonedTime(now, userTimezone);
  const userToday = startOfDay(userNow);
  
  const lastCompletedUserTime = toZonedTime(lastCompletedAt, userTimezone);
  const lastCompletedDay = startOfDay(lastCompletedUserTime);
  
  if (isSame(lastCompletedDay, userToday)) {
    const tomorrow = new Date(userToday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      canComplete: false,
      reason: "Already completed today. Come back tomorrow!",
      nextAvailable: tomorrow
    };
  }
  
  return {
    canComplete: true,
    reason: "Ready to complete today's goal"
  };
}
```

### PWA Service Worker

```javascript
// public/service-worker.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/goals'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 5 * 60 }), // 5 minutes
    ],
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// Offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});
```

## API Documentation

### Authentication Endpoints

```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  timezone: string;
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

// Response
interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'author' | 'super_admin';
  };
  tokens: {
    access: string;
    refresh: string;
  };
}
```

### Goal Endpoints

```typescript
// GET /api/goals
interface GoalsListResponse {
  goals: Goal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// POST /api/goals/:id/enroll
interface EnrollRequest {
  groupId?: string; // Optional group enrollment
}

// POST /api/enrollments/:id/complete
interface CompleteRequest {
  dayIndex: number;
  completedContent?: any; // For exercises
}
```

### Group Endpoints

```typescript
// POST /api/groups/create
interface CreateGroupRequest {
  goalId: string;
  name: string;
  privacy: 'public' | 'private';
  maxMembers?: number;
}

// POST /api/groups/join
interface JoinGroupRequest {
  inviteCode: string; // 6-character code
}
```

## Database Schema

### Core Tables

```sql
-- Users table with timezone support
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'author', 'user') DEFAULT 'user',
    timezone VARCHAR(50) DEFAULT 'UTC',
    email_verified BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goals with approval workflow
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES authors(id),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    min_days INTEGER DEFAULT 5 CHECK (min_days >= 5),
    total_days INTEGER NOT NULL,
    approval_status ENUM('draft', 'pending', 'published', 'archived'),
    tags TEXT[],
    chat_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments with progress tracking
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    goal_id UUID REFERENCES goals(id),
    group_id UUID REFERENCES groups(id),
    current_day_index INTEGER DEFAULT 1,
    last_completed_at TIMESTAMP,
    streak_count INTEGER DEFAULT 0,
    status ENUM('active', 'paused', 'completed') DEFAULT 'active',
    start_date DATE NOT NULL,
    projected_end_date DATE,
    UNIQUE(user_id, goal_id, group_id)
);
```

### Indexes for Performance

```sql
-- Performance indexes
CREATE INDEX idx_enrollments_user_status ON enrollments(user_id, status);
CREATE INDEX idx_goals_approval_status ON goals(approval_status);
CREATE INDEX idx_groups_invite_code ON groups(invite_code);
CREATE INDEX idx_goal_days_goal_id ON goal_days(goal_id, day_index);
```

## UI Components

### Component Library Structure

```
components/
├── ui/                    # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── toast.tsx
│   └── ...
├── goals/                 # Goal-specific components
│   ├── GoalCard.tsx
│   ├── GoalPlayer.tsx
│   ├── ProgressTracker.tsx
│   └── DayContent.tsx
├── groups/               # Group components
│   ├── GroupCard.tsx
│   ├── MembersList.tsx
│   ├── InviteDialog.tsx
│   └── CollectiveStreak.tsx
└── shared/               # Shared components
    ├── Navigation.tsx
    ├── Footer.tsx
    ├── LoadingSpinner.tsx
    └── ErrorBoundary.tsx
```

### Example Custom Component

```tsx
// components/goals/GoalCard.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock } from "lucide-react"

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description: string;
    totalDays: number;
    author: string;
    tags: string[];
    enrollmentCount?: number;
  };
  progress?: {
    currentDay: number;
    completedDays: number;
    streak: number;
  };
  onStart?: () => void;
  onContinue?: () => void;
}

export function GoalCard({ goal, progress, onStart, onContinue }: GoalCardProps) {
  const progressPercentage = progress 
    ? (progress.completedDays / goal.totalDays) * 100 
    : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl">{goal.title}</CardTitle>
          {progress?.streak && progress.streak > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              🔥 {progress.streak} day streak
            </Badge>
          )}
        </div>
        <CardDescription>{goal.description}</CardDescription>
        <div className="flex flex-wrap gap-1 mt-2">
          {goal.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {progress ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">
                  Day {progress.currentDay} of {goal.totalDays}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{goal.totalDays} days</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{goal.enrollmentCount || 0} enrolled</span>
            </div>
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          by {goal.author}
        </div>
      </CardContent>
      
      <CardFooter>
        {progress ? (
          <Button 
            onClick={onContinue} 
            className="w-full"
            size="lg"
          >
            Continue Day {progress.currentDay}
          </Button>
        ) : (
          <Button 
            onClick={onStart} 
            className="w-full"
            size="lg"
          >
            Start Goal
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

## Testing

### Test Structure

```bash
# Run all tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Example Test

```typescript
// __tests__/midnight-rule.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { canCompleteToday } from '@/lib/utils/midnight-rule';

describe('Midnight Rule', () => {
  it('should allow completion when no previous completion exists', () => {
    const result = canCompleteToday({
      lastCompletedAt: null,
      currentDayIndex: 1,
      userTimezone: 'America/New_York'
    });
    
    expect(result.canComplete).toBe(true);
    expect(result.reason).toBe('No previous completion');
  });

  it('should prevent completion if already completed today', () => {
    const now = new Date();
    const result = canCompleteToday({
      lastCompletedAt: now,
      currentDayIndex: 5,
      userTimezone: 'America/New_York'
    });
    
    expect(result.canComplete).toBe(false);
    expect(result.reason).toContain('Already completed today');
    expect(result.nextAvailable).toBeDefined();
  });
});
```

## Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Build backend  
cd backend
npm run build
```

### Docker Deployment

```dockerfile
# Frontend Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/goaltracker
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=goaltracker
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Monitoring

### Error Tracking with Sentry

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event, hint) {
    if (event.exception) {
      console.error('Sentry captured exception:', hint.originalException);
    }
    return event;
  },
});
```

### Analytics with PostHog

```typescript
// lib/analytics/posthog.ts
import posthog from 'posthog-js';

export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });
  }
};

export const trackEvent = (event: string, properties?: any) => {
  if (typeof window !== 'undefined') {
    posthog.capture(event, properties);
  }
};
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Write tests for new features
- Update documentation as needed

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Maintenance tasks

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@dailygoaltracker.com
- 📖 Documentation: [docs.dailygoaltracker.com](https://docs.dailygoaltracker.com)
- 💬 Discord: [Join our community](https://discord.gg/dailygoaltracker)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/dailygoaltracker/issues)

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Hosted on [Vercel](https://vercel.com/)

---

**Made with ❤️ by the DailyGoalTracker Team**

*Building better habits, one day at a time.*