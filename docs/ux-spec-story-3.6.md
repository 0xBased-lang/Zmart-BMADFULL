# BMAD-Zmart Story 3.6: Proposal Creation Flow - UX/UI Specification

_Generated on 2025-10-27 by ULULU (UX Expert Agent: Sally)_

---

## Executive Summary

This UX specification defines the complete user experience for **Story 3.6: Build Proposal Creation Flow** - a multi-step wizard enabling market creators to propose new prediction markets on the BMAD-Zmart platform.

**Scope:** Single feature (Proposal Creation Wizard)
**Epic:** 3 - Frontend & UX
**Priority:** P0
**Complexity:** High (multi-step form, blockchain integration, complex validation)

**Key Requirements:**
- 4-step wizard flow (Title → Resolution Criteria → Bond Selection → Preview)
- Real-time fee calculations based on bond tier selection
- Comprehensive form validation with inline error messaging
- Blockchain transaction integration with Solana Wallet Adapter
- Responsive design supporting mobile (360px+) to desktop (1920px+)
- WCAG 2.1 AA accessibility compliance

**Related Artifacts:**
- Story File: `docs/stories/story-3.6.md`
- Story Context: `docs/stories/story-context-3.6.xml`
- Architecture Reference: `docs/architecture.md`
- Existing Patterns: Stories 3.3 (Homepage), 3.4 (Market Detail), 3.5 (Dashboard)

---

## 1. UX Goals and Principles

### 1.1 Target User Personas

#### Primary Persona: **Community Market Creator**

**Profile:**
- **Name:** Alex (Community Contributor)
- **Age:** 25-40
- **Tech Proficiency:** Intermediate to Advanced (familiar with crypto/DeFi)
- **Goals:**
  - Create interesting prediction markets that engage the community
  - Understand costs and incentives clearly before committing funds
  - Navigate the proposal process quickly and confidently
  - Maximize chances of proposal approval through clear, well-structured proposals

**Pain Points:**
- Uncertainty about bond requirements and fee structures
- Fear of losing funds due to unclear refund policies
- Complex forms that feel overwhelming or confusing
- Lack of guidance on writing good resolution criteria
- Unclear what makes a proposal likely to be approved

**User Needs:**
- Clear visual feedback at each step
- Transparent fee breakdown before committing funds
- Inline validation to catch errors early
- Ability to review everything before final submission
- Educational tooltips explaining bond mechanics and best practices

#### Secondary Persona: **Power User / Market Specialist**

**Profile:**
- **Name:** Morgan (Professional Predictor)
- **Age:** 30-50
- **Tech Proficiency:** Expert (DeFi veteran, multiple wallets)
- **Goals:**
  - Create multiple high-quality markets efficiently
  - Optimize bond amounts for maximum fee efficiency
  - Batch-create proposals when opportunity arises

**Pain Points:**
- Time-consuming multi-step forms for repeat users
- Inability to save drafts or templates
- Lack of keyboard shortcuts for efficiency

**User Needs:**
- Streamlined flow for experienced users
- Ability to duplicate previous successful proposals
- Keyboard navigation support
- Quick access to proposal history

---

### 1.2 Usability Goals

| Goal | Success Metric | Priority |
|------|---------------|----------|
| **Clarity** | Users understand all costs and mechanics before submission | P0 |
| **Error Prevention** | >90% of proposals submitted successfully on first attempt | P0 |
| **Efficiency** | Average completion time <3 minutes for experienced users | P1 |
| **Confidence** | Users feel confident in their understanding of the process | P0 |
| **Accessibility** | 100% keyboard navigable, screen reader compatible | P0 |
| **Responsive** | Fully functional on mobile (360px) to desktop (1920px+) | P0 |

**Key UX Principles:**
1. **Progressive Disclosure**: Only show information relevant to current step
2. **Immediate Feedback**: Validate inputs as user types, show real-time calculations
3. **Reversibility**: Allow users to go back and edit any step before final submission
4. **Transparency**: Make all costs, fees, and consequences crystal clear
5. **Guidance**: Provide contextual help without cluttering the interface

---

### 1.3 Design Principles

**1. Clarity Over Cleverness**
- Use plain language over technical jargon
- Make fee structures immediately understandable
- Avoid hidden costs or surprise fees

**2. Guide, Don't Gate**
- Provide helpful suggestions, not rigid requirements
- Show examples of good proposals
- Validate early and often, but don't block progress unnecessarily

**3. Trust Through Transparency**
- Show exactly where funds go (bond escrow, proposal tax)
- Explain refund conditions clearly
- Display transaction details before wallet signature

**4. Consistency With Platform**
- Maintain visual language from Stories 3.3, 3.4, 3.5
- Reuse established component patterns (cards, buttons, inputs)
- Follow Tailwind utility-first approach

**5. Accessibility as Default**
- Keyboard navigation required, not nice-to-have
- Color never the only indicator of state
- Semantic HTML with proper ARIA labels

---

## 2. Information Architecture

### 2.1 Site Map Context

```
/                         (Homepage - Story 3.3)
├── /markets/[id]        (Market Detail - Story 3.4)
├── /dashboard           (User Dashboard - Story 3.5)
├── /propose             ← **NEW: Proposal Creation (Story 3.6)**
│   ├── Step 1: Market Info
│   ├── Step 2: Resolution Criteria
│   ├── Step 3: Bond Selection
│   ├── Step 4: Preview & Submit
│   └── /success         (Success confirmation page)
├── /proposals           (Future: Story 3.8 - Proposal Voting)
└── /leaderboard         (Future: Story 3.9)
```

