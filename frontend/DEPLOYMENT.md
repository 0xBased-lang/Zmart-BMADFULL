# 🚀 Zmart - Deployment Guide

**Bulletproof deployment configuration for Vercel**

---

## 📋 Prerequisites

### Required Software
- **Node.js:** 18.x (specified in `.nvmrc`)
- **npm:** 9.x or higher
- **Package Manager:** npm only (no yarn/pnpm)

### Check Your Versions
```bash
node -v    # Should show v18.x.x
npm -v     # Should show 9.x.x or higher
```

---

## 🏗️ Local Development

### First Time Setup
```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Edit .env.local with your credentials
# Get Supabase credentials from: https://supabase.com/dashboard

# 4. Start development server
npm run dev
```

### Development Server
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Test production build
npm run start            # Run production build locally
```

---

## 🔧 Vercel Configuration

### Dashboard Settings (One-Time Setup)

**1. Root Directory**
- Go to: Settings → General → Root Directory
- Set to: `frontend`
- This tells Vercel your Next.js app is in the frontend/ subdirectory

**2. Framework Detection**
- Should auto-detect: Next.js
- Build Command: `npm run build` (auto)
- Output Directory: `.next` (auto)
- Install Command: `npm ci --legacy-peer-deps` (from vercel.json)

**3. Environment Variables** (REQUIRED)
- Go to: Settings → Environment Variables
- Add these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

- For each variable, check: Production, Preview, Development
- Click Save

**4. Node.js Version**
- Should auto-detect from `.nvmrc`: 18.19.0
- If not, set in: Settings → General → Node.js Version: 18.x

---

## 📦 Package Manager Enforcement

This project uses **npm only**. Configuration files ensure this:

### Files That Enforce npm:
- **`frontend/.npmrc`** - Forces npm, prevents yarn/pnpm
- **`frontend/package.json`** - Specifies `packageManager: "npm@10.2.4"`
- **`frontend/package-lock.json`** - npm lock file (never delete this)
- **`frontend/vercel.json`** - Uses `npm ci` for installs

### What NOT to Do:
- ❌ Don't run `yarn install`
- ❌ Don't create `yarn.lock`
- ❌ Don't delete `package-lock.json`
- ❌ Don't mix package managers

---

## 🚢 Deployment Process

### Automatic Deployment (Recommended)
```bash
# Push to main branch - auto-deploys to Vercel
git add .
git commit -m "Your commit message"
git push origin main

# Vercel will automatically:
# 1. Detect the push
# 2. Clone the repo
# 3. Install dependencies with npm ci
# 4. Build with npm run build
# 5. Deploy to production
```

### Manual Deployment (Via CLI)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

---

## ✅ Build Process Explained

### What Happens During Build:

1. **Clone Repository**
   - Vercel clones from GitHub

2. **Install Dependencies**
   - Runs: `npm ci --legacy-peer-deps`
   - Uses `package-lock.json` for exact versions
   - `--legacy-peer-deps` handles React 19 peer dependency warnings

3. **Pre-Build Check**
   - Script: `prebuild` in package.json
   - Prints Node and npm versions for debugging

4. **Build Next.js**
   - Runs: `npm run build`
   - Which executes: `next build`
   - Creates optimized production bundle in `.next/`

5. **Deploy**
   - Uploads `.next/` to Vercel edge network
   - Live at your Vercel URL

### Expected Output:
```
✓ Cloning repository
✓ Installing dependencies (npm ci)
✓ Running prebuild script
  🔍 Node: v18.19.0
  📦 npm: 10.2.4
✓ Building application (next build)
  Route (pages)               Size     First Load JS
  ├ ○ /                       1.2 kB         90 kB
  ├ ○ /dashboard              2.5 kB         95 kB
  └ ...
✓ Deployment ready
```

---

## 🐛 Troubleshooting

### Build Fails: "No Next.js version detected"

**Cause:** Package manager confusion or wrong root directory

**Fix:**
```bash
# 1. Verify Root Directory in Vercel dashboard
Settings → General → Root Directory = "frontend"

# 2. Verify package.json has Next.js
grep "next" frontend/package.json
# Should show: "next": "16.0.0"

# 3. Redeploy
```

### Build Fails: "yarn.lock found"

**Cause:** Mixed package managers

**Fix:**
```bash
# Remove yarn.lock
rm -f frontend/yarn.lock
rm -f yarn.lock

# Commit
git add .
git commit -m "fix: Remove yarn.lock"
git push origin main
```

### Environment Variables Not Working

**Cause:** Variables not set in Vercel or wrong environment

**Fix:**
```bash
# 1. Check Vercel dashboard
Settings → Environment Variables

# 2. Ensure checked for all environments:
☑ Production
☑ Preview
☑ Development

# 3. Redeploy after adding variables
```

### Peer Dependency Warnings

**Cause:** React 19 with older packages (wallet adapters)

**Fix:** Already handled by `--legacy-peer-deps` flag
- These are warnings, not errors
- Build will succeed
- Safe to ignore

---

## 🔒 Security

### Security Headers
Configured in `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### Environment Variables
- Never commit `.env.local` to git
- Never expose private keys
- Use Vercel dashboard for production secrets
- Supabase anon key is safe for client-side use

---

## 📊 Monitoring

### Check Deployment Status
```bash
# Via Vercel dashboard
https://vercel.com/dashboard → Your Project → Deployments

# Via CLI
vercel ls
```

### View Build Logs
```bash
# Via dashboard
Click deployment → View Build Logs

# Via CLI
vercel logs <deployment-url>
```

---

## 🔄 Update Process

### Updating Dependencies
```bash
# Check outdated packages
npm outdated

# Update specific package
npm update package-name

# Update Next.js
npm install next@latest

# Test locally first
npm run build
npm run start

# Commit if successful
git add package.json package-lock.json
git commit -m "chore: Update dependencies"
git push origin main
```

### Changing Environment Variables
```bash
# 1. Update in Vercel dashboard
Settings → Environment Variables → Edit

# 2. Update .env.example (for documentation)
# Edit frontend/.env.example

# 3. Redeploy to apply changes
Deployments → Latest → Redeploy
```

---

## 📞 Support

### Useful Links
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Dashboard:** https://supabase.com/dashboard

### Common Commands Reference
```bash
# Development
npm install              # Install dependencies
npm run dev             # Start dev server
npm run build           # Build for production
npm run start           # Run production build locally

# Deployment
git push origin main    # Auto-deploy to Vercel
vercel --prod          # Manual deployment

# Debugging
npm run prebuild       # Check Node/npm versions
vercel logs           # View deployment logs
vercel env ls         # List environment variables
```

---

## ✅ Deployment Checklist

Before each deployment, verify:

- [ ] `package-lock.json` exists and is committed
- [ ] No `yarn.lock` in repository
- [ ] `.env.local` is NOT committed (in .gitignore)
- [ ] Environment variables set in Vercel dashboard
- [ ] Root Directory = `frontend` in Vercel settings
- [ ] Local build succeeds: `npm run build`
- [ ] Git working tree is clean: `git status`

---

## 🎯 Success Indicators

Your deployment is correctly configured when:

✅ Build completes in 2-5 minutes
✅ No "Next.js version not detected" errors
✅ No yarn/pnpm warnings
✅ All routes generated successfully
✅ Environment variables loaded
✅ Site loads without errors
✅ Wallet connection works

---

**Last Updated:** 2025-10-29
**Maintained By:** Development Team
**Status:** Production Ready ✅
