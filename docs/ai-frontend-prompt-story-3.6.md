# AI Frontend Generation Prompts - Story 3.6: Proposal Creation Flow

**Generated:** 2025-10-27
**For:** BMAD-Zmart Proposal Creation Wizard
**Target Tools:** Vercel v0, Lovable.ai, Bolt.new, Claude Artifacts
**Framework:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4

---

## Overview

This document contains **production-ready AI prompts** for generating the complete Proposal Creation Flow (Story 3.6). Each prompt is optimized for AI frontend generation tools and includes all necessary context.

**Related Documents:**
- UX Specification: `docs/ux-spec-story-3.6.md`
- Story Context: `docs/stories/story-context-3.6.xml`
- Story File: `docs/stories/story-3.6.md`

---

## How to Use These Prompts

1. **Copy entire prompt** (each section is a standalone prompt)
2. **Paste into AI tool** (v0.dev, Lovable.ai, etc.)
3. **Review generated code** for accuracy
4. **Integrate into project** following file paths specified
5. **Test thoroughly** (validation, responsive, accessibility)
6. **Iterate if needed** with additional refinement prompts

**⚠️ Important:** AI-generated code requires careful review and testing. Always validate:
- TypeScript type safety
- Form validation logic
- Blockchain transaction building
- Error handling
- Accessibility attributes
- Responsive behavior

---

## Prompt 1: ProposalWizard Container Component

**File:** `frontend/app/propose/components/ProposalWizard.tsx`

**Complexity:** High (Multi-step form orchestration)

**Prompt:**

```
Create a ProposalWizard React component for a Web3 prediction market platform using Next.js 15 App Router, React 19, TypeScript, and Tailwind CSS 4.

REQUIREMENTS:

1. Multi-Step Wizard (4 steps):
   - Step 1: Market Information (title, category)
   - Step 2: Resolution Criteria (criteria, end date)
   - Step 3: Bond Selection (bond amount, tier visualization)
   - Step 4: Preview & Submit (review all data, submit transaction)

2. State Management:
   - Use React Hook Form for form state
   - Maintain wizard state (currentStep, formData)
   - Preserve data when navigating between steps
   - Validate before allowing navigation to next step

3. Component Structure:
   'use client'

   import { useState } from 'react'
   import { useForm, FormProvider } from 'react-hook-form'
   import { zodResolver } from '@hookform/resolvers/zod'
   import { StepIndicator } from './StepIndicator'
   import { Step1MarketInfo } from './Step1MarketInfo'
   import { Step2Resolution } from './Step2Resolution'
   import { Step3BondSelection } from './Step3BondSelection'
   import { Step4Preview } from './Step4Preview'
   import { proposalSchema } from '@/lib/validation/proposalSchema'

   // TypeScript Interface
   interface ProposalFormData {
     title: string // 10-200 characters
     category: string // Politics, Sports, Crypto, Entertainment, Science, Other
     resolutionCriteria: string // Textarea, markdown support
     evidenceLinks: string[] // Optional URLs, max 3
     endDate: Date // Must be future date, max 2 years from now
     bondAmount: number // Minimum 50 ZMart
   }

4. Validation Schema (Zod):
   - title: min(10).max(200).required()
   - category: enum(['Politics', 'Sports', 'Crypto', 'Entertainment', 'Science', 'Other']).required()
   - resolutionCriteria: min(10).max(1000).required()
   - evidenceLinks: array of URLs, optional, max 3 items
   - endDate: refine to be future date, max 2 years from today
   - bondAmount: min(50).max(10000).required()

5. Navigation Logic:
   - currentStep state (1-4)
   - "Next" button: validates current step, then increments currentStep
   - "Back" button: decrements currentStep (disabled on step 1)
   - "Cancel" link: shows confirmation modal if form has data
   - Step indicator allows clicking completed steps to jump back

6. Layout:
   - Max width: 672px (max-w-2xl)
   - Centered on page
   - Card with white background, shadow
   - 24px padding (p-6)
   - Step indicator at top
   - Form content in middle
   - Navigation buttons at bottom (sticky on mobile)

7. Styling (Tailwind CSS 4):
   - Primary color: blue-500 (#3B82F6)
   - Success: green-500 (#10B981)
   - Error: red-500 (#EF4444)
   - Text: gray-800 (#1F2937)
   - Background: gray-100 (#F3F4F6)
   - Card: white with shadow-lg

8. Accessibility:
   - Proper heading hierarchy (h1 > h2 > h3)
   - ARIA labels for all buttons
   - Focus management (focus first field on step load)
   - Keyboard navigation support
   - Screen reader announcements for step changes

9. Responsive Design:
   - Mobile (< 640px): Full width, stacked buttons
   - Tablet (640px - 1023px): Comfortable spacing
   - Desktop (1024px+): Max width 672px, centered

10. Error Handling:
    - Inline validation errors below fields
    - Prevent navigation if validation fails
    - Show error summary if multiple errors
    - Toast notifications for system errors

DELIVERABLES:
- Complete ProposalWizard.tsx component
- Proper TypeScript types
- Zod validation schema
- Tailwind CSS classes
- Comments explaining key logic
- Accessibility attributes (ARIA)
```

