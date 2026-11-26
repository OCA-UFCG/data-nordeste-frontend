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
- The catalog offers no "download all files" zip. Zenodo stopped serving
  `/api/records/{id}/files-archive` (403 from its nginx, and the record response
  no longer carries an `archive` link), so each file is downloaded through its own
  `files[].links.self` URL. Do not bring the zip button back without checking that
  endpoint again.
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
  Instrumentos Sudene disabled (no area data in the backend yet), and
  Desenvolvimento Social (IDH) is offered only in Nordeste (14/11/2026; the
  backend still lacks its area matview and Doc); Caatinga, Semiárido and Área
  de atuação da Sudene show it disabled with a "!" that explains, on hover,
  focus or tap, why the IDH does not apply to them. Estado shows only Instrumentos Sudene disabled (no
  `est_*` matview; Desenvolvimento Social got its state report on
  13/11/2026); disabled themes drop from the selection, and only Município
  offers every theme. An empty municipality search shows the first eight
  municipalities; states are never capped. A backend without `/estados` leaves
  the "Estado" search empty. A state or area name
  goes to the same `/relatorio/{nome}` route, which the backend routes to its
  state or area report (state/area Docs + `auto_relatorios_est` /
  `auto_relatorios_areaint` matviews, no charts or map yet; Minas Gerais waits
  for the data team). To reach the FastAPI service, the server reads
  `AUTOMATIC_REPORT_API_URL` and falls back to
  `NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL`, such as `http://127.0.0.1:8000`.
  Every deploy sets `AUTOMATIC_REPORT_API_URL` to the backend's Docker-network
  address. From inside the VM, the public URL loops back through the LSD front
  door. In Nov/2026 the front door stopped allowing that, which broke beta
  reports until beta got the internal address too. The `/relatorio`
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

LEGACY: since the MapLibre swap (next section) only the Power BI demos
(`/demo/*-powerbi`) still use `ChoroplethMap`/`ChoroplethCanvas` and
`public/maps/*.json`; the IDH, PIB and profile panels use `PanelMap`.

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

## Panel Maps (MapLibre)

The map card of `/demo/pib`, `/demo/idh` and `/demo/perfil-demografico` is the
shared `PanelMap` (`src/components/PanelMap/`, domain rules in
`src/features/panelMap/`; `maplibre-gl` only behind `src/lib/panelMapEngine`).
Design: `docs/superpowers/specs/2026-11-23-mapa-paineis-design.md`.

- **Source of the data:** Drive folder "Mapas_painéis" (id
  `1zXWbyU02PrbuZj9JQQRjf9bwZf-GoKg6`, public by link). The data team owns the
  files; `scripts/geodata/drive_manifest.json` keeps their IDs, so replacing a
  file in Drive keeps the ID. Geodata is never committed to this repository.
- **Pipeline** (`scripts/geodata/`, Python 3 stdlib plus the GDAL CLIs
  `ogr2ogr`, `gdal_translate`, `gdalwarp` and `gdaldem`; no geopandas):

  ```bash
  RAW=/tmp/geodata-raw; OUT=/tmp/geodata        # any empty dirs
  python3 -I scripts/geodata/geodata.py download "$RAW"
  python3 -I scripts/geodata/geodata.py build "$RAW" "$OUT"
  # optional: compare the maps with the database (tunnel + DATA_DB_URL, read-only)
  DATA_DB_URL=... ../Automatic-Reporting/.venv/bin/python -I scripts/geodata/compare_db.py "$OUT"
  python3 -I scripts/geodata/geodata.py issues-pdf "$OUT/data-issues.json" relatorio.pdf
  ```

  `build` writes `vector/*.geojson` (`pib`, `demografia`, `idh`, `estados`,
  `municipios`, `areas`, and `estados_<area>` / `estados_fora_<area>` for
  `nordeste`, `semiarido`, `caatinga`, `sudene`), `raster/aridez_<ano>_<area>.png`, `styles.json` (classes and outlines read
  from the `.qgz`), `manifest.json` and `data-issues.json`. Each aridez PNG is
  clipped to one area (`nordeste`, `semiarido`, `caatinga`, `sudene`; 16 files):
  `gdal_translate -r nearest` repeats each 0.1° pixel on a 0.01° grid (same
  extent, so `manifest.aridez.bounds` holds; no class value changes), then
  `gdalwarp -cutline` with that area's polygon leaves the outside as nodata
  (transparent after `gdaldem color-relief`). The same `gdalwarp` reprojects to
  Web Mercator (`-t_srs EPSG:3857 -te <bounds> -te_srs EPSG:4674 -ts`): the
  MapLibre `image` source only takes the 4 corners in lon/lat and stretches the
  image linearly in Mercator, so a lat/lon PNG drew up to ~17 km (0.15°) south
  of its real place in the middle of the Nordeste (~10 km in RN). `-te` keeps
  the exact extent (the manifest bounds still hold) and `-ts` instead of `-tr`
  stops GDAL from rounding the edge. The cutline is the unsimplified
  area polygons in a temp file: the simplified `areas.geojson` has degenerate
  rings that gdalwarp rejects ("Cutline polygon is invalid"). Without the
  finer grid the edge would follow the 0.1° source pixels, since gdalwarp
  masks the cutline on the source grid. `estados_<area>.geojson` is the part
  of each state inside the area: one feature per UF (`code` = sigla, `name` =
  the `uf` column of `sudene_mun.shp`, same text as `estados.geojson`), the
  `ST_Union` of the `sudene_mun.shp` municipalities flagged `Sim` for the area
  (same flags as the municipal vectors), simplified like the other vectors so
  it matches the municipal mesh (`area_states_select`). Real counts: 9 UFs in
  nordeste and caatinga, 11 in semiarido and sudene. `estados_fora_<area>` is
  the rest of those UFs: the `brasil_estado_4674.shp` state minus that union
  (`ST_Difference`, `area_states_outside_select`; the municipal shapefile is
  joined as `'<path>'.sudene_mun` in the top-level JOIN, since OGR does not
  resolve another datasource inside a subquery). The two sources' borders do
  not coincide exactly, so the difference also has thousands of thin slivers
  along the state edges (hundreds to ~2000 parts per UF), which the map would
  draw as a dotted outline. `drop_outside_fragments` drops every part whose
  outer ring is under `MIN_OUTSIDE_PART_DEG2` (1e-3 deg², about 12 km²); only
  `estados_fora_<area>` is filtered, and the largest fragment dropped is about
  12 km². The data itself is not corrected, only the sliver noise is not
  shipped. After `-simplify` the
  difference comes out as nested `GeometryCollection`s with collapsed
  lines/points; `polygon_parts` keeps the polygons at any depth (without the
  recursion BA and PE lost their whole remainder). A UF with nothing left is
  dropped (`has_polygon`, then the fragment filter): PB, PI and RN drop out of
  `estados_fora_nordeste` and `estados_fora_sudene`, since they lie entirely
  inside those areas. Downloaded files are
  untrusted data: never run anything from `$RAW`. `issues-pdf` needs
  `google-chrome` on the PATH. The SELECTs live in `sql.py` (text only, tested
  on stdlib `sqlite3` with stub spatial functions in `tests/test_sql.py`);
  `build.py` runs them and writes the files. Tests:
  `python3 -m unittest discover -s scripts/geodata/tests -v`.

