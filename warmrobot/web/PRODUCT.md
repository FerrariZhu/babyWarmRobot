# Product

## Register

product

## Users

New parents and caregivers who need a fast, confident answer each morning: what should the baby wear today? They use the app on mobile, often one-handed, with limited time before leaving home. Secondary users include grandparents or nannies managing wardrobe for the same baby profile.

## Product Purpose

Baby Outfit (宝宝穿衣助手) recommends daily clothing based on local weather, baby profile (age, activity level), and the family's wardrobe inventory. Success means the user trusts the recommendation within seconds, adds items easily, and returns daily during dressing time.

## Brand Personality

Warm, reliable, calm. The interface should feel like a thoughtful caregiver—not a flashy consumer app or generic SaaS dashboard.

## Anti-references

- Purple-to-blue SaaS gradients and "startup template" hero sections
- Inter or system-default typography everywhere
- Card nested inside card for every piece of content
- Gray muted text on tinted or colored backgrounds
- Bounce/elastic easing and decorative motion without purpose
- Dense admin-table aesthetics on consumer-facing flows

## Design Principles

1. **Decision first** — Weather and today's outfit recommendation are visible immediately; secondary actions defer.
2. **One-hand mobile** — Touch targets ≥48px; primary actions reachable at thumb zone; bottom nav for core routes.
3. **Trust through clarity** — Show why a recommendation works (warmth reasoning), not just the result.
4. **Gentle guidance** — Empty states teach the next step (add baby, add clothing) without guilt or clutter.
5. **Consistent craft** — One visual system (Stitch tokens) across main app and lessons module; no one-off Tailwind palettes.

## Accessibility & Inclusion

- Target **WCAG 2.1 AA** for text contrast and touch targets
- Minimum interactive target: 48×48px (already in design tokens)
- Respect `prefers-reduced-motion` for non-essential animations
- Form inputs require visible labels and clear error messaging
- Lessons module retains Ukrainian UI copy; visual system aligns with main app
