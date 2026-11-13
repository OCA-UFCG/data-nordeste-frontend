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
- `/reports` lets users choose a municipality or one of the nine Northeast
  states and a supported macrotheme, then opens a generated report through the
  Automatic-Reporting backend.
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
- Contentful content is cached with no expiry in every environment
  (`revalidate: false`, tag `contentful`), so visits do not spend the
  Contentful API quota. To show a published change, open
  `/atualizar-conteudo` and enter the password from the
  `CONTENT_CACHE_PASSWORD` runtime env var; it expires the tag and every
  route. Without that env var the page refuses to run. Each server keeps its
  own cache, so production (two origins behind Cloudflare) only refreshes the
  origin that served the request.
- Beta disables search indexing through Next.js metadata robots settings.
- Production `robots.txt` (`src/features/seo/robotsRules.ts`) blocks
  `/posts?*` and `/explore?*` because each query-string combination is a
  separate Contentful GraphQL request, and crawlers enumerating them used ~2/3
  of the API quota in Oct 2026. Add any new route that turns `searchParams`
  into Contentful variables. `/search` is blocked because it is a search
  result page, not because of quota (it filters a single cached query in
  memory); `/search-index.json` stays open since `/explore` downloads it.
  `/atualizar-conteudo` is blocked because it is operational. Canonical pages
  stay crawlable; `/catalog?page=N` stays open because its pagination comes
  from Zenodo. Any `appEnv` other than `prod` blocks everything.
- Google snippets (`<meta name="description">`) for `/data-panel/[id]` and
  `/boletim/[id]` come from the short-text Contentful field `seoDescription`
  on `panels` and `post`. Empty field falls back to the page's rich-text
  description. `buildMetadata` still truncates to 155 characters.

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
- Automatic reports are generated by the sibling Automatic-Reporting FastAPI
  service. The report preview proxies PDF requests through
  `/api/reports/generate` (the proxy triggers generation, polls the report
  index, and streams the PDF back with `Content-Type: application/pdf`), and
  the search list is proxied through `/api/reports/cities` as
  `{ states, areas, cities }`: the backend's `/estados` (the nine Northeast
  states), `/areas` (the areas of interest) and `/cities`, kept apart. Step 1
  ("Área de Interesse") first asks for a "Recorte"
  (`src/features/reports/reportScopes.ts`): "Município" searches only
  municipalities, "Estado" only states. Nordeste (with the geopolitical
  scopes), Caatinga, Semiárido and Área de atuação da Sudene (strategic
  scopes) are area scopes: choosing one picks the whole area, with no search.
  The Figma opens a state search under Nordeste; product decided (12/11/2026)
  that Nordeste is the whole region instead. An area scope only shows when
  `/areas` lists it, so environments whose backend has no `/areas` (beta and
  prod in Nov/2026) keep only Município and Estado. The area scopes show
  Desenvolvimento Social and Instrumentos Sudene disabled (no area data in the
  backend yet), and Estado shows only Instrumentos Sudene disabled (no
  `est_*` matview; Desenvolvimento Social got its state report on
  13/11/2026); disabled themes drop from the selection, and only Município
  offers every theme. An empty municipality search shows the first eight
  municipalities; states are never capped. A backend without `/estados` leaves
  the "Estado" search empty. A state or area name
  goes to the same `/relatorio/{nome}` route, which the backend routes to its
  state or area report (state/area Docs + `auto_relatorios_est` /
  `auto_relatorios_areaint` matviews, no charts or map yet; Minas Gerais waits
  for the data team). The server
  reads `NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL`, such as
  `http://127.0.0.1:8000`, to reach the FastAPI service. The `/relatorio`
  route served directly by Automatic-Reporting returns an HTML page, not a
  PDF, and is intentionally not used by the frontend preview; pointing pdf.js
  at it would fail to render.