- **Where it runs: gamma only, for now.** The VM keeps the directory at
  `/opt/datane/geodata`; `.github/workflows/deploy-gamma.yml` mounts it with
  `-v /opt/datane/geodata:/geodata:ro -e GEODATA_DIR=/geodata`. Beta and
  production do not mount it. To publish new data:

  ```bash
  sudo mkdir -p /opt/datane/geodata            # once, on the VM
  rsync -av --delete "$OUT/" <gamma-host>:/opt/datane/geodata/
  ls /opt/datane/geodata/vector                # the five GeoJSON files
  ```

  The route reads the files on each request (no restart; browsers cache them
  for 24 h). Locally, set `GEODATA_DIR` in `.env` to `$OUT`.

- **Engine failure:** when MapLibre cannot be imported or cannot create the
  map (no WebGL), the engine calls `onError` and `PanelMap` shows a "Mapa
  indisponível" notice (`ENGINE_UNAVAILABLE`) instead of a blank box.
- **Serving:** `/api/geodata/[...path]` (`src/app/api/geodata/`) reads from
  `GEODATA_DIR`, accepts only `.json`, `.geojson` and `.png` inside that
  directory and answers 503 with the missing variable when it is empty.
  `data-issues.json` sits in the same directory but is never served
  (`resolveGeodataFile` denies it by name): it is the data team's report, not
  map data.
- **Zoom levels** (`src/features/panelMap/mapRecorte.ts`): area of interest
  below zoom 6.5, state from 6.5 (`STATE_ZOOM`), municipality from 8.5
  (`MUNICIPALITY_ZOOM`); the IDH stops at state (`deepest`). Going down uses
  those absolute thresholds and applies the Estado/Município filter under the
  map centre. Both codes come from the one indicator feature under the centre
  (municipal: its `uf` and `code`; IDH: its `code`), and that layer is
  filtered to the area of interest, so the map never emits a code the server
  would drop (`keepKnown`). With the centre outside the area or over the sea
  there is no feature, and the recorte stays as it is, except when zooming out
  to the area level (below the anchor minus the tolerance): that clears the
  recorte without a centre feature, since the empty recorte always round-trips.
- **Boundaries by zoom** (`panelMapStyle.ts`; only the municipal layer has a
  `minzoom`, from `MUNICIPAL_LINES_ZOOM` = `MUNICIPALITY_ZOOM` - 1): the map
  opens on the area of interest with its outline. State limits show at every
  zoom (user decision, 24/11/2026: they used to start at 5.5 and vanished when
  zoomed out); municipal limits appear one level before the municipality
  filter (7.5), so they show before the zoom filters by them (the filter
  thresholds themselves are unchanged). The class fill, veil,
  selection outline and hover outline show at any zoom (the hover is not a
  boundary: it marks the feature the tooltip names). With state features
  (IDH) their own outline has no `minzoom` either. State outlines keep
  the `.qgz` colour but never draw thinner than `STATE_OUTLINE_MIN_WIDTH_PX`
  (1.5 px, `visibleStateOutline` in `qgisPaint.ts`): the `.qgz` width is a print
  one (0.15 mm = 0.57 px) and the limits were invisible on screen (user
  feedback, 24/11/2026). It applies to the separate state-outline layer
  (`paintIndicator`); municipal outlines are unchanged. With state features
  (IDH) the zoom also resolves from the drawn recorte (`recorteForLevel`), so a
  município chosen in the bar does not pin the level at municipality. The engine's
  `municipal` flag picks the variant when the style is built.
- **Going up uses the anchor zoom.** The recorte is only cleared one level when
  the zoom falls more than 0.5 (`ZOOM_OUT_TOLERANCE`) below the anchor: the
  zoom of the last programmatic fit, or the zoom at which the user chose the
  current recorte (`useMapRecorte.ts`). Without it, a user who zoomed into a
  state would only clear it by going below the old fit of the whole area, and a
  choice made in the filter bar would be undone by the first nudge. Only a fit
  moves the anchor; a container resize also is programmatic but would bring the
  old fit zoom and erase it.
- **The map filters the panel through the bar's own `request(...)`**, so the
  other cards reload exactly as with the bar (previous data dimmed, `stale`,
  in the PIB and profile; skeletons in the IDH). It only emits
  at the end of a user gesture and only if the recorte changed; programmatic
  moves (fit to the filters, resize) never emit, which avoids a
  filter → fit → zoom → different filter loop. **Framing rule: every recorte
  change fits** (`engine.fitTo(fitTargetFor(...))`, capped at zoom 10),
  wherever it came from: a zoom or pan released on a new recorte, a click, the
  filter bar, clearing, mount or a new area. A recorte applied by the zoom
  itself therefore fits the filtered state or municipality (centre and zoom), like
  the bar does. User decision, 24/11/2026: "centralizar e ajustar o zoom fica
  melhor" (a centre-only variant was tried and reverted; before, the map did not
  re-fit after its own zoom). The fit is programmatic: its `moveend` never
  emits a filter and only sets the anchor zoom (`fit: true`).
  `useStableRecorte` keeps the pending → server round trip with the same
  content from fitting twice. Every map click (`onMapClick`, the feature
  under the cursor or `null`) goes through `recorteForClick`, and the result is
  emitted and fitted through the prop change only when it differs from the
  current recorte. Rules, by the current recorte: **area** — the clicked
  feature's state is selected, never the municipality directly (clicks go
  down one level at a time: area → state → municipality; user decision,
  24/11/2026), a click on empty map does nothing; **state** — a municipality
  inside the selected state(s) is selected (with several states, one of them
  is narrowed to), while clicking the state itself (state-level maps or cards
  that stop at state), a feature of another state under the veil, or empty
  map (ocean, outside the area) goes back to `EMPTY_RECORTE`;
  **municipality** — clicking the selected municipality (or one of several
  selected) goes back to its state, clicking another municipality selects it
  (no going up), and clicking empty map changes nothing. So clicking outside
  the highlight goes up one level only at state level, never at municipality
  level. Drags are not clicks (MapLibre's `click` excludes them).
- **Gestures and zoom cap** (`src/lib/panelMap/panelMapOptions.ts`): the
  map inside the card uses MapLibre's cooperative gestures (Ctrl/⌘ + wheel,
  two fingers on touch, prompt in Portuguese) so it does not hijack the page
  scroll; the fullscreen `PanelMap` keeps normal gestures (`cooperative`
  prop). Double-click zoom is off, because it interrupted the fit of the
  click. `fitTo` stops at zoom 10, so a small municipality is not zoomed in
  too far.
