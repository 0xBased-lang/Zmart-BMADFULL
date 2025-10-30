#!/bin/bash

# Setup Vercel Environment Variables for Production

echo "🔐 Configuring Vercel Production Environment Variables..."

# Production Supabase credentials
SUPABASE_URL="https://yncpbhamuebuymdwgmtf.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3BiaGFtdWVidXltZHdnbXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTkyMjcsImV4cCI6MjA3NjgzNTIyN30._eSsMkhzW4Hvey5UTcE9xUAgx3zygnO0h4SS19pKegc"

echo ""
echo "📝 Adding NEXT_PUBLIC_SUPABASE_URL..."
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo ""
echo "📝 Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "🚀 Now trigger a new deployment with:"
echo "   vercel --prod"
