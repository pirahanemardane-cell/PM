# Dark mode formal - Phase 2

## Implementation
- next-themes ThemeProvider in root layout
- attribute: class on html
- storageKey: pm-theme
- defaultTheme: light
- enableSystem: false (intentional - stable brand default)
- Toggle: src/components/theme/theme-toggle.tsx

## Tokens
Light/dark CSS variables in src/app/globals.css (@custom-variant dark).

## Rules
- New UI must use semantic tokens (bg-background, text-foreground, border-border)
- Prefer dark: variants only when semantic tokens are not enough
- Toaster forced light for readability of Persian error text

## Reduced motion
Respect prefers-reduced-motion in animations where framer-motion is used.
