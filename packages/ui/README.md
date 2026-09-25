# UI Package

The BlockSense design system. Every reusable visual component lives here, so a
restyle is a change in one package rather than a hunt through twenty pages.

```
ui/src/
├── AddressDisplay.tsx   truncated, copyable addresses
├── BrandLogo.tsx        the BlockSense mark
├── Button.tsx           primary / secondary / ghost / danger
├── ChainBadge.tsx       chain pill with the chain's colour
├── DropdownPanel.tsx    popover container
├── EmptyState.tsx       no-results state
├── ErrorState.tsx       recoverable error state
├── IconButton.tsx       icon-only action
├── InfoTip.tsx          hover explanation
├── LevelBadge.tsx       severity pill
├── LoadingState.tsx     spinner with label
├── Modal.tsx            dialog
├── Panel.tsx            titled content container
├── Segmented.tsx        segmented control
├── Skeleton.tsx         loading placeholder
├── StatCard.tsx         single metric tile
├── Toggle.tsx           on/off switch
└── theme/
    ├── levelStyles.ts     icons + Tailwind classes per severity level
    └── nodeKindStyles.ts  icons + Tailwind classes per graph node kind
```

## Rules

**Presentation only.** No fetching, no scoring, no business rules. A component
that needs to decide something belongs in `apps/web` or in a package.

**No duplicated class strings.** If a colour or spacing value appears twice, it
belongs in `theme/`. Tailwind utilities are fine; ad-hoc hex values are not.

**No knowledge of chains.** `ChainBadge` takes a `ChainId` and asks
`@blocksense/blockchain` for its metadata. It does not contain a `switch`.

## Where the level colours come from

Severity is decided in `@blocksense/intelligence`, which knows nothing about
colour:

```ts
// intelligence — semantic
levelLabel('high');       // 'High'
LEVEL_INFO.high.severity // 2

// ui — visual
levelStyles.high.badge    // 'bg-danger/10 text-danger-ink'
```

The split matters: the API needs the label and the severity, and has no use for
a Tailwind class. Keeping them together would force the server to depend on the
design system.

## Usage

```tsx
import { Button, LevelBadge, Panel, StatCard } from '@blocksense/ui';

<Panel title="Transaction">
  <LevelBadge level="unusual" />
  <Button variant="primary">Open report</Button>
  <StatCard label="Anomaly score" value="62" />
</Panel>
```
