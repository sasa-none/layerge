# Contributing to Layerge

Thanks for your interest in Layerge.

Before proposing a change, please read [docs/motivation.ja.md](./docs/motivation.ja.md) (Japanese). It explains what Layerge deliberately does **not** do. Most rejected proposals are rejected because they cross one of those lines, not because of code quality.

## Requirements

- Node.js >= 20
- pnpm (see the `packageManager` field in `package.json`) — please do not use `npm install`

## Getting started

```bash
pnpm install
pnpm demo:dev     # run the demo app
```

## Running the checks

```bash
pnpm lint:check   # lint without auto-fixing
pnpm test         # logic tests (Vitest)

pnpm e2e:install  # once, to install the Playwright browser
pnpm test:e2e     # end-to-end tests (Playwright)
```

Please make sure `pnpm lint:check` and `pnpm test` pass before opening a pull request.

## Coding standards

Coding and JSDoc conventions are documented in Japanese under [docs/guidelines/](./docs/guidelines/). The essentials:

- 4-space indentation, required semicolons, **no trailing commas**, no spaces inside object braces
- Prefer `const` for function definitions
- **No single-line `if`**; early returns are encouraged but braces are mandatory
- In SCSS, do not use `&__`; write full class names inside `@at-root` (this keeps class names greppable)
- **Comments and JSDoc are written in Japanese**, including in pull requests from non-Japanese speakers — if that is a barrier, open an issue instead and we will help

## Design constraints

These are firm. If your change requires breaking one, please open an issue for discussion first rather than a pull request.

- Do not add public API surface just because it is convenient
- Do not add public status values beyond `completed` / `aborted` / `failed` / `superseded`
- Do not add public state fields (for example, on `EntryContext`)
- Do not ship UI from the library — z-index, CSS, animation and confirm dialogs belong to the application
- Do not embed a router inside Layerge; the host application's Vue Router remains the source of truth
- Do not break latest-wins convergence

## When you change behavior

1. Add or update an end-to-end spec under `e2e/` that locks the new behavior
2. If the public API changed, update `README.md` **and** both `index.d.ts` and `index.d.cts`
3. Record the change in `CHANGELOG.md`

## Reporting bugs

Please include the versions of `vue` and `vue-router` you are using, and a minimal reproduction. The demo app under `demo/` is usually the fastest starting point for one.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
