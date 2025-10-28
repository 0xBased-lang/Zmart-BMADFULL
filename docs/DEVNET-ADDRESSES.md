# 🌐 BMAD-Zmart Devnet Deployment Addresses

**Network:** Solana Devnet
**RPC Endpoint:** https://api.devnet.solana.com
**Deployment Date:** 2025-10-28
**Story:** 4.7-devnet
**Deployer:** 4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA

---

## 📦 Deployed Programs

### 1. Program Registry
```
Program ID: 2ysaGgXXKK7fTjKp59nVyivP7yoUpf9QHJqQHAuavchP
Purpose: Central registry for all BMAD-Zmart programs
Status: ✅ Deployed
Explorer: https://explorer.solana.com/address/2ysaGgXXKK7fTjKp59nVyivP7yoUpf9QHJqQHAuavchP?cluster=devnet
```

### 2. Parameter Storage
```
Program ID: J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD
Purpose: Platform parameters and configuration management
Status: ✅ Deployed
Explorer: https://explorer.solana.com/address/J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD?cluster=devnet
```

### 3. Core Markets (Market Maker)
```
Program ID: 6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV
Purpose: Market creation, betting, and liquidity management
Status: ✅ Deployed
Explorer: https://explorer.solana.com/address/6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV?cluster=devnet
```

### 4. Market Resolution
```
Program ID: Hcxxt6W1HmKQmnUvqpgzNEqVG611Yzt2i4DUvwvkLRf2
Purpose: Market resolution, disputes, and payout distribution
Status: ✅ Deployed
Explorer: https://explorer.solana.com/address/Hcxxt6W1HmKQmnUvqpgzNEqVG611Yzt2i4DUvwvkLRf2?cluster=devnet
```

### 5. Proposal System
```
Program ID: 5XH5i8dypiB4Wwa7TkmU6dnk9SyUGqE92GiQMHypPekL
Purpose: Community governance and proposal voting
Status: ✅ Deployed
Explorer: https://explorer.solana.com/address/5XH5i8dypiB4Wwa7TkmU6dnk9SyUGqE92GiQMHypPekL?cluster=devnet
```

### 6. Bond Manager
```
Program ID: 8XvCToLC42ZV4hw6PW5SEhqDpX3NfqvbAS2tNseG52Fx
Purpose: Market creator bond deposits and refunds
Status: ✅ Deployed
Note: Story 4.6 security fixes will be included in testnet deployment
Explorer: https://explorer.solana.com/address/8XvCToLC42ZV4hw6PW5SEhqDpX3NfqvbAS2tNseG52Fx?cluster=devnet
```

---

## 🔗 Quick Reference

### Copy-Paste for Frontend Config
```typescript
// Devnet Program IDs
export const DEVNET_PROGRAM_IDS = {
  PROGRAM_REGISTRY: "2ysaGgXXKK7fTjKp59nVyivP7yoUpf9QHJqQHAuavchP",
  PARAMETER_STORAGE: "J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD",
  CORE_MARKETS: "6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV",
  MARKET_RESOLUTION: "Hcxxt6W1HmKQmnUvqpgzNEqVG611Yzt2i4DUvwvkLRf2",
  PROPOSAL_SYSTEM: "5XH5i8dypiB4Wwa7TkmU6dnk9SyUGqE92GiQMHypPekL",
  BOND_MANAGER: "8XvCToLC42ZV4hw6PW5SEhqDpX3NfqvbAS2tNseG52Fx",
};
```