- **Scale and compass** (`addPanelMapControls` in `panelMapOptions.ts`, user
  request 24/11/2026): every panel map (card and fullscreen) has a metric
  `ScaleControl` (max 100 px) at the bottom left, clear of the compact
  attribution (bottom right; the legend sits below the frame), and a
  `NavigationControl` with the compass at the top right. The map rotates
  (right-button or Ctrl + drag, two-finger twist) but never tilts
  (`pitchWithRotate`/`touchPitch` off, `maxPitch: 0`); the needle follows the
  bearing and clicking it resets to north. Button titles are in Portuguese
  (`locale`: "Aproximar", "Afastar", "Alinhar ao norte", the attribution
  toggle and the canvas label "Mapa"). A rotation
  `moveend` carries `originalEvent`, so it is a user move, but it changes
  neither zoom nor centre and the recorte stays. `fitTo` keeps the current
  bearing (MapLibre's `fitBounds` would snap back to north). Both controls are
  DOM, so they are not in the "Baixar imagem" PNG (only the canvas is).
- **Feature level** (`src/features/panelMap/featureLevel.ts`): what each
  feature is, a municipality or a state (`featureLevelFor`). The IDH is
  "estado" (its GeoJSON already has the states, with values); every other
  indicator is "municipio". Engine (`municipal`), click and selection follow
  the level; with state features a municipality chosen in the bar counts as
  its state (`recorteForLevel`), otherwise the veil would cover the chosen
  state. The profile's "Estados" view (pink state mesh, `featureLevel` prop,
  `stateMeshPaint`, `statesWithAreaFlags`) was removed on 24/11/2026 (user
  decision): the porte card only has the municipal map.
- **Veil:** grey (`VEIL_COLOR`) only from the state level: states outside the
  chosen ones and, at municipality level, the municipalities of those states
  that are not chosen (`veilFilters`, a layer filter). At area level there is
  no veil. The part of the chosen states outside the area of interest (e.g.
  most of MG in the Sudene area) is grey too, like the rest outside the
  recorte (user decision, 24/11/2026): layer `veil-outside-area` over the fill,
  on the `area-states-outside` source (`estados_fora_<area>.geojson`, the exact
  shape), filtered by `selectedStates`. INTENTIONAL: not a whole-state veil
  under the fill — the fill is 85% opaque and the grey showed through inside
  the area (controller ruling, 24/11/2026).
- **State cut by the area** (user decision, 24/11/2026): the state hover
  outline and the thick state selection outline only cover the part of the
  state inside the area of interest. They use the `area-states` source, fed
  with `vector/estados_<area>.geojson` of the current area (`useAreaStates`,
  `areaStatesFileFor`; refetched when the area changes, `engine.setAreaStates`).
  While the files load, or if one is missing (a GEODATA_DIR built before
  them) or is not a GeoJSON FeatureCollection, the full `estados.geojson` is
  used for hover, selection and fit, the outside veil is an empty
  FeatureCollection (never undefined), and `panel_map_area_states_failed` is
  logged. The
  state boundary lines (`state-outline`) and the veil of the other states keep
  the full `estados.geojson`. Fitting a chosen state frames its part inside
  the area (`fitTargetFor` with `areaStates`, falling back to the full state),
  once: at state level the fit waits for the area files (`ready`), so mounting
  or switching the area with a state chosen does not fit twice.
- **Legend highlight** (as the old profile "porte" chips did): pointer over a
  legend chip (mouse only: `previewOnMouse` in `src/components/Panel/pointer.ts`,
  shared with the bar charts), keyboard focus or a tap highlights that class.
  Each source is tracked on its own (`chipHighlightReducer`,
  `src/features/panelMap/chipHighlightState.ts`): leaving with the mouse does
  not clear a focused chip, blurring clears focus and tap, and a tap
  (`pointerup` that is not a mouse) toggles, because Safari does not focus
  buttons on tap; a second tap also clears the focus Chrome gives the tapped
  button. Mouse wins over focus, focus over tap. The chips are buttons
  described by a screen-reader hint. `engine.setClassHighlight(filter)` gets the features of the class and
  shows the `class-muted` layer over the other features of the area: solid
  `#e5e5e5` (`CLASS_MUTED_COLOR`, user decision of 24/11/2026: opaque grey, not
  a translucent fade), through a `fill-opacity` `case` (0 in the class, 1
  elsewhere), so nothing outside the area is greyed; veil and selection stay
  on top. The filter is `classHighlightFilter` / `chipHighlightFilter`
  (`src/features/panelMap/classHighlight.ts`), built from the same
  `classCondition` as the colours: first class that matches wins, so a class
  excludes the earlier ones (the overlapping demografia ranges), the inverted
  "Médio" matches nothing, and "Sem dado" is "no number or no class", as in
  `countByClass`. In the aridez the raster stays as is: the chip greys out the
  municipalities whose predominant class (`classOf`, from
  `aridezPredominantClasses` in `AridezMapCard`) is another one; without
  `classOf` it highlights nothing.
- **Tooltip ranking:** position among the features of the area of interest in
  the year (`featuresInArea` + `rankWithinArea`, built on `rankRegions` from
  `features/panels/choropleth.ts`); in the IDH, among the 9 states. Features
  without a number in the year show "sem dado" and are not ranked.
