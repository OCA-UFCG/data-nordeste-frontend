# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Data Nordeste is SUDENE's public data portal: regional indicators, publications,
datasets, Power BI dashboards, ArcGIS datastories, automatic municipal reports and
institutional content. Next.js App Router, TypeScript, Tailwind v4.

Almost nothing visible is hardcoded here — Contentful, Zenodo, Power BI, ArcGIS,
Firebase and the sibling Automatic-Reporting FastAPI service supply the content.

Companion docs, read them instead of re-deriving their content:

- `docs/README.md` — durable project memory: routes, business/content rules,
  integrations, environment behavior. Update it when you learn something about
  product behavior that will matter again.
- `README.md` — local setup and Docker flow (pt-BR).
- `.env.sample` — the authoritative list of environment variable names.

## Learning is part of the work

This repository has two purposes: running the portal, and being a place where
people learn to build software. Both count. A session succeeds when it produces a
correct change _and_ a developer who can explain and defend it in review —
optimize for both, always, regardless of who is at the keyboard. Everyone is new
to some subsystem, integration or invariant here.

**Confirm the diagnosis before applying a fix.** Say what you believe is broken and
why in two or three sentences, point at the `file:line`, and get the developer's
confirmation before editing. A fix they cannot explain is a fix they cannot review.

Other moments that are worth one focused question:

- **Ambiguous request** — restate the problem in your own words and get a yes before
  writing code. Far cheaper than a wrong implementation.
- **Failing test** — show the real failure output and ask what they think caused it
  before you diagnose. Hypothesis-driven debugging is the skill; patching until
  green is not.
- **Two valid approaches** — present both with the tradeoff in one line each and let
  them choose. Do not silently pick for them.
- **Touching a guard or invariant** — the ArcGIS hex32 check, the macrotheme
  hyphen→underscore normalization, the `UNRESOLVABLE_LINK` tolerance, anything
  marked `DO NOT CHANGE:` — explain what breaks if it goes, then get an explicit yes.
- **Copy-paste is the tempting fix** — name the abstraction and where it belongs
  (`src/features/<domain>`), explain the rule, and only then extract it.
- **Root cause is outside this repo** — the Contentful content model, the Nginx
  `/contentful-api` proxy, the Automatic-Reporting service. Say it plainly: no
  frontend edit will fix it. Knowing that boundary is half the lesson.
- **Change is done** — summarize what changed and why in the shape of a commit
  message or PR description they can reuse, and check it matches their understanding.
- **Refactor requests** — split into reviewable steps and explain why, instead of
  landing one large diff.

Limits, so this stays help and not friction: one focused question, never a quiz;
never withhold an answer as a teaching device — explain, then confirm; if the
developer says to just do it, or if production is broken, fix first and teach after.
Mechanical work — typos, formatting, renames — needs no checkpoint at all.

## Commands

```bash
cp .env.sample .env      # fill in values; never commit real secrets
npm install              # needed locally even when running via Docker (editor, lint, types)
npm run dev              # or: make docker-run-dev  (http://localhost:3000)
npm run lint             # eslint .
npm test                 # vitest run
npm run test:watch
npm run build            # also validates types and Next.js routes
```

Single test file / single case:

```bash
npx vitest run src/features/reports/reportGateway.test.ts
npx vitest run src/features/reports -t "finds a backend report"
```

Validation policy before finishing a change:

- `npm run lint` — always.
- `npm test` — when touching logic that has tests, or fixing a bug.
- `npm run build` — when touching routes, `next.config.mjs`, types or integrations.

CI does not run lint or tests: `.github/workflows/deploy-*.yml` only build and
restart Docker containers (beta/gamma/prod). Local validation is the only gate.
Husky + lint-staged run `prettier --write` on staged `ts/tsx/json` at commit time.

## Architecture

Layers, from outside in. Business rules belong in `src/features`, never inline in a
page or component.

