## What this changes

<!-- One or two sentences. If it fixes an issue, link it with "Fixes #123". -->

## Why

<!-- The reasoning. Especially useful for judgement calls: why this approach
     over the alternative you considered. -->

## Type

- [ ] Bug fix
- [ ] New feature
- [ ] New chain adapter
- [ ] Refactor or cleanup
- [ ] Documentation
- [ ] Test

## Verification

<!-- All four must pass. CI runs exactly these. -->

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`

## Boundaries respected

- [ ] No scoring logic in `packages/blockchain` — adapters fetch and normalise only
- [ ] `@blocksense/intelligence` is still headless: no React, no CSS, no I/O
- [ ] No token amount passes through `Number` or `parseFloat`
- [ ] No new dependency, or the justification is below

## Notes for the reviewer

<!-- Anything worth a closer look. New adapter? Point at the guide. -->
