# Sprout

**The anti-form for custom-cake bakers.**

Sprout turns the messy stream of customer texts, DMs, and emails into organized, drafted, quoted, and scheduled orders — without ever asking the customer to fill out a form.

---

## The Idea

Most baking-business tools (Bakesy, Bake Diary, CakeBoss, BakeSmart) make the **customer** fill out a structured order form.

**Sprout flips that.** The customer keeps messaging in plain language exactly as they do now — and an LLM structures it for the baker.

> Customer sends a message → AI drafts a reply & quote → Baker swipes to approve, edit, or decline

A human is always in the loop. Nothing is ever sent or booked without an explicit tap.

---

## How It Works

1. **Intake** — Messages come in via paste/share (iOS Share Sheet) or a single free-text "Tell us about your order" web link.
2. **AI Pipeline** — Each message is parsed by Claude into a structured object: intent, order details, draft reply, suggested quote, and any flags (e.g. allergies, missing info).
3. **Flashcard Triage** — A Tinder-style stack lets the baker review each conversation thread at a glance:
   - Swipe right — send the reply / confirm & book
   - Swipe left — park for later
   - Swipe up — politely decline
   - Every action has an undo window
4. **Orders & Calendar** — Confirmed orders push to Google Calendar with a capacity/conflict check, and surface on an Orders page sorted by due date.
5. **Prep Sheet** — A clean, kitchen-ready summary of each order with allergies/dietary needs flagged at the top.
6. **Learning Loop** — Every edit the baker makes to a draft or quote feeds back into future suggestions, so Sprout gets better at sounding like *you*.

---

## Tech Stack

| Layer | Tech |
|---|---|
| **Mobile App** | React Native (Expo), React Navigation, Reanimated + Gesture Handler |
| **State** | TanStack Query + Zustand |
| **Validation** | Zod |
| **Backend** | Firebase (Auth, Firestore, Cloud Functions, Hosting, Storage, Scheduler) |
| **AI** | Anthropic Claude API (`claude-haiku-4-5` for fast tasks, `claude-sonnet-4-6` for drafting/quoting) |
| **Integrations** | Google Calendar API + OAuth 2.0 |
| **Secrets** | Google Secret Manager (server-side only — never bundled client-side) |

---

## Design

Minimalist, solid colors, no gradients — an urban-garden, down-to-earth aesthetic. Plant-themed branding reflects small businesses sprouting toward a bigger customer base.

**Palette — "Succulent Garden"**

| Color | Hex |
|---|---|
| Cream | `#FDF1DB` |
| Sage Tan | `#CFC49D` |
| Terracotta | `#D89684` |
| Light Green | `#96AB88` |
| Mid Green (primary) | `#597B60` |
| Deep Green | `#40534D` |

---

## Scope (v1 MVP)

- Paste/share + web intake
- AI parsing, drafting & quoting pipeline
- Thread/order state model
- Flashcard swipe triage (with undo)
- Inbox + Orders pages
- Per-order prep sheet with allergy flags
- Google Calendar push with capacity checks
- Pricing configuration
- Learning loop

**Coming later (v1.5+):** SMS (Twilio) & email ingestion, deposit payment links, follow-up nudges, Instagram/Messenger DMs, light analytics.

**Explicitly out of scope:** recipe/ingredient costing, inventory management, multi-staff support, heavy reporting.

---

## Privacy & Security

- All LLM calls and secrets live server-side in Cloud Functions / Secret Manager
- No keys are ever bundled in the mobile client
- Sprout maintains its own in-app calendar as the source of truth
- Customer data is treated as sensitive and minimally collected

---

## Status

Portfolio MVP in active development. Single-user (one baker), zero customer accounts required.
