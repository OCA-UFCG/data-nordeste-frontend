# AGENTS.md

The agent guide for this repository lives in [`CLAUDE.md`](CLAUDE.md). Read it
before writing code here — it is the single source for code style, comments,
tests, dependency injection, architecture and the mentoring rules for this team.

This file used to duplicate those rules. It no longer does: two copies drift, and
"no code duplication" applies to documentation too.

Also relevant:

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — branch, commit and pull request
  conventions. The commit convention is enforced by a `commit-msg` hook, so an
  invalid message is rejected before it becomes a commit.
- [`docs/README.md`](docs/README.md) — project memory: routes, business and
  content rules, integrations, environment behavior.
- [`README.md`](README.md) — local setup and Docker flow (pt-BR).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