- **Hover level** (`hoverLevelFor` in `src/features/panelMap/hoverLevel.ts`,
  user decision 24/11/2026, the Atlas da Desertificação behaviour: the hover
  names the next level down of the recorte). On municipal maps (PIB, perfil,
  aridez) with only the area of interest (no Estado/Município), the hover is
  by **state**; with a state or municipality chosen, by municipality, as
  before. The IDH (state features) always hovers its own feature. The engine
  (`setHoverLevel`, `src/lib/panelMap/panelMapHover.ts`) still listens on the
  area-filtered indicator layer and, at state level, lights the hovered
  municipality's state on the `area-states` source (`state-hover` layer, same
  outline as the feature hover, any zoom, above the state outline). So only
  states with municipalities in the area light up, and the outline covers
  only the part of the state inside the area (`estados_<area>.geojson`; e.g.
  MG in the Sudene area is the cut, not the whole state); the part outside
  shows no tooltip. Switching the level clears the current
  hover (a click on a state switches it with the pointer still on the map).
  The state tooltip is "Nome (UF)" (name from `estados.geojson`), "<label>:
  <value>" and "Nº de M" among the states with a number in the area
  (`describeState` in `stateTotals.ts`). The value is the sum of the
  municipalities' `v<ano>` inside the area (`stateTotalsInArea`; municipalities
  without a number are skipped, a state with none is "sem dado") unless the
  card passes `stateValues`: the aridez does, with the ASD share of the state
  (`aridezStateShares`: summed ASD area over summed classified area of its
  municipalities in the area, not the mean of the municipal %).
  Between the name and the value a card can add lines with `tooltipDetails`
  (`MapTooltipDetails`: by `code` for municipalities, by sigla for states;
  `detailsOf` in `PanelMapTooltip.tsx`). Only the aridez sends them; without
  the prop the tooltip is name, value and rank, as before.
