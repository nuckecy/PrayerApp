# DailyGoalTracker Vercel Deployment

This is the frontend application built with Next.js 14.

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nuckecy/PrayerApp&project-name=dailygoaltracker&root-directory=frontend)

## Manual Deployment

### Via Vercel CLI

```bash
cd frontend
vercel --prod
```

### Via Vercel Dashboard

1. Import your GitHub repository
2. **Important:** Set Root Directory to `frontend`
3. Framework will be auto-detected as Next.js
4. Add environment variables (see below)
5. Deploy

## Environment Variables

Add these in your Vercel project settings:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
