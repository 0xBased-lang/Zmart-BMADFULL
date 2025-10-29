#!/bin/bash

# Add Vercel Environment Variables via CLI
# Run from: /Users/seman/Desktop/Zmart-BMADFULL/frontend

echo "🔐 Adding Environment Variables to Vercel..."

# Get Supabase credentials from user
echo ""
echo "📝 You need your production Supabase credentials:"
echo "   Go to: https://supabase.com/dashboard → Your Project → Settings → API"
echo ""
read -p "Enter SUPABASE_URL (https://xxxxx.supabase.co): " SUPABASE_URL
read -p "Enter SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY

# Add required variables (all environments)
echo ""
echo "Adding NEXT_PUBLIC_SUPABASE_URL..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development <<< "$SUPABASE_URL"

echo "Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..."
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development <<< "$SUPABASE_ANON_KEY"

echo "Adding NEXT_PUBLIC_SOLANA_NETWORK..."
vercel env add NEXT_PUBLIC_SOLANA_NETWORK production preview development <<< "devnet"

echo ""
echo "✅ Core environment variables added!"
echo ""
echo "🚀 Now redeploy with: vercel --prod"