---

## Prompt 2: Step Indicator Component

**File:** `frontend/app/propose/components/StepIndicator.tsx`

**Complexity:** Medium

**Prompt:**

```
Create a StepIndicator React component for a multi-step wizard using Next.js 15, TypeScript, and Tailwind CSS 4.

REQUIREMENTS:

1. Props Interface:
   interface StepIndicatorProps {
     currentStep: number // 1-4
     totalSteps: number // 4
     completedSteps: number[] // Array of completed step numbers
     onStepClick?: (step: number) => void // Optional callback for clicking completed steps
   }

2. Visual States:
   - Incomplete step: Gray circle with step number
   - Current step: Blue circle with step number, bold text
   - Completed step: Green circle with checkmark icon, clickable
   - Connecting lines: Gray (incomplete), Blue (current), Green (completed)

3. Step Labels:
   - Step 1: "Market Info"
   - Step 2: "Resolution"
   - Step 3: "Bond"
   - Step 4: "Preview"

4. Layout:
   Desktop (≥640px):
   [1] ━━━ [2] ━━━ [3] ━━━ [4]
   Info  Resolution Bond  Preview

   Mobile (<640px):
   ● ○ ○ ○
   Step 1 of 4: Market Info

5. Interaction:
   - Completed steps are clickable (allow jumping back)
   - Current and future steps are not clickable
   - Hover effect on clickable steps
   - Visual feedback on click

6. Styling (Tailwind):
   - Circle size: 40px (w-10 h-10)
   - Font: Inter, system-ui
   - Connecting line: 2px height, flex-grow
   - Spacing: gap-2 between elements

7. Accessibility:
   - role="progressbar"
   - aria-valuenow={currentStep}
   - aria-valuemin={1}
   - aria-valuemax={totalSteps}
   - aria-label="Step {currentStep} of {totalSteps}: {stepLabel}"
   - Announce step changes to screen readers

8. Responsive:
   - Desktop: Show full labels
   - Mobile: Show "Step N of M" text only

DELIVERABLES:
- Complete StepIndicator.tsx component
- TypeScript interfaces
- Tailwind CSS styling
- Accessibility attributes
- Responsive breakpoints
```

---

## Prompt 3: Step 1 - Market Information Component

**File:** `frontend/app/propose/components/Step1MarketInfo.tsx`

**Complexity:** Low

**Prompt:**

```
Create a Step1MarketInfo React component for a Web3 proposal form using Next.js 15, React Hook Form, TypeScript, and Tailwind CSS 4.

REQUIREMENTS:

1. Form Fields:

   A. Market Title (Text Input):
      - Label: "Market Title *"
      - Placeholder: "Enter a clear, specific title for your market"
      - Validation: 10-200 characters, required
      - Real-time character counter: "N/200 characters"
      - Help text: "Choose a clear title that makes your market easy to understand"

   B. Category (Dropdown/Select):
      - Label: "Category *"
      - Options: Politics, Sports, Crypto, Entertainment, Science, Other
      - Placeholder: "Select category..."
      - Help text: "Help users discover your market by category"

2. Component Structure:
   'use client'

   import { useFormContext } from 'react-hook-form'
   import { ProposalFormData } from './ProposalWizard'

   export function Step1MarketInfo() {
     const { register, formState: { errors }, watch } = useFormContext<ProposalFormData>()
     const title = watch('title')

     return (...)
   }

3. Validation Display:
   - Show character counter in real-time
   - Red if <10 or >200, green if valid (10-200)
   - Error message below field if validation fails
   - Red border on invalid field
   - Green border + checkmark on valid field

4. Styling:
   - Input fields: Full width, 16px min font size (prevents iOS zoom)
   - Padding: 12px (p-3)
   - Border: 1px gray-300, rounded-md
   - Focus: ring-2 ring-blue-500
   - Error state: border-red-500, text-red-500
   - Success state: border-green-500, text-green-500

5. Layout:
   - Stack fields vertically
   - 24px spacing between fields (space-y-6)
   - Labels above inputs
   - Help text below inputs (gray-500, text-sm)
   - Error messages below inputs (red-500, text-sm)

6. Accessibility:
   - Proper <label> for each input
   - aria-describedby linking to help text
   - aria-invalid on validation errors
   - aria-live="polite" for character counter
   - Focus management (focus title on mount)

7. Example Error Messages:
   - Title too short: "Title must be at least 10 characters"
   - Title too long: "Title cannot exceed 200 characters (currently: {length})"
   - Category not selected: "Please select a category"

8. Responsive:
   - Mobile: Full width inputs, 44px min touch targets
   - Desktop: Max width 600px inputs

DELIVERABLES:
- Complete Step1MarketInfo.tsx component
- React Hook Form integration
- Validation error display
- Character counter
- Accessibility attributes
- Tailwind CSS styling
```

