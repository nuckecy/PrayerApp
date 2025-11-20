# DailyGoalTracker - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 20+ (LTS recommended)
- PostgreSQL 15+
- npm, yarn, or pnpm
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PrayerApp
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory (or update the existing one):

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dailygoaltracker"

# JWT Secrets (Change these in production!)
JWT_SECRET="your_jwt_secret_key_change_this_in_production"
JWT_REFRESH_SECRET="your_refresh_secret_key_change_this_in_production"

# Server
PORT=3001
HOST="0.0.0.0"

# CORS
FRONTEND_URL="http://localhost:3000"
```

#### Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

#### Start the Backend Server

```bash
npm run dev
```

The backend API will be available at `http://localhost:3001`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Start the Frontend Server

```bash
npm run dev
```

The frontend application will be available at `http://localhost:3000`

## Development Workflow

### Running Both Servers

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Database Management

**View Database with Prisma Studio:**
```bash
cd backend
npx prisma studio
```

**Create a New Migration:**
```bash
cd backend
npx prisma migrate dev --name <migration_name>
```

**Reset Database:**
```bash
cd backend
npx prisma migrate reset
```

## Project Structure

```
PrayerApp/
├── frontend/               # Next.js PWA application
│   ├── app/               # Next.js 14 App Router
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # User dashboard
│   │   └── goals/        # Goal browsing/viewing
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utilities and API client
│   └── public/          # Static assets
│
├── backend/              # Fastify API server
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth middleware
│   │   ├── utils/       # Utility functions
│   │   └── types/       # TypeScript types
│   └── prisma/          # Database schema
│
├── README.md            # Project documentation
├── PRD.md              # Product Requirements Document
└── SETUP.md            # This file
```

## Testing the Application

### 1. Create a User Account

1. Navigate to `http://localhost:3000`
2. Click "Get Started" or "Create Free Account"
3. Fill in your details (name, email, password)
4. Submit the form

### 2. Browse Goals

- After registration, you'll be redirected to the dashboard
- Click "Browse Goals" to see available goals
- (Note: Initially, there will be no goals. You'll need to create goals as an author)

### 3. Create Goals (Author Access)

To create goals, you need author access. You can manually update the database:

```sql
-- In Prisma Studio or your database client
-- 1. Find your user ID
-- 2. Create an author record:
INSERT INTO authors (id, user_id, status)
VALUES (gen_random_uuid(), '<your_user_id>', 'active');

-- 3. Update your user role:
UPDATE users SET role = 'author' WHERE id = '<your_user_id>';
```

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server
- `npx prisma studio` - Open database GUI
- `npx prisma migrate dev` - Run migrations

## Troubleshooting

### Port Already in Use

If you get an error that port 3000 or 3001 is already in use:

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Database Connection Errors

1. Ensure PostgreSQL is running
2. Check your DATABASE_URL in `.env`
3. Verify the database exists:
   ```bash
   psql -U postgres
   CREATE DATABASE dailygoaltracker;
   ```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. Review the [README.md](./README.md) for full feature documentation
2. Check the [PRD.md](./PRD.md) for product requirements
3. Start building features based on the development roadmap

## Support

For issues or questions:
- Check existing documentation
- Review error logs in the console
- Examine the PRD for feature specifications

---

**Happy Coding!** 🚀