- **The map does not correct data.** Values, classes and geometries are drawn
  as delivered: the "Médio" population range with inverted limits, the
  negative PIB lower limit and the rest show in the legend as they are. Only
  two things are allowed: renaming properties and turning numeric text into a
  number to paint (`pop_2000`; what does not convert becomes `null`, "sem
  dado"). The Semiárido has no polygon in the Drive, so `areas.geojson` builds
  it from the municipalities flagged `semi_21_1`. Everything wrong goes to
  `data-issues.json` (build checks, plus `compare_db.py` for differences above
  0.5% between `v<ano>` and the database, shown as "Shape × banco: …" and
  replaced, not duplicated, when run again) and from there to the PDF for the
  data owner. Final PDFs go to
  `Documentacao-OCA/data-nordeste/frontend/mapas-paineis-problemas-dados-<data>.pdf`.
- **Basemaps:** Esri World Imagery ("Satélite") and the standard
  OpenStreetMap raster tiles ("Padrão": white land, blue ocean;
  `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, tiles up to zoom 19), both
  with CORS open. The downloaded image credits the basemap active in the card
  (`usePanelMapCard` + `panelMapImageSource`: "© OpenStreetMap contributors"
  for the Padrão, "Esri, Maxar, Earthstar Geographics" for the satellite); on
  screen, card and fullscreen credit it in MapLibre's attribution control
  (the fullscreen footer has no source since PR #413). The fullscreen map is
  a new `PanelMap` on each opening. Card and fullscreen share one basemap,
  held by `usePanelMapCard` and passed as the controlled `basemap` prop
  (`mapBinding` and `fullscreenBinding`): fullscreen opens on the card's
  basemap (the engine is created on it, so the Padrão never flashes) and a
  switch made in fullscreen is still there when it closes. The OpenStreetMap tile
  server is a shared volunteer service under the
  [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/):
  fair use only, and heavy traffic would need another tile provider. The
  aridez raster is the main layer of the aridez panel only (`indicator="aridez"`,
  `aridez` defaults to `"base"`), always on, with the decade of the year filter
  (1991 shows 1990, 2001 shows 2000, ...); no checkbox or selector. It shows
  only inside the panel's Área: the URL comes from
  `aridezRasterFile(year, area)` (`features/panelMap/aridezRaster.ts`) and
  changing the area swaps the image (`usePanelMapAridez`).
- **Card pieces** (`src/components/PanelMap/`): `PanelMapCardActions` (the
  shared `ProtoFullscreenButton`, ⓘ and the menu with the basemap credit),
  `usePanelMapCard`, `PanelMapSkeleton` (the loading card keeps the map box
  height and the legend row) and `panelMapTexts`. A skeleton unmounts the map
  (and MapLibre with its WebGL context, geodata and camera). The PIB and the
  profile dim a pending map (`stale`, still mounted); the IDH has no `stale`,
  so its map lists no filter dependency (`map: []` in `idhCardState.ts`): the
  map draws geodata for the requested filters and needs no server data. Only
  the first load, a failed query and its retry show the skeleton.
- **Removed by this swap** (see each panel section): `IdhMapLegend`,
  `buildIdhMapProps`, `buildIdhLegend`; `pibStates.ts` (`PIB_STATE_BINS`,
  `buildPibStateLookup`), `buildPibMapProps` and the card legend;
  `PerfilPorteToggles`, `DemografiaMapa`, `toggleTerritorialUf`,
  `PIB_MAP_HINT`, `PIB_MAP_IMAGE_SOURCE`.
- **Removed by the aridez swap** (see "Aridity Index Panel Demo"):
  `ProtoStateMap`, the non-`renderStage` branch of `ProtoMapFullscreen` (zoom
  buttons, drag, wheel, `MAP_SELECT_HINT`; `renderStage` is now required),
  `ProtoBinLegend`, `describeStatesOffMap` (`statesOffMap.ts`), `stateShapes.ts`,
  `mapViewBox.ts`, `selectOnlyTerritorialUf`, `aridezStates.ts`
  (`ARIDEZ_STATE_BINS`, `buildAridezStateLookup`), `buildAridezMapProps`, the
  `estados` query of the aridez panel and the 20-px zoom icons of `ProtoIcon`.

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

## Experimental Catalog (`/demo`)

- **What:** `src/app/demo/page.tsx` lists the demos under "Experimental"
  (header button after "Relatório"). Today: PIB, IDH, Perfil demográfico and
  Aridez; FNE and the `-powerbi` variants stay out of the catalog.
- **Gate:** the page sits under `src/app/demo/layout.tsx`, so it answers 404
  without `DEMOS_HABILITADAS=1`. The header button is a client component and
  cannot read that runtime variable; it shows when `NEXT_PUBLIC_APP_ENV` is
  `beta` (gamma and beta builds), in `src/features/navigation/experimentalLink.ts`.
  Turning the demos on in an environment means both together.
- **Cards:** the `ContentPost` card body (`PostCardBody` with
  `label="Painel experimental"`, no date) over the Contentful post of the
  original panel, found by its `link` (`/data-panel/<id>`) in
  `src/features/experimental/panels.ts`. The card links to `/demo/<route>` in
  the same tab. A demo whose post is missing is left out; a Contentful failure
  shows the page with no cards and logs `experimental_panels_contentful_failed`.
- **Header width:** with the extra item, the desktop menu at 1440 px ends about
  60 px past the content's right edge (still inside the viewport).

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
  reproduced in layout and behaviour: cover (back link, breadcrumb,
  "Atualizado em", macrotheme badge, lead), horizontal view tabs above the
  filters at every width (the left rail is gone since the November redesign,
  PR #410), sticky filter bar with the panel identity ("IDH"), cards, ⓘ and
  ⋯ menu, "Saiba mais sobre o IDH" with "Ler mais" and glossary. The cover
  of every prototype panel is light only (`ProtoCover`, PRs #410–#412). It
  replaced the Power BI-faithful version of `129cef4` (gauges, no ranking).
- The prototype building blocks (card, sheet, ⓘ, ⋯ menu, cover, filter bar
  shell, stat cards, the map fullscreen frame, "Saiba mais", sticky chain)
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
- The line chart is hand-drawn SVG like the prototype, not ECharts
  (`idhLineChart.ts` holds the geometry; the 0.4–0.8 axis widens only if a
  real value leaves it). Colours and font are SVG attributes so "Baixar
  imagem" (PNG or SVG) serialises them; the ranking and group bars are HTML
  and only share and open the catalogue.
- The overview map (`IdhMapCard`) is the shared MapLibre `PanelMap`
  (indicator "idh", area "nordeste", `deepest="estado"`, `formatIdhCard`: two
  decimals, the precision of the Drive shapes), states
  only, with the classes from the `.qgz` as delivered. Zooming into or
  clicking a state sets the UF filter through `useRecorteFilters` with
  `idhToRecorte`/`recorteToIdh` and `dashboard.actions.changeFilters` (the
  same request as the filter bar, keeping the open view). The map needs the
  round trip to be exact, and it is only because the map emits codes of
  features of the current area: the state comes from the IDH feature under the
  centre (the indicator layer is filtered to the area), never from the
  27-state mesh. A code the server drops (`loadIdhPanel` keeps only known UFs)
  comes back different and the map refits to the whole area. `usePanelMapFilters` (territorial panels) and the
  IDH card are thin callers of that generic core. The ranking keeps its own
  toggle (`onSelectUf`) and `IDH_MAP_BUCKETS`. Fullscreen is a second
  `PanelMap` (`renderStage`) in the card `overlay`; the downloaded image comes
  from the engine with the active basemap's credit (`panelMapImageSource`).
  It shows "Atualizado em" (`updatedAt`), like the other IDH cards. Removed:
  `IdhMapLegend`, `buildIdhMapProps` (`idhMapProps.ts`) and `buildIdhLegend`
  (the legend now comes from `PanelMap`).
- Prototype rules that came from its demo data were not ported (state data
  only for 2021, "sem dado por estado", the undo toast): the `des_idh` views
  have the yearly series per state. The empty-state notice of the sex and
  colour views shows only when the database really has no group data.
- Card states (`resolveIdhCardStates` in `idhCardState.ts`): while a filter
  navigation is pending, only the cards whose data depends on the changed
  filter show the skeleton (the IDH has no `stale`; the other panels dim the
  previous data instead); a UF change leaves the map and ranking alone, a
  year change leaves the yearly series and the map alone (the map follows the
  requested year at once and never remounts). The
  selection (map/ranking highlight, chart year, selects) follows the requested
  filters at once, and the next filter starts from them. Skeletons only when
  there is no previous data: retrying or navigating away from a failed query
  (`emptyIdhPanel` keeps the layout); "Tentar de novo" runs `router.refresh()`.
- Contentful texts: the cover lead is the entry's `abovePanelDescription`
  (`IDH_LEAD` only as fallback) and the long `description` renders before
  "Saiba mais". The title stays `IDH_TITLE`: the "panels" entry `title` is the
  lookup key (`"idh"`), not display text. The PIB, perfil and aridez covers
  follow the same rule (`PIB_LEAD`, `PERFIL_LEAD`, `ARIDEZ_LEAD` are copies of
  the Contentful text, used only as fallback), so every demo cover opens with
  the same paragraph as `/data-panel/<id>`. The cover badge says "Atualizado
  em" with the entry `date`.
- Switching views only calls `replaceState`; the active tab is local state that
  follows `data.filters.visao` when it changes. Do not put a `key` on
  `IdhDashboard`: it remounted the panel on the first filter after a tab
  switch and closed the mobile filter sheet (PR #397 review).
- Year range: no year is hardcoded. `loadIdhYearRange` reads
  `min(ano)`/`max(ano)` from `idh_geral_novo_view` on both `/demo/idh` and
  `/demo/idh-powerbi`, and the range travels in `IdhPanelData.yearRange`. The
  default year is the last one. If the range query fails, `/demo/idh` shows
  the cards' error state (`NO_IDH_YEARS`: no year offered) and
  `/demo/idh-powerbi` its load-failed message; both log
  `idh_demo_year_range_failed`.
- Card footer "Atualizado em MM/AAAA" is the `date` of the Contentful "panels"
  entry (the same date the original panel shows as "Publicado em"), formatted
  by `formatIdhUpdatedAt` and passed to `IdhDashboard` as `updatedAt`. Without
  the entry or its `date`, the label is hidden; there is no fixed fallback.
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
  Since the November redesign (PR #411) it also has the "Veja mais" bar
  (`ProtoVejaMais`, text from `buildDemografiaAnalise`), the panel identity in
  the filter bar, and the census years come from the database
  (`loadDemografiaYearRange`, `NO_DEMOGRAFIA_YEARS` when the query fails; no
  "· 0" is shown, see `withYear`/`NO_YEAR`).
- Deliberate deviations from the prototype:
  - The map is the shared MapLibre `PanelMap` (indicator "demografia", the
    `.qgz` classes as delivered, including the inverted "Médio" range in the
    legend). Only the municipal map remains: the porte classes with the
    legend chips (`deepest: "municipio"`). The prototype's "Municípios |
    Estados" switch was removed on 24/11/2026 (user decision), together with
    the Estados view; `usePorteMapView` now only keeps the fullscreen state.
    The SVG state map, the old porte pills (`PerfilPorteToggles`) and
    `useDemografiaHighlight` are gone (the legend chips of `PanelMap`
    highlight the class). Zooming or clicking the map changes Estado and
    Município in the panel filters through `usePanelMapFilters` (the same
    `request` as the filter bar).
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
- Image download exists for the series and the colour or race chart (SVG) and,
  for the map, comes from the MapLibre engine (`toImageSource`) with
  the active basemap credited in the source (`panelMapImageSource`).
- Removed with this rebuild: `DemografiaCharts`, `DemografiaSaibaMais`,
  `PorteLegend`, `PyramidChart`, `ValueBars` and `buildPyramidOption`.
- Card state: `resolvePanelCardState` (`src/features/panels/panelCardState.ts`)
  picks "loading", "error" or "ok", and loading beats error, so "Tentar de
  novo" shows the skeleton while the query runs again. The IDH reuses it in
  `resolveIdhCardStates` for its failed branch.
- Dialogs that must survive the loading state (the porte map fullscreen, the
  IDH map fullscreen) go in `ProtoCard`'s `overlay` slot, outside the body:
  inside it, the loading skeleton unmounted the dialog on every filter.
- Changing "Área de interesse" keeps the chosen states and municipalities, as
  the prototype's `norm()` does. The server drops the ones outside the new
  area (`keepKnown` in `src/features/panels/territorialOptions.ts`), which
  keeps the multi-state selection. PIB clears both instead.
- Card states (`resolvePerfilCardStates` in `perfilCardState.ts`): the map
  depends only on Área and Ano (`PERFIL_CARD_DEPENDENCIES`), as in the PIB, so
  the Estado/Município its own zoom sets does not dim it.
- The fullscreen map is a second `PanelMap` (`renderStage`) wired to the same
  filters, in the chosen view; the view and the fullscreen state
  (`usePorteMapView`: `view`, `fullscreen`) live in the dashboard so they
  survive the swap to the empty layout.
- The map is a canvas with no text for screen readers, so the card carries an
  `sr-only` table built by `buildPerfilPorteTable` (on the shared
  `buildMunicipalMapTable`, `features/panels/municipalMapTable.ts`).
- Shared by the PIB and the profile map cards (`src/components/PanelMap/`):
  `usePanelMapFilters` (selection to recorte and back), `PanelMapCardActions`
  (fullscreen button, ⓘ and the menu with the basemap credit),
  `usePanelMapCard` (the card's engine, active basemap and cooperative
  gestures) and
  `panelMapTexts` (`PANEL_MAP_HINT`, `panelMapImageSource`).
- Removed with the map swap: `PerfilPorteToggles`, `DemografiaMapa`
  (`useDemografiaHighlight`, profile copy), `toggleTerritorialUf`
  (`territorialPlace.ts`), `PIB_MAP_HINT` and `PIB_MAP_IMAGE_SOURCE`.
  `ChoroplethCanvas`, `ChoroplethMap` and `public/maps/*.json` stay: the Power
  BI demos still use them.
- Neither the cards nor the map fullscreen show the source (PR #413): the
  panel already has a "Fonte dos dados" section, so `*_CARD_SOURCE` only goes
  into the downloaded image (for maps, with the basemap credit). The IDH cards
  keep only "Atualizado em" (`ProtoCard` `updatedAt`). The map fullscreen
  footer is only the `PANEL_MAP_HINT`; the basemap credit stays in MapLibre's
  attribution control. The porte legend only shows in the "Municípios" view,
  in the card and in the fullscreen.

## PIB Panel Demo (`/demo/pib`)

- Same approach as the IDH and demographic profile panels: the reference is
  the prototype's `pib.html` (same artifact), rebuilt with the shared
  `ProtoPanel/` pieces in the "pib" tone (orange accent `#e5640f`, total
  `#f2761c`, per capita `#1e88c7`) and the real `eco_pib.vw_pib_municipal_pbi`
  data. Cover, sticky filter bar, two big numbers, the yearly line with one
  axis per series, the municipal map and the two sector cards, "Saiba mais" and
  related content. Since the November redesign (PR #412) the filter bar
  carries the panel identity (`PIB_ICON`, `PIB_SHORT_TITLE`) and fills its row,
  and `loading.tsx` renders `PibDashboard` with `loading` (every card in its
  skeleton) inside the same `PibPageFrame` as the page.
- Shared pieces extracted for this panel, so nothing was copied from the
  profile: `ProtoTerritorialFilters` (Ano, Área, Estado, Município; was
  `PerfilFilterBar`), `features/panels/territorialPlace.ts` (was
  `demografia/perfilPlace.ts`) and the `pair` variant of `ProtoStatCards`.
- Data: the map itself comes from the geodata files (`pib.geojson`, `v<ano>`
  per municipality; see "Panel Maps (MapLibre)"), not from the database.
  `loadPibPanel` no longer sums `pib_total` by state (`PibPanelData.estados`
  was removed): no card read it, and every map zoom is a navigation, so it
  cost one database query per gesture. Sector data (VAB and activities) ends
  before the PIB: the last year with VAB comes from the database
  (`loadVabLastYear`, `MAX(ano)` with `vab_servicos`, in
  `PibPanelData.vabLastYear`). A year without VAB nor activities
  (`lacksPibSectorData`) shows the notice with "Ver <último ano>" and
  "Escolher outro ano", which scrolls to the Ano select and rings it (on a
  phone it opens the filter sheet; `usePibYearField`). The sector ⓘ texts are
  the content team's (PR #413) and no longer cite that year.
- Deliberate deviations from the prototype:
  - The map is the shared MapLibre `PanelMap` (indicator "pib", municipal
    level, `.qgz` classes as delivered; `PibMapCard`), not the prototype's
    state-only SVG. Title "PIB total por município" (`PIB_MAP_TITLE`, content
    team review, PR #413). Its ⓘ (`PIB_MAP_INFO`, rendered by
    `PibInfoParagraphs` with the terms in bold) opens with how the map filters
    (zoom or click, first click picks the state and the next a municipality,
    clicking it again goes up a level, legend hover highlights a class), then the content team's PIB and per capita definitions verbatim.
    #413 also built a municipal map on the old canvas stack
    (`ProtoMunicipalMap`, `pibMunicipios`, a `GROUP BY cd_mun` query in
    `loadPibPanel`); the merge kept the MapLibre card and dropped those.
    The previous demo's table and the "highlight an activity on the map"
    list are gone; the activity card shows the three largest, as the
    prototype does.
  - Zooming or clicking the map sets Estado and Município in the filter
    (`usePanelMapFilters`, the bar's own `request`); several states are
    possible through the Estado filter.
  - The map keeps a fixed height (480 px, 400 px below 1000 px), unlike #413,
    whose map followed the sector column. `PanelMap` frames only on `fitTo`
    (a recorte change); a container resize keeps centre and zoom. The column
    height changes with the year (the no-VAB notice) and the municipality
    while the map stays mounted, so a following map would end up cropped or
    loose without a refit.
  - The VAB axis unit follows the data (`pibBarUnit`: trilhões, bilhões,
    milhões, mil) instead of the fixed "R$ bilhões", so a small municipality
    gets a readable axis.
  - VAB card (content team review): subtitle unit with the label abbreviation
    ("R$ milhões (Mi)", `formatPibUnit`), footer "VAB total: R$ 304,20 Mi", and
    the ⓘ text `PIB_CARD_INFO.vab` with "Valor Adicionado Bruto (VAB)" in bold.
  - Line card (content team review): title "Dinâmica temporal do PIB total e
    do PIB per capita" (`PIB_LINE_TITLE`, also the SVG label and the image
    title). Each Y axis has a title with its unit drawn inside the SVG, so the
    download keeps it ("PIB total (R$ bilhões)" top left, "PIB per capita (R$
    mil)" top right), plain pt-BR ticks in that unit, and the axis line, ticks
    and title in the series color (text in the darker `*Ink` for AA). No
    series legend: the axis titles name the series. `point.pib` and `point.perCapita` are in
    reais; `pibLineUnits` divides. The total drops to milhões/mil when the
    series stays under R$ 1 bi (small municipalities), as the VAB axis does.
    Tooltip and value labels keep `formatPibReais`. Subtitle: place and year
    span only (`pibLineSubtitle`). Below 560 px the two titles do not fit
    side by side (~250 px in Inter): they stack as a two-row header with a
    series marker, the selected year's value right-aligned on each row
    instead of labels on the lines, the side margins follow the widest tick
    label, and the selected year always shows on the X axis.
  - Money uses the existing formatter ("R$ 45,00 Mi"); the prototype drops
    decimals in millions. The change pill reads "em relação a 2022" (shared
    `formatYearChange`), not "vs. 2022".
  - No "Atualizado em" on the cards: the database does not say when the PIB
    was loaded (no `updatedAt`).
  - Minas Gerais and Espírito Santo (Área da Sudene, Semiárido) are drawn
    like any other state because the map is municipal; the old "no shape in
    the nine-state map" hint (`describeStatesOffMap`) is gone, and so is the
    helper.
  - "Saiba mais" keeps the Power BI definitions (PIB, per capita, VAB,
    participação) as the glossary; the prototype has only the paragraphs.
- Image download exists for the line (SVG) and the map (from the
  MapLibre engine, with the active basemap's credit in the source); the sector bars are
  HTML.
- Removed with this rebuild: `PibSectorCharts`, `AtividadeList`,
  `AtividadeHighlightChip`, `PibSaibaMais`, `TrendChart`, `HorizontalBarChart`
  and `trendOption`. Still exported but unused after it:
  `buildHorizontalBarOption`, `withCommonFit` and `TerritorialSelects`.
- The yearly line charts (IDH, PIB) share `useLineYear` and
  `ProtoYearSlider` (`ProtoPanel/ProtoLineYear.tsx`) and the pure
  `stepYear`/`yearIndexAtPointer` (`features/panels/lineInteraction.ts`). The
  tooltip keeps the hovered year, not an index, so a series that changes
  while it is open cannot point outside it; a filtered year missing from the
  series highlights nothing (`selectedIndex` -1) in both charts.
- Card states as in the IDH (`resolvePibCardStates` in `pibCardState.ts`,
  built on the shared `resolveDependentCardStates` and `usePendingFilters`):
  while a filter loads, only the cards whose query depends on the changed
  filter keep their data dimmed (`stale`); the map depends only on Área and
  Ano (`PIB_CARD_DEPENDENCIES` in `pibCardState.ts`), so zooming it does not dim it, and a year
  change leaves the yearly series alone. The selection (map
  outline, chart year, filter bar) follows the requested filters at once.
  Skeletons only after a failed query ("Tentar de novo" and loading beats
  error). The map fullscreen goes in `ProtoCard`'s `overlay` slot.
- Big numbers: `buildPibBigNumbers` (`features/panels/pib/pibBigNumbers.ts`)
  says "Primeiro ano da série" only on the first year; with a zero previous
  year there is no pill. The arrow colour uses the shared `yearChangeTone`
  (was `perfilChangeTone`).
- Local setup: the tunnel command is not in any repository; ask the team.
  The Gamma database conventionally sits on local port 5434.

## Aridity Index Panel Demo (`/demo/aridez`)

- Same approach as the IDH, profile and PIB panels: the reference is the
  prototype's `aridez.html` (artifact "Painéis Data Nordeste · Protótipo
  navegável", November 2026), rebuilt with the shared `ProtoPanel/` pieces in
  the "aridez" tone (Meio Ambiente green `#758f21`). Cover, sticky filter bar,
  "Veja mais", two big numbers (ASD in km² and in %), the municipal map, the
  columns by class and the per-municipality 100% bars, "Saiba mais" and
  related content from the Contentful "panels" entry `aridez`.
- Data: `meio_aridez.vw_aridez` (`cd_mun`, `ano_consolidacao`, `dn_uni`,
  `area_km2_classe`), the view the Automatic-Reporting environment text reads.
  Years: 1991, 2001, 2011 and 2021. The view also carries the territorial
  columns (`sigla_uf`, `uf`, `nm_mun`, `ne`, `semi_21`, `caat_24`, `aas_21`),
  identical to `eco_pib.vw_pib_municipal_pbi` for every municipality (checked
  on 23/11/2026), so the panel reads them directly. An earlier version joined
  the PIB view for them and made a state filter 3–10× slower on a cold cache.
  `dn_uni` 2/3/4/5 are árido, semiárido, subúmido seco and úmido
  (`ARIDEZ_CLASSES`). ASD (Área Suscetível à Desertificação) is árido +
  semiárido + subúmido seco, index below 0.65 (UNCCD). Percentages use the
  classified area (sum of the four classes) as the base, as the prototype does.
- `dn_uni` 1 is ignored.
- "Veja mais" (`ProtoPanel/ProtoVejaMais.tsx`, text in
  `features/panels/aridez/aridezAnalise.ts`): the prototype's expandable bar on
  top of the panel. The prototype also offers a floating button, switched by its
  black test strip; only the bar was built. The ASD change compares the chosen
  year with 1991 (`ARIDEZ_BASE_YEAR`, the prototype says "1990" with made-up
  values). A red dot marks text that changed while the bar was closed. The
  component takes any `PanelAnalysis`, so the other panels can adopt it. It
  slides open (grid rows, 220 ms) and the text flashes in the accent colour when
  a filter changes it (`animate-proto-flash` in `globals.css`), as in the
  prototype; both respect `prefers-reduced-motion`.
- Deliberate deviations from the prototype:
  - Real values everywhere; the prototype's state and municipal figures were
    illustrative.
  - The municipal list shows every municipality of the selection (about 1,800
    for the whole area), with `content-visibility: auto`. The segment tooltip
    is the prototype's dark `ProtoTooltip`, driven by one delegated
    `pointermove` on the list, not a handler per segment.
  - No "Atualizado em" on the cards (no load date in the database, as in PIB).
- Map card (`AridezMapCard`, "Índice de aridez", same title on the phone and
  on the downloaded poster; it was "Índice de aridez por município" until the
  content team review, PR #430): the shared
  MapLibre `PanelMap` with `indicator="aridez"` and `deepest="municipio"`, as in
  the PIB. Filters go through `usePanelMapFilters(selection, request)`, the same
  `request` as the filter bar (zoom and click set Estado and Município; the
  old click-a-state `onSelectUf` is gone). The main layer is the aridez raster
  of the decade of `selection.ano`; state and municipal outlines (the
  `vector/municipios.geojson` mesh, no values) go on top. Subtitle "Índice de
  aridez · área · ano" uses `selection.ano`.
  - Hover shows the municipality, one line per class with the share of its
    classified area in that class ("Percentual de área semiárida: 90,00%", in
    `ARIDEZ_CLASSES` order; a class without area, or one that rounds to
    0,00%, is left out), then "Percentual de área suscetível à desertificação"
    (its % of ASD, `formatSharePercent`, the same number as the municipalities
    card) and its rank in the area, from the `values` prop. With only the area
    of interest it shows the state, its class lines from the summed areas of
    its municipalities in the area (not the mean of the municipal %) and its %
    of ASD (`stateValues`, `aridezStateShares`; `AridezMunicipio.uf` comes from
    `sigla_uf`). The class lines are `aridezTooltipDetails`, passed as
    `tooltipDetails` (content team review, PR #430). The legend below the
    map is the raster palette (`styles.json`) with, per class, the number of municipalities where it is
    the predominant class (largest area among `dn_uni` 2..5; a tie goes to the
    drier class), from `classCounts`. All three come from pure functions in
    `features/panels/aridez/aridezMap.ts` (`aridezMapValues`,
    `aridezClassCounts`, `aridezTooltipDetails`), memoized on `data.mapa`.
  - `AridezPanelData.mapa` replaces the old `estados`: every municipality of
    the Área and Ano, ignoring Estado and Município (same query as
    `porMunicipio`, reused when no state or municipality is chosen). Reading
    `porMunicipio` would shrink the ranking and the legend counts at each zoom
    and leave the map without values in the "no data" layout. So the map's
    dependencies are `["area","ano"]` (`aridezCardState.ts`): zoom never dims it,
    year or area changes dim it (`stale`, still mounted), and only a failed query
    and its retry show the skeleton (`PanelMapSkeleton`).
  - Needs `vector/municipios.geojson` and `raster/aridez_<ano>_<area>.png` in the
    geodata folder (`/opt/datane/geodata`); without them the map shows the
    "geodados indisponíveis" notice. The raster palette (`styles.json`) and the
    `ARIDEZ_CLASSES` colours of the other cards differ slightly; the values
    2 to 5 match.
- Texts from the content team review (PR #430):
  - The ⓘ of the map, class and municipalities cards (`AridezIndexInfo`) is
    the card's own reading (`ARIDEZ_CARD_INFO`) followed by the index
    definition, word for word (`ARIDEZ_INDEX_DEFINITION`: IA, the UNCCD
    classes as a list, ASD, ETP and the "Obs."). The approved wording is kept
    as delivered, including "à regiões" and "sem dados" (the map says "sem
    dado"); it lists "Hiperárido", which the legend does not show (the panel
    uses classes 2 to 5). The shared `ProtoCardInfo` popover got
    `max-h-[60vh]` with scroll, since this text can be taller than the screen.
    On desktop the popover opens on hover and closes when the pointer leaves
    the ⓘ button, so reading it to the end needs a click (which pins it).
  - Subtitles: "<lugar> · <ano> · área por classe de índice de aridez" (class
    card) and "<lugar> · <ano> · percentual da área por classe de índice de
    aridez" (municipalities card; the request wrote "Percentual", lowercase
    here like the other segments after "·").
  - The "Veja análise" footnote says "Texto gerado conforme os filtros
    aplicados"; the demographic profile still says "conforme os filtros:".
- The class columns card stretches to the municipal list beside it
  (`#c-cls .chartbox{flex:1}` in the prototype): the SVG is absolutely
  positioned in a growing box and `useElementWidth` also reports the height.
- Shared pieces extracted for this panel: `ProtoFullscreenButton`
  (`ProtoPanel/ProtoMapControls.tsx`; the map cards use it through
  `PanelMapCardActions`), `buildZeroAxis` (`features/panels/zeroAxis.ts`, was `pib/pibAxis.ts`),
  `describeSelectedTerritory` (`territorialOptions.ts`) and the jsdom fakes
  `stubPanelBrowserApis` (`ProtoPanel/protoBrowserFakes.ts`, was in
  `idhTestFixtures.ts`).
- Headless Chrome screenshots (`--screenshot` with `--virtual-time-budget`)
  often capture the SVG charts empty because `ResizeObserver` has not fired;
  check the layout in a real browser or with Playwright waiting for the chart.