---

## Prompt 4: Step 3 - Bond Selection Component (Most Complex)

**File:** `frontend/app/propose/components/Step3BondSelection.tsx`

**Complexity:** Very High (Real-time calculations, tier visualization)

**Prompt:**

```
Create a Step3BondSelection React component with bond slider, tier visualization, and real-time fee calculations for a Web3 prediction market platform. Use Next.js 15, React Hook Form, TypeScript, Tailwind CSS 4.

REQUIREMENTS:

1. Bond Selection Slider:
   - Range: 50 - 1000 ZMart
   - Logarithmic scale preferred for better UX
   - Visual tier markers at 100 and 500 ZMart
   - Large touch target for mobile (44px minimum)
   - Smooth dragging animation

2. Tier System:
   - LOW: 50-99 ZMart → 0.5% creator fee (Green badge)
   - MEDIUM: 100-499 ZMart → 1.0% creator fee (Blue badge)
   - HIGH: 500-1000 ZMart → 2.0% creator fee (Purple badge)

3. Real-Time Calculations:

   const calculateFees = (bondAmount: number) => {
     // Determine tier
     let tier: 'LOW' | 'MEDIUM' | 'HIGH'
     let creatorFeePercent: number

     if (bondAmount < 100) {
       tier = 'LOW'
       creatorFeePercent = 0.5
     } else if (bondAmount < 500) {
       tier = 'MEDIUM'
       creatorFeePercent = 1.0
     } else {
       tier = 'HIGH'
       creatorFeePercent = 2.0
     }

     // Calculate fees
     const proposalTax = bondAmount * 0.01 // 1% non-refundable
     const totalCost = bondAmount + proposalTax
     const refundIfApproved = bondAmount // 100%
     const refundIfRejected = bondAmount * 0.5 // 50%

     return {
       tier,
       creatorFeePercent,
       proposalTax,
       totalCost,
       refundIfApproved,
       refundIfRejected
     }
   }

4. Component Layout:

   ┌─────────────────────────────────────────────┐
   │ Bond Amount *                               │
   │                                             │
   │ ◄────────●─────────► Slider                │
   │ 50      100     500         1000            │
   │                                             │
   │ Selected: 150 ZMart                         │
   │                                             │
   │ ┌─────────────────────────────────────────┐ │
   │ │  Tier: MEDIUM Badge           1.0% Fee  │ │
   │ └─────────────────────────────────────────┘ │
   │                                             │
   │ Fee Breakdown:                              │
   │ • Bond deposit:     150.00 ZMart           │
   │ • Proposal tax:       1.50 ZMart (1%)     │
   │ • Total cost:       151.50 ZMart           │
   │                                             │
   │ Potential Refund:                           │
   │ • If approved:      150.00 ZMart (100%)    │
   │ • If rejected:       75.00 ZMart (50%)     │
   │                                             │
   │ ℹ️  Higher bonds unlock better creator      │
   │    fee rates. The 1% proposal tax is        │
   │    non-refundable.                          │
   └─────────────────────────────────────────────┘

5. Tier Badge Component:
   - Dynamic color based on tier
   - Smooth color transition when crossing thresholds
   - Scale animation (slight pulse) on tier change
   - Format: "TIER_NAME (FEE%)"

6. Number Formatting:
   - All amounts: 2 decimal places
   - Currency suffix: " ZMart"
   - Monospace font for numbers
   - Count-up animation when bond changes (300ms)

7. Styling (Tailwind):
   - Slider track: h-2 bg-gray-200 rounded-full
   - Slider thumb: w-6 h-6 bg-blue-500 rounded-full, shadow-lg
   - Slider markers: absolute positioned lines at tier thresholds
   - Tier badge: px-4 py-2 rounded-full font-semibold
     - LOW: bg-green-100 text-green-800
     - MEDIUM: bg-blue-100 text-blue-800
     - HIGH: bg-purple-100 text-purple-800
   - Fee breakdown: space-y-2, text-sm
   - Monospace amounts: font-mono font-semibold

8. Accessibility:
   - <input type="range"> with proper labels
   - aria-valuemin={50}
   - aria-valuemax={1000}
   - aria-valuenow={bondAmount}
   - aria-label="Bond amount in ZMart"
   - Keyboard support: Arrow keys to adjust amount
   - Screen reader announces: "Bond amount: 150 ZMart, Medium tier, 1% creator fee"

9. Tooltip (Info Icon):
   - Position: Bottom of component
   - Trigger: Click on ℹ️ icon (mobile), Hover (desktop)
   - Content: "Your bond is held in escrow during voting. If approved, you get 100% back plus the right to earn creator fees. If rejected, you get 50% back. If you cancel, you forfeit the bond."
   - Accessible: aria-describedby

10. Responsive:
    - Mobile: Slider thumb larger (48px for easy dragging)
    - Desktop: Hover effects on slider
    - All sizes: Touch-friendly spacing

11. Animations:
    - Tier change: 250ms ease-out color transition + scale pulse
    - Fee recalculation: 300ms count-up animation
    - Slider drag: Smooth, no lag

DELIVERABLES:
- Complete Step3BondSelection.tsx component
- Tier badge sub-component
- Fee calculation logic with TypeScript types
- Real-time updates on slider change
- Smooth animations
- Accessibility attributes
- Responsive design
- Tooltip component
```

