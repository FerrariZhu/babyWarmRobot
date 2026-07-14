---
name: Baby Outfit Stitch
description: Warm, calm product UI for daily baby outfit recommendations
colors:
  primary: "#3e6658"
  on-primary: "#ffffff"
  primary-container: "#8fb9a8"
  on-primary-container: "#224a3d"
  primary-fixed: "#c0ecda"
  secondary: "#8b4e38"
  secondary-fixed: "#ffdbcf"
  tertiary: "#3b637b"
  tertiary-fixed: "#c6e7ff"
  background: "#fbf9f5"
  on-background: "#1b1c1a"
  on-surface-variant: "#414845"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f5f3ef"
  surface-container-high: "#eae8e4"
  outline-variant: "#c0c8c3"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "38px"
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
  body:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  label:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "0.05em"
  icon:
    fontFamily: "Material Symbols Outlined, sans-serif"
    fontSize: "24px"
    fontWeight: 400
rounded:
  default: "1rem"
  lg: "2rem"
  xl: "3rem"
  pill: "9999px"
  indicator: "4px"
spacing:
  gutter: "16px"
  margin-mobile: "20px"
  margin-desktop: "40px"
  touch-target-min: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "12px 32px"
  card-surface:
    backgroundColor: "{colors.surface-container-lowest}"
    rounded: "{rounded.default}"
    padding: "16px 24px"
  input-field:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.default}"
    padding: "12px 16px"
---

# Design System: Baby Outfit Stitch

## 1. Overview

**Creative North Star: "Morning Calm"**

A soft, nature-tinted product surface that helps parents decide quickly without visual noise. Density is comfortable on mobile; hierarchy favors weather and outfit recommendations. Depth comes from tonal surfaces and subtle green-tinted shadows—not stacked card frames.

**Key Characteristics:**

- Sage green primary with warm cream backgrounds
- Plus Jakarta Sans for display/headlines, Work Sans for body
- Rounded-xl cards, rounded-full primary CTAs
- Cloud shadows (green-tinted, low opacity)
- Material Symbols Outlined for iconography

## 2. Colors

Muted sage-and-cream palette derived from Material 3 roles, tuned for parenting context.

### Primary

- **Forest Sage** (#3e6658): Primary buttons, active nav, key headings accents
- **Mist Sage** (#8fb9a8 / primary-container): Selected chips, soft highlights
- **Dawn Mint** (#c0ecda / primary-fixed): Weather hero backgrounds

### Secondary

- **Warm Clay** (#8b4e38): Error banners, warm accent alerts (secondary-fixed backgrounds)

### Tertiary

- **Sky Slate** (#3b637b / tertiary-fixed): Profile stat tiles, informational accents

### Neutral

- **Cream Canvas** (#fbf9f5): Page background
- **Ink Soft** (#1b1c1a): Primary text
- **Stone Whisper** (#414845): Secondary text on light surfaces only—not on tinted backgrounds

### Named Rules

**The Tinted Text Rule.** On primary-fixed or colored hero surfaces, use on-primary-fixed or white-tinted text—not gray-on-color.

## 3. Typography

**Display Font:** Plus Jakarta Sans  
**Body Font:** Work Sans  

**Character:** Friendly geometric display paired with readable humanist body. Avoid Inter and system-ui as primary identity fonts.

### Hierarchy

- **Display** (700, 32/38): Page hero numbers, success moments
- **Headline** (600, 24/32): Section titles ("今日推荐")
- **Body** (400, 16/24): Descriptions, form copy
- **Label** (600, 12/16, uppercase tracking): CTAs, nav labels, chips

## 4. Elevation

Hybrid: mostly flat tonal surfaces (`surface-container-*`), with **cloud-shadow** for interactive cards.

### Shadow Vocabulary

- **cloud-shadow**: `0 4px 20px rgba(62, 102, 88, 0.06)` — cards at rest
- **cloud-shadow-active**: `0 8px 24px rgba(62, 102, 88, 0.12)` — hover/active cards

### Named Rules

**The Flat Hero Rule.** Weather hero uses tonal fill (primary-fixed), not nested card shadows inside the hero.

## 5. Components

### Buttons

- **Shape:** Pill (`rounded-full`), min-height 48px
- **Primary:** `bg-primary text-on-primary`, active scale 0.95
- **Ghost/text:** `font-label-caps text-primary`, opacity on active

### Cards

- **Shape:** `rounded-xl`, `bg-surface-container-lowest`
- **Padding:** p-4 to p-6; avoid card wrapping every list row unless the row is tappable

### Inputs

- **Shape:** `rounded-xl border-2 border-surface-container-high`
- **Focus:** `focus:border-primary`
- **Error:** `rounded-xl bg-secondary-fixed text-on-secondary-fixed`

### Navigation

- **Bottom nav:** Fixed, cloud-shadow, primary for active tab
- **App shell:** Centered max-width content, `pb-[100px]` for nav clearance

## 6. Do's and Don'ts

**Do**

- Use design tokens from `globals.css` / Tailwind theme (`bg-primary`, `text-on-surface-variant`)
- Use `MaterialIcon` for icons
- Use `font-headline-md-mobile`, `font-body-md`, `font-label-caps` utility classes
- Keep empty states actionable with icon + short copy + primary CTA

**Don't**

- Use raw `slate-*`, `violet-*`, `sky-*` Tailwind palettes in product UI
- Nest rounded-xl cards inside rounded-xl cards
- Use `shadow-sm` when `cloud-shadow` is the project standard
- Put gray text on primary-fixed or colored backgrounds