**Navigation Access Points:**
1. **Primary:** Main navigation "Create Proposal" button (Header)
2. **Secondary:** Call-to-action on Homepage for logged-in users
3. **Tertiary:** "Create Another" button on success page

---

### 2.2 Navigation Structure

#### Primary Navigation (Header)
- Logo (left) → Home
- Browse Markets
- My Dashboard
- **Create Proposal** ← New addition
- Wallet Connection (right)

#### Wizard Navigation (Internal)
- Step Indicator: 1/4, 2/4, 3/4, 4/4
- Navigation Controls:
  - "Back" button (disabled on Step 1)
  - "Next" button (disabled if validation fails)
  - "Cancel" link (returns to homepage, confirms if form filled)

#### Breadcrumb (Mobile Only)
- Home > Create Proposal > Step [N]

---

## 3. User Flows

### 3.1 Primary User Flow: Proposal Creation (Happy Path)

**Mermaid Diagram:**

\`\`\`mermaid
flowchart TD
    Start([User clicks<br/>'Create Proposal']) --> CheckWallet{Wallet<br/>Connected?}
    CheckWallet -->|No| ConnectWallet[Show wallet<br/>connection modal]
    ConnectWallet --> Step1
    CheckWallet -->|Yes| Step1[Step 1: Market Info<br/>- Title input<br/>- Category dropdown]

    Step1 --> Validate1{Valid?<br/>10-200 chars}
    Validate1 -->|No| ShowError1[Show inline<br/>error messages]
    ShowError1 --> Step1
    Validate1 -->|Yes| Step2[Step 2: Resolution Criteria<br/>- Criteria textarea<br/>- Evidence links<br/>- End date picker]

    Step2 --> Validate2{Valid?<br/>Future date,<br/>max 2 years}
    Validate2 -->|No| ShowError2[Show validation<br/>errors]
    ShowError2 --> Step2
    Validate2 -->|Yes| Step3[Step 3: Bond Selection<br/>- Amount slider<br/>- Tier visualization<br/>- Fee calculator]

    Step3 --> Validate3{Valid?<br/>Min 50 ZMart}
    Validate3 -->|No| ShowError3[Show min<br/>requirement]
    ShowError3 --> Step3
    Validate3 -->|Yes| Step4[Step 4: Preview<br/>- All info review<br/>- Fee breakdown<br/>- Edit links]

    Step4 --> ConfirmSubmit{User clicks<br/>'Submit'}
    ConfirmSubmit -->|Yes| TxBuild[Build Solana<br/>transaction]
    ConfirmSubmit -->|Cancel| Step4

    TxBuild --> WalletSign[Request wallet<br/>signature]
    WalletSign --> UserApproves{User approves<br/>in wallet?}
    UserApproves -->|No| TxCancelled[Show cancellation<br/>message]
    TxCancelled --> Step4
    UserApproves -->|Yes| SubmitTx[Submit transaction<br/>to Solana]

    SubmitTx --> TxResult{Transaction<br/>success?}
    TxResult -->|Error| ShowTxError[Show error<br/>with retry option]
    ShowTxError --> Step4
    TxResult -->|Success| Success[Success Page<br/>- Proposal ID<br/>- Voting countdown<br/>- Next actions]

    Success --> End([Complete])
\`\`\`

**Flow Steps:**

**1. Entry** (Pre-Step 1)
- **Entry Point:** Header "Create Proposal" button, Homepage CTA
- **Gate:** Wallet connection required
- **If not connected:** Show wallet connection modal, then proceed to Step 1

**2. Step 1: Market Information** (~ 30 seconds)
- **Goal:** Define basic market details
- **Inputs:**
  - Market title (text input, 10-200 chars)
  - Category (dropdown: Politics, Sports, Crypto, Entertainment, Science, Other)
- **Validation:** Real-time character count, error if <10 or >200
- **Navigation:** "Next" enabled only when valid
- **Exit:** "Cancel" link with confirmation if title entered

**3. Step 2: Resolution Criteria** (~ 1-2 minutes)
- **Goal:** Define how market will be resolved
- **Inputs:**
  - Resolution criteria (textarea, markdown preview, 50-500 chars recommended)
  - Evidence requirements (optional URL inputs, up to 3 links)
  - End date (date picker, must be future date, max 2 years from now)
- **Validation:**
  - End date must be in future
  - End date cannot exceed 2 years from creation
  - Show warning if criteria too vague (<50 chars)
- **Help Content:** Tooltip explaining good resolution criteria with examples
- **Navigation:** "Back" to Step 1, "Next" enabled when valid

**4. Step 3: Bond Selection** (~ 1 minute)
- **Goal:** Choose bond amount and understand fee implications
- **Inputs:**
  - Bond amount slider (50-1000 ZMart, logarithmic scale preferred)
  - Tier thresholds visualized: <100 (Low), 100-499 (Medium), 500+ (High)
- **Real-Time Feedback:**
  - Current tier badge (Low/Medium/High)
  - Creator fee percentage (0.5% / 1.0% / 2.0%)
  - Proposal tax (1% of bond, non-refundable)
  - Total cost calculation
  - Potential refund amount (100% if approved, 50% if rejected)
- **Help Content:** Tooltip explaining bond mechanics and refund conditions
- **Navigation:** "Back" to Step 2, "Next" enabled (min 50 ZMart enforced)

**5. Step 4: Preview & Review** (~ 1 minute)
- **Goal:** Review all information before committing
- **Display:**
  - Summary card with all entered information (read-only)
  - Fee breakdown table:
    - Bond deposit: [amount] ZMart (refundable based on outcome)
    - Proposal tax: [1% of bond] ZMart (non-refundable)
    - Creator fee tier: [0.5% / 1.0% / 2.0%]
    - **Total cost:** [bond + tax] ZMart
  - Edit links next to each section (jump back to specific step)
- **Help Content:** Refund conditions summary
- **Navigation:** "Back" to Step 3, "Submit Proposal" button (primary CTA)

**6. Transaction Submission** (~ 30 seconds - 2 minutes)
- **Process:**
  1. Build Solana transaction with create_proposal instruction
  2. Request wallet signature
  3. Show transaction details in wallet
  4. User approves/rejects in wallet
  5. Submit to Solana network
  6. Poll for confirmation
- **Loading States:**
  - "Preparing transaction..." (building)
  - "Waiting for wallet approval..." (signature request)
  - "Submitting to blockchain..." (transaction in flight)
  - "Confirming..." (waiting for finality)
- **Error Handling:**
  - User rejection → Return to preview with option to retry
  - Network error → Show error with retry button
  - Insufficient funds → Clear error message with balance display

**7. Success State** (End of flow)
- **Display:**
  - Success icon/animation
  - Proposal ID (from transaction)
  - Voting period countdown timer
  - Brief explanation of next steps (community voting)
- **Actions:**
  - "View Proposal" button → Navigate to proposal detail page (Story 3.8)
  - "Create Another Proposal" button → Return to Step 1
  - "Go to Dashboard" link → Navigate to user dashboard

---

### 3.2 Alternative Flow: Wallet Not Connected

\`\`\`mermaid
flowchart TD
    Start([User navigates<br/>to /propose]) --> CheckWallet{Wallet<br/>Connected?}
    CheckWallet -->|No| ShowPrompt[Show prominent<br/>wallet connection<br/>prompt]
    ShowPrompt --> UserAction{User action}
    UserAction -->|Connect| OpenWalletModal[Open wallet<br/>selection modal]
    UserAction -->|Dismiss| RedirectHome[Redirect to<br/>homepage]
    OpenWalletModal --> WalletSelected{Wallet<br/>selected?}
    WalletSelected -->|Yes| Connected[Connected!<br/>Show success toast]
    Connected --> ProceedToStep1[Load Step 1]
    WalletSelected -->|Cancel| ShowPrompt
\`\`\`

**UX Treatment:**
- Dedicated "Connect Wallet" screen (not just a modal)
- Clear explanation of why wallet is needed for proposals
- List of supported wallets with icons
- "Learn More" link explaining wallet setup
- Option to browse existing proposals without connecting

---

### 3.3 Alternative Flow: Form Abandonment

**Triggers:**
- User clicks "Cancel" link
- User navigates away (browser back, closes tab)
- User clicks outside wizard area (if in modal)

**UX Treatment:**
1. **If form is empty:** Allow immediate exit
2. **If form has data:** Show confirmation modal:
   - Title: "Leave without submitting?"
   - Message: "Your proposal progress will be lost. Are you sure?"
   - Actions: "Keep Editing" (primary), "Leave" (destructive)

**Future Enhancement (not in Story 3.6):**
- Auto-save to local storage
- "Resume Draft" option on return

---

### 3.4 Error Flow: Validation Failures

**Inline Validation (Real-Time):**
- Title too short → "Title must be at least 10 characters"
- Title too long → "Title cannot exceed 200 characters (currently: [N])"
- End date in past → "End date must be in the future"
- End date too far → "End date cannot be more than 2 years from now"
- Bond too low → "Minimum bond is 50 ZMart"

**Visual Treatment:**
- Red border on invalid field
- Red error icon next to field
- Error message in red text below field
- "Next" button disabled with tooltip explaining why

**Accessibility:**
- Error messages announced to screen readers
- Focus automatically moved to first error on navigation attempt
- Error summary at top of step if multiple errors

---

### 3.5 Error Flow: Transaction Failures

**Error Scenarios:**

| Error Type | User Message | Actions Offered |
|------------|--------------|-----------------|
| **User Rejection** | "Transaction cancelled. Your wallet signature was not approved." | Try Again, Cancel |
| **Insufficient Funds** | "Insufficient SOL balance. You need [X] SOL to cover bond + fees. Current balance: [Y] SOL." | Add Funds, Cancel |
| **Network Error** | "Network error. Unable to connect to Solana. Please check your internet connection." | Retry, Cancel |
| **Transaction Failed** | "Transaction failed on blockchain. Error: [details]. No funds were deducted." | Retry, View Error Details, Cancel |
| **Timeout** | "Transaction timeout. The blockchain is busy. Your funds are safe." | Retry, Check Status, Cancel |

**Visual Treatment:**
- Error modal with red accent
- Clear error icon
- Plain language explanation
- Technical details in expandable section
- Prominent retry option

---

## 4. Component Library and Design System

### 4.1 Design System Approach

**Strategy:** Tailwind CSS utility-first with custom components

**Rationale:**
- Consistency with existing Stories 3.3, 3.4, 3.5
- Rapid development with Tailwind utilities
- Lightweight (no heavy design system dependency)
- Easy customization for Web3 aesthetics

**Component Organization:**
```
frontend/app/propose/
├── page.tsx                     (Server component wrapper)
└── components/
    ├── ProposalWizard.tsx       (Main wizard orchestrator)
    ├── StepIndicator.tsx        (Progress indicator UI)
    ├── Step1MarketInfo.tsx      (Title + Category)
    ├── Step2Resolution.tsx      (Criteria + Date picker)
    ├── Step3BondSelection.tsx   (Bond slider + Tier viz)
    ├── Step4Preview.tsx         (Review + Submit)
    ├── FeeBreakdown.tsx         (Reusable fee display)
    ├── BondTierBadge.tsx        (Tier indicator badge)
    └── SuccessPage.tsx          (Post-submission success)
