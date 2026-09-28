---
target: dashboard home
total_score: 14
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 5
timestamp: 2026-09-28T02-04-27Z
slug: client-src-pages-home-tsx
---
Method: dual-agent (A: design-review · B: detector-evidence). No browser automation available in this environment; browser visualization skipped.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Lifetime "Saldo total" next to income-only delta; budget save fails silently |
| 2 | Match System / Real World | 2 | "Saldo total" all-time vs Brazilian month-to-month thinking; future months plot as zero |
| 3 | User Control and Freedom | 1 | No validation/undo on budget; dead-end rows with no drill-through |
| 4 | Consistency and Standards | 2 | CHART_COLORS reused across pies (green = different categories); near-identical opposite-action CTAs |
| 5 | Error Prevention | 1 | Invented R$5.000 default budget; silent no-op on invalid budget input |
| 6 | Recognition Rather Than Recall | 2 | Recent rows lack category/payment/source signals |
| 7 | Flexibility and Efficiency | 1 | No period switcher, filters, shortcuts, or click-through to /transacoes |
| 8 | Aesthetic and Minimalist Design | 2 | ~7 competing focal points; heavy shadow-lg + hover:shadow-xl everywhere |
| 9 | Error Recovery | 0 | Zero error surfaces: failed summary/transactions/budget render stale/zero/nothing |
| 10 | Help and Documentation | 2 | Empty states guide, but no explanation of Saldo total vs mensal, budget, chart range |
| **Total** | | **14/40** | **Poor** |

## Design Specificity Verdict

Competent generic SaaS dashboard wearing finance copy — interchangeable with any CRUD admin. Biggest missed opportunity: money as a decision ("posso gastar?", "onde estourou?", "o que vence este mês?"), not a number. Detector (CLI, exit 0, 0 findings on home/navbar/modal/css): nothing co-rendered; earlier 14 gray-on-color hits on other pages were hover-pairing false positives.

## Overall Impression

Premium half-second hero, then confidence erodes through cryptic pies and a flatlining future-dated line. "Bonito, mas não confio no número e não sei o que fazer."

## What's Working

1. Hero information scent: greeting → label → balance → delta → dual CTA in one block.
2. Dark-mode discipline on every card, icon wash, axis, skeleton.
3. PT-BR money correctness via central brl() and toLocaleDateString.

## Priority Issues

- **[P1] Hero number untrustworthy**: lifetime balance + income-only delta labeled "vs. mês anterior". Fix: monthly balance primary, lifetime muted; delta matches the shown figure with explicit label.
- **[P1] Line chart plots 5 future months as zero**: 12 points now-6..now+5 with rotated labels. Fix: past 6–7 months only, straight labels, end-dot values.
- **[P1] Twin equal-weight pies**: shared palette, income pie ~1 slice, no values. Fix: keep expense donut with ranked legend (category + brl + %), drop/simplify income.
- **[P1] Budget rail invented and unforgiving**: default 5000 when unset, silent save errors, DOM-last vs visually-first. Fix: explicit empty state, inline save error, reconcile order.
- **[P1] Recent transactions dead end**: non-link divs, no category chip, unsorted, no "Ver todas →". Fix: links, chips/badges, sort desc, footer link.

## Persona Red Flags

- **Alex (power)**: no period/filter/compare, non-clickable chart/pie/rows, no shortcuts, client-side month filter over 1000-row fetch.
- **Sam (a11y)**: DOM order ≠ visual order (budget rail); recharts SVG with no text fallback; icon-only budget buttons lack labels (home Check/X); navbar aria-labels in English ("menu"/"close"); modal missing role=dialog/aria-modal/focus trap.

## Minor Observations

1. ArrowDownToLine fallback icon mislabels expenses (reads as download/income).
2. Skeleton heights don't match shipped layout (layout jump on load).
3. Despesas KPI in light red-400 vs siblings in slate-900 inverts emphasis.

## Questions to Consider

1. If the dashboard showed one number + one button for a user whose rent rose 15%, what survives?
2. What breaks (well) if lifetime "Saldo total" is banned and every figure is scoped to this month including parcelas and fixas?