---

## Prompt 5: Step 4 - Preview Component

**File:** `frontend/app/propose/components/Step4Preview.tsx`

**Complexity:** Medium

**Prompt:**

```
Create a Step4Preview React component showing a read-only summary of all proposal data before blockchain submission. Use Next.js 15, React Hook Form, TypeScript, Tailwind CSS 4.

REQUIREMENTS:

1. Component Structure:
   'use client'

   import { useFormContext } from 'react-hook-form'
   import { ProposalFormData } from './ProposalWizard'
   import { FeeBreakdown } from './FeeBreakdown'

   interface Step4PreviewProps {
     onEdit: (step: number) => void // Callback to jump to specific step
   }

2. Display Sections:

   A. Market Information Card:
      - Title (display value)
      - Category (display value)
      - [Edit] link (jumps to Step 1)

   B. Resolution Criteria Card:
      - Resolution criteria (truncate if >200 chars with "Read more")
      - Evidence links (if provided)
      - End date (formatted: "December 31, 2025")
      - [Edit] link (jumps to Step 2)

   C. Bond & Fees Card:
      - Bond Amount: XXX.XX ZMart
      - Tier: TIER_NAME (FEE%)
      - Proposal Tax: XXX.XX ZMart (1%, non-refundable)
      - ──────────────────────────
      - Total Cost: XXX.XX ZMart (bold, larger text)
      -
      - Refund if approved: XXX.XX ZMart (100%)
      - Refund if rejected: XXX.XX ZMart (50%)
      - [Edit] link (jumps to Step 3)

3. Card Styling:
   - Border: 2px solid gray-200
   - Background: white
   - Padding: 20px (p-5)
   - Rounded: rounded-lg
   - Spacing: space-y-4 between cards
   - Shadow: shadow-sm

4. Edit Links:
   - Position: Top right of each card
   - Style: text-blue-500 hover:text-blue-700 text-sm
   - Icon: Pencil icon from lucide-react
   - Accessible: aria-label="Edit {section name}"

5. Warning Banner:
   - Position: Below all cards, before buttons
   - Icon: ⚠️ Warning triangle
   - Text: "Once submitted, you cannot edit this proposal. Please review carefully."
   - Style: bg-amber-50 border-l-4 border-amber-400 p-4 text-amber-800

6. Fee Breakdown Component:
   - Reusable component showing fees in table format
   - Columns: Description | Amount
   - Rows:
     - Bond deposit | XXX.XX ZMart (refundable)
     - Proposal tax | XXX.XX ZMart (1%, non-refundable)
     - Total cost | XXX.XX ZMart (bold)
   - Monospace font for amounts
   - Align amounts right

7. Data Formatting:
   - Dates: format(date, 'MMMM d, yyyy') using date-fns
   - Amounts: toFixed(2) + ' ZMart'
   - Tier badge: Same as Step 3 (color-coded)

8. Layout:
   - All cards full width
   - 24px spacing between cards
   - Warning banner 16px margin top
   - Centered content, max-w-2xl

9. Accessibility:
   - Proper heading hierarchy (h3 for card titles)
   - aria-label on edit links
   - Clear focus indicators
   - Keyboard navigation support

10. Responsive:
    - Mobile: Cards full width, stacked
    - Desktop: Same layout, comfortable padding

DELIVERABLES:
- Complete Step4Preview.tsx component
- FeeBreakdown reusable component
- Edit callback integration
- Data formatting utilities
- Accessibility attributes
- Tailwind CSS styling
```

