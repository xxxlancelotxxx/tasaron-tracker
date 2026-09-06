# Teknik Ofis Haftalık İlerleme Paneli

## 0. Research Log
- Embedded reference: Professional SaaS dashboard direction selected from the frontend design guidance; no existing UI or brand system was present in the repository.
- Project schema source: `supabase_schema.sql` inspected for the weekly progress and subcontractor data contracts.
- Decision: A restrained technical-office surface using slate neutrals, blue PV, green EV, and red AC as semantic chart tokens.
- Design iteration: Complete visual overhaul from amateur template to professional SaaS dashboard.

## 1. Design System
- Canvas: `#f8fafc` (slate-50); surface: `#ffffff`; ink: `#0f172a` (slate-900); muted ink: `#64748b` (slate-500); border: `#e2e8f0` (slate-200).
- PV: `#2563eb` (blue-600); EV: `#16a34a` (green-600); AC: `#dc2626` (red-600); warning: `#d97706` (amber-600); risk: `#dc2626` (red-600).
- Chart reference lines: SPI `#d97706` (amber-600); CPI `#7c3aed` (violet-600); grid and borders use `#e2e8f0`.
- Dark canvas: `#0b1120` (slate-950); dark surface: `#111827` (slate-900); dark border: `#1e293b` (slate-800).
- Spacing follows a 4px base through Tailwind spacing tokens. Cards use `rounded-xl`, controls use `rounded-lg`.
- Elevation uses multi-layer shadows: `shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_14px_rgba(15,23,42,0.03)]`.
- Focus uses the blue ring token with offset: `focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1`.

## 2. Typography
- UI font: Inter via `next/font/google` with latin-ext subset for Turkish glyph coverage.
- Page title: `text-[15px]` / `font-semibold`; section title: `text-[15px]` / `font-semibold`; body: `text-[13px]`; metadata: `text-[11px]`.
- Numeric metrics use tabular numerals for scanability.
- KPI values: `text-[32px] font-bold`.

## 3. Primitives
- `Card`, `Table`, `Badge`, `Button`, `Select`, `Progress`, and `Alert` are shadcn-compatible primitives under `components/ui`.
- Badge includes colored dot indicators for semantic status (good, medium, risk, neutral).
- Button uses `h-9` height with `text-[13px]` and active states.
- Table header uses `bg-slate-50/80` with `text-[11px] uppercase tracking-wider`.
- Select uses `h-9` height with `rounded-lg`.

## 4. Layout Grammar
- Sidebar: Fixed dark shell (`bg-slate-950`) with lucide-react icons, usePathname-based active indicators, and "Modüller" section label.
- Topbar: Sticky with `backdrop-blur-md`, project chip, and user avatar.
- Content: `lg:pl-60` for sidebar offset; mobile uses horizontal scrollable nav strip.
- Mobile: `MobileNav` component shows on `lg:hidden` with horizontal scroll.

## 5. Dashboard Components
- KpiCard: Gradient backgrounds per tone (blue/emerald/amber/red/slate), lucide icons, `text-[32px]` values, trend arrows (TrendingUp/TrendingDown/Minus).
- EvmTrendChart: ResponsiveContainer 360px min, styled tooltip, semantic line colors.
- WorkflowPanels: Icon-prefixed headers, status badges with dots, "Kritik" and "Aksiyon" cards.
- EvmTable: Sticky header, tabular numerics, Badge-wrapped CPI/SPI values.

## 6. Interaction and States
- Filters update the visible chart/table without a route transition.
- Chart tooltip exposes PV, EV, AC, SPI, and CPI for the hovered week.
- Loading, error, and no-data states are explicit with icon-prefixed empty states.
- Reduced-motion users receive no transition-dependent information.

## 7. Responsive Behavior
- Chart container has a 360px minimum visual height and uses `ResponsiveContainer`.
- Contractor table scrolls horizontally below `md`; important status and score columns remain readable.
- Sidebar hidden below `lg`; replaced by MobileNav horizontal strip.
- KPI grid: 4-col desktop → 2-col tablet → 1-col mobile.

## 8. Accessibility
- Form controls have visible labels with `htmlFor` attributes; chart has a descriptive title and legend.
- Status is communicated by text and badge color (with dot indicator), never color alone.
- Table headers use semantic `th`; focus-visible rings are retained.
- Sidebar nav uses `aria-label="Ana gezinme"` and `aria-current="page"`.

## 9. File Manifest
- `app/globals.css` — Design tokens and utility layers
- `app/layout.tsx` — Root layout with Inter font
- `app/page.tsx` — Landing page with feature cards
- `app/login/page.tsx` — Login/Signup form
- `app/dashboard/layout.tsx` — Dashboard shell (Sidebar + MobileNav)
- `app/dashboard/page.tsx` — KPI grid, EVM chart, workflow panels, EVM table
- `app/dashboard/timesheets/page.tsx` — Timesheet CRUD with Select primitive
- `app/dashboard/reports/page.tsx` — Export buttons with lucide icons
- `components/layout/Sidebar.tsx` — Dark sidebar with usePathname, MobileNav
- `components/layout/Topbar.tsx` — Sticky blurred topbar
- `components/dashboard/KpiCard.tsx` — Gradient KPI cards with trend icons
- `components/dashboard/EvmTable.tsx` — Professional data table
- `components/dashboard/EvmTrendChart.tsx` — Recharts line chart
- `components/dashboard/WorkflowPanels.tsx` — Critical items + pending timesheets
- `components/ui/*` — Card, Badge, Table, Button, Select, Progress, Alert

## 10. Accepted Debt
- The date picker uses the platform date input to avoid introducing a second calendar dependency; it can be replaced with the project's generated shadcn Calendar when installed.
- Supabase generated database types are not available in this repository, so the server adapter narrows selected rows at the boundary.
