# Shared period for Dashboard and Transacoes

## Context
The app currently mixes two different time scopes:
- Dashboard summary cards show all-time totals for saldo, receitas and despesas.
- A separate monthly block and the calendar are locked to the current system month.
- Transacoes has its own local filters and does not share the same period as Dashboard.
- The Transacoes screen shows two entry points for "Gerenciar categorias", which is redundant.

This creates inconsistent readings between summary and detail, and makes the calendar appear stuck on the current month.

## Goal
Create one shared period selection model for Dashboard and Transacoes so both screens reflect the same financial scope.

The selected period must support:
- Total geral
- A specific month and year

Cofrinhos remain cumulative for now. In a later phase, Cofrinhos may add an optional aporte history filter without changing goal progress.

## Scope
### In scope for phase 1
- Shared period state used by Dashboard and Transacoes
- Dashboard cards respect the selected period
- Dashboard calendar uses the selected month instead of the system month
- Dashboard chart anchors to the selected period while remaining readable in Total geral mode
- Transacoes uses the same selected period as the base filter
- Existing search/type/category/date filters in Transacoes remain as secondary refinements
- Remove the duplicated "Gerenciar categorias" button

### Out of scope for phase 1
- Changing how Cofrinhos progress is calculated
- Monthly goal progress
- Firestore or backend persistence for period selection
- Cross-user shared settings

## Recommended approach
Use a small shared period store/composable as the single source of truth.

Why this approach:
- Keeps Dashboard and Transacoes consistent without prop drilling
- Avoids router complexity for a feature that is mainly local state
- Makes phase 2 easier if Cofrinhos later wants to read the selected period for aporte history only

## Period model
Represent the period as one object with explicit mode.

Example shape:
- mode: 'total' | 'month'
- year: number | null
- month: number | null

Rules:
- mode 'total' ignores month/year for aggregate cards and transaction base filtering
- mode 'month' requires both month and year
- Initial state should be chosen from available transaction data when possible
- If there are transactions, default to the most recent transaction month instead of the current system month
- If there are no transactions, default to current month for the UI but keep totals naturally zero

## Shared behavior
### Dashboard
- Saldo, receitas and despesas cards use the selected period
- The monthly card becomes a period card and reflects the same period label as the selector
- Cofrinhos card remains all-time and must be labeled as cumulative to avoid confusion
- Analytic messages should use the currently selected period data
- Recent transactions may remain recent-all-time, but the label should make that scope explicit if kept

### Calendar
- Calendar is only meaningful in month mode
- When the selected period is Total geral, the calendar trigger should either be disabled or switch to the most recent month before opening
- Recommended behavior: disable opening in Total geral and show a short hint such as "Escolha um mes para usar o calendario"
- In month mode, the calendar header, grid and selected-day transactions all use the selected month/year

### Chart
- In month mode, the 6-point comparison chart should end at the selected month and go backwards 5 months
- In total mode, the chart can still show the latest 6 months as contextual trend data
- The chart title/subtitle must state the scope clearly so users do not confuse it with the aggregate cards

### Transacoes
- The shared period acts as a base filter before local refinements
- In total mode, the base filter includes all transactions
- In month mode, only transactions from the selected month/year are included
- Search, type, category and custom date range continue to apply on top of that base set
- Summary totals in Transacoes must reflect the post-period, post-filter result set

### Categories UI
- Keep a single visible entry point for "Gerenciar categorias"
- Remove the redundant button inside the top action area if the header action remains

## Data flow
1. Load the shared period state from a dedicated store/composable.
2. Derive a base transaction set from the selected period.
3. Dashboard computes cards, chart anchors and calendar data from that base set.
4. Transacoes starts from the same base set, then applies its local filters.
5. Whenever transactions change, recompute the available month range and keep the selected period valid.

## Edge cases
- If the selected month has no transactions, Dashboard and Transacoes should show zero/empty states without falling back silently to another month.
- If all transactions of the selected month are deleted, the period remains selected and the UI shows an empty month.
- If the user is on Total geral, cards remain aggregate and calendar stays unavailable.
- If imported/demo data spans multiple months, the selector must expose those months in descending order.

## UI changes
- Add a visible period selector shared by Dashboard and Transacoes
- Selector options:
  - Total geral
  - Month/year options derived from existing transactions
- Keep the selector label identical across both screens
- Update subtitles/captions so users always know whether they are seeing Total geral or a specific month
- Remove the duplicate category-management button from Transacoes

## Testing strategy
Manual verification for phase 1 should cover:
- Switching from Total geral to a month updates both Dashboard and Transacoes consistently
- Switching between months updates cards, chart anchor and calendar correctly
- Month with no transactions shows empty states without errors
- Total geral disables or blocks calendar access with a clear hint
- Local Transacoes filters still work after the shared period filter is applied
- Creating, editing and deleting transactions immediately updates both screens under the active period
- Demo user data exposes multiple months in the selector
- Only one "Gerenciar categorias" button remains visible

## Phase 2 note
For Cofrinhos, add only an optional aporte-history filter by period. Do not change:
- valorAtual
- progresso da meta
- total guardado geral

That future filter should be informational only.