- The deploy `failover-runner` (`aws-datane-failover`) is arm64/Graviton. That
  is why `deploy-gamma.yml` and `deploy-prod.yml` build
  `linux/amd64,linux/arm64` while `deploy-beta.yml` does not. Dropping
  `linux/arm64` breaks the deploy with `no matching manifest for
  linux/arm64/v8`. Consequence: `package-lock.json` must keep its
  `*-linux-arm64-*` entries, or the arm64 build fails resolving native
  binaries.
- Do not document secrets or concrete environment values here. Use
  `.env.sample` for variable names and the project root `README.md` for local
  setup flow.

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

## Panel Data Cache

- `queryDataDb` (`src/lib/dataDb.ts`) is wrapped in `unstable_cache`, the same
  mechanism as `src/features/navigation/content.ts` and
  `src/features/reports/content.ts`. The key includes the SQL and parameters;
  results are valid for 24 h (`DATA_DB_CACHE_SECONDS`) and tagged
  `DATA_DB_CACHE_TAG` (`"data-db"`). It serves every native panel demo.
- The source data (IBGE, PNUD) changes at most monthly, so a day-old answer is
  fine. Next stores the entries on disk (`.next/cache`), so a `docker restart`
  keeps them; a new container (every deploy) starts empty. Clearing without a
  deploy needs a server-side `revalidateTag(DATA_DB_CACHE_TAG)`, which no route
  calls yet.
- Results are stored as JSON and parsed on each read, so callers get their own
  rows. Failed queries throw and are not stored.
- The pages stay `force-dynamic`: the route still renders per request, only
  the database round trips are cached.
- `unstable_cache` is superseded by `"use cache"` in Next 16; moving to it
  needs `cacheComponents`, so migrate the three uses together.

## Native Panel Maps

- `ChoroplethMap` reads GeoJSON meshes from `public/maps/`, built from IBGE
  shapefiles by the scripts in `scripts/`. Each feature's `properties.name`
  holds the code the panel data uses as `region.code`.
- With a mouse (`(hover: hover) and (pointer: fine)`) the map zooms and pans.
  On touch screens it only zooms (pinch), so a one-finger drag keeps scrolling
  the page. The rule follows the pointer, not the width: on desktop the map sits
  in a column of about 300 to 470 px.
- The frame (`boundingCoords`) is always the whole filtered area. Selecting a
  municipality only sets `center` and `zoom` on top of it, so zooming out
  (`scaleLimit.min: 1`) goes back to the whole area. Framing the municipality
  itself used to lock zoom-out at that small box.
- The map box keeps the aspect ratio of the whole mesh, not of the filtered
  area, so the card does not change height between states. A wide state such
  as PE is drawn centred with blank space above and below.
- The map uses the canvas renderer; the other charts stay on SVG. Panning
  ~1,800 SVG paths was sluggish.

## Responsive Layout

Fixes from the October 2026 responsiveness study (P1 and P2).

- **P1, header:** the full header (logo, search, six menu items) needs about
  1,400 px, so `ResponsiveHeader` switches to it only from 1440 px; below that
  the compact (hamburger) header is used. The search box can shrink to 200 px
  and the menu items sit 8 px apart. New or longer menu labels in Contentful eat
  into that margin: check the header at 1440 px after adding one.
- **P2, carousels:** the `CardCarousel` arrows sit 48 px outside the carousel,
  which only fits the section gutters from `lg` (1024 px). Below that, swipe and
  the dots are the navigation.
- **Tablets (744–1194 px):** `.content-carousel` reserves 6rem for arrows.
  `CardCarousel` adds `content-carousel-lg-arrows` so that reserve only applies
  from `lg`; below it the 6rem showed as a gap where a card was cut in half.
  `GalleryCarousel` (about page) is centred and shows arrows from `md`, so it
  keeps the reserve. Indicator cards go 2 → 3 → 4 per view (`md`/`lg`/`xl`)
  and the home theme grid 2 → 3 → 4 columns, because at 4 columns below `xl`
  long names such as "Desenvolvimento Social" ran under the card's arrow.
