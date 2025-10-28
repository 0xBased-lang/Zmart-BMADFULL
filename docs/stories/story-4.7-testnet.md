# Story 4.7-testnet: Deploy All Programs to Testnet with Frontend Integration

**Epic:** 4 - Quality Assurance and Deployment
**Type:** Deployment & Integration
**Priority:** CRITICAL
**Estimated Effort:** 2-3 days
**Dependencies:** Stories 4.1-4.6 complete

## 🎯 Story Overview

Deploy all 6 Solana programs to testnet and integrate with the frontend for comprehensive testing before mainnet deployment. This critical step ensures full system integration and validates all user flows in a production-like environment.

## 📋 Acceptance Criteria

### Deployment Criteria
- [ ] AC-1: All 6 programs successfully deployed to Solana testnet
- [ ] AC-2: Program addresses documented and verified
- [ ] AC-3: ProgramRegistry initialized with all program entries
- [ ] AC-4: ParameterStorage configured with testnet parameters
- [ ] AC-5: GlobalFeatureToggles set for progressive rollout testing

### Integration Criteria
- [ ] AC-6: Frontend configured to use testnet RPC endpoints
- [ ] AC-7: Frontend environment variables updated with testnet program IDs
- [ ] AC-8: Wallet adapters configured for testnet
- [ ] AC-9: All frontend hooks updated to use testnet programs
- [ ] AC-10: Frontend deployed to staging environment

### Verification Criteria
- [ ] AC-11: Each program responds to test transactions
- [ ] AC-12: Frontend successfully connects to all programs
- [ ] AC-13: Complete user flow tested end-to-end
- [ ] AC-14: Error handling validated
- [ ] AC-15: Deployment documentation complete

## 🔧 Technical Implementation

### Phase 1: Testnet Program Deployment

#### Step 1: Environment Setup
```bash
# Configure Solana CLI for testnet
solana config set --url https://api.testnet.solana.com

# Verify configuration
solana config get
# Expected: RPC URL: https://api.testnet.solana.com

# Check wallet balance (request airdrop if needed)
solana balance
# If low: solana airdrop 2
```

#### Step 2: Generate Program Keypairs
```bash
# Create keys directory
mkdir -p keys/testnet

# Generate deterministic keypairs for each program
# This ensures consistent addresses across deployments
for program in bond-manager market-maker market-resolution \
  parameter-storage proposal-system program-registry; do

  echo "Generating keypair for ${program}..."
  solana-keygen new \
    --outfile "keys/testnet/${program}-keypair.json" \
    --force \
    --no-bip39-passphrase
done

# Document the generated addresses
echo "# Testnet Program Addresses" > docs/TESTNET-ADDRESSES.md
for keypair in keys/testnet/*-keypair.json; do
  program=$(basename $keypair -keypair.json)
  address=$(solana-keygen pubkey $keypair)
  echo "- ${program}: ${address}" >> docs/TESTNET-ADDRESSES.md
done
```

#### Step 3: Update Anchor.toml for Testnet
```toml
# Anchor.toml
[features]
seeds = false
skip-lint = false

[programs.testnet]
bond_manager = "<bond-manager-pubkey>"
market_maker = "<market-maker-pubkey>"
market_resolution = "<market-resolution-pubkey>"
parameter_storage = "<parameter-storage-pubkey>"
proposal_system = "<proposal-system-pubkey>"
program_registry = "<program-registry-pubkey>"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Testnet"
wallet = "./keys/testnet/deployer-wallet.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

# Testnet specific settings
[test]
startup_wait = 10000
```

#### Step 4: Build Programs for Testnet
```bash
# Clean previous builds
anchor clean

# Build with testnet feature flags
anchor build -- --features testnet

# Verify build artifacts
ls -la target/deploy/*.so

# Check program sizes (must be < 1MB for testnet)
for program in target/deploy/*.so; do
  size=$(du -h $program | cut -f1)
  echo "$(basename $program): ${size}"
done
```

