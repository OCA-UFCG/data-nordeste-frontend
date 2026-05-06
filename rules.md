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

# Tests

This project does not currently define an automated test command in package.json.
Before finishing changes, run npm run lint. Run npm run build when changing routes, Next.js config, types, or integrations.
When tests are added, expose them through a single package.json script.
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
