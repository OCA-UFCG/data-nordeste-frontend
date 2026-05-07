# Code style

Functions: 4-20 lines. Split if longer.
Files: under 500 lines. Split by responsibility.
One thing per function, one responsibility per module (SRP).
Names: specific and unique. Avoid data, handler, Manager. Prefer names that return <5 grep hits in the codebase.
Types: explicit. Avoid any, Record<string, unknown>, and untyped functions.
No code duplication. Extract shared logic into a function/module.
Early returns over nested ifs. Max 2 levels of indentation.
Exception messages must include the offending value and expected shape.

# Comments

Keep your own comments. Don't strip them on refactor — they carry intent and provenance.
Write WHY, not WHAT. Skip // increment counter above i++.
Docstrings on public functions: intent + one usage example.
Reference issue numbers / commit SHAs when a line exists because of a specific bug or upstream constraint.
Prefer architectural comments near the critical code path they explain. Locality
matters: a comment beside the invariant, guard, query, adapter, or compatibility
branch is more useful to humans and AI coding agents than context hidden in a
distant document.
Use intent/constraint comments to preserve architectural decisions, production
constraints, legacy compatibility requirements, performance tradeoffs, edge
cases, and invariants.
Treat these comments as persistent steering for AI coding agents during
refactors and code generation. They should make it harder for future edits to
accidentally erase non-obvious behavior.
Use clear prefixes when the risk is high: IMPORTANT:, WARNING:, INTENTIONAL:,
LEGACY:, PERF:, DO NOT CHANGE:.
Avoid redundant comments that merely restate syntax or obvious control flow.

GOOD:

```ts
// LEGACY: Contentful stores macrotheme IDs with underscores, while public URLs
// use hyphens. Keep this normalization or existing shared links will break.
const contentfulMacrothemeId = routeSlug.replaceAll("-", "_");

// PERF: This fetch is cached for the whole page render because the Zenodo
// endpoint is slow and the catalog filters reuse the same response.
const records = await getCachedZenodoRecords();

// DO NOT CHANGE: ArcGIS accepts many URL shapes, but these routes intentionally
// reject non-hex IDs before rendering to avoid embedding arbitrary external URLs.
if (!ARC_GIS_ID_PATTERN.test(id)) notFound();
```

BAD:

```ts
// Replace hyphens with underscores.
const contentfulMacrothemeId = routeSlug.replaceAll("-", "_");

// Get records.
const records = await getCachedZenodoRecords();

// If id is invalid, show 404.
if (!ARC_GIS_ID_PATTERN.test(id)) notFound();
```

# Tests

This project exposes automated tests through npm test.
Before finishing code changes, run npm run lint. Run npm test when changing tested logic or fixing bugs. Run npm run build when changing routes, Next.js config, types, or integrations.
Bug fixes get a regression test when test infrastructure exists.
Mock external I/O (API, DB, filesystem) with named fake classes, not inline stubs.
Tests must be F.I.R.S.T: fast, independent, repeatable, self-validating, timely.

# Dependencies

Inject dependencies through constructor/parameter, not global/import.
Wrap third-party libs behind a thin interface owned by this project.

# Structure

Follow Next.js App Router conventions.
Prefer small focused modules over god files.
Predictable paths: src/app, src/components, src/lib, src/utils, public.

# Formatting

Use the language default formatter (prettier). Don't discuss style beyond that.

# Logging

Structured JSON when logging for debugging / observability.
Plain text only for user-facing CLI output.