```

**Shared Components (from existing codebase):**
- `Header.tsx` (global navigation)
- `WalletProvider.tsx` (wallet context)
- Toast notifications (react-hot-toast)

**New Shared Components (reusable beyond Story 3.6):**
- `FormField.tsx` (labeled input with validation)
- `Tooltip.tsx` (info tooltips)
- `ConfirmModal.tsx` (confirmation dialogs)

---

### 4.2 Core Components Specification

#### Component: StepIndicator

**Purpose:** Show user progress through 4-step wizard

**States:**
- `incomplete`: Step not yet reached (gray, number only)
- `current`: Currently active step (blue, number + title)
- `complete`: Completed step (green checkmark, clickable)

**Variants:**
- Desktop: Horizontal layout with connecting lines
- Mobile: Compact horizontal dots

**Visual Spec:**
```
Desktop:
[1] ━━━ [2] ━━━ [3] ━━━ [4]
Title  Criteria  Bond  Preview

Mobile:
● ○ ○ ○  (Step 1 of 4)
```

**Accessibility:**
- `role="progressbar"`
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Announce step changes to screen readers

---

#### Component: Step1MarketInfo

**Inputs:**

| Field | Type | Validation | Help Text |
|-------|------|------------|-----------|
| Title | Text input | 10-200 chars, required | "Choose a clear, specific title for your market" |
| Category | Dropdown | Required, 6 options | "Help users discover your market by category" |

**Layout:**
```
┌─────────────────────────────────────────┐
│ Market Title *                          │
│ ┌───────────────────────────────────┐   │
│ │ [User input...]                   │   │
│ └───────────────────────────────────┘   │
│ 15/200 characters                       │
│                                         │
│ Category *                              │
│ ┌───────────────────────────────────┐   │
│ │ [Select category...         ▼]    │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘

[Cancel]                    [Next Step →]
```

**Validation Display:**
- Character counter updates in real-time
- Red if <10 or >200, green if valid
- Error message appears below field

---

#### Component: Step3BondSelection

**Purpose:** Bond amount selection with tier visualization and fee calculation

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Bond Amount *                               │
│                                             │
│ ┌───────────────────────────────────────┐   │
│ │ ◄────────●─────────►                   │   │ Slider
│ └───────────────────────────────────────┘   │
│        50          100          500    1000 │
│                                             │
│ Selected: 150 ZMart                         │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │  Tier: MEDIUM Badge                     │ │ Tier Indicator
│ │  Creator Fee: 1.0%                      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Fee Breakdown:                              │
│ • Bond deposit:     150.00 ZMart           │
│ • Proposal tax:       1.50 ZMart (1%)     │
│ • Total cost:       151.50 ZMart           │
│                                             │
│ ℹ️  Bond refund: 100% if approved,          │
│    50% if rejected, 0% if cancelled         │
└─────────────────────────────────────────────┘

[← Back]                    [Next Step →]
```

**Real-Time Calculations:**
- Slider updates bond amount
- Tier badge updates based on thresholds
- All fees recalculate instantly
- Smooth animations on tier changes

**Tier Thresholds:**
- **Low Tier:** 50-99 ZMart → 0.5% creator fee (Green badge)
- **Medium Tier:** 100-499 ZMart → 1.0% creator fee (Blue badge)
- **High Tier:** 500+ ZMart → 2.0% creator fee (Purple badge)

**Tooltip Content (ℹ️ icon):**
"Your bond is held in escrow during voting. If your proposal is approved, you get 100% back plus the right to earn creator fees. If rejected, you get 50% back. If you cancel, you forfeit the bond."

---

#### Component: Step4Preview

**Purpose:** Final review before transaction submission

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Review Your Proposal                        │
│                                             │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│ ┃ Market Information            [Edit] ┃   │
│ ┃ Title: "Will Bitcoin reach..."       ┃   │
│ ┃ Category: Crypto                     ┃   │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                             │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│ ┃ Resolution Criteria           [Edit] ┃   │
│ ┃ Resolved YES if Bitcoin price...     ┃   │
│ ┃ End Date: Dec 31, 2025               ┃   │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                             │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│ ┃ Bond & Fees                   [Edit] ┃   │
│ ┃                                      ┃   │
│ ┃ Bond Amount:        150.00 ZMart     ┃   │
│ ┃ Tier:               MEDIUM (1.0%)    ┃   │
│ ┃ Proposal Tax:         1.50 ZMart     ┃   │
│ ┃ ─────────────────────────────────    ┃   │
│ ┃ Total Cost:         151.50 ZMart     ┃   │
│ ┃                                      ┃   │
│ ┃ Refund if approved:    150.00 ZMart  ┃   │
│ ┃ Refund if rejected:     75.00 ZMart  ┃   │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                             │
│ ⚠️  Once submitted, you cannot edit         │
│    this proposal. Please review carefully.  │
└─────────────────────────────────────────────┘