- **Indicator card edges:** the items pad 8 px on both sides, so the strip
  offsets both sides (`-mx-2`) and the clipping viewport gets 8 px of padding
  back (`-mx-2 px-2`). Without that, the first and last cards sat on the
  `overflow-hidden` edge and lost their shadow.

## FNE Panel Demo (`/demo/fne`)

- Rebuilds the ArcGIS Experience of the `fundo_financiamento` panel (the only
  panel not on Power BI) with native charts. Nothing shown on Beta was dropped:
  both dashboards (Quantidade / Valor de contratações) became tabs, and the
  totals, the charts by sector, beneficiary size, PNDR typology, population
  size, state, Semiárido and RIDE, the top 20 municipalities, the year layers
  with the state limit, and the "Sobre" and "O que é o FNE?" texts all stay.
- Texts around the panel (intro, "Saiba mais" and "Conteúdos relacionados")
  come from the Contentful "panels" entry `fundo_financiamento`, like the other
  demos. The ArcGIS "Sobre" and "O que é o FNE?" texts sit in the header ⓘ.
- Data comes from the `instrsudene_fne` schema, which exists only on the
  **Gamma** database (`10.5.8.137`), not on Beta. Point the tunnel behind
  `DATA_DB_URL` at Gamma to run the demo locally.
- `fne_indicadores` (municipality × year) feeds totals, sectors, territorial
  breakdowns and the map; `fne_programas` (finalidade × setor × programa ×
  porte) feeds the beneficiary-size chart and the top 20, joined to
  `fne_indicadores` on `cd_mun` and year for the territorial filters.
- The ArcGIS pie "Contratações por tipo de porte" counted rows of the source
  table; the demo sums the tab's metric per size instead, so the chart adds up
  to the panel total.
- Map: `LayeredMap` draws municipalities on an ECharts `geo` component, so the
  state limit can be a `lines` series sharing its zoom and pan. The limit is
  computed from the municipal mesh (segments used once or shared by two
  states), which also covers the Sudene part of MG and ES. The class breaks
  and colours are the ArcGIS ones, as are the bar colour (`#00bd47`) and the
  colours of the beneficiary-size pie.
- Municipalities are a multi-choice filter (`MultiSelectFilter`, in
  `src/components/Panel/filters/`): the URL keeps them as `?mun=2611606,2304400` (a
  single code still works), the SQL uses `cd_mun = ANY($n)`, clicking the map
  adds or removes a municipality, and the map frames the whole selection. The
  choice is applied when the list closes, so ticking several boxes queries
  once.

## IDH Panel Demo (`/demo/idh`)

- The reference is the navigable prototype ("Painéis Data Nordeste", `idh.html`),
  reproduced in layout and behaviour: dark cover (back link, breadcrumb,
  "Publicado em", macrotheme badge, lead), sticky filter bar, left rail of
  views above 900 px (top tab bar below), cards with footer, ⓘ and ⋯ menu,
  "Saiba mais sobre o IDH" with "Ler mais" and glossary. It replaced the
  Power BI-faithful version of `129cef4` (gauges, no ranking).
- The prototype building blocks (card, sheet, ⓘ, ⋯ menu, cover, filter bar
  shell, stat cards, state map and its fullscreen, "Saiba mais", sticky chain)
  live in `src/components/ProtoPanel/` and are shared with the demographic
  profile; IDH-only pieces stay in `src/components/IdhDashboard/`. The
  prototype CSS was ported to Tailwind with its exact values (`protoStyles.ts`
  holds the tokens); `max-[700px]`/`max-[900px]`/`max-[1100px]` are its
  breakpoints. Each panel sets its accent through CSS variables
  (`protoToneStyle`, `ProtoToneContext`): roots rendered by the server page
  take a `tone` prop, portals (sheet, popovers, dialog, tooltip) re-apply it
  because they render outside the panel tree.
