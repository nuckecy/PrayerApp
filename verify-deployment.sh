#!/bin/bash

# 🧪 Deployment Verification Script
# This script helps you verify your Supabase + Vercel setup is working

set -e

echo "🔍 PrayerApp Deployment Verification Tool"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Frontend exists
echo "1️⃣  Checking frontend setup..."
if [ -f "./frontend/package.json" ]; then
    echo -e "${GREEN}✅ Frontend package.json found${NC}"
else
    echo -e "${RED}❌ Frontend package.json not found${NC}"
    exit 1
fi

# Check 2: Environment files
echo ""
echo "2️⃣  Checking environment files..."
if [ -f "./frontend/.env.example" ]; then
    echo -e "${GREEN}✅ .env.example found${NC}"
    echo "   Template variables:"
    grep "^NEXT_PUBLIC" ./frontend/.env.example | sed 's/^/   • /'
else
    echo -e "${RED}❌ .env.example not found${NC}"
fi

if [ -f "./frontend/.env.local" ]; then
    echo -e "${GREEN}✅ .env.local found (local testing ready)${NC}"
else
    echo -e "${YELLOW}ℹ️  .env.local not found (create this for local testing)${NC}"
fi

# Check 3: Vercel config
echo ""
echo "3️⃣  Checking Vercel configuration..."
if [ -f "./vercel.json" ]; then
    echo -e "${GREEN}✅ vercel.json found${NC}"
    echo "   Build settings:"
    cat ./vercel.json | grep -E "buildCommand|framework" | sed 's/^/   • /'
else
    echo -e "${RED}❌ vercel.json not found${NC}"
fi

# Check 4: Supabase client setup
echo ""
echo "4️⃣  Checking Supabase client..."
if grep -q "NEXT_PUBLIC_SUPABASE_URL" ./frontend/lib/supabase.ts 2>/dev/null; then
    echo -e "${GREEN}✅ Supabase client configured${NC}"
    echo "   Location: frontend/lib/supabase.ts"
else
    echo -e "${RED}❌ Supabase client not found${NC}"
fi

# Check 5: Frontend dependencies
echo ""
echo "5️⃣  Checking dependencies..."
if grep -q "@supabase/supabase-js" ./frontend/package.json; then
    echo -e "${GREEN}✅ @supabase/supabase-js installed${NC}"
else
    echo -e "${YELLOW}⚠️  @supabase/supabase-js not found in package.json${NC}"
fi

if grep -q "next" ./frontend/package.json; then
    echo -e "${GREEN}✅ Next.js installed${NC}"
else
    echo -e "${RED}❌ Next.js not found${NC}"
fi

# Summary
echo ""
echo "=========================================="
echo "📋 VERIFICATION CHECKLIST"
echo "=========================================="
echo ""
echo "Before going live, make sure you have:"
echo ""
echo "Local Setup:"
echo "  [ ] Created frontend/.env.local"
echo "  [ ] Added NEXT_PUBLIC_SUPABASE_URL"
echo "  [ ] Added NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo "Supabase Setup:"
echo "  [ ] Created Supabase project"
echo "  [ ] Database schema created (SQL run)"
echo "  [ ] Authentication enabled"
echo "  [ ] Email confirmations disabled (for testing)"
echo ""
echo "Vercel Setup:"
echo "  [ ] GitHub connected"
echo "  [ ] Environment variables added:"
echo "      • NEXT_PUBLIC_SUPABASE_URL"
echo "      • NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  [ ] Root Directory set to: ./frontend"
echo "  [ ] Latest deployment redeployed"
echo ""
echo "=========================================="
echo "🧪 TESTING STEPS"
echo "=========================================="
echo ""
echo "1. Visit your Vercel URL"
echo "   https://your-project.vercel.app"
echo ""
echo "2. Click 'Get Started' → Should show registration form"
echo ""
echo "3. Create a test account:"
echo "   Email: test@example.com"
echo "   Password: TestPass123!"
echo "   Name: Test User"
echo ""
echo "4. Check Supabase dashboard:"
echo "   Auth → Users (should see your test user)"
echo "   Table Editor → profiles (should see profile)"
echo ""
echo "5. Try logging in on your app"
echo ""
echo "=========================================="
echo "📚 HELPFUL LINKS"
echo "=========================================="
echo ""
echo "Dashboards:"
echo "  • Supabase: https://app.supabase.com"
echo "  • Vercel: https://vercel.com/dashboard"
echo ""
echo "Documentation:"
echo "  • Setup Guide: ./SUPABASE_COMPLETE_SETUP.md"
echo "  • Deployment Fix: ./VERCEL_DEPLOYMENT_FIXED.md"
echo "  • Supabase Docs: https://supabase.com/docs"
echo ""
echo "=========================================="
echo "✅ Run this command to do local testing:"
echo "=========================================="
echo ""
echo "cd frontend && npm install && npm run dev"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
