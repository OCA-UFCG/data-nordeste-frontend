# Mapa dos painéis (MapLibre + geodados na VM) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o card de mapa de `/demo/pib`, `/demo/idh` e `/demo/perfil-demografico` por um mapa MapLibre compartilhado (basemap Satélite/Oceano, indicador com classes do `.qgz`, aridez raster, recorte por zoom que filtra o painel, véu cinza a partir do estado, tooltip com ranking), alimentado por geodados preparados de uma pasta do Drive e servidos de um diretório da VM.

**Architecture:** Um script Python (`scripts/geodata/`) baixa a pasta do Drive, converte com GDAL (GeoJSON simplificado, PNG do raster), extrai cores/classes dos `.qgs` e grava `styles.json`/`manifest.json` num diretório (`GEODATA_DIR`). Uma rota do Next (`/api/geodata/[...path]`) serve esse diretório. Regras puras do mapa ficam em `src/features/panelMap/`, o vendor fica atrás de `src/lib/panelMapEngine.ts`, e `src/components/PanelMap/` monta tudo; cada painel só adapta seus filtros.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, maplibre-gl 4.7.1 (já instalado), Vitest + Testing Library; Python 3 stdlib + CLIs GDAL (`ogr2ogr`, `gdaldem`, `gdalinfo`) + `unittest`; Chrome headless para o PDF.

**Spec:** `docs/superpowers/specs/2026-11-23-mapa-paineis-design.md`

## Global Constraints

- **Nunca corrigir dados.** Valores, classes e geometrias do Drive são usados como vieram; problemas vão para `data-issues.json` → PDF. (Renomear propriedades e converter texto numérico para desenhar não é correção; o que não converter vira "sem dado".)
- Pasta do Drive: `1zXWbyU02PrbuZj9JQQRjf9bwZf-GoKg6` (pública por link). Download: `https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`.
- Áreas: `nordeste`→`ne`, `semiarido`→`semi_21_1`, `caatinga`→`caat_24`, `sudene`→`aas_21_1`; valor `"Sim"`.
- Véu cinza **só a partir do nível estado**; nível área não tem véu.
- O zoom aplica o filtro do painel pelo mesmo `request(...)` da barra (dispara as consultas). Movimento programático nunca gera filtro.
- Ranking do tooltip: entre as feições da área de interesse no ano (IDH: entre os 9 estados), via `rankRegions` (`src/features/panels/choropleth.ts`).
- Basemaps: Satélite `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`; Oceano `https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}` (ambos com `Access-Control-Allow-Origin: *`, conferido). Atribuição "Esri".
- Geodados **só no gamma** por ora: VM em `/opt/datane/geodata`, montada só em `deploy-gamma.yml`.
- Regras do `CLAUDE.md`: funções de 4–20 linhas, `src/features` puro e testado, vendor atrás de interface própria, nomes específicos, `@/` imports, erros com valor e formato esperado, logs JSON com `event`.
- Commits: Conventional Commits (`commitlint.config.mjs`), **sem `Co-Authored-By`**, nunca `--no-verify`. O repo só commita quando o usuário pedir — confirmar antes do 1º commit (e o `git config user.email`, hoje `@cyan-agro.com`, que não é projeto da Cyan).
- Ambiente local: VPN LSD + `ssh -N -L 5433:127.0.0.1:5432 datane`, `DATA_DB_URL` apontando para o túnel, `DEMOS_HABILITADAS=1`, `GEODATA_DIR=<dir local gerado>`.

## Review Focus

1. **Ano do filtro ausente no shape** (IDH 2012–2021 no painel × shape 2012–2024; Demografia 2000/2010/2022): o mapa pinta "sem dado" e o tooltip diz "sem dado", sem quebrar nem ranquear `null`. → teste em Task 5 (`classColorExpression` com coluna faltando) e Task 7 (`describeMapFeature` com `value: null`).
2. **Centro do mapa no oceano ou fora da área** ao parar o movimento: mantém o recorte atual, nenhuma navegação. → teste em Task 6 (`resolveRecorte` sem `centerUf`).
3. **Filtro com vários estados/municípios vindo da barra**: véu fora da união, enquadra a união, e o primeiro toque no mapa não desfaz. → testes em Task 6 e Task 7.
4. **`GEODATA_DIR` ausente ou arquivo faltando** (ex.: deploy antes do rsync): a rota responde 503/404 com mensagem clara e o card mostra aviso, sem derrubar o painel. → testes em Task 4 e Task 9.
5. **Classe do `.qgz` com `lower > upper`** (a faixa "Médio" da demografia): reproduzida como está (nunca casa), legenda mostra a faixa, e o script registra o problema. → testes em Task 2 (check) e Task 5 (expressão).

---

## File Structure

```
scripts/geodata/
  drive_manifest.json      IDs do Drive → caminho relativo em <raw>/
  geodata.py               CLI: download | build | issues-pdf
  drive.py                 download (fetch injetável)
  qgis_style.py            .qgz → classes, contornos, paleta raster
  checks.py                inconsistências (puro) → lista de Issue
  build.py                 chamadas GDAL e montagem de styles/manifest
  compare_db.py            (opcional, venv do Automatic-Reporting) shape × banco
  issues_pdf.py            data-issues.json → HTML → PDF (Chrome headless)
  tests/test_*.py          unittest
src/features/geodata/geodataFile.ts(+test)       resolve caminho seguro + content-type
src/app/api/geodata/[...path]/route.ts(+test)    serve GEODATA_DIR
src/features/panelMap/
  geodataTypes.ts          tipos de styles.json / manifest.json / propriedades
  qgisPaint.ts(+test)      classes → expressão MapLibre; classForValue
  mapRecorte.ts(+test)     níveis de zoom e resolução do recorte
  mapLayers.ts(+test)      filtros de área, véu e contorno do recorte; bbox
  mapTooltip.ts(+test)     texto do tooltip + ranking
  panelMapAdapters.ts(+test) filtros do painel ↔ MapRecorte (territorial e IDH)
src/lib/panelMapEngine.ts  única peça que importa maplibre-gl
src/lib/chartImage.ts      + canvasImageSource
src/components/PanelMap/
  PanelMap.tsx(+test) useGeodata.ts useMapRecorte.ts(+test)
  BasemapSwitch.tsx AridezControl.tsx PanelMapLegend.tsx PanelMapTooltip.tsx
```

Painéis tocados: `PibDashboard/PibMapCard.tsx`, `DemografiaDashboard/PerfilPorteMapCard.tsx` (+ `PerfilLayout.tsx`, `DemografiaDashboard.tsx`), `IdhDashboard/IdhOverview.tsx` (+ `idhMapProps.ts`). Deploy/doc: `.env.sample`, `.github/workflows/deploy-gamma.yml`, `docs/README.md`.

---

### Task 1: Download do Drive (`scripts/geodata/drive.py`)

