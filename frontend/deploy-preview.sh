#!/bin/bash

# Deploy to Vercel Preview for Private Testing
# This will NOT deploy to production

set -e

echo "🔒 Deploying to Vercel PREVIEW (not production)..."
echo ""

cd "$(dirname "$0")"

# Get Supabase credentials for preview testing
echo "📝 We need Supabase credentials for preview environment:"
echo "   Go to: https://supabase.com/dashboard → Your Project → Settings → API"
echo ""
echo "   Or use localhost Supabase for testing (from your .env.local)"
echo ""

read -p "Use localhost Supabase? (y/n): " USE_LOCAL

if [ "$USE_LOCAL" = "y" ]; then
    SUPABASE_URL="http://localhost:54321"
    SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    echo ""
    echo "✅ Using localhost Supabase"
else
    echo ""
    read -p "Enter SUPABASE_URL (https://xxxxx.supabase.co): " SUPABASE_URL
    read -p "Enter SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
fi

# Export for vercel build
export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
export NEXT_PUBLIC_SOLANA_NETWORK="devnet"

echo ""
echo "🚀 Deploying to preview..."
echo ""

# Deploy to preview (NOT production)
vercel --yes

echo ""
echo "✅ Preview deployment complete!"
echo ""
echo "🔗 Your preview URL will be shown above"
echo "   (looks like: https://frontend-xxxxx-kektech1.vercel.app)"
echo ""
echo "🔒 This is a PRIVATE preview URL - not public/production"
echo ""