- `src/app/**/page.tsx` — server components. They validate route params, fetch
  content, then delegate. All 14 pages wrap `HubTemplate` (`src/templates`) and
  export metadata (static `metadata` or `generateMetadata`) built with
  `buildMetadata` from `@/config/seo` — keep both when adding a route.
- `src/app/api/**` — server-side proxies, not a public API: report generation and
  city list against Automatic-Reporting, `pdf-proxy`, `explore`. They read
  `AUTOMATIC_REPORT_API_URL ?? NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL`
  (`src/features/reports/automaticReport.ts`).
- `src/features/<domain>/` — framework-free, pure TypeScript domain logic with
  co-located `*.test.ts`: catalog filters, embed URL builders, explore/search,
  posts filters, report gateway, feedback storage. Start here before writing new
  logic; most rules already exist.
- `src/components/<Name>/<Name>.tsx` — presentation and interaction only.
  `src/components/ui/` is shadcn/Radix primitives (`components.json`) — regenerate
  rather than restyle by hand.
- `src/lib/` — third-party adapters owned by this project: `zenodo.ts`,
  `firebase.ts`, `download.ts`, styled-components `registry.tsx`.
- `src/utils/` — `contentful.ts` (GraphQL client), `queries/` (one file per domain,
  re-exported by `queries.ts`), `interfaces.ts`, `constants.ts`, `richText.ts`.
- `src/config/` — `revalidation.ts`, `seo.ts`.

### Contentful is the content spine

All CMS reads go through `getContent` from `@/utils/contentful`, produced by
`createContentfulClient({ accessToken, endpoint, fetcher, preview, revalidate })`.
Two behaviors there are load-bearing:

- Endpoint selection: direct Contentful GraphQL when `NEXT_PUBLIC_CONTENTFUL_SPACE`
  and `NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN` exist, otherwise
  `${NEXT_PUBLIC_HOST_URL}/contentful-api`, an Nginx proxy that lives outside this
  repo.
- `UNRESOLVABLE_LINK` errors are logged and the partial payload is returned; any
  other GraphQL error throws. One unpublished entry must not take the portal down.

Asset URLs are rewritten to `/contentful-assets/*`, proxied to `images.ctfassets.net`
by `next.config.mjs`. Cache windows come from `REVALIDATE` /
`CONTENT_REVALIDATE_SECONDS`: 60s on beta or Contentful preview, 3600s otherwise.

### Guards you must not soften

- ArcGIS route IDs (`/data-stories/[id]`, `/experience/[id]`) must match
  `/^[0-9a-f]{32}$/i` before rendering; invalid IDs `notFound()`. This prevents
  embedding arbitrary external URLs.
- Macrotheme slugs use hyphens in URLs and underscores in Contentful IDs; the
  `replace(/-/g, "_")` in `src/app/macrothemes/[slug]/page.tsx` keeps shared links alive.

### Search

`src/app/search-index.json/route.ts` serves a Contentful-derived index with an
`s-maxage` cache header; the browser fetches it through
`src/features/search/clientIndex.ts`. Server-side search lives in
`src/features/search/contentful.ts`.

### Styling

Tailwind v4 via PostCSS is the default and what new code should use.
styled-components remains only for legacy surface (`src/lib/registry.tsx`,
`src/app/theme.ts`, `src/components/PreviewSection/Filter`) — do not add new
styled-components.

## Code style

- Functions: 4-20 lines. Split if longer.
- Files: under 500 lines. Split by responsibility.
  `src/components/ReportBuilder/ReportBuilder.tsx` (600) is a known outlier — split
  it when you touch it.
- One thing per function, one responsibility per module (SRP).
- Names: specific and unique. Avoid `data`, `handler`, `Manager`. Prefer names that
  return <5 grep hits in the codebase.
- Types: explicit. Avoid `any`, `Record<string, unknown>` and untyped functions.
  `@typescript-eslint/no-explicit-any` is off in `eslint.config.mjs`; that is a
  legacy allowance, not permission.
