# Data Nordeste Frontend Project Memory

This document is shared project memory for agents and developers working on the
Data Nordeste frontend. Read it before making product, route, content model, or
integration changes.

Keep this file updated whenever you learn or change context that future agents
need: routes, business rules, content model assumptions, integrations,
environment behavior, or operational knowledge. Code-writing and implementation
style rules live in `CLAUDE.md`; do not duplicate them here.

## What This Application Is

Data Nordeste is a public portal for SUDENE-related regional data experiences.
The frontend presents regional indicators, publications, datasets, dashboards,
datastories, partner information, and institutional content.

Primary audiences include citizens, researchers, policy or institutional users,
and internal maintainers who consume or maintain regional data experiences.

The application is a Next.js App Router project. Most visible content is managed
outside the repository and rendered through frontend route/component logic.

## Core Domains

- **CMS content:** Contentful is the source of truth for navigation, page
  headers, homepage sections, posts, macrothemes, panels, preview cards,
  partners, institutional content, and survey questions.
- **Dataset catalog:** Zenodo is queried through the public records API. The app
  uses the Zenodo community `datane` as the catalog source.
- **Interactive panels:** Power BI dashboards are embedded in iframe views using
  the panel source configured in Contentful.
- **ArcGIS experiences:** StoryMaps and Experience Builder pages are embedded by
  ID and rendered as full-page iframe experiences.
- **Macrothemes:** Macrothemes organize indicators, publications, dashboards,
  datastories, colors, tags, and rich explanatory content.
- **Feedback survey:** Survey questions come from Contentful. Submissions go
  through Firebase App Check to an external feedback endpoint.

## Route Mental Model

- `/` renders the homepage: banner carousel, preview indicator cards, recent
  publications, macrotheme-based data sections, about section, partners, and the
  feedback survey.
- `/macrothemes/[slug]` renders one macrotheme page. The URL slug uses hyphens,
  then the route normalizes it to underscores before querying Contentful.
- `/posts` lists publications from Contentful. It filters content types such as
  `newsletter`, `additional-content`, and `data-story`.
- `/explore` lists Contentful publication records related to interactive data
  experiences, including `data-panel`, `newsletter`, `additional-content`, and
  `data-story`.
- `/catalog` lists dataset records from Zenodo community `datane`, with filters
  whose labels/options come from Contentful.
- `/data-panel/[id]` loads a Contentful panel by title/id and embeds its Power BI
  source. The optional `pageName` query parameter is appended to the iframe URL.
- `/data-stories/[id]` embeds an ArcGIS StoryMap. The ID must be a 32-character
  hexadecimal string.
- `/experience/[id]` embeds an ArcGIS Experience Builder app. The ID must be a
  32-character hexadecimal string.
- `/about` renders institutional content, contact information, collaboration
  network content, history, and values from Contentful.
- `/connections` renders partner/project cards from Contentful.
- `/health` returns `{ "status": "ok" }` for health checks.

## Business And Content Rules

- Contentful drives the public information architecture. Header/footer
  navigation, section text, page headers, content lists, and many visual labels
  should be treated as CMS-owned unless the code clearly hardcodes them.
- Content type values drive filtering and presentation. Known values are:
  `data-panel`, `newsletter`, `additional-content`, and `data-story`.
- Macrotheme route slugs use hyphens in URLs and underscores in Contentful IDs.
  For example, a route slug like `economia-e-renda` is queried as
  `economia_e_renda`.
- Preview indicator cards are Contentful `previewCardsCollection` entries. Cards
  can be shown on the homepage when `mostrarNaHomepage` is true.
- ArcGIS embed routes reject invalid IDs before rendering. Valid IDs currently
  match `/^[0-9a-f]{32}$/i`.
- ArcGIS StoryMaps and Experience Builder URLs get `embed=true` added when it is
  missing.
- Feedback submissions are suppressed locally for 24 hours after a successful
  submit using the `datane@feedback_submitted` localStorage key.
- Content revalidation depends on environment:
  - beta or Contentful preview: 60 seconds
  - production/default: 3600 seconds
- Beta disables search indexing through Next.js metadata robots settings.

## Integrations And Environment

- Direct Contentful GraphQL is used when
  `NEXT_PUBLIC_CONTENTFUL_SPACE` and `NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN` are
  present.
- Otherwise, the app calls `${NEXT_PUBLIC_HOST_URL}/contentful-api`.
  `/contentful-api` is not implemented as a Next.js route in this frontend. It
  is served by an Nginx proxy running on another VM that the development team can
  access.
- Zenodo records are fetched from `https://zenodo.org/api/records` with
  `communities=datane`.