#### Step 5: Deploy Programs to Testnet
```bash
# Deploy in dependency order
# 1. Deploy parameter-storage first (no dependencies)
anchor deploy \
  --program-name parameter_storage \
  --program-keypair keys/testnet/parameter-storage-keypair.json

# 2. Deploy program-registry (no dependencies)
anchor deploy \
  --program-name program_registry \
  --program-keypair keys/testnet/program-registry-keypair.json

# 3. Deploy bond-manager (depends on parameter-storage)
anchor deploy \
  --program-name bond_manager \
  --program-keypair keys/testnet/bond-manager-keypair.json

# 4. Deploy proposal-system (depends on parameter-storage)
anchor deploy \
  --program-name proposal_system \
  --program-keypair keys/testnet/proposal-system-keypair.json

# 5. Deploy market-maker (depends on bond-manager, parameter-storage)
anchor deploy \
  --program-name market_maker \
  --program-keypair keys/testnet/market-maker-keypair.json

# 6. Deploy market-resolution (depends on market-maker)
anchor deploy \
  --program-name market_resolution \
  --program-keypair keys/testnet/market-resolution-keypair.json
```

#### Step 6: Initialize Programs
```typescript
// scripts/initialize-testnet.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  ProgramRegistry,
  ParameterStorage,
  GlobalFeatureToggles
} from "../target/types";

async function initializeTestnet() {
  // Connect to testnet
  const connection = new anchor.web3.Connection(
    "https://api.testnet.solana.com",
    "confirmed"
  );

  const wallet = anchor.web3.Keypair.fromSecretKey(
    // Load deployer wallet
  );

  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    { commitment: "confirmed" }
  );

  // Initialize ProgramRegistry
  const registry = anchor.workspace.ProgramRegistry as Program<ProgramRegistry>;

  await registry.methods.initialize()
    .accounts({
      admin: wallet.publicKey,
      registry: registryPda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  // Register all programs
  const programs = [
    { name: "bond_manager", address: BOND_MANAGER_ID },
    { name: "market_maker", address: MARKET_MAKER_ID },
    { name: "market_resolution", address: MARKET_RESOLUTION_ID },
    { name: "parameter_storage", address: PARAMETER_STORAGE_ID },
    { name: "proposal_system", address: PROPOSAL_SYSTEM_ID },
  ];

  for (const program of programs) {
    await registry.methods.registerProgram(
      program.name,
      program.address,
      1, // version
      true // active
    )
    .accounts({
      admin: wallet.publicKey,
      registry: registryPda,
    })
    .rpc();
  }

  // Initialize ParameterStorage with testnet values
  const params = anchor.workspace.ParameterStorage as Program<ParameterStorage>;

  await params.methods.initialize()
    .accounts({
      admin: wallet.publicKey,
      parameters: paramsPda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  // Set testnet parameters
  await params.methods.updateParameters({
    bondAmount: new anchor.BN(1_000_000), // 1 USDC for testing
    disputeWindow: 300, // 5 minutes for quick testing
    minMarketDuration: 60, // 1 minute minimum
    maxMarketDuration: 86400, // 1 day maximum
    platformFeeRate: 250, // 2.5%
    creatorFeeRate: 100, // 1%
    maxBetAmount: new anchor.BN(100_000_000), // 100 USDC max
    minBetAmount: new anchor.BN(100_000), // 0.1 USDC min
    emergencyPause: false,
  })
  .accounts({
    admin: wallet.publicKey,
    parameters: paramsPda,
  })
  .rpc();

  console.log("✅ Testnet initialization complete!");
}

initializeTestnet().catch(console.error);
```

### Phase 2: Frontend Integration

#### Step 1: Update Frontend Environment
```typescript
// frontend/.env.testnet
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.testnet.solana.com
NEXT_PUBLIC_COMMITMENT_LEVEL=confirmed

# Program IDs (from deployment)
NEXT_PUBLIC_BOND_MANAGER_PROGRAM_ID=<testnet-address>
NEXT_PUBLIC_MARKET_MAKER_PROGRAM_ID=<testnet-address>
NEXT_PUBLIC_MARKET_RESOLUTION_PROGRAM_ID=<testnet-address>
NEXT_PUBLIC_PARAMETER_STORAGE_PROGRAM_ID=<testnet-address>
NEXT_PUBLIC_PROPOSAL_SYSTEM_PROGRAM_ID=<testnet-address>
NEXT_PUBLIC_PROGRAM_REGISTRY_PROGRAM_ID=<testnet-address>

# Feature flags
NEXT_PUBLIC_ENABLE_MAINNET_WARNING=true
NEXT_PUBLIC_TESTNET_MODE=true
NEXT_PUBLIC_DEBUG_MODE=true
```