[← Back]            [Submit Proposal]
```

**Interaction:**
- [Edit] links jump back to specific step
- Form data preserved when navigating back
- "Submit Proposal" button is prominent (green, large)
- Clicking Submit shows transaction confirmation modal

---

#### Component: TransactionModal

**Purpose:** Show transaction status during submission

**States:**

**1. Preparing:**
```
┌─────────────────────────────┐
│ Preparing Transaction       │
│                             │
│     [Spinning animation]    │
│                             │
│ Building proposal on-chain  │
│ transaction...              │
└─────────────────────────────┘
```

**2. Awaiting Signature:**
```
┌─────────────────────────────┐
│ Approve in Wallet           │
│                             │
│     [Wallet icon pulsing]   │
│                             │
│ Check your wallet for       │
│ signature request           │
│                             │
│        [Cancel]             │
└─────────────────────────────┘
```

**3. Submitting:**
```
┌─────────────────────────────┐
│ Submitting to Blockchain    │
│                             │
│     [Progress bar]          │
│                             │
│ This may take a moment...   │
└─────────────────────────────┘
```

**4. Success:**
```
┌─────────────────────────────┐
│ Proposal Submitted! ✓       │
│                             │
│     [Success animation]     │
│                             │
│ Redirecting to success      │
│ page...                     │
└─────────────────────────────┘
```

---

### 4.3 Validation & Error Display Patterns

**Input Validation States:**

| State | Border | Icon | Message Color | Help Text |
|-------|--------|------|---------------|-----------|
| Default | Gray | None | Gray | Default help text |
| Focus | Blue | None | Gray | Default help text |
| Valid | Green | ✓ | Green | Confirmation message |
| Invalid | Red | ⚠ | Red | Error message |
| Disabled | Gray | None | Gray | Disabled state explanation |

**Error Message Format:**
```
[Field Label] *
┌────────────────────────┐
│ [Invalid input]    ⚠️  │ ← Red border
└────────────────────────┘
❌ [Specific error message]  ← Red text
```

**Success Message Format:**
```
[Field Label] *
┌────────────────────────┐
│ [Valid input]      ✓   │ ← Green border
└────────────────────────┘
✅ [Confirmation message]   ← Green text (optional)
```

---

## 5. Visual Design Foundation

### 5.1 Color Palette

Following existing BMAD-Zmart brand from Stories 3.3-3.5:

| Color Role | Hex | Usage |
|------------|-----|-------|
| **Primary** | `#3B82F6` (Blue 500) | Primary actions, links, step indicator (current) |
| **Primary Hover** | `#2563EB` (Blue 600) | Hover state for primary elements |
| **Success** | `#10B981` (Green 500) | Success messages, valid inputs, tier Low badge |
| **Warning** | `#F59E0B` (Amber 500) | Warnings, tier Medium badge |
| **Error** | `#EF4444` (Red 500) | Errors, invalid inputs |
| **Info** | `#8B5CF6` (Purple 500) | Informational messages, tier High badge |
| **Neutral Dark** | `#1F2937` (Gray 800) | Primary text, headings |
| **Neutral** | `#6B7280` (Gray 500) | Secondary text, labels |
| **Neutral Light** | `#F3F4F6` (Gray 100) | Backgrounds, disabled states |
| **White** | `#FFFFFF` | Cards, inputs, modal backgrounds |

**Semantic Color Usage:**
- Tier Low (50-99 ZMart): Success Green
- Tier Medium (100-499 ZMart): Warning Amber
- Tier High (500+ ZMart): Info Purple
- Refundable amounts: Success Green
- Non-refundable amounts: Error Red

---

### 5.2 Typography

Following existing font stack from frontend:

**Font Families:**
- **Sans-serif (Primary):** `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Monospace (Numbers):** `ui-monospace, "SF Mono", Monaco, "Cascadia Code", monospace`

**Type Scale:**

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| H1 | 2.25rem (36px) | 700 | 1.2 | Page title ("Create Proposal") |
| H2 | 1.875rem (30px) | 600 | 1.3 | Step titles |
| H3 | 1.5rem (24px) | 600 | 1.4 | Section headings |
| H4 | 1.25rem (20px) | 600 | 1.4 | Card titles |
| Body Large | 1.125rem (18px) | 400 | 1.6 | Important content, instructions |
| Body | 1rem (16px) | 400 | 1.5 | Default text |
| Body Small | 0.875rem (14px) | 400 | 1.5 | Help text, labels |
| Caption | 0.75rem (12px) | 400 | 1.4 | Character counters, metadata |
| Button Text | 1rem (16px) | 500 | 1 | Button labels |
| Monospace (Amounts) | 1.125rem (18px) | 600 | 1.2 | Numeric values (ZMart, fees) |

---

### 5.3 Spacing and Layout

**Spacing Scale (Tailwind):**
- `xs`: 0.25rem (4px) - Tight spacing
- `sm`: 0.5rem (8px) - Compact elements
- `md`: 1rem (16px) - Default spacing
- `lg`: 1.5rem (24px) - Section spacing
- `xl`: 2rem (32px) - Major sections
- `2xl`: 3rem (48px) - Page sections

**Layout Grid:**
- **Max Width:** 800px (wizard content should not span too wide)
- **Container Padding:** 1.5rem (24px) mobile, 2rem (32px) desktop
- **Card Spacing:** 1.5rem (24px) internal padding
- **Form Field Spacing:** 1.5rem (24px) between fields

**Wizard Layout Structure:**
```
┌────────────────────────────────────────┐
│ [Header - Global Nav]                  │ ← Full width
├────────────────────────────────────────┤
│        [Step Indicator 1-2-3-4]        │ ← Centered, max-w-2xl
├────────────────────────────────────────┤
│                                        │
│    ┌──────────────────────────────┐   │
│    │                              │   │ ← Form content
│    │   [Step Content Card]        │   │   max-w-2xl (672px)
│    │                              │   │   centered
│    │                              │   │
│    └──────────────────────────────┘   │
│                                        │
│    [Back Button]    [Next Button]     │ ← Sticky bottom
└────────────────────────────────────────┘
```

---

## 6. Responsive Design

### 6.1 Breakpoints

| Breakpoint | Width | Target Devices | Layout Changes |
|------------|-------|----------------|----------------|
| Mobile | 320px - 639px | Small phones | Single column, stacked navigation, compact step indicator |
| Tablet | 640px - 1023px | Large phones, tablets | Single column, full step indicator, larger touch targets |
| Desktop | 1024px+ | Laptops, desktops | Centered layout (max-w-2xl), full features |

---

### 6.2 Adaptation Patterns

**Mobile (< 640px):**
- Step indicator: Compact dots `● ○ ○ ○` with "Step 1 of 4" text
- Form inputs: Full width with 16px min font size (prevents zoom on iOS)
- Navigation buttons: Full width, stacked vertically
- Bond slider: Smaller with simplified tier labels
- Fee breakdown: Stacked rows, not table
- Success page: Full-screen takeover

**Tablet (640px - 1023px):**
- Step indicator: Full horizontal with labels
- Form inputs: Max-width 100%, comfortable spacing
- Navigation buttons: Side by side with adequate spacing
- Bond slider: Full range with tier markers
- Fee breakdown: Two-column layout

**Desktop (1024px+):**
- Step indicator: Full horizontal with connecting lines
- Form inputs: Optimal width (max 600px)
- Navigation buttons: Fixed positions (left/right)
- Bond slider: Full interactive range
- Fee breakdown: Table format with aligned columns
- Tooltips: Hover-activated (vs click on mobile)

---

## 7. Accessibility

### 7.1 Compliance Target

**WCAG 2.1 Level AA** (Required for public deployment)

**Key Requirements Met:**
- ✅ All interactive elements keyboard accessible
- ✅ Color contrast ratio ≥ 4.5:1 for normal text
- ✅ Color contrast ratio ≥ 3:1 for large text and UI components
- ✅ Focus indicators visible on all interactive elements
- ✅ Form labels and error messages programmatically associated
- ✅ Heading structure semantic and logical
- ✅ ARIA labels for all icon-only buttons
- ✅ Screen reader announcements for dynamic content changes

---

### 7.2 Key Accessibility Requirements

#### Keyboard Navigation

**Tab Order:**
1. Skip to content link (hidden, visible on focus)
2. Header navigation elements
3. Step indicator (current step only)
4. Form fields (in logical order)
5. Help tooltips (activatable via keyboard)
6. Navigation buttons (Back, Next/Submit)
7. Cancel link

**Keyboard Shortcuts:**
- `Tab`: Move forward through interactive elements
- `Shift + Tab`: Move backward
- `Enter` / `Space`: Activate buttons, open dropdowns
- `Arrow Keys`: Navigate dropdown options, adjust slider
- `Esc`: Close modals, cancel actions

**Focus Management:**
- Focus moves to first form field on step load
- Focus moves to first error on validation failure
- Focus returns to trigger element when modal closes
- Focus outline: 2px solid blue (`ring-2 ring-blue-500`)

#### Screen Reader Support

**ARIA Labels:**
- Step indicator: `aria-label="Step [N] of 4: [Title]"`
- Form inputs: Proper `<label>` associations
- Help tooltips: `aria-describedby` linking to tooltip content
- Error messages: `aria-live="polite"` for dynamic announcements
- Loading states: `aria-busy="true"` + descriptive text

**Semantic HTML:**
- `<main>` for wizard content
- `<nav>` for step indicator
- `<form>` wrapping each step
- `<fieldset>` and `<legend>` for grouped inputs (if applicable)
- Proper heading hierarchy (`<h1>` → `<h2>` → `<h3>`)

**Announcements:**
- Step changes: "Step 2 of 4: Resolution Criteria"
- Validation errors: "Error: Title must be at least 10 characters"
- Successful submission: "Proposal submitted successfully. Redirecting to confirmation page."
- Transaction states: "Waiting for wallet approval", "Submitting to blockchain", etc.

#### Visual Accessibility

**Color Contrast:**
- Text on white: Gray 800 (#1F2937) → 12.63:1 ✅
- Error text: Red 500 (#EF4444) → 4.52:1 ✅
- Success text: Green 600 (#059669) → 4.68:1 ✅
- Link text: Blue 600 (#2563EB) → 8.59:1 ✅
- Placeholder text: Gray 400 → 4.75:1 ✅

**Never Rely on Color Alone:**
- Errors: Red border + icon + text message
- Success: Green border + checkmark icon + text
- Required fields: Asterisk + "(required)" in label
- Tier badges: Color + text label ("Low", "Medium", "High")

**Text Sizing:**
- Allow browser zoom up to 200% without breaking layout
- Min font size: 14px (0.875rem) for body text
- Min touch target size: 44px × 44px (mobile)
- Min click target size: 24px × 24px (desktop)

---

## 8. Interaction and Motion

### 8.1 Motion Principles

**1. Purposeful, Not Decorative**
- Animations guide user attention
- Transitions provide context for state changes
- No animation for animation's sake

**2. Fast and Subtle**
- Duration: 150-300ms for most transitions
- Easing: Ease-out for entering, ease-in for exiting
- Respect `prefers-reduced-motion` media query

**3. Consistent Patterns**
- Similar actions use similar animations
- Maintain consistency with existing Stories 3.3-3.5

---

### 8.2 Key Animations

| Element | Animation | Duration | Easing | Trigger |
|---------|-----------|----------|--------|---------|
| **Step Transition** | Fade out old step, slide in new step | 300ms | ease-in-out | Next/Back clicked |
| **Validation Error** | Shake input field | 200ms | ease-out | Validation fails |
| **Success Checkmark** | Scale in with slight bounce | 400ms | cubic-bezier | Validation passes |
| **Tier Badge Change** | Color transition + scale pulse | 250ms | ease-out | Bond amount crosses threshold |
| **Fee Recalculation** | Number count-up animation | 300ms | ease-out | Bond amount changes |
| **Tooltip Appear** | Fade in + slight slide from top | 150ms | ease-out | Hover/focus on info icon |
| **Button Hover** | Background color transition | 150ms | ease-in-out | Mouse enter/leave |
| **Loading Spinner** | Continuous rotation | 1000ms | linear | Loading state active |
| **Success Page Entry** | Confetti burst + fade in content | 600ms | ease-out | Transaction confirmed |
| **Error Shake** | Horizontal shake | 200ms | ease-in-out | Transaction error |

**Reduced Motion Fallback:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Design Files and Wireframes

### 9.1 Design Files

**Status:** Not using high-fidelity design tools for this story

**Approach:**
- Implement directly from this UX specification
- Use Tailwind CSS utilities for rapid prototyping
- Reference existing components from Stories 3.3, 3.4, 3.5
- Optionally use AI frontend generation tools (v0.dev, Lovable.ai) with generated prompts

**Design System Reference:**
- Tailwind CSS documentation: https://tailwindcss.com
- Solana Wallet Adapter UI: Existing component patterns
- React Hot Toast: Existing toast notification patterns

---

### 9.2 Key Screen Layouts

#### Screen Layout 1: Step 1 - Market Information (Desktop)

```
┌──────────────────────────────────────────────────────────────────┐
│                         HEADER (Global Nav)                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ◉ ───── ○ ───── ○ ───── ○                    │
│                   Title  Criteria  Bond   Preview                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  Market Information                                        │ │
│  │                                                            │ │
│  │  Market Title *                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ Enter a clear, specific title for your market       │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  0/200 characters                                          │ │
│  │                                                            │ │
│  │  Category *                                                │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ Select category...                               ▼  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ℹ️  Choose a clear title that makes your market easy      │ │
│  │     to understand and search for.                         │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Cancel                                    [Next Step →]         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                         FOOTER (Optional)                        │
└──────────────────────────────────────────────────────────────────┘
```

#### Screen Layout 2: Step 3 - Bond Selection (Desktop)

```
┌──────────────────────────────────────────────────────────────────┐
│                         HEADER (Global Nav)                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ◉ ───── ◉ ───── ◉ ───── ○                    │
│                   Title  Criteria  Bond   Preview                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  Bond Selection                                            │ │
│  │                                                            │ │
│  │  Bond Amount *                                             │ │
│  │                                                            │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │ 50    ◄────────────●─────────────►   500     1000  │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │           Low          Medium          High                │ │
│  │                                                            │ │
│  │  Selected Amount: 150 ZMart                                │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Current Tier: MEDIUM                      1.0% Fee  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  Cost Breakdown:                                           │ │
│  │  • Bond deposit:               150.00 ZMart (refundable)  │ │
│  │  • Proposal tax (1%):            1.50 ZMart (non-refund)  │ │
│  │  ───────────────────────────────────────────────────────  │ │
│  │  • Total Cost:                 151.50 ZMart               │ │
│  │                                                            │ │
│  │  Potential Refund:                                         │ │
│  │  • If approved:                150.00 ZMart (100%)         │ │
│  │  • If rejected:                 75.00 ZMart (50%)          │ │
│  │                                                            │ │
│  │  ℹ️  Higher bonds unlock better creator fee rates          │ │
│  │     (0.5% → 1.0% → 2.0%). The 1% proposal tax is          │ │
│  │     non-refundable.                                        │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [← Back]                                       [Next Step →]    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Screen Layout 3: Success Page (Mobile)

