# Contributing

Thank you for helping improve CoverCropper.

## Development

```bash
pnpm install
pnpm test
pnpm build
pnpm typecheck
pnpm lint
pnpm --filter @covercropper/playground dev
```

## Pull requests

- Keep crop math in `@covercropper/core`.
- Keep the Web Component as the single interactive implementation.
- Keep React/Vue/Angular packages as thin wrappers.
- Add or update tests for behavior changes.
- Do not introduce public styling APIs without documenting the contract.

## Release

Maintainers publish beta releases with:

```bash
pnpm build
pnpm test
pnpm publish:beta
```
