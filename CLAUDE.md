# BMAD-Zmart Project Configuration

## Project Overview
**Solana Prediction Market Platform**
**Tech Stack:** Solana (Anchor) + Next.js + Supabase
**Status:** Active Development

---

## 🛠️ Claude Skills for This Project

### Blockchain-Tool Skill
**Use for:** Smart contract auditing, security analysis, Solana program issues

**Activation:**
```
Use the blockchain-tool skill when working on:
- Smart contract security audits
- Solana program debugging
- Vulnerability detection
- Contract optimization
- Anchor framework issues
```

**Examples:**
- "Audit the betting contract for security issues"
- "Review the market resolution program for vulnerabilities"
- "Check for reentrancy or oracle manipulation risks"

---

### Web3 Skill
**Use for:** dApp development, frontend integration, blockchain interactions

**Activation:**
```
Use the web3 skill when working on:
- Frontend Web3 integration
- Wallet connectivity (Phantom, Solflare)
- Transaction handling
- Smart contract interaction from frontend
- Web3 testing and debugging
```

**Examples:**
- "Debug wallet connection in the betting interface"
- "Optimize transaction handling in the frontend"
- "Fix the market creation flow"
- "Implement proper error handling for failed transactions"

---

## Server Management
- Always work on the VPS server via SSH; never shift work to a local directory
- Never shift from the VPS to a local directory, not even after compacting the context
- We only move to another directory if there is a specific direct command by human

---

## CodeRabbit Integration
- Always run CodeRabbit review before commits and PRs
- Auto-fix issues with confidence >0.8
- Use background execution for non-blocking workflow (7-30+ min reviews)
- Validate fixes with re-review and testing
- Integration with /implement, /build, /improve, /git commands

---

## Development Guidelines

### Smart Contract Development
- Use blockchain-tool skill for security audits
- Test on devnet before mainnet
- Document all program accounts
- Follow Anchor best practices

### Frontend Development
- Use web3 skill for wallet integration
- Handle transaction errors gracefully
- Show loading states during blockchain calls
- Validate signatures client-side

### Code Quality
- Write tests for new features
- Follow existing code patterns
- Document complex logic
- Keep functions focused and small

### Git Workflow
- Commit frequently with clear messages
- Run tests before committing
- Use descriptive commit messages

---

## Project Structure
```
Zmart-BMADFULL/
├── programs/          # Solana smart contracts (Anchor)
│   ├── core-markets/
│   ├── market-resolution/
│   └── proposal-system/
├── frontend/          # Next.js application
│   ├── components/
│   ├── pages/
│   └── lib/          # Web3 utilities
├── database/          # Supabase SQL migrations
├── docs/             # Documentation
├── e2e/              # E2E tests
└── scripts/          # Deployment scripts
```

---

## Key Commands
```bash
# Solana/Anchor
anchor build           # Build programs
anchor test            # Test programs
anchor deploy          # Deploy to devnet

# Frontend
cd frontend && npm run dev    # Dev server
npm test                      # Run tests
npm run build                 # Build for production

# Deployment
vercel --prod          # Deploy frontend
```

---

## When to Use Which Skill

### Use blockchain-tool for:
✅ Auditing smart contracts
✅ Finding security vulnerabilities
✅ Analyzing Solana programs
✅ Checking for common attack vectors
✅ Optimizing program performance
✅ Reviewing program architecture

### Use web3 for:
✅ Building dApp frontends
✅ Integrating wallet connections
✅ Handling transactions
✅ Debugging Web3 interactions
✅ Implementing signing flows
✅ Testing end-to-end dApp features

---

## Important Files
- `docs/architecture.md` - Technical architecture
- `frontend/README-frontend.md` - Frontend documentation
- `database/README.md` - Database schema
- `programs/*/src/lib.rs` - Solana program code

---

## Environment Setup
- **Blockchain:** Solana devnet
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Frontend:** Vercel deployment
- **Wallets:** Phantom, Solflare support

---

## Security Considerations
- Always use blockchain-tool skill for contract audits
- Validate all user inputs
- Handle wallet disconnections
- Implement proper error boundaries
- Never expose private keys
- Test transaction flows thoroughly