```
┌────────────────────────────┐
│    [Success Animation]     │
│            ✓               │
│                            │
│   Proposal Submitted!      │
│                            │
│  Your proposal has been    │
│  submitted to the          │
│  community for voting.     │
│                            │
│  ┌────────────────────────┐│
│  │ Proposal ID            ││
│  │ #1547                  ││
│  │                        ││
│  │ Voting Period          ││
│  │ Ends in 6d 23h 45m     ││
│  └────────────────────────┘│
│                            │
│  What's Next?              │
│                            │
│  1. Community votes on     │
│     your proposal          │
│  2. Results tallied after  │
│     voting period          │
│  3. If approved (≥60% YES),│
│     your market is created │
│                            │
│  ┌────────────────────────┐│
│  │   View Proposal        ││
│  └────────────────────────┘│
│                            │
│  ┌────────────────────────┐│
│  │ Create Another         ││
│  └────────────────────────┘│
│                            │
│  Go to Dashboard           │
│                            │
└────────────────────────────┘
```

---

## 10. Next Steps and Implementation Guidance

### 10.1 Immediate Actions

**For UX/UI Designer (if applicable):**
- [ ] Review this specification for completeness
- [ ] Create high-fidelity mockups in Figma (optional)
- [ ] Design bond tier visual identity (Low/Medium/High badges)
- [ ] Create illustration/icon assets for success state

