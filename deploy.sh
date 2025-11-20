#!/bin/bash

# DailyGoalTracker - Quick Deploy Script
# This script helps deploy the application to Vercel (frontend) and Railway (backend)

set -e

echo "🚀 DailyGoalTracker Deployment Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

echo -e "${GREEN}✓ All required CLI tools are installed${NC}"
echo ""

# Deploy Frontend
echo "📦 Deploying Frontend to Vercel..."
echo "=================================="
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo ""
echo "Starting Vercel deployment..."
echo "Follow the prompts to configure your deployment."
echo ""

vercel --prod

echo ""
echo -e "${GREEN}✓ Frontend deployed to Vercel!${NC}"
echo ""

# Get Vercel URL
echo "Please note your Vercel URL from above."
read -p "Enter your Vercel URL (e.g., https://your-app.vercel.app): " VERCEL_URL

cd ..

# Deploy Backend
echo ""
echo "🔧 Deploying Backend to Railway..."
echo "=================================="
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

echo ""
echo "Initializing Railway project..."
railway init

echo ""
echo "Adding PostgreSQL database..."
railway add --database postgresql

echo ""
echo "Setting environment variables..."
read -sp "Enter JWT_SECRET for production: " JWT_SECRET
echo ""
read -sp "Enter JWT_REFRESH_SECRET for production: " JWT_REFRESH_SECRET
echo ""

railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
railway variables set FRONTEND_URL="$VERCEL_URL"
railway variables set PORT=3001
railway variables set HOST="0.0.0.0"

echo ""
echo "Deploying backend..."
railway up

echo ""
echo "Running database migrations..."
railway run npx prisma generate
railway run npx prisma migrate deploy

echo ""
echo -e "${GREEN}✓ Backend deployed to Railway!${NC}"
echo ""

# Get Railway URL
echo "Getting your Railway deployment URL..."
RAILWAY_URL=$(railway status | grep "deployment" | awk '{print $NF}')

echo ""
echo "=================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "Frontend URL: $VERCEL_URL"
echo "Backend URL:  $RAILWAY_URL"
echo ""
echo "⚠️  Important: Update your Vercel environment variables!"
echo ""
echo "Run this command to update Vercel:"
echo -e "${YELLOW}vercel env add NEXT_PUBLIC_API_URL production${NC}"
echo "Then enter: $RAILWAY_URL"
echo ""
echo "Or update manually in Vercel dashboard:"
echo "1. Go to your project settings"
echo "2. Navigate to 'Environment Variables'"
echo "3. Set NEXT_PUBLIC_API_URL = $RAILWAY_URL"
echo "4. Redeploy your frontend"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
