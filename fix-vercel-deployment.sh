#!/bin/bash

# 🚀 Quick Vercel Deployment Fix Script
# This script helps you fix common Vercel deployment issues

set -e

echo "🔍 Vercel Deployment Issue Detector & Fixer"
echo "==========================================="
echo ""

# Check 1: vercel.json exists
echo "✓ Checking vercel.json..."
if [ -f "./vercel.json" ]; then
    echo "  ✅ vercel.json found"
else
    echo "  ❌ vercel.json missing - creating it..."
    cat > vercel.json << 'EOF'
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm install",
  "framework": "nextjs"
}
EOF
    echo "  ✅ vercel.json created"
fi

echo ""

# Check 2: Environment file exists
echo "✓ Checking frontend/.env.example..."
if [ -f "./frontend/.env.example" ]; then
    echo "  ✅ .env.example found"
else
    echo "  ⚠️  .env.example missing - creating it..."
    cat > frontend/.env.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
    echo "  ✅ .env.example created"
fi

echo ""
echo "=========================================="
echo "📋 NEXT STEPS FOR VERCEL DEPLOYMENT:"
echo "=========================================="
echo ""
echo "1. Go to: https://vercel.com/dashboard"
echo ""
echo "2. Select your PrayerApp project"
echo ""
echo "3. Go to Settings → Environment Variables"
echo "   Add these variables from your Supabase project:"
echo "   • NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co"
echo "   • NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc..."
echo ""
echo "4. Go to Settings → Git"
echo "   Set Root Directory to: ./frontend"
echo ""
echo "5. Go to Deployments tab"
echo "   Click the latest deployment → 'Redeploy'"
echo ""
echo "6. ✅ Your app should deploy successfully!"
echo ""
echo "=========================================="
echo "📚 REFERENCE:"
echo "=========================================="
echo "• Vercel Config: ./vercel.json"
echo "• Environment Template: ./frontend/.env.example"
echo "• Full Guide: ./VERCEL_DEPLOYMENT_FIXED.md"
echo ""
