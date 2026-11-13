---
name: Aura Dourada Mobile
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#4e4638'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#807666'
  outline-variant: '#d2c5b3'
  surface-tint: '#7a580f'
  primary: '#7a580f'
  on-primary: '#ffffff'
  primary-container: '#c59b4e'
  on-primary-container: '#4c3400'
  inverse-primary: '#edc06f'
  secondary: '#1b6d24'
  on-secondary: '#ffffff'
  secondary-container: '#a0f399'
  on-secondary-container: '#217128'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c19e26'
  on-tertiary-container: '#463600'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea8'
  primary-fixed-dim: '#edc06f'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5e4200'
  secondary-fixed: '#a3f69c'
  secondary-fixed-dim: '#88d982'
  on-secondary-fixed: '#002204'
  on-secondary-fixed-variant: '#005312'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: 0em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Outfit
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system translates the prestige, warmth, and craftsmanship of the Capim Dourado craft into a high-end mobile passport, loyalty, and dining concierge experience. It targets discerning mall patrons, gastronomical seekers, and loyalty members who value premium service, exclusivity, and seamless utility. 

The aesthetic is an artisanal blend of **Modern Luxury** and **Refined Warm Minimalism**. It eschews cold, sterile interfaces in favor of warm tinted whites, subtle metallic highlights, elegant filigree line motifs derived from the logo, and fluid interactions reminiscent of high-end lifestyle and delivery services. The emotional tone evokes privilege, warmth, and intuitive efficiency.

## Colors

The palette revolves around the golden lustre of the regional emblem, tempered by deep charcoal typography and crisp, organic neutrals.

- **Primary (`#C59B4E` / `#D4AF37` / `#A37C2C`):** Rich gold ochre tones used for interactive CTAs, active states, tier badges, and loyalty point counters. A lighter champagne tint (`#FBF8F1`) serves as a warm accent fill for highlighted containers.
- **Secondary (`#2E7D32`):** Emerald green, reserved for success states, validated stamp redemptions, coupon claims, and active status indicators.
- **Tertiary (`#D4AF37`):** Pure metallic gold, applied selectively to celebratory states, VIP tiers, and high-value discount highlights.
- **Neutral Palette:**
  - Base canvas: `#F7F5F0` (warm ivory limestone) provides soft, anti-glare contrast.
  - Surface cards: `#FFFFFF` with warm undertones.
  - High-emphasis text: `#1A1A1A` (warm deep onyx) ensuring AA/AAA contrast.
  - Medium-emphasis text: `#4A4A4A` for secondary descriptions, store metadata, and timestamps.
  - Borders & dividers: `#EAE4D7` (pale golden sand).

## Typography

The typographic hierarchy pairs the editorial sophistication of **Playfair Display** with the geometric legibility of **Outfit**.

- **Playfair Display** anchors hero titles, tier milestones, passport chapter covers, and promotional spotlight cards. Its high-contrast serifs reference luxury hospitality and high fashion.
- **Outfit** provides clarity and utility for listings, cart interactions, coupon codes, and navigational UI, keeping dense mobile screens legible even in varying outdoor sunlight.
- Micro-labels and loyalty tiers employ uppercase styling with relaxed letter spacing (`0.05em` to `0.08em`) to mimic boutique foil embossing.

## Layout & Spacing

The layout is built for native mobile ergonomics with a fluid column framework.

- **Grid & Margins:** A 4-column fluid mobile grid with `1.25rem` (`20px`) outer safe margins. Gutters are fixed at `1rem` (`16px`) to ensure seamless side-by-side card viewing (e.g., dual-column restaurant and discount lists).
- **Rhythm:** An 8px base rhythm governs spacing. Tight element stacks (such as badges above shop names) use `space-xs` (4px) or `space-sm` (8px). Structural section separators utilize `space-xl` (36px).
- **Safe Areas:** Fixed bottom navigation and sticky coupon redemption drawers factor in native OS safe area insets with dynamic backdrop blur.

## Elevation & Depth

Visual hierarchy uses warm, diffuse ambient depth rather than harsh cast shadows, producing a warm glow reminiscent of sunlight reflecting off gold:

- **Level 0 (Flat):** Native background (`#F7F5F0`) with faint borders (`1px solid #EAE4D7`).
- **Level 1 (Card & List Surfaces):** Pure white background (`#FFFFFF`) with `box-shadow: 0 4px 18px -2px rgba(163, 124, 44, 0.08), 0 2px 6px rgba(0, 0, 0, 0.02)`.
- **Level 2 (Floating Action Buttons & Bottom Sheets):** Elevated interactive elements feature `box-shadow: 0 12px 28px -4px rgba(197, 155, 78, 0.22), 0 4px 12px rgba(26, 26, 26, 0.05)`.
- **Glass Elements:** Navigation bars and modal overlays use `backdrop-filter: blur(16px)` on `rgba(247, 245, 240, 0.85)` with a `1px` subtle gold hairline divider.

## Shapes

The design system incorporates soft, organic geometric curvature matching the signature loop motifs of the brand identity:

- **Standard Surfaces (Roundedness Level 2):** Cards, input fields, and banners adopt `0.5rem` (8px) to `1rem` (16px) radii.
- **Pills & Badges:** Category filter chips, discount pill tags, and primary bottom-bar CTA buttons utilize full pill radii (`9999px`) to invite touch interactions.
- **Embellishments:** Subtle corner flourishes and watermark-like curved loops inspired by the logo ornament passport stamps and milestone certificates.

## Components

### Buttons
- **Primary:** Warm gradient or solid `#C59B4E` with crisp white text, bold weight, rounded pill shape, and a subtle golden ambient elevation.
- **Success / Claim:** `#2E7D32` solid button with white text, used strictly for voucher activation, redemption confirmation, and completed orders.
- **Secondary / Outline:** Warm white background with `1.5px` border in `#C59B4E` and primary golden text.
- **Ghost / Text:** Uppercase labels with gold underline indicators for subtle actions like "Ver Regulamento".

### Passport & Loyalty Cards
- **Stamp Grid:** A multi-slot digital punch card featuring circular cutouts with dashed golden outlines that transform into shimmering gold medals or emerald checkmarks upon check-in.
- **Tier Card:** Elevated container sporting a subtle champagne-to-ivory gradient, high-contrast dark text, dynamic progress bar (gold track over warm neutral), and metallic badge emblem.

### Merchant & Coupon Cards
- Modern delivery-app aesthetic: 16:9 or 4:3 high-res imagery capped by a top-left floating emerald discount pill (`-20% OFF`, `2 por 1`).
- Bottom section contains store branding, estimated walking/delivery time, points yield (e.g., `+50 pts`), and a direct quick-claim tap target.

### Chips & Filters
- **Default:** `#FFFFFF` background, `#EAE4D7` border, `#4A4A4A` text.
- **Selected:** Tinted champagne background (`#FBF8F1`), solid `#C59B4E` border, `#C59B4E` bold text.

### Input Fields
- Warm white base (`#FFFFFF`) with `#EAE4D7` resting borders, shifting to a `1.5px` `#C59B4E` focus ring. Floating labels transition in Outfit small caps.

### Dialogs & Bottom Drawers
- Sheet surfaces feature a top handle in `#EAE4D7`, generous `1.5rem` top corner rounding, and QR/Barcode presentation blocks designed with high contrast for barcode scanners at merchant counters.