---

## Prompt 6: Success Page Component

**File:** `frontend/app/propose/components/SuccessPage.tsx`

**Complexity:** Low-Medium

**Prompt:**

```
Create a SuccessPage React component shown after successful proposal submission to Solana blockchain. Use Next.js 15, TypeScript, Tailwind CSS 4.

REQUIREMENTS:

1. Props Interface:
   interface SuccessPageProps {
     proposalId: number // From blockchain transaction
     votingEndsAt: Date // Calculated end date
     txSignature?: string // Optional transaction hash
   }

2. Layout Structure:

   ┌────────────────────────────┐
   │   [Success Animation]      │
   │         ✓ Checkmark        │
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

3. Success Animation:
   - Checkmark icon: Large (w-20 h-20), green-500
   - Animation: Scale in with slight bounce (400ms cubic-bezier)
   - Optional: Confetti burst using react-confetti (lightweight)

4. Countdown Timer:
   - Live countdown to votingEndsAt date
   - Format: "Xd Xh Xm" (days, hours, minutes)
   - Updates every minute
   - Use useEffect + setInterval
   - Example: "6d 23h 45m" or "23h 45m" or "45m"

5. Info Card Styling:
   - Border: 2px solid green-200
   - Background: green-50
   - Padding: 16px (p-4)
   - Rounded: rounded-lg
   - Text: center-aligned
   - Proposal ID: text-2xl font-bold
   - Countdown: text-xl font-semibold monospace

6. Action Buttons:

   A. "View Proposal" (Primary):
      - Navigate to /proposals/{proposalId} (future Story 3.8)
      - Style: bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold
      - Full width on mobile, auto width on desktop

   B. "Create Another" (Secondary):
      - Navigate to /propose (reset wizard)
      - Style: bg-white border-2 border-blue-500 text-blue-500 px-6 py-3 rounded-lg font-semibold
      - Full width on mobile, auto width on desktop

   C. "Go to Dashboard" (Tertiary):
      - Navigate to /dashboard
      - Style: text-blue-500 hover:underline text-sm
      - Text link, no button styling

7. Next Steps Section:
   - Numbered list (1, 2, 3)
   - Clear, concise explanations
   - Help user understand what happens next
   - Emphasize ≥60% approval threshold

8. Optional Transaction Link:
   - If txSignature provided, show link to Solana Explorer
   - Format: "View on Solana Explorer →"
   - Open in new tab: target="_blank" rel="noopener noreferrer"
   - URL: https://explorer.solana.com/tx/{txSignature}?cluster=devnet

9. Accessibility:
   - h1: "Proposal Submitted!"
   - aria-live="polite" on success message
   - Proper button labels
   - Focus on primary "View Proposal" button on mount

10. Responsive:
    - Mobile: Full width content, stacked buttons
    - Desktop: Centered content (max-w-md), side-by-side buttons

11. Animations:
    - Success icon: Scale + bounce entrance
    - Page content: Fade in (300ms)
    - Confetti: Optional burst on load (3 seconds duration)

DELIVERABLES:
- Complete SuccessPage.tsx component
- Countdown timer logic
- Success animation
- Navigation button handlers
- Accessibility attributes
- Tailwind CSS styling
- TypeScript interfaces
```

---

## Prompt 7: Form Validation Schema (Zod)

**File:** `frontend/lib/validation/proposalSchema.ts`

**Complexity:** Medium

**Prompt:**

