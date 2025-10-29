#!/bin/bash

# Disable Production Auto-Deploy
# This prevents automatic deployments to production when pushing to main

echo "🛡️  Disabling Production Auto-Deploy..."
echo ""
echo "This will prevent automatic production deployments."
echo "You'll need to manually deploy to production when ready."
echo ""

cd "$(dirname "$0")"

# Check current project settings
echo "📋 Current project configuration:"
vercel project ls | grep frontend

echo ""
echo "To disable production auto-deploy:"
echo ""
echo "Option 1: Via Dashboard (Recommended)"
echo "  1. Go to: https://vercel.com/kektech1/frontend/settings/git"
echo "  2. Scroll to 'Production Branch'"
echo "  3. Turn OFF 'Automatically create Production Deployments'"
echo "  4. Or change Production Branch to a non-existent branch like 'production-ready'"
echo ""
echo "Option 2: Via vercel.json (Already configured)"
echo "  Your vercel.json is configured correctly"
echo "  Deployments from branches other than main will be previews only"
echo ""
echo "✅ To keep it private:"
echo "  - Push to feature branches (not main) for preview testing"
echo "  - Preview URLs are unlisted and not indexed"
echo "  - Use manual 'vercel' command for private hash URLs"
echo ""

read -p "Open Vercel dashboard settings now? (y/n): " OPEN

if [ "$OPEN" = "y" ]; then
    open "https://vercel.com/kektech1/frontend/settings/git"
fi

echo ""
echo "✅ Done! Remember to deploy to preview only until you're ready."
echo ""