**Files:**
- Create: `scripts/geodata/drive_manifest.json`, `scripts/geodata/drive.py`, `scripts/geodata/geodata.py`, `scripts/geodata/tests/test_drive.py`

**Interfaces:**
- Produces: `drive_url(file_id: str) -> str`; `download_all(manifest: dict, raw_dir: Path, fetch: Callable[[str, Path], None]) -> list[Path]`; CLI `python3 -I scripts/geodata/geodata.py download <raw_dir>`.
- `drive_manifest.json`: `{"folderId": "...", "files": [{"id": "...", "path": "pib/pib.qgz"}, ...]}` com **todos** os arquivos listados na pasta (subpastas `pib/`, `idh/`, `demografia/`, `indice_aridez/`, `shapefile_geral/{brasil,nordeste,caatinga,area_sudene}/`; xlsx incluídos). Os caminhos reproduzem a árvore do Drive; o `.cpg` `municipio_sudene.cpg` mantém o nome do Drive.

IDs (levantados em 23/11/2026; pastas → arquivos):
- `pib/`: `pib.qgz` 1WuIOi6CTrDt09kfEaA24i-JYA5YWqKgh, `pib_geral.xlsx` 1DhEuqOBUTgvMQjvv1xnOB49A0fr3uFW6; `pib/shapefile/`: `.dbf` 1RkaRaZLTXerM1neUxb7F9BNOuaEdidEA, `.qmd` 1V-ytB3WF41KMa1JQOmCxs9jXjHwuNpBl, `.shx` 1FEBx23YzusrreAFB59cL5TNBK_Ste2tX, `.shp` 1xzs2TP0Raz2wIAuBweioKOQCrtshnhMK, `.prj` 1Mm1fZgWDeSeImHKRprDka6hGEdb5vX5E, `.cpg` 1Hs8ksmDxXR3nCkj3Z07RCjgqntQpkqNk
- `idh/`: `idh.qgz` 1fZnPHYl8z-BlYatmb1aclqqprl4Yf0RC, `idh_geral.xlsx` 1zlap_OdhB8kFa0IjqyndvkansN6A4F3x; `idh/shapefile/`: `.dbf` 1ykcwNPpX3vITkapViaq8Td-LcbOB4NCw, `.qmd` 178okyVGmUVkIvTXGEXUVbpltC-sgeG0g, `.shp` 1ZBiS-7n4q5GYmOssn6g000ftsNmRI1Ht, `.shx` 1ebYFIygCMiTGVpN5Yg1igLwrKoD1GY-B, `.prj` 1dHZmGwslloA3J9fv5iqCBz1MDL4mq7RF
- `demografia/`: `demografia.qgz` 1BJkM0D5NJ-ZldpZtIbiyP_GfXwdDXG99, `demografia_geral.xlsx` 1bJHjoNDsJOpJYaIvybjX1z23pC1PqmRb; `demografia/shapefile/`: `.dbf` 1HZBdLZ5GAczKvcEnRrR6cvKOWFabmzbU, `.shx` 105xw3wz7iYxwRvz9dqKUivIderI90lrJ, `.qmd` 1oTuV0MuEBjzCSZfqwPcZQnXbcgidLdy9, `.shp` 1_NntOrUDaN-sLVjYmc4nn8WK2UVA2rW9, `.prj` 1Q_uC4qTdEerlrLpUGeETSCklIgQ6SJTF, `.cpg` 1PvMqQcAs17Bz5lKk4EJA7mcs0_BM9Aon
- `indice_aridez/`: `indice_aridez.qgz` 1nTqJ0cHYm43lRbglZt5C3QU8djr50HDz; `indice_aridez/raster/`: `_2010_4674_rec.tif.aux.xml` 1a1OEsX5-IdeRAeVfS4PxyxNhykyU5hvL, `_2000_…aux.xml` 1bxZZlL5UDfcd4w7U9DmbptTWZ7J6fo-P, `_1990_…aux.xml` 14JAyW0eOmvUMSxeCyVz7KoCagk14kL9w, `_2010_4674_rec.tif` 1wOEapls48TLxsJOUD7lrb7kGQErLpSzV, `_2000_4674_rec.tif` 1BWbYO7FkoAzKnRNC56UmAtGgXgQkuWBI, `_1990_4674_rec.tif` 1_9mZ5fp_SvgwB_faPR6oaoagyOfHTRv7, `indice_aridez_2020_4674.tif.aux.xml` 1TQgr6c4qNrcLwLWLjZ2oNdxCSb6944Ap, `_2020_4674_rec.tif` 1WLA2PSAGzVNr5JtjR0Pdwq5PVdQstGqR (nomes completos `indice_aridez_<ano>_4674_rec.tif`)
- `shapefile_geral/area_sudene/`: `sudene_mun.dbf` 1ZVZ_HozEEXWH-siH5hratrscgDTr324t, `limite_sudene.shp` 1eYnO9XRtp-uYO0UkkeTuCAq-yrWth5TC, `.dbf` 1F6sQrSuJfuIvBNo_cdWiZbWL6itrDvId, `.shx` 1x7sHTmWXuVwFCp3O6OxlTJXTzVPCrhvZ, `.prj` 1FCSKybuW-RRdw5v6hY4fiuQUYhlbLg4B, `.cpg` 1GmLRg2QJ_v--6V8Owf1p25-NR3LXyMcr, `sudene_mun.qmd` 1ve3uTV0oAwY2Q83G8yMgextaCHTS9x8S, `sudene_mun.shx` 1rzHmRZNS6wzzbyfFkfir1S4wDkuUq-cN, `sudene_mun.shp` 1DXHJHUP1J7wsI7XMP2OPXvJdUX9oPTi4, `sudene_mun.prj` 15ter0s2LxbX7pusYIThral_7CAW5Rq1m, `municipio_sudene.cpg` 1cy71_yPfUaEzYq5q2uUHkG3t9z0y_y85
- `shapefile_geral/caatinga/`: `Caatinga.shx` 1DFiK6HqNOpIYphBWR9FWtqm7C3c9MwLw, `.shp` 1JHrYbov9RuEjyQxgqYu094wtlmIDZ_RL, `.qmd` 1avzf6Oig6Ll0Ug5lV33UInfHCec9vGje, `.dbf` 14Ay7X-5cOO7vR4MtvyY7mDWYP8DRAHJJ, `.prj` 1l7baOmOdSdE-ia7FZHeR0lZ7rvtDRMwQ, `.cpg` 1k9Qi2gnYwKZX6shmVnlA0XEwyOD4jv8O
- `shapefile_geral/brasil/`: `brasil_estado_4674.dbf` 1GLLMWA5RHsB89GrxRaX21n13c02Yy3xn, `.shx` 1B4zE8k7gSnGner8o-KIsjwlh4TVBAVZk, `.shp` 1OJvhVBzHXlEARdhOcUXh3MhGcGBp1PJO, `.prj` 1hH7zDVTcY5mo8F74LGLJZYwIo3IM6CLT, `.cpg` 1Nl1_S1GuoU_kuMQHf8tCQX4LsoQX6EFZ, `limite_brasil_4674.shp` 1OSJeCLh4dgX4Y0f29GyH_C-eDgVQ6DJe, `.shx` 1YULYH9phOU8nlCviiuYe_6xCp9-id4dW, `.dbf` 1nRbOeGMI5vOvtJMgiSjw4OasPYcagEUo, `.prj` 1DE136YCOdL6RU4MXdX-KUjPvaFd_n4So
- `shapefile_geral/nordeste/`: `nordeste_4674.dbf` 1WD8ZKqZYhdrsnu59xoqyiesIWMiMAx9p, `.shx` 1oJ2ZvmPvHsjebjKfTZPAkYlA5D-RYn5W, `.shp` 1t8gzveAt9HQgLDdylgbnkm26CgHMKHBO, `.qmd` 19MFbtNXizVkERXENw4NMCRhBuMCHlYqa, `.cpg` 1WtE2D7J2PnrmiooqyuypIdGA3NwxzZ4L, `.prj` 1DnaVLHM1aUBxUDSV5kVcib4RijCt7B76, `limite_nordeste_4674.shp` 1d4qtKfG4tyvJG7mi4eGvEbbfHRv6OSia, `.dbf` 1K22rLZlchlyxlvQo8KK09XsHej3aS9EB, `.shx` 1xBTqxLn7Rr6QqPr6X8GIxxYq_hNlRz7v, `.prj` 1tzYvERuMX9s0QPG1msERFmWg9upukSbz, `.cpg` 18hFeonjbp9kjnEmM8wgUYK_NbE4gpSkq