```
Create a Zod validation schema for the proposal creation form with custom error messages and refinements. TypeScript.

REQUIREMENTS:

1. Schema Structure:

   import { z } from 'zod'

   export const proposalSchema = z.object({
     title: z.string()
       .min(10, 'Title must be at least 10 characters')
       .max(200, 'Title cannot exceed 200 characters')
       .regex(/^[a-zA-Z0-9\s\-\?\!\.\,]+$/, 'Title contains invalid characters'),

     category: z.enum([
       'Politics',
       'Sports',
       'Crypto',
       'Entertainment',
       'Science',
       'Other'
     ], { errorMap: () => ({ message: 'Please select a category' }) }),

     resolutionCriteria: z.string()
       .min(10, 'Resolution criteria must be at least 10 characters')
       .max(1000, 'Resolution criteria cannot exceed 1000 characters'),

     evidenceLinks: z.array(z.string().url('Must be a valid URL')).max(3, 'Maximum 3 evidence links').optional(),

     endDate: z.date()
       .refine((date) => date > new Date(), {
         message: 'End date must be in the future'
       })
       .refine((date) => {
         const twoYearsFromNow = new Date()
         twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2)
         return date <= twoYearsFromNow
       }, {
         message: 'End date cannot be more than 2 years from now'
       }),

     bondAmount: z.number()
       .min(50, 'Minimum bond amount is 50 ZMart')
       .max(10000, 'Maximum bond amount is 10,000 ZMart')
   })

   export type ProposalFormData = z.infer<typeof proposalSchema>

2. Additional Validators:

   // Helper: Check if criteria is too vague
   export const isCriteriaTooVague = (criteria: string): boolean => {
     return criteria.length < 50
   }

   // Helper: Get character count
   export const getCharCount = (text: string): number => {
     return text.length
   }

   // Helper: Format validation error for display
   export const formatValidationError = (error: z.ZodError): Record<string, string> => {
     const formatted: Record<string, string> = {}
     error.errors.forEach((err) => {
       const path = err.path.join('.')
       formatted[path] = err.message
     })
     return formatted
   }

3. Custom Error Messages:
   - Clear, user-friendly language
   - Specific guidance on how to fix
   - Include current value in error when relevant

4. Type Exports:
   - ProposalFormData: Main form type
   - CategoryOption: Union type for categories
   - ValidationError: Error message type

DELIVERABLES:
- Complete proposalSchema.ts file
- Zod schema with all validations
- TypeScript type definitions
- Helper validation functions
- Custom error messages
```

---

## Prompt 8: Solana Transaction Hook

**File:** `frontend/lib/hooks/useProposalSubmit.ts`

**Complexity:** Very High (Blockchain integration)

**Prompt:**