- Firebase is used for survey feedback submission and App Check. The frontend
  expects Firebase public config variables, a ReCaptcha V3 key, and a feedback
  endpoint URL.
- Google Analytics is configured through `NEXT_PUBLIC_GA_ID`.
- Power BI and ArcGIS content are embedded through external URLs configured in
  Contentful or built from route IDs.
- The deploy `failover-runner` (`aws-datane-failover`) is arm64/Graviton. That
  is why `deploy-gamma.yml` builds `linux/arm64` and `deploy-prod.yml` builds
  both `linux/amd64` and `linux/arm64`, while `deploy-beta.yml` builds amd64
  only. Dropping `linux/arm64` breaks the deploy with `no matching manifest for
  linux/arm64/v8`. Consequence: `package-lock.json` must keep its
  `*-linux-arm64-*` entries, or the arm64 build fails resolving native
  binaries.
- arm64 images are built on native `ubuntu-24.04-arm` runners, never under
  QEMU. Emulated, `npm ci` takes ~250s and registry connections drop midway
  (`ECONNRESET`), consistently rather than intermittently. Prod builds each
  architecture in its own job, pushes by digest, and `merge-image` publishes
  `:latest` plus the release tag as one multi-arch manifest, because
  `push-prod` (amd64) and `push-failover` (arm64) pull the same tag.
- Do not document secrets or concrete environment values here. Use
  `.env.sample` for variable names and the project root `README.md` for local
  setup flow.

## Removed Features

### Custom report (`/relatorio`), removed 2026-09-24

Users picked a municipality and a macrotheme and got a PDF generated by the
sibling Automatic-Reporting FastAPI service. It had been in production since
tag `v2.3.0` (2026-09-23). The last commit with the whole feature is
`185eba4`. The removal is split into two commits, so that reverting both
brings it back: `refactor: remove a feature de relatório personalizado` (code
and docs) and `chore: remove variáveis do Automatic-Reporting do deploy`
(`.env.sample`, `Dockerfile.production`, `deploy-*.yml`). Use
`git log --grep "relatório personalizado"` to find the SHAs.

The revert only restores the repository. Before tagging a release, check
these things that live outside it:

- The `automatic-reporting-prod` container runs on the prod VM, and the
  frontend reaches it through the `docker network connect` step in
  `deploy-prod.yml`. The server-side proxies read `AUTOMATIC_REPORT_API_URL`
  (internal name, prod only) before `NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL`.
- The GitHub Actions variables `NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL` and
  `AUTOMATIC_REPORT_API_URL_PROD` exist. If either one is missing, the
  container starts with an empty value, the build stays green, and the report
  fails at runtime.
- The Contentful content type `report` (banner, `textoDoBanner`,
  `textoDoMunicipio`, `textoDoTema`) and `themeCollection` still exist.
  `REPORT_PAGE_QUERY` fails hard on a missing type, because only
  `UNRESOLVABLE_LINK` is tolerated.
- No redirect for `/relatorio` was added to `next.config.mjs` after the
  removal. A redirect would catch the route before the page does.
- The Automatic-Reporting API contract has not changed. The restored tests use
  fakes, so they pass either way. Check the integration against the real
  backend on beta.

## Agent Notes

- Treat this file as the durable orientation layer for future agents. If a
  product behavior is learned during a task and is likely to matter again, add it
  here.
- Keep `CLAUDE.md` focused on how agents should write code. Keep this document
  focused on what the project is, how it behaves, and what external systems it
  depends on.
- Prefer AI-oriented architectural comments near critical code paths when the
  context belongs to a specific invariant, guard, query, adapter, compatibility
  branch, or performance tradeoff. Use this document for broader project memory;
  use local comments for durable steering that future humans and coding agents
  need during refactors or code generation.
- Local comments should explain intent, constraints, legacy compatibility,
  production concerns, edge cases, and non-obvious decisions. Avoid comments that
  merely describe syntax or repeat what the next line of code already says.
- Useful high-signal prefixes include `IMPORTANT:`, `WARNING:`, `INTENTIONAL:`,
  `LEGACY:`, `PERF:`, and `DO NOT CHANGE:`.
- Before changing a route or integration, inspect the related Contentful query,
  constants, and component behavior. Many business decisions are encoded across
  `src/app`, `src/utils/queries.ts`, `src/utils/constants.ts`,
  `src/utils/contentful.ts`, `src/lib/zenodo.ts`, and `src/lib/firebase.ts`.
- For docs-only changes, no application test is normally required. If the change
  touches code, follow the validation guidance in `CLAUDE.md`.