- [ ] **Step 1: Write the failing test** — `tests/test_drive.py`:
  - `test_drive_url_uses_usercontent_with_confirm`: `drive_url("abc")` == `"https://drive.usercontent.google.com/download?id=abc&export=download&confirm=t"`.
  - `test_download_all_writes_tree`: manifest com 2 arquivos (`"a/x.qgz"`, `"a/b/y.shp"`), `fetch` fake (classe `DriveFetchFake` que grava `b"ok"` e registra URLs) → arquivos existem em `tmp/a/x.qgz` e `tmp/a/b/y.shp`; retorna os 2 caminhos.
  - `test_download_all_rejects_html_page`: `DriveFetchFake` grava `b"<!DOCTYPE html>"` → `ValueError` cuja mensagem cita o `path` e "expected file bytes, got an HTML page".
  - `test_manifest_paths_are_unique_and_relative`: carrega o `drive_manifest.json` real; nenhum caminho começa com `/` ou contém `..`; sem duplicados; contém `pib/pib.qgz`, `indice_aridez/raster/indice_aridez_2020_4674_rec.tif`.
- [ ] **Step 2: Run** `python3 -m unittest discover -s scripts/geodata/tests -v` → FAIL (módulo não existe).
- [ ] **Step 3: Implement** `drive.py` e o subcomando `download` em `geodata.py` (`argparse`; o `fetch` real usa `urllib.request.urlretrieve`).
- [ ] **Step 4: Run** os testes → PASS. Depois: `python3 -I scripts/geodata/geodata.py download "$SCRATCH/geodata-raw"` e `ls -R` mostra a árvore; `ogrinfo -ro -so .../pib/shapefile/pib.shp pib` → `Feature Count: 2074`.
- [ ] **Step 5: Commit** `feat(geodata): baixa a pasta de mapas dos painéis do Drive`

### Task 2: Estilos do `.qgz` e checagens (`qgis_style.py`, `checks.py`)

**Files:**
- Create: `scripts/geodata/qgis_style.py`, `scripts/geodata/checks.py`, `scripts/geodata/tests/test_qgis_style.py`, `scripts/geodata/tests/test_checks.py`, `scripts/geodata/tests/fixtures/mini.qgs`

**Interfaces:**
- Produces:
  - `read_qgs(qgz_path: Path) -> ET.Element` (abre o zip, lê o único `*.qgs`).
  - `graduated_classes(root, layer_name: str) -> list[dict]` → `{"lower": float, "upper": float, "label": str, "color": "#rrggbb"}` na ordem do arquivo; e `graduated_attribute(root, layer_name) -> str` (ex. `"pib_2023"`).
  - `layer_outline(root, layer_name: str) -> dict` → `{"color": "#666666", "widthMm": 0.15}` (do símbolo 0 do renderer).
  - `raster_palette(root, layer_name: str) -> list[dict]` → `{"value": int, "color": "#rrggbb", "label": str}` (de `colorrampshader/item`).
  - `Issue = TypedDict("Issue", {"arquivo", "camada", "campo", "problema", "evidencia", "esperado"})` em `checks.py`.
  - `check_class_ranges(arquivo, camada, classes) -> list[Issue]` (lower > upper; sobreposição/lacuna entre classes consecutivas; lower negativo para indicador que não admite negativo).
  - `check_field_types(arquivo, camada, fields: dict[str, str], year_prefix: str) -> list[Issue]` (colunas do mesmo prefixo com tipos diferentes).
  - `check_values(arquivo, camada, rows: list[dict], code_field, year_fields) -> list[Issue]` (código duplicado, nulos por ano, valor negativo, texto não numérico em coluna de ano).
  - `check_expected_files(raw_dir, expected: list[str]) -> list[Issue]` (ex. `.cpg` com nome diferente do `.shp`; Semiárido sem polígono próprio — registrado como "lacuna", não erro).
- Cores QGIS vêm como `"r,g,b,a,rgb:..."` → usar os 3 primeiros inteiros.

- [ ] **Step 1: Write the failing tests**
  - `mini.qgs`: copiar só os `<maplayer>` `brasil_estado_4674` e `demografia` do `demografia.qgz` real (com as 3 faixas, incluindo `lower="50000" upper="10000"`).
  - `test_graduated_classes_reads_as_is`: `[c["lower"], c["upper"]]` == `[[0,50000],[50000,10000],[10000,4000000]]`; cores `#efcfdc`, `#e7a4bf`, `#e482a9`; labels iguais ao arquivo.
  - `test_layer_outline_state_limit`: `layer_outline(root, "brasil_estado_4674")` == `{"color": "#666666", "widthMm": 0.15}`.
  - `test_raster_palette_reads_items` (fixture com 4 items da aridez 2020): `[(2,"#d7191b","Árido"),(3,"#fe7f00","Semiárido"),(4,"#c6e8ac","Subúmido seco"),(5,"#2c83b9","Úmido")]`.
  - `test_check_class_ranges_flags_inverted_range`: issue com `campo="pop_2022"`, `problema` contendo `"limite inferior 50000 maior que o superior 10000"`, `esperado` contendo `"≤ 100 mil"` (vindo do rótulo).
  - `test_check_class_ranges_flags_negative_lower`: classes PIB com lower `-190464340` → 1 issue.
  - `test_check_field_types_flags_text_year`: `{"pop_2000": "String", "pop_2010": "Integer64", "pop_2022": "Integer64"}` → 1 issue em `pop_2000`.
  - `test_check_values_flags_duplicates_nulls_negatives`: 3 linhas (código repetido, um `None`, um negativo) → 3 issues com o código na `evidencia`.