```
Create a useProposalSubmit React hook for building and submitting ProposalSystem transactions to Solana blockchain. Use Next.js 15, TypeScript, Anchor framework, Solana web3.js.

REQUIREMENTS:

1. Hook Interface:

   import { useConnection, useWallet } from '@solana/wallet-adapter-react'
   import { Program, AnchorProvider, BN } from '@project-serum/anchor'
   import { PublicKey, Transaction } from '@solana/web3.js'
   import { ProposalFormData } from '../validation/proposalSchema'

   interface UseProposalSubmitResult {
     submitProposal: (data: ProposalFormData) => Promise<SubmitResult>
     isSubmitting: boolean
     error: string | null
     reset: () => void
   }

   interface SubmitResult {
     success: boolean
     proposalId?: number
     txSignature?: string
     error?: string
   }

2. Core Functionality:

   export function useProposalSubmit(): UseProposalSubmitResult {
     const { connection } = useConnection()
     const { publicKey, signTransaction } = useWallet()
     const [isSubmitting, setIsSubmitting] = useState(false)
     const [error, setError] = useState<string | null>(null)

     const submitProposal = async (data: ProposalFormData): Promise<SubmitResult> => {
       try {
         setIsSubmitting(true)
         setError(null)

         // 1. Validate wallet connected
         if (!publicKey || !signTransaction) {
           throw new Error('Wallet not connected')
         }

         // 2. Create Anchor provider
         const provider = new AnchorProvider(connection, { publicKey, signTransaction }, {})

         // 3. Load ProposalSystem program
         const programId = new PublicKey('5XH5i8dypiB4Wwa7TkmU6dnk9SyUGqE92GiQMHypPekL')
         const idl = await Program.fetchIdl(programId, provider)
         const program = new Program(idl, programId, provider)

         // 4. Get next proposal ID (query on-chain or from database)
         const proposalId = await getNextProposalId(program)

         // 5. Derive PDA for proposal account
         const [proposalPDA] = await PublicKey.findProgramAddress(
           [Buffer.from('proposal'), new BN(proposalId).toArrayLike(Buffer, 'le', 8)],
           programId
         )

         // 6. Get global parameters PDA
         const [globalParamsPDA] = await PublicKey.findProgramAddress(
           [Buffer.from('global_params')],
           new PublicKey('2SaE3YvdsoNJZQxYPqLR9r59k2FDAGv7J1qCvzzQWLvW') // ParameterStorage
         )

         // 7. Get bond escrow PDA
         const [bondEscrowPDA] = await PublicKey.findProgramAddress(
           [Buffer.from('bond_escrow'), proposalPDA.toBuffer()],
           new PublicKey('DM1jJCkZZEwY5tmWbgvKRxsDFzXCdbfrYCCH1CiwWks1') // BondManager
         )

         // 8. Calculate amounts (convert to lamports)
         const bondAmountLamports = new BN(data.bondAmount * 1e9) // ZMart = SOL for MVP
         const endTimestamp = new BN(Math.floor(data.endDate.getTime() / 1000))

         // 9. Build transaction
         const tx = await program.methods
           .createProposal(
             new BN(proposalId),
             data.title,
             data.resolutionCriteria,
             bondAmountLamports,
             endTimestamp
           )
           .accounts({
             proposal: proposalPDA,
             globalParameters: globalParamsPDA,
             creator: publicKey,
             bondEscrow: bondEscrowPDA,
             bondManagerProgram: new PublicKey('DM1jJCkZZEwY5tmWbgvKRxsDFzXCdbfrYCCH1CiwWks1'),
             systemProgram: SystemProgram.programId
           })
           .transaction()

         // 10. Set recent blockhash
         tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
         tx.feePayer = publicKey

         // 11. Sign transaction
         const signedTx = await signTransaction(tx)

         // 12. Submit to Solana
         const txSignature = await connection.sendRawTransaction(signedTx.serialize())

         // 13. Confirm transaction
         await connection.confirmTransaction(txSignature, 'confirmed')

         // 14. Return success
         return {
           success: true,
           proposalId,
           txSignature
         }

       } catch (err: any) {
         const errorMessage = err.message || 'Transaction failed'
         setError(errorMessage)
         return {
           success: false,
           error: errorMessage
         }
       } finally {
         setIsSubmitting(false)
       }
     }

     const reset = () => {
       setError(null)
       setIsSubmitting(false)
     }

     return { submitProposal, isSubmitting, error, reset }
   }

3. Helper Functions:

   // Get next proposal ID from on-chain or database
   async function getNextProposalId(program: Program): Promise<number> {
     // Query existing proposals or maintain counter
     // For MVP, could use Date.now() or query Supabase
     return Date.now()
   }

4. Error Handling:
   - Wallet not connected: Clear error message
   - Insufficient funds: Show balance vs required amount
   - Network errors: Suggest retry with exponential backoff
   - Transaction timeout: Show status check option
   - User rejection: Clear cancellation message

5. Loading States:
   - isSubmitting: true during transaction
   - Show progress: "Preparing..." → "Signing..." → "Submitting..." → "Confirming..."

6. TypeScript Types:
   - All parameters properly typed
   - Anchor program types from IDL
   - Solana web3.js types

DELIVERABLES:
- Complete useProposalSubmit.ts hook
- Transaction building logic
- PDA derivation
- Error handling
- Loading states
- TypeScript types
- Comments explaining each step
```

---

## Sample Data for Testing

Use this sample data when testing generated components:

```typescript
// Sample Proposal Form Data
export const sampleProposalData: ProposalFormData = {
  title: "Will Bitcoin reach $100,000 by December 31, 2025?",
  category: "Crypto",
  resolutionCriteria: "This market resolves YES if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange (Coinbase, Binance, Kraken) at any point before December 31, 2025 23:59:59 UTC. Resolved NO otherwise. Price must be sustained for at least 60 seconds.",
  evidenceLinks: [
    "https://www.coinbase.com/price/bitcoin",
    "https://www.coingecko.com/en/coins/bitcoin"
  ],
  endDate: new Date('2025-12-31T23:59:59Z'),
  bondAmount: 150
}

// Sample Calculation Results
export const sampleFees = {
  bondAmount: 150,
  tier: 'MEDIUM' as const,
  creatorFeePercent: 1.0,
  proposalTax: 1.50, // 1% of 150
  totalCost: 151.50,
  refundIfApproved: 150.00,
  refundIfRejected: 75.00
}

// Sample Success Data
export const sampleSuccess = {
  proposalId: 1547,
  votingEndsAt: new Date('2025-11-03T23:59:59Z'),
  txSignature: 'mock-tx-signature-1234567890'
}
```