### Environment Variables
```bash
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_WS_ENDPOINT=wss://api.devnet.solana.com

# Program IDs
NEXT_PUBLIC_PROGRAM_REGISTRY_ID=2ysaGgXXKK7fTjKp59nVyivP7yoUpf9QHJqQHAuavchP
NEXT_PUBLIC_PARAMETER_STORAGE_ID=J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD
NEXT_PUBLIC_CORE_MARKETS_ID=6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV
NEXT_PUBLIC_MARKET_RESOLUTION_ID=Hcxxt6W1HmKQmnUvqpgzNEqVG611Yzt2i4DUvwvkLRf2
NEXT_PUBLIC_PROPOSAL_SYSTEM_ID=5XH5i8dypiB4Wwa7TkmU6dnk9SyUGqE92GiQMHypPekL
NEXT_PUBLIC_BOND_MANAGER_ID=8XvCToLC42ZV4hw6PW5SEhqDpX3NfqvbAS2tNseG52Fx
```

---

## 🧪 Testing Information

### Devnet SOL Faucet
- **CLI**: `solana airdrop 2` (may be rate-limited)
- **Web**: https://faucet.solana.com/

### Devnet USDC (Test Token)
- **Mint Address**: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (devnet USDC)
- **Decimals**: 6
- **Faucet**: Available through Solana ecosystem tools

### Test Wallet
- **Address**: 4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA
- **Balance**: 10.8+ SOL
- **Purpose**: Deployer and testing

---

## 📊 Deployment Status

| Program | Status | Version | Last Updated |
|---------|--------|---------|--------------|
| program_registry | ✅ Active | 0.1.0 | 2025-10-28 |
| parameter_storage | ✅ Active | 0.1.0 | 2025-10-28 |
| core_markets | ✅ Active | 0.1.0 | 2025-10-28 |
| market_resolution | ✅ Active | 0.1.0 | 2025-10-28 |
| proposal_system | ✅ Active | 0.1.0 | 2025-10-28 |
| bond_manager | ✅ Active | 0.1.0 | 2025-10-28 |

**All Programs Operational** ✅

---

## 🔄 Upgrade Strategy

### Current Devnet Deployment
- **Purpose**: Frontend integration and testing
- **Security Level**: Development (suitable for testing)
- **Missing Fixes**: M-01 security fix (non-critical for devnet)

### Future Testnet Deployment
- **Purpose**: Pre-production testing with full security
- **Security Level**: Production-ready with all fixes
- **Includes**: Story 4.6 security fixes (M-01 program ID validation)
- **Timeline**: When testnet SOL available

### Mainnet Deployment
- **Purpose**: Production deployment
- **Security Level**: Maximum security
- **Prerequisites**:
  - Comprehensive testnet testing complete
  - All security fixes verified
  - User acceptance testing passed

---

## 🛠️ Frontend Integration Checklist

- [ ] Copy addresses to frontend .env.devnet
- [ ] Update wallet adapter to use devnet
- [ ] Configure RPC endpoints for devnet
- [ ] Update program ID constants
- [ ] Test wallet connection
- [ ] Test program queries
- [ ] Test transactions
- [ ] Verify all user flows

---

## 📝 Notes

### Version Information
- **Anchor Framework**: v0.32.1
- **Solana CLI**: v2.3.13
- **Node.js**: v18+
- **Deployment Method**: Anchor deploy

### Known Limitations
- Bond Manager missing M-01 security fix (program ID validation)
  - **Impact**: Low for devnet testing
  - **Mitigation**: Will be included in testnet/mainnet
  - **Workaround**: None needed for development

### Support & Troubleshooting
- Check program status: `solana program show <PROGRAM_ID>`
- View transactions: Solana Explorer (devnet mode)
- Get devnet SOL: `solana airdrop 2` or web faucet
- RPC issues: May need custom RPC endpoint for better reliability

---

## 🎯 Success Criteria

This devnet deployment is successful when:
- ✅ All 6 programs deployed and accessible
- ✅ Frontend connects to all programs
- ✅ All user flows functional
- ✅ No critical bugs blocking testing
- ✅ Team can test features end-to-end

**Current Status**: ✅ Ready for frontend integration!

---

**Last Updated**: 2025-10-28 19:56 CET
**Next Step**: Frontend integration (Story 4.7-devnet continues)
