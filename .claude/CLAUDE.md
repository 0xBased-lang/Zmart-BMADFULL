# Claude Code Project Configuration

## Project: BMAD-Zmart
Solana prediction market platform - Full-stack Web3 dApp

---

## 🎯 Claude Skills Integration

### blockchain-tool
**Purpose:** Comprehensive blockchain development and security toolkit

**Use Cases:**
- Smart contract security auditing (470+ vulnerability patterns)
- Solana/Anchor program debugging
- Oracle manipulation detection
- Flash loan attack prevention
- Wallet security analysis
- Economic attack analysis
- MEV exposure assessment
- Professional audit report generation

**When to Activate:**
- Before deploying any smart contract
- When security concerns arise
- For program optimization
- During contract architecture review

**Example Usage:**
```
"Use blockchain-tool to audit the betting contract"
"Analyze the market resolution program for vulnerabilities"
"Check for reentrancy risks in the core-markets program"
```

---

### web3
**Purpose:** Web3 dApp development, debugging, and optimization toolkit

**Use Cases:**
- Next.js dApp frontend development
- Wallet integration (Phantom, Solflare, MetaMask)
- Transaction management and error handling
- Smart contract interaction (ethers.js/viem/wagmi/@solana/web3.js)
- E2E testing with Playwright
- Gas optimization
- Performance profiling
- Web3 debugging workflows

**When to Activate:**
- Building frontend features
- Debugging wallet connections
- Implementing transaction flows
- Optimizing dApp performance
- Testing Web3 integrations

**Example Usage:**
```
"Use web3 to debug the wallet connection issue"
"Optimize the betting transaction flow"
"Implement proper error handling for failed transactions"
"Test the market creation E2E workflow"
```

---

## Integration with SuperClaude Framework

Import SuperClaude configurations:
- @/Users/seman/.claude/COMMANDS.md
- @/Users/seman/.claude/FLAGS.md
- @/Users/seman/.claude/PRINCIPLES.md
- @/Users/seman/.claude/RULES.md
- @/Users/seman/.claude/ORCHESTRATOR.md

---

## Project-Specific Workflow

### Smart Contract Development
1. Design program architecture
2. Implement with Anchor framework
3. **Use blockchain-tool for security audit**
4. Test on devnet
5. Deploy after audit passes

### Frontend Development
1. Design user interface
2. **Use web3 for wallet integration**
3. Implement transaction handling
4. Test with Playwright
5. Deploy to Vercel

### Code Review Process
1. Run CodeRabbit for automated review
2. **Use blockchain-tool for contract security**
3. **Use web3 for frontend/integration issues**
4. Address findings
5. Validate with tests

---

## Skill Selection Decision Tree

```
Is this a smart contract issue?
├─ YES → Use blockchain-tool
│  ├─ Security audit needed
│  ├─ Vulnerability detection
│  ├─ Program optimization
│  └─ Architecture review
│
└─ NO → Is it frontend/Web3?
   ├─ YES → Use web3
   │  ├─ Wallet integration
   │  ├─ Transaction handling
   │  ├─ dApp debugging
   │  └─ E2E testing
   │
   └─ NO → General development
      ├─ Use SuperClaude commands
      ├─ /implement for features
      ├─ /troubleshoot for bugs
      └─ /improve for optimization
```

---

## Testing Strategy

### Smart Contract Testing
- **blockchain-tool:** Security and vulnerability testing
- Anchor test suite: Unit tests
- Integration tests: Multi-program flows

### Frontend Testing
- **web3:** E2E dApp testing with Playwright
- Unit tests: Component testing
- Integration tests: API + blockchain interaction

---

## Security Best Practices

### Always Use blockchain-tool For:
✅ Pre-deployment contract audits
✅ Security vulnerability scans
✅ Economic attack analysis
✅ Access control validation
✅ Oracle manipulation checks

### Always Use web3 For:
✅ Wallet security implementation
✅ Transaction protection
✅ XSS prevention in dApps
✅ Proper error handling
✅ Secure RPC provider usage

---

## Deployment Checklist

### Before Deploying Contracts:
- [ ] Run blockchain-tool security audit
- [ ] Address all critical/high findings
- [ ] Test on devnet extensively
- [ ] Document all program accounts
- [ ] Verify upgrade authority settings

### Before Deploying Frontend:
- [ ] Run web3 integration tests
- [ ] Test wallet connections
- [ ] Validate transaction flows
- [ ] Check error handling
- [ ] Run CodeRabbit review
- [ ] Deploy to preview environment first

---

## Common Issues & Solutions

### Smart Contract Issues
**Problem:** Security vulnerability detected
**Solution:** Activate blockchain-tool for detailed analysis and remediation

### Frontend Issues
**Problem:** Wallet connection failing
**Solution:** Activate web3 for debugging wallet integration

### Integration Issues
**Problem:** Transaction not confirming
**Solution:** Use web3 to analyze transaction flow and error handling

---

## Quick Reference

### Activate Blockchain Skill:
```
"Use blockchain-tool to [audit/analyze/debug] [contract/program]"
```

### Activate Web3 Skill:
```
"Use web3 to [implement/debug/optimize] [wallet/transaction/dApp feature]"
```

### General Commands:
```
/implement [feature]     # Implement new feature
/troubleshoot [issue]    # Debug problems
/improve [target]        # Optimize code
/test                    # Run tests
```

---

## Project Goals

✅ Secure, audited smart contracts (blockchain-tool)
✅ Seamless Web3 user experience (web3)
✅ High-quality, tested code
✅ Comprehensive documentation
✅ Production-ready deployment

---

**Use the right skill for the right job. Build secure, high-quality Web3 applications.** 🚀