---

## Integration Checklist

After generating components with AI tools, complete these integration steps:

### 1. Dependencies Installation
```bash
cd frontend
npm install react-hook-form @hookform/resolvers zod date-fns
npm install @headlessui/react @heroicons/react
npm install react-datepicker @types/react-datepicker
```

### 2. File Structure Setup
```
frontend/
├── app/
│   └── propose/
│       ├── page.tsx (Server component wrapper)
│       ├── success/
│       │   └── page.tsx (Success route)
│       └── components/
│           ├── ProposalWizard.tsx
│           ├── StepIndicator.tsx
│           ├── Step1MarketInfo.tsx
│           ├── Step2Resolution.tsx
│           ├── Step3BondSelection.tsx
│           ├── Step4Preview.tsx
│           ├── SuccessPage.tsx
│           ├── FeeBreakdown.tsx
│           └── BondTierBadge.tsx
│
├── lib/
│   ├── validation/
│   │   └── proposalSchema.ts
│   ├── hooks/
│   │   └── useProposalSubmit.ts
│   └── solana/
│       ├── proposal.ts (Transaction builder)
│       └── idl/
│           └── proposal_system.json (Copy from target/idl/)
```

### 3. Copy ProposalSystem IDL
```bash
cp target/idl/proposal_system.json frontend/lib/solana/idl/
```

### 4. Update Global Navigation
Add "Create Proposal" link to `frontend/app/components/Header.tsx`:
```tsx
<Link href="/propose" className="...">
  Create Proposal
</Link>
```

### 5. Testing Checklist
- [ ] All form fields validate correctly
- [ ] Bond slider calculates fees accurately
- [ ] Tier badges change at correct thresholds
- [ ] Step navigation works (Next/Back/Edit)
- [ ] Wallet connection required
- [ ] Transaction builds correctly
- [ ] Success page displays proposal ID
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] Keyboard navigation functional
- [ ] Screen reader compatible
- [ ] Error states display properly
- [ ] Loading states show during submission

### 6. Accessibility Audit
Run these tools after implementation:
- axe DevTools (Chrome extension)
- WAVE (Web Accessibility Evaluation Tool)
- Lighthouse (Chrome DevTools)
- Manual keyboard navigation test
- Screen reader test (NVDA or VoiceOver)

### 7. Browser Testing
Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Mobile Chrome (Android)

---

## Refinement Prompts

If generated code needs adjustments, use these follow-up prompts:

**For Styling Adjustments:**
```
Update the [component name] to use these specific Tailwind classes:
- Primary button: bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors
- Input fields: border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500
- Error state: border-red-500 focus:ring-red-500
```

**For TypeScript Errors:**
```
Fix TypeScript errors in [component name]:
- Ensure all props are properly typed
- Add proper return types to functions
- Use strict null checks
- Import types from correct locations
```

**For Accessibility Issues:**
```
Improve accessibility for [component name]:
- Add proper ARIA labels to all interactive elements
- Ensure keyboard navigation works (Tab, Enter, Escape)
- Add aria-live regions for dynamic content
- Improve color contrast to meet WCAG 2.1 AA
```

**For Responsive Design:**
```
Make [component name] fully responsive:
- Mobile (<640px): Full width, stacked layout
- Tablet (640-1023px): Comfortable spacing
- Desktop (1024px+): Max width 672px, centered
- Ensure touch targets are 44px minimum on mobile
```

---

## Additional Resources

**Tailwind CSS Documentation:**
- https://tailwindcss.com/docs

**React Hook Form:**
- https://react-hook-form.com/

**Zod Validation:**
- https://zod.dev/

**Solana Web3.js:**
- https://solana-labs.github.io/solana-web3.js/

**Anchor Framework:**
- https://www.anchor-lang.com/

**Accessibility Guidelines:**
- https://www.w3.org/WAI/WCAG21/quickref/

---

## Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-27 | 1.0 | Initial AI prompts for Story 3.6 | ULULU (UX Expert: Sally) |

---

**End of AI Frontend Prompts Document**

_These prompts are optimized for AI frontend generation tools. Copy the entire prompt for each component, paste into your AI tool of choice, review the generated code carefully, and integrate following the checklist above._
