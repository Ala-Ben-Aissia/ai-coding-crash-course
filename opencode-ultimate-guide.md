# The Ultimate OpenCode Free Models Guide for Senior Web Engineers

> Ship top-tier web apps using only free OpenCode models. Stack: TypeScript, Next.js v16+, Remix v3, React Router v8.

---

## Table of Contents

1. [Model Roster & Selection Logic](#1-model-roster--selection-logic)
2. [The Context Engineering Mindset](#2-the-context-engineering-mindset)
3. [Daily Workflow Patterns](#3-daily-workflow-patterns)
4. [Framework-Specific Playbooks](#4-framework-specific-playbooks)
5. [Progressive Enhancement Protocol](#5-progressive-enhancement-protocol)
6. [Tooling & Automation](#6-tooling--automation)
7. [Monorepo Strategies](#7-monorepo-strategies)
8. [Anti-Patterns & Failure Modes](#8-anti-patterns--failure-modes)
9. [Measuring Effectiveness](#9-measuring-effectiveness)
10. [Quick Reference Card](#10-quick-reference-card)

---

## 1. Model Roster & Selection Logic

### The Full Roster

| Model | ID | Variants | Release | Role |
|-------|----|----------|---------|------|
| **LongCat 2.5 Preview Free** | `opencode/longcat-2.5-preview-free` | — | Jul 2026 | Deep reasoning, architecture, complex debugging |
| **Space Bunny Free** | `opencode/space-bunny-free` | low, medium, high, xhigh, max | Jul 2026 | Scalable workhorse — the "dial" you turn |
| **MiMo-V2.6-Flash Free** | `opencode/mimo-v2.6-flash-free` | — | Jul 2026 | Fast edits, small refactors, interactive sessions |
| **Muse Spark 1.3 Free** | `opencode/muse-spark-1.3-contributor-free` | minimal, low, medium, high, xhigh | Jul 2026 | Open-source-aware, good for UI/components |
| **Ling 3.0 Flash Fin Free** | `opencode/ling-3.0-flash-fin-free` | — | Jun 2026 | Lightweight tasks, speed-critical operations |
| **Nemotron 3.5 Lightning Free** | `opencode/nemotron-3.5-lightning-free` | — | Jun 2026 | Boilerplate, fast inference, reasoning |
| **Big Pickle** | `opencode/big-pickle` | — | Oct 2025 | Legacy fallback — use only if others hit limits |

### Selection Decision Tree

```
START: What is the task?
│
├─ Architecture / System Design / RFC Review
│  └─→ LongCat 2.5 Preview (deep reasoning, trade-off analysis)
│
├─ Complex Multi-File Refactor / Migration
│  └─→ Space Bunny max (highest compute, broad context)
│
├─ Feature Implementation (Server Action + UI + Types)
│  ├─ Server logic → Space Bunny high
│  ├─ UI components → Muse Spark high
│  └─ Type definitions → MiMo Flash
│
├─ Debugging (Hydration, Type Errors, RSC Boundaries)
│  ├─ Type errors → Space Bunny high
│  ├─ Hydration → Nemotron 3.5 Lightning (fast reasoning)
│  └─ RSC boundary → LongCat 2.5 (deep understanding)
│
├─ Quick Edits / Config / Docs / Boilerplate
│  └─→ MiMo Flash / Ling Flash / Space Bunny low
│
└─ Everything else (daily coding)
   └─→ Space Bunny medium (default) → escalate if stuck
```

### The Golden Rule

> **Match compute to complexity. Never use max-tier for boilerplate. Never use flash-tier for architecture.**

---

## 2. The Context Engineering Mindset

### Core Principle

```
┌─────────────────────────────────────────────────────────────┐
│  YOU curate the RIGHT 5–15 files for the task              │
│  The MODEL executes with precision                          │
│                                                             │
│  5 minutes of context curation = 30 minutes saved          │
│  from fixing hallucinations and wrong assumptions          │
└─────────────────────────────────────────────────────────────┘
```

Free models have ~32k–128k context windows. Your `apps/web` alone is 200k+ tokens. The model doesn't know your architecture — **you do**. Invest 5 minutes curating files to save 30 minutes fixing hallucinations.

### File Selection Checklist

**Always include:**
- [ ] Entry point (`page.tsx`, `route.tsx`, `action.ts`, `loader.ts`)
- [ ] Type definitions (`shared/types/`, Zod schemas, Prisma/Drizzle models)
- [ ] The mutation/logic file (Server Action, loader, action)
- [ ] The UI consumer component
- [ ] Related hooks/utils (`useQuery`, `useMutation`, helpers)

**Conditionally include:**
- [ ] Middleware/auth (if auth boundaries change)
- [ ] Config files (`next.config.ts`, `remix.config.ts`, `tsconfig.json`)
- [ ] Parent layout (for RSC boundaries, providers)
- [ ] Test file (if TDD/verification needed)

**Always exclude:**
- `node_modules`, `.next`, `dist`, lock files
- Unrelated routes/features
- Generated types (unless debugging type errors)

### The CONTEXT.md / AGENTS.md File

**This is the single highest-leverage file in your repo.** Keep it updated.

```markdown
# Project Context for AI Assistants

## Stack
- Next.js 16 (App Router, RSC, Server Actions, PPR)
- React 19 (useActionState, useOptimistic, useFormStatus)
- TypeScript 5.6+ (strict, noUncheckedIndexedAccess)
- Prisma 6 (PostgreSQL, RLS policies)
- Auth.js v5 (credentials + OAuth, session in DB)
- TanStack Query v5 (server state)
- Tailwind CSS v4 + shadcn/ui (Radix primitives)

## Key Patterns
- Server Actions in `actions/{domain}/{action}.ts`
- Zod schemas co-located with actions
- Prisma extensions for RLS in `lib/db/extensions.ts`
- React 19 forms: `useActionState` + `useFormStatus`
- Error boundaries per route segment

## Internal Packages
- `@company/ui` — Radix + Tailwind components
- `@company/shared` — Types, Zod schemas, utils
- `@company/config` — ESLint, TSConfig, Tailwind presets

## Common Gotchas
- RSC boundary at `app/(dashboard)/layout.tsx` — don't cross with client hooks
- Middleware.ts runs on Edge — no Prisma, use `@edge-compat/prisma`
- Server Actions need `'use server'` at file top, not function level
```

---

## 3. Daily Workflow Patterns

### Pattern 1: Feature Implementation (New Route + Action + UI)

```bash
# Step 1: Plan (low context, fast)
opencode run -m opencode/space-bunny-free:low \
  "Design the API + types for: 'User invites team member via email.
   Uses Next.js 16 Server Action, Zod validation, Resend email,
   Prisma upsert, returns { success, inviteId }.
   Files to consider: [list 3-4 relevant files]"

# Step 2: Implement Server Action (focused, high compute)
opencode run -m opencode/space-bunny-free:max \
  "Implement the Server Action in actions/team/invite.ts.
   Context: [paste types + prisma schema + email util]"

# Step 3: Implement UI (focused)
opencode run -m opencode/muse-spark-1.3-contributor-free:high \
  "Build the InviteMemberDialog component.
   Uses React 19 useActionState, shadcn Dialog, react-hook-form + Zod.
   Context: [paste action signature + type defs]"

# Step 4: Wire up + verify types
opencode run -m opencode/space-bunny-free:medium \
  "Connect the dialog to the page. Fix any TypeScript errors.
   Context: [page.tsx + action + component]"
```

### Pattern 2: Complex Refactor (Pages Router → App Router Migration)

```bash
# Phase 1: Inventory (you do this, model summarizes)
find apps/web/app -name "*.tsx" -path "*/dashboard/*" | head -20
# → Paste list to model
opencode run -m opencode/space-bunny-free:max \
  "Analyze these 20 dashboard files. Categorize by:
   - Client components ('use client')
   - Server components (RSC)
   - Server Actions
   - Data fetching patterns (getServerSideProps vs fetch vs SQL)
   Output: migration priority order + shared patterns to extract"

# Phase 2: Extract shared patterns (high context)
opencode run -m opencode/space-bunny-free:max \
  "Create shared utilities for the dashboard migration:
   - createServerActionWrapper (error handling, auth, logging)
   - createDataAccess (typed Prisma queries with RLS)
   - useOptimisticMutation (React 19 useOptimistic + useActionState)
   Context: [3-4 representative files showing current patterns]"

# Phase 3: Migrate per-route (focused, parallelizable)
# Run multiple focused sessions, each with 3-5 files max
```

### Pattern 3: Debugging Production Issues

```bash
# Hydration mismatch
opencode run -m opencode/nemotron-3.5-lightning-free \
  "Fix hydration mismatch: 'Expected server HTML to contain...'
   Error occurs in components/DashboardChart.tsx.
   Server renders one value, client another.
   Context: [DashboardChart.tsx + parent page.tsx + data fetching code]"

# Complex TypeScript error
opencode run -m opencode/space-bunny-free:high \
  "Resolve this TS error in actions/billing/upgrade.ts:
   Type 'Promise<Stripe.Subscription>' is not assignable to
   type 'Promise<SubscriptionPlan>'.
   Context: [upgrade.ts + types/billing.ts + prisma/schema.prisma +
             lib/stripe.ts]"

# RSC boundary violation
opencode run -m opencode/longcat-2.5-preview-free \
  "Fix RSC boundary violation: client hook used in server component.
   File: app/(dashboard)/analytics/page.tsx
   The component uses useState + useEffect but is not marked 'use client'.
   Context: [page.tsx + layout.tsx + the custom hook being used]"
```

### Pattern 4: Architecture Reviews / RFCs

```bash
opencode run -m opencode/longcat-2.5-preview-free \
  "Review this RFC for migrating auth from NextAuth v4 to Auth.js v5.
   Focus on: RSC compatibility, Server Action integration,
   middleware.ts changes, session typing, migration path.
   Context: [RFC.md + current auth.ts + middleware.ts + types/auth.ts +
             package.json deps]"
```

### Pattern 5: Test Writing

```bash
opencode run -m opencode/space-bunny-free:high \
  "Write Vitest unit tests for lib/utils/formatters.ts.
   Cover: edge cases, null/undefined inputs, timezone handling.
   Context: [formatters.ts + existing test setup + one example test file]"
```

---

## 4. Framework-Specific Playbooks

### Next.js v16+ (App Router)

| Task | Model | Variant | Key Prompt Focus |
|------|-------|---------|------------------|
| Server Components | Space Bunny | max | RSC boundaries, streaming, suspense |
| Server Actions | Space Bunny | high | Progressive enhancement, error handling |
| Caching (ISR/SSG) | LongCat 2.5 | — | Cache invalidation strategy, tags |
| Middleware | Muse Spark | high | Auth, geo, A/B testing, Edge constraints |
| Parallel/Intercepting Routes | Space Bunny | max | Complex layout patterns, loading.tsx |
| Route Handlers | Space Bunny | high | REST conventions, streaming responses |
| Metadata API | MiMo Flash | — | Static vs dynamic, streaming metadata |

**Next.js Prompt Template:**
```
Implement [feature] in my Next.js 16 App Router codebase.
Constraints:
- Server Components by default, 'use client' only when needed
- Server Actions for mutations with useActionState
- Zod validation on all inputs
- Progressive enhancement: forms work without JS
- Use React 19 features (useOptimistic, useFormStatus)
Files to consider: [list 3-5 files]
```

### Remix v3

| Task | Model | Variant | Key Prompt Focus |
|------|-------|---------|------------------|
| Loaders/Actions | Space Bunny | high | Data loading optimization, defer() |
| Nested Routes | Muse Spark | high | Layout composition, outlet context |
| Optimistic UI | Space Bunny | max | useFetcher, progressive enhancement |
| Resource Routes | Muse Spark | high | API endpoints, proper HTTP status |
| Error Boundaries | Space Bunny | high | Error recovery UX, root error.tsx |
| Remix Auth | Space Bunny | high | Session handling, cookie management |

**Remix Prompt Template:**
```
Implement [feature] in my Remix v3 app.
Constraints:
- Use loaders for data, actions for mutations
- Implement optimistic UI with useFetcher
- Progressive enhancement: forms work without JS
- Proper error boundaries at route level
- Type-safe with Remix's built-in types
Files to consider: [list 3-5 files]
```

### React Router v8

| Task | Model | Variant | Key Prompt Focus |
|------|-------|---------|------------------|
| Framework Mode | Space Bunny | high | When to use library vs framework mode |
| Data Loading | Muse Spark | high | loader/action functions, defer() |
| Deferred Data | Space Bunny | max | Suspense boundaries, Await component |
| Type Safety | Muse Spark | high | Type-safe routes, param validation |
| Nested Routes | Space Bunny | high | Layout routes, outlet rendering |

**React Router Prompt Template:**
```
Implement [feature] in my React Router v8 app.
Constraints:
- Use framework mode with data loading
- Type-safe route params and search params
- Deferred data with Suspense boundaries
- Progressive enhancement: works without JS
Files to consider: [list 3-5 files]
```

---

## 5. Progressive Enhancement Protocol

### The 6 Rules to Embed in Every Prompt

1. **Core content without JS** — Can the page render meaningfully without JavaScript?
2. **Semantic HTML first** — Use proper elements before adding interactivity
3. **CSS before JS** — Solve styling with CSS before reaching for JS
4. **Enhance, don't replace** — Add JS on top of working HTML, not instead of it
5. **Form fallbacks** — Ensure forms work without JS (use `<form>` with actions)
6. **Skeleton states** — Provide loading states that work without JS

### Universal Prompt Addition

Append this to every feature implementation prompt:

```
REMEMBER: Progressive enhancement is required.
- All forms must work without JavaScript (native <form> + server action)
- All content must be readable without JavaScript
- JS is an enhancement layer, not a requirement
- Use <noscript> fallbacks where appropriate
```

### Framework-Specific PE Patterns

| Framework | No-JS Fallback Pattern |
|-----------|----------------------|
| Next.js 16 | Server Actions + `<form action={...}>` works without JS |
| Remix v3 | Native `<form>` + action, useFetcher for enhancement |
| React Router v8 | Form + loader/action, defer() for progressive loading |

---

## 6. Tooling & Automation

### Shell Aliases (~/.zshrc or ~/.bashrc)

```bash
# Model aliases for daily flow
alias oc-low='opencode run -m opencode/space-bunny-free:low'
alias oc-med='opencode run -m opencode/space-bunny-free:medium'
alias oc-high='opencode run -m opencode/space-bunny-free:high'
alias oc-max='opencode run -m opencode/space-bunny-free:max'
alias oc-flash='opencode run -m opencode/mimo-v2.6-flash-free'
alias oc-longcat='opencode run -m opencode/longcat-2.5-preview-free'
alias oc-muse='opencode run -m opencode/muse-spark-1.3-contributor-free:high'
alias oc-nemo='opencode run -m opencode/nemotron-3.5-lightning-free'

# Quick context builder (fzf + bat)
oc-ctx() {
  local files=$(find . -name "*.ts" -o -name "*.tsx" | fzf -m --preview 'bat --color=always {}')
  echo "$files" | xargs -I{} sh -c 'echo "=== {} ==="; cat {}'
}

# Verify after model changes
oc-verify() {
  npx tsc --noEmit && pnpm lint && pnpm test
}
```

### OpenCode Subagent Strategy

| Subagent Type | When to Use | What to Ask |
|---------------|-------------|-------------|
| **explore** | Need to find files/patterns before asking model to write code | "Find all Server Actions related to billing" |
| **general** | Multi-step task that can run in parallel | "Refactor all dashboard components to use new pattern" |
| **general (background)** | Long-running refactors while you continue other work | "Migrate these 10 files from Pages to App Router" |

### Verification Loop (After Every Model Change)

```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint
pnpm lint

# 3. Test
pnpm test

# 4. Build (if applicable)
pnpm build

# 5. Preview in browser
# Use browser.preview to visually verify the change
```

---

## 7. Monorepo Strategies

### Context Curation by Scenario

| Scenario | Files to Include |
|----------|-----------------|
| **Shared package changes** (`packages/ui`, `packages/shared`) | `package.json` + `tsconfig.json` + 2-3 consumer files |
| **Cross-app dependencies** | Explicitly list which apps consume the package |
| **Type-safe config** (`turbo.json`, `nx.json`) | Config + affected project `package.json`s |
| **Database schema (Prisma/Drizzle)** | `schema.prisma` or `schema.ts` + migration file |
| **CI/CD changes** | Workflow file + affected `package.json` scripts |

### Monorepo Prompt Template

```
I'm working in a Turborepo monorepo. I need to modify [package].
Consumers of this package: [list apps].
Current package structure: [paste package.json + tsconfig.json]
Task: [describe the change]
Constraints: maintain backward compatibility, update all consumers.
```

---

## 8. Anti-Patterns & Failure Modes

### When Free Models Aren't Enough

| Signal | What It Means | Action |
|--------|--------------|--------|
| "I keep pasting the same 10 files" | Context window too small | Script a context builder / use `/compact` |
| "Model hallucinates internal APIs" | Free models don't know your private packages | Document them in CONTEXT.md |
| "Context window exceeded" | Task too large for free tier | Split into smaller tasks or upgrade |
| "Model suggests deprecated patterns" | Training cutoff hit | Feed docs/examples in context |
| "Model can't understand the architecture" | Missing context | Add more files, especially types and entry points |
| "Same error keeps recurring" | Model is stuck in a loop | Switch models or variants |

### Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Do This Instead |
|--------------|-------------|-----------------|
| Asking "how do I build X?" | Too open-ended, wastes tokens | "Implement X given these constraints and patterns" |
| Including entire directories | Wastes context window, causes confusion | Curate 5-15 specific files |
| Using max-tier for boilerplate | Wastes compute, slower than flash | Match tier to complexity |
| Not verifying model output | Bugs ship to production | Always run tsc + lint + test |
| One giant prompt for everything | Model loses focus, quality drops | Break into focused steps |
| Ignoring CONTEXT.md | Model re-learns your stack every session | Keep it updated, it's your force multiplier |

---

## 9. Measuring Effectiveness

### KPIs to Track

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Time to first working draft** | < 5 min for features | From prompt to tsc passing |
| **Model output acceptance rate** | > 80% | % of changes that pass review without major edits |
| **Context curation time** | < 5 min | Time spent selecting files before prompting |
| **Verification pass rate** | > 90% | % of model changes that pass tsc + lint + test on first try |
| **Tokens per task** | Track trends | Lower is better for same quality |

### Weekly Review Questions

1. Which model/variant did I use most? Was it the right choice?
2. Where did the model hallucinate? What context was missing?
3. What patterns did I correct? Are they in CONTEXT.md?
4. Which tasks took longest? Can they be broken down further?
5. What new patterns emerged? Should they be documented?

---

## 10. Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODEL SELECTION CHEAT SHEET                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COMPLEX / ARCHITECTURE  → LongCat 2.5 / Space Bunny max        │
│  DAILY CODING            → Space Bunny medium / Muse Spark high │
│  QUICK TASKS             → MiMo Flash / Ling Flash              │
│  BOILERPLATE             → Nemotron Lightning                   │
│  DEBUGGING TYPES         → Space Bunny high                    │
│  DEBUGGING HYDRATION     → Nemotron 3.5 Lightning              │
│  DEBUGGING RSC           → LongCat 2.5                         │
│  UI COMPONENTS           → Muse Spark high                     │
│  SERVER LOGIC            → Space Bunny high/max                 │
│  TESTS                   → Space Bunny high                    │
│  DOCS / CONFIG           → MiMo Flash / Space Bunny low        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    WORKFLOW PHASES                              │
│                                                                 │
│  1. ARCHITECTURE  → LongCat 2.5 / Space Bunny max              │
│  2. SCAFFOLDING   → Nemotron Lightning / MiMo Flash           │
│  3. DEVELOPMENT   → Space Bunny high / Muse Spark high         │
│  4. REFACTOR      → Space Bunny medium / Muse Spark medium     │
│  5. QUICK FIXES   → Ling Flash / MiMo Flash                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    GOLDEN RULES                                 │
│                                                                 │
│  ✓ You architect; they implement                               │
│  ✓ Context is your lever — curate 5-15 files max              │
│  ✓ Verify, don't trust — tsc + lint + test after every change │
│  ✓ Batch similar tasks — all actions in one session           │
│  ✓ Document patterns — update CONTEXT.md every correction     │
│  ✓ Progressive enhancement — JS enhances, never replaces      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Copy-Paste Prompt Library

### "Implement a Server Action"
```
Implement a Server Action in actions/[domain]/[action].ts.
Requirements:
- Zod validation on all inputs
- Auth check (throw if unauthorized)
- Database operation with Prisma
- Return { success: boolean, data?: T, error?: string }
- Progressive enhancement: works with native <form>
Context: [paste types + prisma schema + auth helper]
```

### "Build a Component"
```
Build a [ComponentName] component.
Requirements:
- TypeScript strict mode
- Radix UI primitive + Tailwind styling
- React 19 patterns (useActionState if form-related)
- Accessible (ARIA labels, keyboard navigation)
- Responsive (mobile-first)
Context: [paste types + existing similar component for style reference]
```

### "Fix a Type Error"
```
Fix this TypeScript error:
[paste full error message]
Context: [paste the file with error + related type definitions + any imports]
```

### "Write Tests"
```
Write [Vitest/Jest/Playwright] tests for [file/function].
Cover: happy path, edge cases, error cases, boundary conditions.
Context: [paste the file + existing test setup + one example test]
```

### "Review My Code"
```
Review this code for:
- Type safety issues
- Performance problems
- Security vulnerabilities
- Progressive enhancement violations
- Best practice deviations
Context: [paste the code + relevant types/configs]
```

---

_Last updated: September 27, 2026. All models are completely free — no API keys, no rate limits, no hidden costs._