- Deliberate deviations: the action green is the theme `green-800`
  (`#017f35`), not the prototype `#018f39`, which fails 4.5:1 under white
  text. The cover lead is capped at 1136 px (the prototype's 120ch in its own
  Inter build).
- Charts are hand-drawn SVG like the prototype, not ECharts: the line
  (`idhLineChart.ts` holds the geometry; the 0.4–0.8 axis widens only if a
  real value leaves it) and the map (`idhStateShapes.ts`, the prototype's nine
  state outlines in a 600 × 754 box). Colours and font are SVG attributes so
  "Baixar imagem" (PNG or SVG) serialises them; the ranking and group bars are
  HTML and only share and open the catalogue.
- Prototype rules that came from its demo data were not ported (state data
  only for 2021, "sem dado por estado", the undo toast): the `des_idh` views
  have the yearly series per state. The empty-state notice of the sex and
  colour views shows only when the database really has no group data.
- Card states follow the real app: skeletons while a filter navigation is
  pending, the error state with "Tentar de novo" (`router.refresh()`) when the
  query fails (`emptyIdhPanel` keeps the layout).
- WARNING: "Atualizado em 11/2026" in the card footers is the prototype's
  fixed text (`IDH_DATA_UPDATED_AT`); the database does not expose a load
  date yet.
- Group gaps (`idhGroupCompare.ts`): index points for IDH and Gini, percent
  for money; money bars end at the next hundred with 10% headroom.
- Gini cards have the catalogue item disabled ("Este dado ainda não tem
  página no catálogo"), as in the prototype.
- Local setup traps met while building it: two `.env` assignments on one line
  silently corrupt `NEXT_PUBLIC_CONTENTFUL_SPACE`, and either Contentful var
  missing falls back to `/contentful-api`, which only exists behind production
  Nginx (the error body is the portal's own 404 HTML). The panel's
  `DATA_DB_URL` needs the SSH tunnel up, which needs the internal network.

## Demographic Profile Panel Demo (`/demo/perfil-demografico`)

- Same approach as the IDH panel: the reference is the prototype's
  `perfil.html` (same artifact), rebuilt with the shared `ProtoPanel/` pieces
  in the "perfil" tone (pink accent `#d6537f`, women `#c2395f`, men `#96b02e`)
  and the real `dem_demografia.final_demografia` data. Cover, sticky filter
  bar, the `.dg` grid (big number, municipalities, map, sex, age pyramid) and
  `.dg2` (census series, colour or race), "Saiba mais" without glossary.
- Deliberate deviations from the prototype:
  - The map shows both views: "Municípios" (default, the real municipal mesh
    coloured by size band, ECharts canvas for performance through
    `ChoroplethCanvas`) and "Estados" (the prototype's nine-state SVG, click
    to filter). The prototype itself notes it draws states "em vez de
    contornos municipais".
  - Estado and Município keep multiple selection (up to 100, as before),
    styled like the prototype selects; links with several places still work.
  - Axis and labels come from the data (`perfilCharts.ts`: `niceAxis`,
    `formatCompactPeople`), not the prototype's fixed 40–60 Mi, so a single
    municipality gets a readable scale.
  - The change pill is green above zero, red below and neutral at 0,0%
    (`perfilChangeTone`); no pill for 2000, which has no previous census.
  - The empty state appears only when the database has no population for the
    chosen place and year.
- Field widths follow the perfil prototype (`.fb-in .fl`: flexible 110–240 px,
  Ano up to 140 px); the IDH bar keeps its fixed 204 px.
- Image download exists for the series and the colour or race chart (SVG);
  the map is a canvas and the other cards are HTML.
- Removed with this rebuild: `DemografiaCharts`, `DemografiaSaibaMais`,
  `PorteLegend`, `PyramidChart`, `ValueBars` and `buildPyramidOption`.
