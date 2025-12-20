# OSMech Design System — Summary

This document summarizes the design system tokens, button variants, spacing, and pagination rules used across the project.

## Palette
- Primary: `#2563EB` (blue-600), gradient `from-blue-600 to-blue-700`
- Success: `#10B981`
- Neutral text: `#0F172A` (slate-900)
- Surface / border: `#E6EDF4` / `#CBD5E1`

## Typography
- System stack (recommend installing Inter)
- Labels: uppercase, `text-xs`, `font-medium`
- Body: 14-16px
- Headings: H1 28-32px (ExtraBold), H2 20-24px (SemiBold)

## Spacing & Radii
- Spacing tokens: 4 / 8 / 12 / 16 / 24 / 32
- Radii: `--radius-sm` (6px), `--radius-md` (12px), `--radius-lg` (16px)

## Buttons
- `.btn-primary`: primary CTA with gradient, `rounded-xl`, strong shadow, `focus` ring
- `.btn-secondary`: subtle, bordered white button
- `.btn-ghost`: inline action (transparent)
- `.btn-danger`: destructive action with red gradient
- `.btn-icon`: square icon button, 40px

Use `<button className="btn btn-primary">` or prefer `Button` component when available.

## Pagination
- Pills with `rounded-full` (36px height)
- Active page uses primary gradient and elevated shadow
- Provide `Prev/Next` controls with `aria-label` and keyboard focus
- Include per-page selector for large datasets

## Icons
- Standardize icons: default action icons `22-24px`, context icons `18-20px`.
- Use consistent sizing helpers: `.icon-sm`, `.icon-md`, `.icon-lg`.

## Forms & Inputs
- `rounded-xl`, `border-2`, `focus:ring-4` with `--focus-ring` token
- Labels uppercase and `tracking-wide`
- Inline validation messages use `text-sm` and `text-red-600`

## Accessibility
- Ensure contrast >= 4.5:1 for normal text
- Use `aria-current`, `aria-label`, and visible keyboard focus styles

---

For detailed component usage examples, check component files in `src/components/ui/` (Button, Pagination) and follow the token names in `index.css`.
