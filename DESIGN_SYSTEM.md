# Kato Design System
## Inspired by Linear + Claude.ai — NOT AI slop

### Color Palette
**Dark mode (primary):**
- Background: `#1a1a1e` (slightly warm dark, not pure black)
- Surface: `#222326` (Linear's Nordic Gray)
- Surface elevated: `#2a2a2e`
- Border: `rgba(255,255,255,0.06)` — felt, not seen
- Text primary: `#f4f5f8` (Mercury White)
- Text secondary: `rgba(255,255,255,0.5)`
- Text muted: `rgba(255,255,255,0.3)`
- Accent: `#5c7cfa` (Kato blue — used SPARINGLY)

**Light mode:**
- Background: `#f7f6f0` (Claude's warm off-white)
- Surface: `#ffffff`
- Surface elevated: `#ffffff`
- Border: `rgba(0,0,0,0.06)`
- Text primary: `#1a1a1e`
- Text secondary: `rgba(0,0,0,0.55)`
- Accent: `#4c6ef5`

### Typography
- Font: Inter (already set up)
- Scale down everything — expert tool feel
- Nav items: 13px, medium weight
- Body: 13px regular
- Labels: 11px, medium, uppercase tracking-wider — used sparingly
- Headings: 15-16px, semibold (NOT 2xl or 3xl — too consumer)
- Hierarchy through color dimming, not size jumps

### Spacing
- 4px base grid
- Sidebar padding: 12px
- Card padding: 16px
- Section gaps: 16-20px
- NO excessive whitespace — information density matters

### Components
- Borders: 1px, barely visible (`rgba` not solid colors)
- Border radius: 8px for cards, 6px for inputs, 8px for buttons
- Shadows: NONE in dark mode. In light mode: `0 1px 2px rgba(0,0,0,0.04)` max
- Buttons: solid fill for primary, ghost/outline for secondary. No gradients.
- Inputs: subtle border, no box-shadow on focus — just border color change
- Cards: background differentiation only, minimal border

### Anti-Slop Rules
1. NO gradient backgrounds or buttons
2. NO colored badges everywhere — use gray, one accent color max
3. NO emoji in navigation (use simple text or minimal SVG icons)
4. NO rounded-full badges — use rounded-md
5. NO excessive animation — only purposeful transitions
6. NO hero sections with big taglines inside the app
7. Structure felt through alignment and spacing, not boxes and lines
8. When in doubt, remove an element rather than add one