#### Step 2: Update Frontend Hooks
```typescript
// frontend/lib/constants/program-ids.ts
export const TESTNET_PROGRAM_IDS = {
  BOND_MANAGER: new PublicKey(process.env.NEXT_PUBLIC_BOND_MANAGER_PROGRAM_ID!),
  MARKET_MAKER: new PublicKey(process.env.NEXT_PUBLIC_MARKET_MAKER_PROGRAM_ID!),
  MARKET_RESOLUTION: new PublicKey(process.env.NEXT_PUBLIC_MARKET_RESOLUTION_PROGRAM_ID!),
  PARAMETER_STORAGE: new PublicKey(process.env.NEXT_PUBLIC_PARAMETER_STORAGE_PROGRAM_ID!),
  PROPOSAL_SYSTEM: new PublicKey(process.env.NEXT_PUBLIC_PROPOSAL_SYSTEM_PROGRAM_ID!),
  PROGRAM_REGISTRY: new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_REGISTRY_PROGRAM_ID!),
};

// Use testnet IDs when on testnet
export const PROGRAM_IDS =
  process.env.NEXT_PUBLIC_NETWORK === 'testnet'
    ? TESTNET_PROGRAM_IDS
    : MAINNET_PROGRAM_IDS;
```

#### Step 3: Configure Wallet Adapter
```typescript
// frontend/app/providers/WalletProvider.tsx
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Use testnet for testing
  const network = process.env.NEXT_PUBLIC_NETWORK === 'testnet'
    ? WalletAdapterNetwork.Testnet
    : WalletAdapterNetwork.Mainnet;

  const endpoint = useMemo(() => {
    if (process.env.NEXT_PUBLIC_RPC_ENDPOINT) {
      return process.env.NEXT_PUBLIC_RPC_ENDPOINT;
    }
    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

### Phase 3: Verification & Testing

#### Step 1: Verify Program Deployment
```bash
# Check each program is deployed
for program in bond-manager market-maker market-resolution \
  parameter-storage proposal-system program-registry; do

  address=$(solana-keygen pubkey keys/testnet/${program}-keypair.json)
  echo "Checking ${program} at ${address}..."

  solana program show $address
done

# Verify program ownership
solana program show <program-id> --lamports
```

#### Step 2: Integration Test Script
```typescript
// scripts/test-testnet-integration.ts
async function testIntegration() {
  const tests = [
    {
      name: "Connect to programs",
      test: async () => {
        // Try to fetch each program's IDL
        for (const [name, id] of Object.entries(TESTNET_PROGRAM_IDS)) {
          const program = new Program(idl, id, provider);
          console.log(`✅ Connected to ${name}`);
        }
      }
    },
    {
      name: "Create test market",
      test: async () => {
        const market = await createTestMarket();
        console.log(`✅ Market created: ${market.publicKey.toBase58()}`);
      }
    },
    {
      name: "Place test bet",
      test: async () => {
        const bet = await placeTestBet(market);
        console.log(`✅ Bet placed: ${bet.signature}`);
      }
    },
    {
      name: "Test dispute flow",
      test: async () => {
        const dispute = await initiateTestDispute(market);
        console.log(`✅ Dispute initiated: ${dispute.publicKey.toBase58()}`);
      }
    },
  ];

  for (const { name, test } of tests) {
    try {
      console.log(`Running: ${name}...`);
      await test();
    } catch (error) {
      console.error(`❌ Failed: ${name}`, error);
      process.exit(1);
    }
  }

  console.log("\n✅ All integration tests passed!");
}
```

#### Step 3: Frontend Deployment to Staging
```bash
# Build frontend for testnet
cd frontend
npm run build:testnet

# Deploy to Vercel staging
vercel --prod --env-file=.env.testnet

# Or deploy to custom staging server
npm run deploy:staging

# Document staging URL
echo "Staging URL: https://testnet.zmart.app" >> ../docs/TESTNET-ADDRESSES.md
```

### Phase 4: Monitoring & Validation

#### Monitoring Setup
```typescript
// scripts/monitor-testnet.ts
import { Connection } from '@solana/web3.js';

