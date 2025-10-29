#!/bin/bash

# Quick Preview Deployment - Test Build Only
# Skip Supabase for now, just verify Vercel build works

set -e

echo "🚀 Quick Preview Deploy - Testing Build Only"
echo ""
echo "⚠️  Note: This will deploy WITHOUT Supabase"
echo "   The app will build but DB features won't work yet"
echo ""

cd "$(dirname "$0")"

# Create minimal env just for build
cat > .env.build.local << 'ENV'
# Minimal config to pass build (dummy Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_key_for_build_only
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_WS_ENDPOINT=wss://api.devnet.solana.com
NEXT_PUBLIC_COMMITMENT_LEVEL=confirmed
NEXT_PUBLIC_PROGRAM_REGISTRY_ID=2ysaGgXXKK7fTjKp59nVyivP7yoUpf9QHJqQHAuavchP
NEXT_PUBLIC_PARAMETER_STORAGE_ID=J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD
NEXT_PUBLIC_CORE_MARKETS_ID=6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV
NEXT_PUBLIC_MARKET_RESOLUTION_ID=Hcxxt6W1HmKQmnUvqpgzNEqVG611Yzt2i4DUvwvkLRf2
NEXT_PUBLIC_PROPOSAL_SYSTEM_ID=5XH5i8dypiB4Wwa7TkmU6dnk9SyUGqE92GiQMHypPekL
NEXT_PUBLIC_BOND_MANAGER_ID=8XvCToLC42ZV4hw6PW5SEhqDpX3NfqvbAS2tNseG52Fx
NEXT_PUBLIC_PROGRAM_ID=6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV
NEXT_PUBLIC_ADMIN_WALLET=4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA
NEXT_PUBLIC_DEVNET_MODE=true
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
NEXT_PUBLIC_USDC_DECIMALS=6
NEXT_PUBLIC_EXPLORER_URL=https://explorer.solana.com
NEXT_PUBLIC_EXPLORER_CLUSTER=devnet
ENV

echo "✅ Created build config with placeholder Supabase"
echo ""
echo "🔨 Testing build locally first..."
echo ""

# Test build locally
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Local build successful!"
    echo ""
    echo "🚀 Ready to deploy to Vercel preview?"
    echo "   This will create a preview URL you can test"
    echo ""
    read -p "Deploy to Vercel preview now? (y/n): " DEPLOY
    
    if [ "$DEPLOY" = "y" ]; then
        echo ""
        echo "📤 Deploying to Vercel preview..."
        
        # Deploy with env file
        vercel --yes --build-env .env.build.local
        
        echo ""
        echo "✅ Preview deployment complete!"
        echo ""
        echo "🔗 Your preview URL is shown above"
        echo "   (Format: https://frontend-xxxxx-kektech1.vercel.app)"
        echo ""
        echo "⚠️  Remember: Supabase features won't work yet (placeholder URLs)"
        echo "   Add real Supabase credentials later for full functionality"
    fi
else
    echo ""
    echo "❌ Local build failed - fix errors before deploying"
fi

# Cleanup
rm -f .env.build.local

echo ""