- [ ] **Step 2: Run** `python3 -m unittest discover -s scripts/geodata/tests -v` → FAIL.
- [ ] **Step 3: Implement** os dois módulos (`xml.etree`, `zipfile`; nada de geopandas).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(geodata): lê cores e classes do qgz e aponta inconsistências`

### Task 3: Build dos geodados (`build.py`, subcomando `build`)

**Files:**
- Create: `scripts/geodata/build.py`, `scripts/geodata/tests/test_build.py`
- Modify: `scripts/geodata/geodata.py`

**Interfaces:**
- Consumes: Task 2.
- Produces (em `<out>/`), consumidos pelo TS (Task 5):
  - `vector/pib.geojson`, `vector/demografia.geojson`: propriedades `code` (string 7 dígitos), `name`, `uf` (sigla), `nordeste`, `semiarido`, `caatinga`, `sudene` (`1`/`0` a partir de `"Sim"`), e `v<ano>` numérico por coluna de ano (`pib_2023` → `v2023`; `pop_2000` texto → `CAST(... AS REAL)`, inválido → `null`).
  - `vector/idh.geojson`: `code` = sigla UF, `name` = `Estado_UF`, `uf` = sigla, `nordeste=1`, `v<ano>`.
  - `vector/estados.geojson`: os 27 estados de `brasil_estado_4674`, `code` = sigla, `name`.
  - `vector/areas.geojson`: 4 feições, propriedade `area` ∈ `nordeste|semiarido|caatinga|sudene` (`limite_nordeste_4674`, `Caatinga`, `limite_sudene`, e Semiárido = `ST_Union` dos municípios de `sudene_mun` com `semi_21_1='Sim'`).
  - `raster/aridez_<ano>.png` (ano ∈ 1990, 2000, 2010, 2020) via `gdaldem color-relief -alpha -nearest_color_entry` com a paleta do `.qgz` (sem dado transparente).
  - `styles.json`: `{"indicators": {"pib"|"demografia"|"idh": {"attribute": "pib_2023", "classes": [...], "outline": {"color", "widthPx"}}}, "stateOutline": {...}, "aridez": [{"value","color","label"}]}`; `widthPx = max(0.5, round(widthMm * 96 / 25.4, 2))`.
  - `manifest.json`: `{"generatedAt": ISO, "years": {"pib": [...], "demografia": [...], "idh": [...]}, "aridez": {"years": [1990,2000,2010,2020], "bounds": [[w,s],[e,n]]}}` (bounds via `gdalinfo -json`, `cornerCoordinates`).
  - `data-issues.json`: lista de `Issue` de Task 2 rodadas sobre os arquivos reais.
  - Constantes: `SIMPLIFY_TOLERANCE_DEG = 0.002`, `COORD_PRECISION = 5` (`-lco COORDINATE_PRECISION=5`), saída `-t_srs EPSG:4326`.
- `run(cmd: list[str]) -> str` único ponto de `subprocess.run(check=True)`; erro cita o comando e o stderr.

- [ ] **Step 1: Write the failing tests** — `test_build.py`:
  - `test_year_columns_maps_prefix_to_v`: `year_columns(["cd_mun_1","pib_2010","pib_2023"], "pib_")` == `{"pib_2010": "v2010", "pib_2023": "v2023"}`.
  - `test_municipal_select_sql`: `municipal_select("pib", {"pib_2010": "v2010"})` contém `CAST(cd_mun_1 AS TEXT) AS code`, `(ne = 'Sim') AS nordeste`, `CAST(pib_2010 AS REAL) AS v2010`.
  - `test_relief_palette_text`: `relief_palette([{"value":3,"color":"#fe7f00",...}])` == `"3 254 127 0 255\nnv 0 0 0 0\n"`.
  - `test_width_px_from_mm`: `0.15 → 0.57`; `0.05 → 0.5`.
  - `test_build_manifest_years_sorted`: a partir das colunas → anos crescentes.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `build.py` e o subcomando `build <raw> <out>` (rodando também os checks e gravando `data-issues.json`).
- [ ] **Step 4: Verify**
  - testes → PASS.
  - `python3 -I scripts/geodata/geodata.py build "$SCRATCH/geodata-raw" "$SCRATCH/geodata"`; `du -sh $SCRATCH/geodata/vector/*` → cada municipal < 4 MB; `python3 -c` conta 2074 feições em `pib.geojson` e 4 em `areas.geojson`; `styles.json` tem as 7 classes do PIB e a faixa `[50000, 10000]` intacta na demografia.
- [ ] **Step 5: Commit** `feat(geodata): gera geojson, png da aridez, estilos e manifesto`

### Task 4: Rota `/api/geodata/[...path]`

**Files:**
- Create: `src/features/geodata/geodataFile.ts`, `src/features/geodata/geodataFile.test.ts`, `src/app/api/geodata/[...path]/route.ts`, `src/app/api/geodata/[...path]/route.test.ts`
- Modify: `.env.sample` (`GEODATA_DIR=""` com comentário: diretório preparado por `scripts/geodata`)

**Interfaces:**
- Produces: `resolveGeodataFile(root: string, segments: string[]): { absolutePath: string; contentType: string } | null` — só `.json`/`.geojson` (`application/json`, geojson como `application/geo+json`) e `.png` (`image/png`); `null` para `..`, segmento vazio, caminho absoluto, extensão fora da lista. `geodataEtag(size: number, mtimeMs: number): string`.
- Rota `GET`: sem `GEODATA_DIR` → 503 `{ error: "GEODATA_DIR is \"undefined\"; expected the directory prepared by scripts/geodata." }`; caminho inválido → 400; arquivo inexistente → 404; ok → corpo + `Content-Type`, `Cache-Control: public, max-age=86400`, `ETag`; `If-None-Match` igual → 304. Log JSON `event: "geodata_file_missing"` no 404.

- [ ] **Step 1: Write the failing tests**
  - `geodataFile.test.ts`: `resolveGeodataFile("/g", ["vector","pib.geojson"])` → `{ absolutePath: "/g/vector/pib.geojson", contentType: "application/geo+json" }`; `["..","etc","passwd"]`, `["vector","a.js"]`, `[]`, `["/abs.json"]` → `null`.
  - `route.test.ts` (`vi.stubEnv("GEODATA_DIR", tmpdir)` com arquivo real em `os.tmpdir()`): 200 com headers; 304 com `If-None-Match`; 404; 400 para `..`; 503 sem env.
- [ ] **Step 2: Run** `npx vitest run src/features/geodata src/app/api/geodata` → FAIL.
- [ ] **Step 3: Implement** (route com `fs/promises`, `params` como `Promise<{ path: string[] }>` no Next 16).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(api): serve os geodados dos mapas a partir de GEODATA_DIR`

### Task 5: Tipos e pintura das classes (`geodataTypes.ts`, `qgisPaint.ts`)

**Files:**
- Create: `src/features/panelMap/geodataTypes.ts`, `src/features/panelMap/qgisPaint.ts`, `src/features/panelMap/qgisPaint.test.ts`

**Interfaces:**
- Produces:
  - `type PanelIndicator = "pib" | "demografia" | "idh"`; `type QgisClass = { lower: number; upper: number; label: string; color: string }`; `type QgisOutline = { color: string; widthPx: number }`; `type IndicatorStyle = { attribute: string; classes: QgisClass[]; outline: QgisOutline }`; `type GeodataStyles = { indicators: Record<PanelIndicator, IndicatorStyle>; stateOutline: QgisOutline; aridez: { value: number; color: string; label: string }[] }`; `type GeodataManifest = { generatedAt: string; years: Record<PanelIndicator, number[]>; aridez: { years: number[]; bounds: [[number, number], [number, number]] } }`; `type MapFeatureProps = { code: string; name: string; uf: string; nordeste?: number; semiarido?: number; caatinga?: number; sudene?: number; [year: \`v${number}\`]: number | null }`.
  - `NO_DATA_COLOR = "#d9d9d9"`.
  - `yearField(ano: number): string` → `"v2023"`.
  - `classForValue(classes: QgisClass[], value: number | null): QgisClass | null` — semântica QGIS: 1ª classe `lower ≤ v ≤ upper`, demais `lower < v ≤ upper`, primeira que casar; `null` se nenhuma.
  - `classColorExpression(classes: QgisClass[], ano: number): ExpressionSpecification` (tipo importado de `maplibre-gl` só como `import type`) — `["case", <sem valor>, NO_DATA_COLOR, <cond classe 1>, cor1, ..., NO_DATA_COLOR]` com a mesma semântica.

- [ ] **Step 1: Write the failing tests**
  - `classForValue(PIB_CLASSES, 66351305000)` → label `"> R$ 35 Bi"`; `classForValue(PIB_CLASSES, 500000000)` → 1ª classe (borda superior inclusiva).
  - Demografia como veio (`[0,50000],[50000,10000],[10000,4000000]`): `70000` → `"Grande (≥ 100 mil habitantes)"`; nenhum valor cai em "Médio".
  - `classForValue(classes, null)` → `null`.
  - `classColorExpression(classes, 2023)` começa com `"case"` e testa `["==", ["typeof", ["get", "v2023"]], "number"]` (ausente/`null` → `NO_DATA_COLOR`) e termina em `NO_DATA_COLOR`.
- [ ] **Step 2: Run** `npx vitest run src/features/panelMap/qgisPaint.test.ts` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(panel-map): pinta o indicador com as classes do qgz`

### Task 6: Níveis de zoom e recorte (`mapRecorte.ts`)

**Files:**
- Create: `src/features/panelMap/mapRecorte.ts`, `src/features/panelMap/mapRecorte.test.ts`

**Interfaces:**
- Produces:
  - `type MapLevel = "area" | "estado" | "municipio"`; `type MapRecorte = { uf: string[]; mun: string[] }`; `EMPTY_RECORTE`.
  - `STATE_ZOOM = 6.5`, `MUNICIPALITY_ZOOM = 8.5`, `ZOOM_OUT_TOLERANCE = 0.5`.
  - `levelForZoom(zoom: number, deepest: MapLevel): MapLevel`.
  - `levelOfRecorte(recorte: MapRecorte): MapLevel`.
  - `resolveRecorte(input: { zoom: number; fittedZoom: number; current: MapRecorte; centerUf?: string; centerMun?: string; deepest: MapLevel }): MapRecorte` — regras (spec, "Regra de nível"): sem `centerUf` → `current`; descer quando `levelForZoom` > nível atual (estado → `{uf:[centerUf], mun:[]}`, município → `{uf:[centerUf], mun:[centerMun]}`, sem `centerMun` fica no estado); subir só quando `zoom < fittedZoom - ZOOM_OUT_TOLERANCE` e o nível pelo zoom é mais raso (área → `EMPTY_RECORTE`, estado → `{uf:[centerUf], mun:[]}`); mesmo nível e alvo central fora da seleção → troca o alvo; alvo central dentro da seleção (multi) → `current`.
  - `sameRecorte(a: MapRecorte, b: MapRecorte): boolean` (ignora ordem).

- [ ] **Step 1: Write the failing tests** (um `it` por regra):
  - `levelForZoom(5, "municipio")` → `"area"`; `7` → `"estado"`; `9` → `"municipio"`; `levelForZoom(9, "estado")` → `"estado"` (IDH).
  - Zoom 7 sobre PE, sem filtro → `{uf:["PE"], mun:[]}`.
  - Zoom 9 sobre Recife → `{uf:["PE"], mun:["2611606"]}`.
  - Bahia escolhida na barra, `fittedZoom: 5.8`, `zoom: 5.8`, centro em BA → mantém `{uf:["BA"]}` (não sobe).
  - `fittedZoom: 7`, `zoom: 6.2` → `EMPTY_RECORTE`.
  - Arrastar no nível estado de PE para PB (zoom 7) → `{uf:["PB"], mun:[]}`.
  - Multi `{uf:["PE","PB"]}`, zoom 7, centro em PE → mantém o multi.
  - Sem `centerUf` (oceano) → `current` inalterado.
  - `deepest: "estado"` com zoom 10 → nunca põe `mun`.
  - `sameRecorte({uf:["PB","PE"],mun:[]}, {uf:["PE","PB"],mun:[]})` → `true`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(panel-map): resolve o recorte pelo zoom e pelo centro do mapa`

### Task 7: Camadas, véu, tooltip e adaptadores de filtro

**Files:**
- Create: `src/features/panelMap/mapLayers.ts`, `mapLayers.test.ts`, `mapTooltip.ts`, `mapTooltip.test.ts`, `panelMapAdapters.ts`, `panelMapAdapters.test.ts` (todos em `src/features/panelMap/`)

**Interfaces:**
- Consumes: Tasks 5–6; `TerritorialArea`/`TerritorialFilters` (`src/features/panels/territorialFilters.ts`); `IdhFilters` (`src/features/panels/idh/idhPanel.ts`); `rankRegions`.
- Produces:
  - `areaFilter(area: TerritorialArea): FilterSpecification` → `["==", ["get", "<area>"], 1]`.
  - `veilFilters(recorte: MapRecorte): { states: FilterSpecification | null; features: FilterSpecification | null }` — nível área: ambos `null`; estado: `states` = estados com `code` fora de `recorte.uf`, `features` = `null`; município: `states` idem e `features` = feições com `uf` em `recorte.uf` e `code` fora de `recorte.mun`.
  - `VEIL_COLOR = "#9ca3af"`, `VEIL_OPACITY = 0.75`.
  - `selectionFilter(recorte: MapRecorte, indicator: PanelIndicator): FilterSpecification | null` (contorno grosso: municípios em `mun`, senão estados em `uf`).
  - `bboxOf(features: GeoJSON.Feature[]): [[number, number], [number, number]] | null`.
  - `fitTargetFor(recorte: MapRecorte, area: TerritorialArea, sources: { features: FeatureCollection; states: FeatureCollection; areas: FeatureCollection }): [[number, number], [number, number]] | null` — `mun` → bbox deles; `uf` → bbox dos estados; senão bbox da área (`areas.geojson`).
  - `rankWithinArea(features: MapFeatureProps[], ano: number): Map<string, number>` (só feições com número; usa `rankRegions`).
  - `describeMapFeature(feature: MapFeatureProps, ano: number, ranks: Map<string, number>, total: number, formatValue: (v: number) => string): { title: string; value: string; rank: string | null }` — título `"Recife (PE)"` para município, `"Pernambuco (PE)"` para estado (`name` já traz isso no IDH); sem valor → `value: "sem dado"`, `rank: null`; rank `"12º de 1.794"` (`formatNumber`).
  - `territorialToRecorte(f: TerritorialFilters): MapRecorte`; `recorteToTerritorial(f: TerritorialFilters, r: MapRecorte): TerritorialFilters` (mantém `ano`/`area`; `uf`/`mun` vazios viram `undefined`).
  - `idhToRecorte(f: IdhFilters): MapRecorte`; `recorteToIdh(f: IdhFilters, r: MapRecorte): IdhFilters` (só `uf[0]`).

- [ ] **Step 1: Write the failing tests**
  - `veilFilters(EMPTY_RECORTE)` → `{states: null, features: null}` (sem cinza no nível área).
  - `veilFilters({uf:["PE"],mun:[]})` → `states` é `["!", ["in", ["get","code"], ["literal",["PE"]]]]`, `features: null`.
  - `veilFilters({uf:["PE"],mun:["2611606"]})` → `features` véu dos municípios de PE ≠ Recife.
  - `veilFilters({uf:["PE","PB"],mun:[]})` → véu fora da união.
  - `fitTargetFor` com 2 estados → bbox que cobre os dois (fixtures de quadrados).
  - `rankWithinArea` ignora `null` e empata como `rankRegions`.
  - `describeMapFeature` com `v2023: null` → `{ value: "sem dado", rank: null }`; com valor e rank 12 de 1794 → `rank: "12º de 1.794"`.
  - Adaptadores: ida e volta preservam `ano`/`area`/`visao`; `recorteToTerritorial(f, EMPTY_RECORTE)` → sem `uf`/`mun`; `recorteToIdh(f, {uf:["PE"],mun:[]})` → `uf: "PE"`.
- [ ] **Step 2: Run** `npx vitest run src/features/panelMap` → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(panel-map): véu, enquadramento, tooltip e ponte com os filtros dos painéis`

### Task 8: Adaptador MapLibre (`src/lib/panelMapEngine.ts`) e PNG do canvas

**Files:**
- Create: `src/lib/panelMapEngine.ts`
- Modify: `src/lib/chartImage.ts` (+ `canvasImageSource`), `src/components/ProtoPanel/ProtoCardMenu.tsx` (prop `chart` passa a ser `{ getSource: () => ChartImageSource | null }`)

**Interfaces:**
- Consumes: Tasks 5–7.
- Produces:
  - `type BasemapKind = "satelite" | "oceano"`; `BASEMAPS: Record<BasemapKind, { label: string; tiles: string; attribution: string }>`.
  - `interface PanelMapEngine { setBasemap(kind: BasemapKind): void; setSources(s: { features: FeatureCollection; states: FeatureCollection; areas: FeatureCollection }): void; setIndicatorPaint(p: { color: ExpressionSpecification; outline: QgisOutline; stateOutline: QgisOutline; areaFilter: FilterSpecification }): void; setVeil(v: ReturnType<typeof veilFilters>): void; setSelection(f: FilterSpecification | null): void; setAridez(a: { url: string; bounds: [[number,number],[number,number]] } | null): void; fitTo(bbox: [[number,number],[number,number]]): void; onMoveEnd(cb: (e: { zoom: number; centerUf?: string; centerMun?: string; programmatic: boolean; fittedZoom: number }) => void): void; onHover(cb: (h: { props: MapFeatureProps; x: number; y: number } | null) => void): void; onClickFeature(cb: (props: MapFeatureProps) => void): void; toImageSource(): ChartImageSource; destroy(): void }`
  - `createPanelMapEngine(container: HTMLElement, opts: { basemap: BasemapKind; onReady: (engine: PanelMapEngine) => void }): void` — `preserveDrawingBuffer: true`, `attributionControl` compacto, `NavigationControl` sem bússola, `promoteId: "code"` nas fontes, hover por `feature-state`, `programmatic` marcado em `fitTo` (flag zerada no `moveend` seguinte), `fittedZoom` = zoom após o último `fitTo`; centro resolvido com `queryRenderedFeatures` no ponto central nas camadas de estados e de feições. Camadas na ordem: basemap → aridez → indicador (fill) → véu → contornos municipais → contorno estadual → seleção (`#1f2937`, 2.5px).
  - `canvasImageSource(canvas: HTMLCanvasElement): ChartImageSource`.
  - Sem teste unitário do adaptador (é o vendor); coberto pelo teste do componente com `PanelMapEngineFake` e pela verificação no navegador (Task 13).

- [ ] **Step 1: Write the failing test** — em `src/lib/chartImage.test.ts` (criar se não existir): `canvasImageSource(canvas)` devolve largura/altura do canvas e `getDataURL` chama `toDataURL("image/png")` (canvas fake).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** `canvasImageSource`, o adaptador e o ajuste do tipo de `chart`.
- [ ] **Step 4: Run** `npx vitest run src/lib src/components/ProtoPanel` e `npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** `feat(panel-map): adaptador do MapLibre e imagem a partir do canvas`

### Task 9: Componente `PanelMap`

**Files:**
- Create: `src/components/PanelMap/PanelMap.tsx`, `useGeodata.ts`, `useMapRecorte.ts`, `useMapRecorte.test.ts`, `BasemapSwitch.tsx`, `AridezControl.tsx`, `PanelMapLegend.tsx`, `PanelMapTooltip.tsx`, `PanelMap.test.tsx`, `panelMapEngineFake.ts` (fake para testes)

**Interfaces:**
- Consumes: Tasks 4–8.
- Produces:
  - `useGeodata(indicator: PanelIndicator): { status: "loading" } | { status: "error"; message: string } | { status: "ready"; styles: GeodataStyles; manifest: GeodataManifest; features: FeatureCollection; states: FeatureCollection; areas: FeatureCollection }` (busca `/api/geodata/styles.json`, `manifest.json`, `vector/<indicator>.geojson`, `vector/estados.geojson`, `vector/areas.geojson`; `fetch` injetável por parâmetro opcional).
  - `useMapRecorte(args: { engine: PanelMapEngine | null; recorte: MapRecorte; deepest: MapLevel; onRecorteChange: (r: MapRecorte) => void }): void` — no `onMoveEnd`: ignora `programmatic`; chama `resolveRecorte`; só dispara se `!sameRecorte`.
  - `PanelMap` props: `{ indicator: PanelIndicator; ano: number; area: TerritorialArea; recorte: MapRecorte; deepest: MapLevel; onRecorteChange: (r: MapRecorte) => void; formatValue: (v: number) => string; label: string; onEngine?: (e: PanelMapEngine | null) => void; className?: string; createEngine?: typeof createPanelMapEngine }`.
  - Efeitos: mudou `recorte`/`area` → `engine.fitTo(fitTargetFor(...))` + `setVeil` + `setSelection`; mudou `ano` → `setIndicatorPaint`; clique numa feição → `fitTo(bbox dela)` (o recorte vem do `moveend` pelo zoom).
  - Controles dentro do mapa: `BasemapSwitch` (Satélite | Oceano, `aria-pressed`, padrão **Oceano**), `AridezControl` (checkbox "Índice de aridez" + select de década com `manifest.aridez.years`, padrão desligado, último ano), `PanelMapLegend` (classes do `.qgz` do indicador; com aridez ligada, também a paleta da aridez), `PanelMapTooltip` (título, valor, `Nº no ranking`).
  - Erro de geodados → aviso no lugar do mapa: "Mapa indisponível: os geodados não foram encontrados neste ambiente." (sem derrubar o card).

- [ ] **Step 1: Write the failing tests**
  - `useMapRecorte.test.ts` (com `PanelMapEngineFake` que expõe `emitMoveEnd`): `programmatic: true` → `onRecorteChange` não chamado; zoom 7 em PE sem filtro → chamado uma vez com `{uf:["PE"],mun:[]}`; mesmo recorte de novo → não chama.
  - `PanelMap.test.tsx` (`createEngine` fake, `fetch` fake com fixtures mínimas): renderiza os botões "Satélite"/"Oceano" com Oceano pressionado; clicar "Satélite" → `engine.setBasemap("satelite")`; ligar aridez → `setAridez` com `url` `/api/geodata/raster/aridez_2020.png`; trocar `recorte` por props → `fitTo` e `setVeil` chamados; `fetch` 503 → texto "Mapa indisponível".
- [ ] **Step 2: Run** `npx vitest run src/components/PanelMap` → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm run lint`.
- [ ] **Step 5: Commit** `feat(panel-map): componente de mapa compartilhado dos painéis`

### Task 10: Painel do PIB

**Files:**
- Modify: `src/components/PibDashboard/PibMapCard.tsx`, `src/components/PibDashboard/PibLayout.tsx`, `src/components/PibDashboard/PibDashboard.tsx`, textos em `pibTexts.ts` (título/info do card)
- Test: `src/components/PibDashboard/PibMapCard.test.tsx` (criar)

**Interfaces:**
- Consumes: `PanelMap`, `territorialToRecorte`/`recorteToTerritorial`, `formatPibReais`, `canvasImageSource` via `onEngine`.
- Produces: `PibMapCard` com props `{ data; selection: TerritorialFilters; onFiltersChange: (f: TerritorialFilters) => void; state; onRetry }` (troca `selectedUfs`/`onSelectUf`); `PibLayout` passa `selection` e `request`.
- Título do card: "Mapa do PIB por município"; subtítulo `PIB total · <área> · <ano>`; `deepest: "municipio"`; fullscreen: `ProtoMapFullscreen` com `renderStage={() => <PanelMap ... />}`; menu com `chart={{ getSource: () => engine?.toImageSource() ?? null }}`; fonte da imagem = `PIB_CARD_SOURCE + " · Basemap: Esri"`.
- Some do card: `buildPibMapProps`, `MapLegend`, `describeStatesOffMap` (se ficarem sem uso no repo, remover e listar em `docs/README.md`).

- [ ] **Step 1: Write the failing test** — `PibMapCard.test.tsx` (mock de `@/components/PanelMap/PanelMap` que expõe as props): `PanelMap` recebe `indicator="pib"`, `ano` e `recorte` vindos de `selection`; chamar o `onRecorteChange` do mock com `{uf:["PE"],mun:[]}` → `onFiltersChange` recebe `{...selection, uf:["PE"], mun: undefined}`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** `npx vitest run src/components/PibDashboard` → PASS (ajustar testes existentes que dependiam de `onSelectUf`).
- [ ] **Step 5: Commit** `feat(pib): mapa municipal com recorte por zoom no painel do PIB`

### Task 11: Painel do perfil demográfico

**Files:**
- Modify: `src/components/DemografiaDashboard/PerfilPorteMapCard.tsx`, `PerfilLayout.tsx`, `DemografiaDashboard.tsx`, `PerfilLayout.test.tsx`
- Test: `src/components/DemografiaDashboard/PerfilPorteMapCard.test.tsx` (criar)

**Interfaces:**
- Consumes: igual à Task 10, com `formatPessoas` e `indicator="demografia"`.
- Saem do card: `ViewToggle`/vista Estados, `ChoroplethCanvas`, `PerfilPorteToggles` (legenda vem do `.qgz` pelo `PanelMapLegend`); `usePorteMapView` passa a guardar só `fullscreen`. Fica: tabela `sr-only` (`buildPerfilPorteTable`). Componentes/funções que ficarem sem uso no repo (`PerfilPorteToggles`, `useDemografiaHighlight`, `ChoroplethCanvas`…) são removidos e listados em `docs/README.md`.
- `deepest: "municipio"`; título continua "Porte dos municípios"; INFO atualizado: "…Aproxime o mapa para filtrar o painel por estado e por município."

- [ ] **Step 1: Write the failing test** — mesmo formato da Task 10 com `indicator="demografia"`; e "a tabela sr-only continua no card".
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** `npx vitest run src/components/DemografiaDashboard` → PASS.
- [ ] **Step 5: Commit** `feat(perfil): mapa de porte em MapLibre com recorte por zoom`

### Task 12: Painel do IDH

**Files:**
- Modify: `src/components/IdhDashboard/IdhOverview.tsx` (`MapCard`), `src/components/IdhDashboard/idhMapProps.ts` (remover se sem uso), `IdhDashboard.test.tsx`/`IdhOverview.test.tsx` conforme quebrarem
- Test: caso novo em `src/components/IdhDashboard/IdhOverview.test.tsx`

**Interfaces:**
- Consumes: `PanelMap` com `indicator="idh"`, `area="nordeste"`, `deepest: "estado"`, `idhToRecorte`/`recorteToIdh`, `formatIdh`.
- O `onSelectUf` do overview passa a ser `onFiltersChange(recorteToIdh(selection, r))`; ranking e outros cards inalterados (continuam com `IDH_MAP_BUCKETS`). `IdhMapLegend` sai do card do mapa (a legenda vem do `.qgz`).

- [ ] **Step 1: Write the failing test** — no `IdhOverview.test.tsx`: `PanelMap` (mock) recebe `deepest="estado"`; `onRecorteChange({uf:["PE"],mun:[]})` → filtro pedido com `uf: "PE"`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** `npx vitest run src/components/IdhDashboard` → PASS.
- [ ] **Step 5: Commit** `feat(idh): mapa por estado em MapLibre com recorte por zoom`

### Task 13: Ambiente local, verificação completa e navegador

**Files:**
- Modify: `.env` local (não commitado): `DATA_DB_URL` (túnel 5433, credenciais do `oca_user` do `../Automatic-Reporting/.env`), `DEMOS_HABILITADAS=1`, `GEODATA_DIR=$SCRATCH/geodata`

- [ ] **Step 1:** Túnel: `ssh -N -L 5433:127.0.0.1:5432 datane` em background; `ss -ltnp | grep 5433` mostra o listener.
- [ ] **Step 2:** `npm run lint && npm test && npm run build` → tudo verde.
- [ ] **Step 3:** `npm run dev`; no navegador (`mcp__claudecodebrowser__*`), para cada painel (`/demo/pib`, `/demo/perfil-demografico`, `/demo/idh`): mapa carrega com Oceano; troca para Satélite; liga aridez 2020 e 1990; zoom até um estado → véu cinza fora dele e URL ganha `uf=`; zoom até município (PIB/perfil) → URL ganha `mun=` e os outros cards recarregam; afastar → filtro limpo; hover → tooltip com município, valor e ranking; escolher 2 estados na barra → véu fora da união e enquadra; "Baixar imagem" gera PNG. Screenshot de cada estado para mostrar ao usuário.
- [ ] **Step 4:** Ajustar `STATE_ZOOM`/`MUNICIPALITY_ZOOM` se o mapa no card pedir (são constantes nomeadas; atualizar os testes da Task 6 junto).
- [ ] **Step 5: Commit** (se houver ajuste) `fix(panel-map): ajusta os limiares de zoom ao tamanho do card`

### Task 14: Deploy no gamma, runbook, relatório de dados

**Files:**
- Create: `scripts/geodata/compare_db.py`, `scripts/geodata/issues_pdf.py`, `scripts/geodata/tests/test_issues_pdf.py`
- Modify: `.github/workflows/deploy-gamma.yml`, `docs/README.md`

**Interfaces:**
- `compare_db.py <geodata_dir>` (roda com `../Automatic-Reporting/.venv/bin/python`, lê `DATA_DB_URL` do ambiente, sessão `default_transaction_read_only=on`): compara `v<ano>` do `pib.geojson` com `SUM(pib_total)` por `cd_mun`/ano em `eco_pib.vw_pib_municipal_pbi`, população com `dem_demografia.final_demografia`, IDH com `des_idh.idh_geral_novo_view`; diferença relativa > 0,5% vira `Issue` (com 10 exemplos por indicador) anexada a `data-issues.json`. Conferir as colunas reais nas queries de `src/features/panels/*/…Panel.ts` antes de escrever o SQL.
- `issues_pdf.py <data-issues.json> <saida.pdf>`: `render_issues_html(issues) -> str` (tabela agrupada por arquivo: Arquivo, Camada, Campo, Problema, Evidência, O que se espera; cabeçalho "Mapas dos painéis — problemas nos dados", data, origem = pasta do Drive) e conversão `google-chrome --headless --no-pdf-header-footer --print-to-pdf=<saida> <html>`.
- `deploy-gamma.yml`, no `docker run` do `push-gamma`: `-v /opt/datane/geodata:/geodata:ro` e `-e GEODATA_DIR=/geodata`, com comentário `IMPORTANT:` dizendo que o diretório é preenchido por `scripts/geodata` + rsync (seção do `docs/README.md`).
- `docs/README.md`: seção "Panel Maps (MapLibre)" — fonte (pasta do Drive), comandos `download`/`build`, rsync, `GEODATA_DIR`, só gamma, regras do zoom/véu/ranking, "o mapa não corrige dados", componentes removidos.

- [ ] **Step 1: Write the failing test** — `test_issues_pdf.py`: `render_issues_html([issue])` contém o nome do arquivo, o problema e escapa `<`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** os dois scripts, o workflow e o doc.
- [ ] **Step 4: Verify**
  - `python3 -m unittest discover -s scripts/geodata/tests` → PASS.
  - Com o túnel: `DATA_DB_URL=... ../Automatic-Reporting/.venv/bin/python -I scripts/geodata/compare_db.py "$SCRATCH/geodata"`; depois `python3 -I scripts/geodata/issues_pdf.py "$SCRATCH/geodata/data-issues.json" ~/Projetos/oca/data-nordeste/Documentacao-OCA/data-nordeste/frontend/mapas-paineis-problemas-dados-2026-11-23.pdf`; abrir o PDF e conferir que lista ao menos: faixa "Médio" invertida, `pop_2000` texto, limite negativo do PIB, `.cpg` com nome trocado, Semiárido sem polígono.
  - Gamma: `ssh` (só leitura) no host do runner `datane-gamma-lsd-runner` para confirmar o container `data-nordeste-frontend` do gamma e o caminho; `sudo mkdir -p /opt/datane/geodata`; `rsync -av --delete "$SCRATCH/geodata/" <host>:/opt/datane/geodata/`; `ls /opt/datane/geodata/vector` mostra os 5 GeoJSON.
- [ ] **Step 5: Commit** `chore(deploy): monta os geodados dos mapas no gamma e documenta o fluxo`

---

## Self-review (feito)

- Cobertura do spec: objetivos 1–11 → Tasks 9–12 (1), 8–9 (2), 5/9 (3), 3/9 (4), 6/9 (5), 9 (6), 7 (7), 2–3/8 (8), 7/9 (9), 1/3/14 (10), 2/14 (11). Ajuste ao spec: o véu é por filtro de camada (estados/municípios fora do recorte), não "mundo com furo" — mais simples e cobre "áreas não destacadas"; atualizar §3 do spec na Task 7.
- Tipos conferidos entre tasks: `MapRecorte`, `PanelIndicator`, `QgisOutline`, `veilFilters`, `PanelMapEngine`.
