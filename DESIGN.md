# JobCedar — Design Specification

This document is the **design authority** for JobCedar. Every visual decision during the build MUST follow this spec. Do not deviate from these choices — they were selected specifically for this product's domain, audience, and brand personality.

## Brand Identity

**Personality:** bold
**Product:** Solid AI backbone for your trades business

This is not a generic SaaS template. JobCedar should look like a product with its own design team — something you'd see on Product Hunt with 500+ upvotes, not something that obviously came from a generator.

## Color System

All colors use oklch() format in Tailwind CSS v4. Convert these hex values to oklch() when writing CSS variables.

| Role | Hex | Usage |
|------|-----|-------|
| **Primary** | #E05A1A | Brand color. Primary buttons, active nav states, key UI accents, links. |
| **Secondary** | #1E3A5F | Supporting elements. Secondary buttons, section backgrounds, subtle borders. |
| **Accent** | #F59E0B | Highlight sparingly. Success states, badges, notification dots, hover effects. |
| **Background** | #faf8f5 | Page background. NOT pure white. This subtle tint creates warmth/coolness. |

**Color rules:**
- Primary color appears on every screen but is never overwhelming — it should guide the eye, not assault it
- Secondary color does the heavy lifting for borders, dividers, muted text, inactive states
- Accent is the "pop" — use it for max 2-3 elements per screen
- Derive hover/active/disabled states from the primary: hover = slightly darker, active = darker still, disabled = 40% opacity
- Dark mode (if applicable): invert the value scale, keep the hue. Don't just slap `dark:` classes — redesign the palette for dark backgrounds.

## Typography

| Role | Font | Weight | Tracking |
|------|------|--------|----------|
| **Headings** | Space Grotesk | 600-700 | tight (-0.02em) |
| **Body** | Work Sans | 400-500 | normal |
| **Mono/Data** | System mono stack | 400 | normal |

**Typography rules:**
- Import BOTH fonts via `@import` at the VERY TOP of `globals.css`, BEFORE all other CSS
- Heading font is for h1-h3 ONLY. Do not use it for buttons, labels, or body text.
- Body font handles everything else: paragraphs, buttons, nav, labels, form inputs
- Use `max-w-prose` or `max-w-2xl` for body text blocks — never let text run full-width
- Font size hierarchy: h1=2.25rem, h2=1.5rem, h3=1.25rem, body=0.875-1rem. Be consistent.

## Component Design Language

### Border Radius: sharp (6px)

Precise, technical, no-nonsense. Buttons are rectangles with barely-there rounding. Cards have crisp edges. This product means business.

**Apply consistently:** buttons, cards, inputs, dropdowns, modals, badges, tooltips, images — everything shares the same radius system. The ONLY exception is avatars (always fully rounded) and very small badges/pills (can be fully rounded regardless of system).

### Component Personality

**Bold personality** — high-contrast, geometric, confident.
- **Buttons:** Solid fills with strong contrast. No outlines for primary actions. Large click targets. Consider uppercase text for primary CTAs.
- **Cards:** Distinct borders or strong shadows. Cards should feel like distinct objects, not floating suggestions.
- **Navigation:** Bold sidebar with strong active states (full background highlight, not just text color). Consider a dark sidebar.
- **Data display:** Dense tables and grids are OK. Bold headers, clear separators. Numbers should be large and prominent.
- **Interactions:** Snappy transitions (150ms). Hover states should be decisive (scale, color shift), not subtle.
- **Empty states:** Strong illustration or icon, direct copy. No hand-holding.
- **Modals vs drawers:** Prefer modals — they command attention. Use for confirmations, creation flows.
- **shadcn components to favor:** Dialog, AlertDialog, Table, Tabs, Command (for search), Badge (for status).

### Layout Architecture

**Hero layout:** split
- Left side: headline, subheadline, CTA. Right side: product illustration/screenshot/visual.
- The visual side should be at least 45% of the width. Don't cram it.

**Feature layout:** bento
- Mixed-size grid: 1-2 large hero cards + smaller supporting cards.
- Large cards get more visual treatment (illustration, screenshot, demo).
- This is NOT a uniform 3-column grid — vary the sizes intentionally.

**Dashboard layout:**
- Use a sidebar navigation for 4+ sections, top tabs for 2-3 sections
- Main content area: max-w-6xl with consistent horizontal padding
- Cards for distinct data groups, tables for list data
- Every screen needs a clear primary action (top-right button or inline CTA)

### Spacing & Density

- Page padding: 24-32px horizontal, 32-48px vertical sections
- Card padding: 16-24px internal
- Between cards: 16-24px gap
- Between sections: 48-64px
- Use Tailwind's spacing scale consistently: 4, 6, 8, 12, 16, 24, 32, 48, 64
- When in doubt: add more space, not less

### Shadows & Elevation

- Cards: `shadow-sm` default, `shadow-md` on hover (if interactive)
- Modals/drawers: `shadow-xl`
- Buttons: no shadow (unless the brand personality calls for it)
- Dropdowns/popovers: `shadow-lg`
- Never use `shadow-2xl` — it looks like a 2015 Material Design demo

### Icons

- Use Lucide icons exclusively (already in the boilerplate via `lucide-react`)
- Icon size: 16px in buttons/nav, 20px in cards/features, 24px in hero elements
- Icon color: match the text color they sit next to, or use the primary color for emphasis
- Stroke width: use default (2px). Don't mix stroke widths.

## What Makes This Product Unique

The goal is NOT to be "the prettiest template." The goal is to be **recognizable**. If someone screenshots JobCedar and posts it, people should not be able to confuse it with any other product.

Uniqueness comes from the **combination** of:
1. The specific color palette (not just "it's blue")
2. The typography pairing (the heading font carries personality)
3. The radius philosophy (sharp products feel different from rounded ones)
4. The component treatment (how cards, buttons, nav FEEL)
5. The spacing and density (airy vs. compact)
6. The layout choices (sidebar vs. top nav, modals vs. drawers, bento vs. grid)

A finance dashboard with serif headings, sharp corners, and dense tables feels COMPLETELY different from a wellness app with rounded sans-serif, pill buttons, and spacious card layouts — even if both are "good design."

Commit to this spec. Don't water it down by falling back to shadcn defaults.

## Anti-Patterns (DO NOT)

- Do NOT leave shadcn components unstyled/default — every component should reflect the brand
- Do NOT use `bg-blue-600` or any hardcoded Tailwind colors — use your CSS variables
- Do NOT mix border radius values — pick the system radius and apply it everywhere
- Do NOT use more than 2 font families (heading + body, that's it)
- Do NOT center everything — left-aligned content is usually more readable for dashboards
- Do NOT use generic purple-to-blue gradients
- Do NOT use default gray-100 backgrounds for cards — use your secondary color at low opacity
- Do NOT use spinners for loading — use Skeleton components
- Do NOT leave empty states blank — every empty state needs a message and a primary action
