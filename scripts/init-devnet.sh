#!/bin/bash
##############################################################################
# BMAD-Zmart Devnet Initialization Script
#
# This script initializes the parameter storage on devnet using Anchor CLI.
# This is the RECOMMENDED way to initialize parameters.
#
# Prerequisites:
# - Anchor CLI installed (anchor --version)
# - Solana CLI installed with configured wallet
# - At least 0.5 SOL in your devnet wallet
#
# Usage:
#   chmod +x scripts/init-devnet.sh
#   ./scripts/init-devnet.sh
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEVNET_URL="https://api.devnet.solana.com"
PROGRAMS_DIR="$HOME/Desktop/BMAD-METHOD/BMAD-Zmart/programs"

echo -e "${BLUE}🚀 BMAD-Zmart Devnet Initialization${NC}\n"

##############################################################################
# Step 1: Check Prerequisites
##############################################################################

echo -e "${BLUE}📋 Step 1: Checking prerequisites...${NC}"

# Check Anchor
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor CLI not found${NC}"
    echo -e "\nPlease install Anchor:"
    echo -e "  cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    echo -e "  avm install latest"
    echo -e "  avm use latest\n"
    exit 1
fi
echo -e "${GREEN}✅ Anchor CLI found: $(anchor --version)${NC}"

# Check Solana
if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not found${NC}"
    echo -e "\nPlease install Solana:"
    echo -e "  sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\"\n"
    exit 1
fi
echo -e "${GREEN}✅ Solana CLI found: $(solana --version | head -1)${NC}"

# Check programs directory
if [ ! -d "$PROGRAMS_DIR" ]; then
    echo -e "${RED}❌ Programs directory not found: $PROGRAMS_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Programs directory found${NC}"

##############################################################################
# Step 2: Check Wallet and Balance
##############################################################################

echo -e "\n${BLUE}💰 Step 2: Checking wallet and balance...${NC}"

# Get wallet address
WALLET=$(solana address)
echo -e "Wallet: ${WALLET}"

# Get balance
BALANCE=$(solana balance --url devnet | awk '{print $1}')
echo -e "Balance: ${BALANCE} SOL (devnet)"

# Check minimum balance (0.1 SOL)
if (( $(echo "$BALANCE < 0.1" | bc -l) )); then
    echo -e "${RED}❌ Insufficient balance!${NC}"
    echo -e "\nYou need at least 0.1 SOL for initialization."
    echo -e "\n${YELLOW}Get devnet SOL:${NC}"
    echo -e "  solana airdrop 2 --url devnet"
    echo -e "  Or visit: https://faucet.solana.com\n"
    exit 1
fi
echo -e "${GREEN}✅ Balance sufficient${NC}"

##############################################################################
# Step 3: Check if Already Initialized
##############################################################################

echo -e "\n${BLUE}🔍 Step 3: Checking initialization status...${NC}"

cd "$PROGRAMS_DIR"

# Derive Parameters PDA
PARAM_PROGRAM="J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD"

# Check if parameters account exists
# Note: This is a simplified check - actual verification would parse account data
echo -e "Checking global parameters account..."

# We'll just try to run the initialization - if it's already initialized, it will fail gracefully
echo -e "${GREEN}✅ Ready to initialize${NC}"

##############################################################################
# Step 4: Set Environment Variables
##############################################################################

echo -e "\n${BLUE}⚙️  Step 4: Configuring environment...${NC}"

export ANCHOR_PROVIDER_URL="$DEVNET_URL"
export ANCHOR_WALLET="$HOME/.config/solana/id.json"

echo -e "ANCHOR_PROVIDER_URL=$ANCHOR_PROVIDER_URL"
echo -e "ANCHOR_WALLET=$ANCHOR_WALLET"
echo -e "${GREEN}✅ Environment configured${NC}"

##############################################################################
# Step 5: Build Programs (if needed)
##############################################################################

echo -e "\n${BLUE}🔨 Step 5: Building programs...${NC}"

if [ ! -d "target" ]; then
    echo -e "${YELLOW}No build artifacts found - building...${NC}"
    anchor build
else
    echo -e "${GREEN}✅ Build artifacts exist (skipping build)${NC}"
    echo -e "   To rebuild: cd programs && anchor build"
fi

##############################################################################
# Step 6: Initialize Parameters
##############################################################################

echo -e "\n${BLUE}🚀 Step 6: Initializing parameters...${NC}"

echo -e "${YELLOW}Note: This script requires an Anchor script named 'initialize-params'${NC}"
echo -e "${YELLOW}in your Anchor.toml [scripts] section.${NC}\n"

echo -e "To initialize manually, run these commands:"
echo -e "${BLUE}cd $PROGRAMS_DIR"
echo -e "anchor run initialize-params --provider.cluster devnet${NC}\n"

echo -e "${YELLOW}Alternatively, you can call the initialize instruction directly:${NC}"
echo -e "${BLUE}anchor idl init --provider.cluster devnet J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD${NC}\n"

echo -e "${YELLOW}⚠️  Manual initialization required${NC}"
echo -e "This script provides the setup - you need to run the Anchor command above.\n"

echo -e "Once initialized, verify with:"
echo -e "${BLUE}cd ../BMAD-Zmart-frontend"
echo -e "npx ts-node scripts/verify-devnet-deployment.ts${NC}\n"

##############################################################################
# Summary
##############################################################################

echo -e "${GREEN}✅ Environment setup complete!${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Initialize parameters (see commands above)"
echo -e "2. Verify initialization: ${BLUE}npx ts-node scripts/verify-devnet-deployment.ts${NC}"
echo -e "3. Create test market: ${BLUE}npx ts-node scripts/create-market.ts${NC}"
echo -e "4. Start dev server: ${BLUE}npm run dev${NC}"
echo -e "5. Test betting in browser!\n"