async function monitorTestnet() {
  const connection = new Connection(
    'https://api.testnet.solana.com',
    {
      commitment: 'confirmed',
      wsEndpoint: 'wss://api.testnet.solana.com'
    }
  );

  // Monitor each program
  for (const [name, programId] of Object.entries(TESTNET_PROGRAM_IDS)) {
    connection.onProgramAccountChange(
      programId,
      (accountInfo, context) => {
        console.log(`[${name}] Account changed:`, {
          slot: context.slot,
          size: accountInfo.data.length,
        });
      }
    );

    connection.onLogs(
      programId,
      (logs, context) => {
        console.log(`[${name}] Logs:`, logs.logs);
      }
    );
  }

  console.log('📊 Monitoring testnet programs...');
}
```

#### Validation Checklist
```markdown
## Testnet Deployment Validation

### Programs
- [ ] bond-manager deployed and initialized
- [ ] market-maker deployed and initialized
- [ ] market-resolution deployed and initialized
- [ ] parameter-storage deployed and initialized
- [ ] proposal-system deployed and initialized
- [ ] program-registry deployed and initialized

### Frontend Integration
- [ ] RPC connection working
- [ ] Wallet connection working (Phantom)
- [ ] Wallet connection working (Solflare)
- [ ] Program IDLs loading correctly
- [ ] Transaction signing working

### User Flows
- [ ] Create market flow complete
- [ ] Place bet flow complete
- [ ] Claim payout flow complete
- [ ] Dispute initiation flow complete
- [ ] Proposal voting flow complete

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Transaction failures show proper messages
- [ ] Wallet disconnection handled
- [ ] Rate limiting handled

### Performance
- [ ] Page load time < 3s
- [ ] Transaction confirmation < 30s
- [ ] No memory leaks detected
- [ ] API calls optimized
```

## 📊 Success Metrics

### Deployment Metrics
- ✅ 6/6 programs deployed successfully
- ✅ 100% initialization success rate
- ✅ All program accounts accessible
- ✅ Frontend connects to all programs

### Integration Metrics
- ✅ 5/5 main user flows working
- ✅ 0 critical bugs found
- ✅ <2s average transaction time
- ✅ 100% wallet connection success

### Testing Metrics
- ✅ 50+ test transactions executed
- ✅ 10+ unique test users
- ✅ 24-hour stability test passed
- ✅ 0 program panics

## 🚨 Risk Mitigation

### Known Risks
1. **Testnet Congestion**: May experience delays during high activity
   - Mitigation: Use custom RPC node if needed

2. **Testnet Resets**: Testnet may reset, clearing state
   - Mitigation: Script to quickly redeploy and reinitialize

3. **Limited Testnet Tokens**: Faucet limits may restrict testing
   - Mitigation: Multiple test wallets prepared

4. **Version Mismatches**: IDL/program version conflicts
   - Mitigation: Strict version control and documentation

### Rollback Plan
If critical issues found:
1. Document all issues discovered
2. Halt frontend deployment
3. Fix issues in programs
4. Redeploy affected programs only
5. Retest affected flows

## 📝 Deliverables

### Documentation
- [ ] TESTNET-ADDRESSES.md with all program addresses
- [ ] Deployment runbook for team
- [ ] Integration test results
- [ ] Performance metrics report

### Code Artifacts
- [ ] Updated Anchor.toml for testnet
- [ ] Initialize script for testnet
- [ ] Frontend .env.testnet file
- [ ] Monitoring scripts

### Testing Evidence
- [ ] Transaction signatures for all test flows
- [ ] Screenshots of working frontend
- [ ] Performance metrics dashboard
- [ ] Error logs (if any)

## 🎯 Definition of Done

✅ All 6 programs deployed to testnet
✅ Programs initialized with test parameters
✅ Frontend connected to testnet programs
✅ All user flows tested end-to-end
✅ No critical bugs remaining
✅ Documentation complete
✅ Team sign-off received

## 📚 References

- [Solana Testnet Docs](https://docs.solana.com/clusters#testnet)
- [Anchor Deployment Guide](https://www.anchor-lang.com/docs/manifest#programs-deploy)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

## 🔄 Post-Deployment Actions

After successful testnet deployment:
1. Monitor for 24-48 hours
2. Collect user feedback
3. Fix any discovered issues
4. Create Story 4.8 for comprehensive testing phase
5. Plan mainnet deployment based on testnet results

---

**Story Status:** Ready to implement
**Estimated Start:** Immediately
**Estimated Completion:** 2-3 days
**Blocker:** None
**Next Story:** 4.8 - Comprehensive Testnet Testing