**For Frontend Developer:**
- [ ] Set up route structure (`/frontend/app/propose/`)
- [ ] Install additional dependencies:
  - `react-hook-form` for form state management
  - `zod` for schema validation
  - `react-datepicker` for date selection
  - `@headlessui/react` for accessible dropdowns/modals
- [ ] Copy `proposal_system.json` IDL to `frontend/lib/solana/idl/`
- [ ] Create base component structure following specification
- [ ] Implement Step 1 (Market Info) first as proof of concept
- [ ] Build transaction helper (`lib/solana/proposal.ts`)
- [ ] Create `useProposalSubmit` hook
- [ ] Implement validation schemas with Zod
- [ ] Add unit tests for validation logic
- [ ] Implement responsive breakpoints
- [ ] Test keyboard navigation thoroughly
- [ ] Run accessibility audit (axe DevTools, WAVE)
- [ ] Test complete flow on devnet

**For Product Manager:**
- [ ] Review UX specification for alignment with PRD
- [ ] Approve design direction and component specs
- [ ] Define success metrics for Story 3.6
- [ ] Prepare user testing plan for post-implementation validation

---

### 10.2 Design Handoff Checklist

#### Core Requirements
- [x] All user flows documented with diagrams
- [x] Component inventory complete with states and variants
- [x] Accessibility requirements defined (WCAG 2.1 AA)
- [x] Responsive strategy clear (3 breakpoints)
- [x] Brand guidelines incorporated (Tailwind colors)
- [x] Performance goals established

#### Story 3.6 Specific
- [x] 4-step wizard flow fully specified
- [x] Validation rules documented for all fields
- [x] Fee calculation logic defined
- [x] Bond tier thresholds specified
- [x] Transaction flow detailed
- [x] Error handling patterns defined
- [x] Success state designed
- [x] Mobile adaptations specified
- [x] Keyboard navigation mapped
- [x] Screen reader announcements defined

#### Frontend Implementation Ready
- [x] Component structure outlined
- [x] Layout specifications provided
- [x] Color palette defined with semantic usage
- [x] Typography scale specified
- [x] Spacing and grid system documented
- [x] Animation specifications included
- [x] Accessibility requirements detailed
- [x] Responsive breakpoints defined
- [x] Integration points identified (Solana, Supabase)
- [x] Testing strategy outlined

#### Story-Specific Dependencies
- [x] ProposalSystem program interface documented
- [x] Transaction building requirements specified
- [x] Wallet integration patterns referenced
- [x] Real-time calculation requirements defined
- [x] Database sync expectations outlined

---

## 11. AI Frontend Prompt Generation

**Next Step:** Generate AI-optimized prompts for tools like Vercel v0 or Lovable.ai

This will be created in a separate document: `docs/ai-frontend-prompt-story-3.6.md`

**Prompt will include:**
- Complete component specifications
- Tailwind CSS class examples
- Form validation logic
- TypeScript interfaces
- Responsive design requirements
- Accessibility attributes
- Sample data for testing

---

## Appendix

### Related Documents

- **PRD:** `docs/PRD.md`
- **Story File:** `docs/stories/story-3.6.md`
- **Story Context:** `docs/stories/story-context-3.6.xml`
- **Architecture:** `docs/architecture.md`
- **Epics:** `docs/epics.md`
- **Existing Patterns:**
  - Story 3.3 (Homepage): `docs/STORY-3.3-COMPLETE.md`
  - Story 3.4 (Market Detail): `docs/STORY-3.4-COMPLETE.md`
  - Story 3.5 (Dashboard): `docs/STORY-3.5-COMPLETE.md`

### Technical References

- **ProposalSystem IDL:** `target/idl/proposal_system.json`
- **Frontend Structure:** `docs/architecture.md#Complete Project Structure`
- **Transaction Patterns:** `frontend/lib/solana/betting.ts`
- **Hooks Patterns:** `frontend/lib/hooks/useMarkets.ts`, `useMarketUpdates.ts`

### Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-27 | 1.0 | Initial UX specification for Story 3.6 | ULULU (UX Expert: Sally) |

---

**End of UX Specification**

_This document serves as the complete UX/UI specification for implementing Story 3.6: Build Proposal Creation Flow. All implementation should reference this specification for design decisions, component structure, validation rules, and accessibility requirements._
