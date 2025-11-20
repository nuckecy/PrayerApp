#!/bin/bash

# 🧪 Local Testing Setup Script
# Creates .env.local and starts dev server

set -e

echo "🧪 LOCAL TESTING SETUP"
echo "======================"
echo ""

# Check if Supabase credentials provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "❌ Missing Supabase credentials!"
    echo ""
    echo "Usage:"
    echo "  bash setup-local-testing.sh <SUPABASE_URL> <SUPABASE_ANON_KEY>"
    echo ""
    echo "Example:"
    echo "  bash setup-local-testing.sh https://xxxxx.supabase.co eyJhbGc..."
    echo ""
    echo "Where to find these:"
    echo "  1. Go to: https://app.supabase.com"
    echo "  2. Select your project"
    echo "  3. Settings → API"
    echo "  4. Copy Project URL and Anon public key"
    exit 1
fi

SUPABASE_URL=$1
SUPABASE_ANON_KEY=$2

# Create .env.local
echo "📝 Creating frontend/.env.local..."
cat > frontend/.env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

echo "✅ .env.local created"
echo ""

# Check if node_modules exist
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🚀 Starting dev server..."
echo ""
echo "The app will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd frontend
npm run dev