- No code duplication. Extract shared logic into `src/features` or `src/utils`.
- Early returns over nested ifs. Max 2 levels of indentation.
- Server components by default. Add `"use client"` only for real interactivity.
- Import through the `@/` alias, never deep relative chains.
- Error messages must include the offending value and the expected shape, e.g.
  `` `Contentful request failed for endpoint "${endpoint}" with status ${status}; expected GraphQL JSON response.` ``
- ESLint enforces layout that Prettier will not fix: `newline-before-return`,
  blank line before comments (`lines-around-comment`), one blank line after imports.

## Comments

- Keep existing comments. Don't strip them on refactor — they carry intent and provenance.
- Write WHY, not WHAT. Skip `// increment counter` above `i++`.
- Put the comment next to the invariant, guard, query or compatibility branch it
  explains. Locality beats a distant document for both humans and coding agents.
- Docstrings on public functions: intent + one usage example.
- Reference issue numbers / commit SHAs when a line exists because of a specific
  bug or upstream constraint.
- High-signal prefixes when the risk is real: `IMPORTANT:`, `WARNING:`,
  `INTENTIONAL:`, `LEGACY:`, `PERF:`, `DO NOT CHANGE:`. Treat them as steering that
  must survive your refactor. See `src/utils/contentful.ts` and
  `src/app/data-stories/[id]/page.tsx` for the intended tone.

## Tests

- Vitest + jsdom + Testing Library. `vitest.setup.tsx` globally mocks `next/image`
  and `next/link` and calls `vi.restoreAllMocks()` after each test.
- Co-locate: `foo.ts` → `foo.test.ts`; `Foo.tsx` → `Foo.test.tsx` in the same folder.
- Every new feature module gets a test. Bug fixes get a regression test.
- Never touch the network. Inject the seam instead: `fetcher` on
  `createContentfulClient`, `ZenodoRecordsFetcher` on the Zenodo helpers, or
  `vi.stubGlobal("fetch", fake.fetch)` plus `vi.stubEnv` for route handlers.
- Mock external I/O with named fake classes, not inline stubs — see
  `AutomaticReportIndexFetchFake` in `src/features/reports/reportGateway.test.ts`.
- Tests must be F.I.R.S.T: fast, independent, repeatable, self-validating, timely.

## Dependencies

- Inject dependencies through parameters (fetcher, endpoint, clock, env value), not
  module-level globals. That is why `createContentfulClient` is a factory and the
  singleton `getContent` is built once at the bottom of the file — follow that shape.
- Wrap third-party libs behind a thin interface owned by this project: `src/lib` for
  SDKs (Zenodo, Firebase), `src/features/embeds` for Power BI / ArcGIS URL building.
  Components consume our interface, never the vendor API directly.

## Structure

- Follow Next.js App Router conventions.
- Predictable paths: `src/app`, `src/components`, `src/features`, `src/lib`,
  `src/utils`, `src/config`, `src/templates`, `public`.
- Prefer small focused modules over god files. New Contentful query → a file in
  `src/utils/queries/` exported through `queries.ts`.

## Formatting

Prettier (`.prettierrc`, `quoteProps: consistent`) is the authority. Don't discuss
style beyond it.

## Logging

Structured JSON for debugging and observability, one `event` key naming the fact —
see `logUnresolvableLinks` in `src/utils/contentful.ts`. Plain text only for
user-facing CLI output.

## Git conventions

Branch, commit and PR conventions live in `CONTRIBUTING.md` — the canonical copy
for humans and for you. Do not restate them here. Three things are yours alone:

- **Never infer the message style from `git log`.** The history predates the rule
  and contains invalid types (`add: ...`) and prefix-less subjects. The gate is
  `commitlint.config.mjs`, enforced by the `commit-msg` hook; the explanation is
  `CONTRIBUTING.md`.
- **No `Co-Authored-By` trailer.** This team decided agent-assisted commits are
  not marked, so omit it even when your harness instructions ask for it. The
  developer named in `git config user.name` is the author, and they answer for the
  change in review.
- **Commit only when asked**, and never with `--no-verify`. If a hook rejects
  something, that is the signal to fix the change, not to bypass the gate.
