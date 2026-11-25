"""Gera os arquivos do mapa dos painéis (`<out>/`) a partir da pasta bruta do Drive.

Saídas: `vector/*.geojson` (inclui `municipios.geojson`, a malha sem indicador, e
`estados_<area>.geojson` / `estados_fora_<area>.geojson`, a parte de cada estado
dentro / fora da área),
`raster/aridez_<ano>_<area>.png` (recortado pela área), `styles.json`,
`manifest.json` e `data-issues.json`. IMPORTANT: nada aqui corrige dado do Drive;
só renomeia propriedades, converte texto numérico para desenhar (o que não
converter vira `null`, "sem dado") e reporta problemas em `data-issues.json`.

Uso: `build(Path("<raw>"), Path("<out>"))`.
"""

import json
import os
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

import checks
import qgis_style
from sql import (
    AREA_FLAGS,
    area_select,
    area_states_outside_select,
    area_states_select,
    municipal_select,
    municipios_select,
    semiarido_select,
    state_indicator_select,
    states_select,
    year_columns,
)

SIMPLIFY_TOLERANCE_DEG = 0.002
COORD_PRECISION = 5
ARIDEZ_YEARS = (1990, 2000, 2010, 2020)
BOUNDS_TOLERANCE_DEG = 1e-4
# PAM desligado: o GDAL não grava `.aux.xml` na pasta bruta nem ao lado dos PNG.
GDAL_ENV = {**os.environ, "GDAL_PAM_ENABLED": "NO"}

INDICATORS = {
    "pib": {"shp": "pib/shapefile/pib.shp", "qgz": "pib/pib.qgz", "prefix": "pib_", "code": "cd_mun_1"},
    "demografia": {
        "shp": "demografia/shapefile/demografia.shp",
        "qgz": "demografia/demografia.qgz",
        "prefix": "pop_",
        "code": "cd_mun_1",
    },
    "idh": {"shp": "idh/shapefile/idh.shp", "qgz": "idh/idh.qgz", "prefix": "idh_", "code": "uf"},
}
STATES_SHP = "shapefile_geral/brasil/brasil_estado_4674.shp"
STATE_OUTLINE_QGZ = "pib/pib.qgz"
AREA_POLYGONS = {
    "nordeste": "shapefile_geral/nordeste/limite_nordeste_4674.shp",
    "caatinga": "shapefile_geral/caatinga/Caatinga.shp",
    "sudene": "shapefile_geral/area_sudene/limite_sudene.shp",
}
SEMIARIDO_SOURCE_SHP = "shapefile_geral/area_sudene/sudene_mun.shp"
# Malha municipal sem indicador (painel de aridez): a mesma base do Semiárido.
MUNICIPIOS_SHP = SEMIARIDO_SOURCE_SHP
# Estados recortados pela área (hover e seleção do mapa): a união dos municípios
# da mesma malha, para coincidir com as feições municipais desenhadas.
AREA_STATES_SHP = SEMIARIDO_SOURCE_SHP
# O Semiárido não tem polígono no Drive; listá-lo faz a lacuna aparecer no relatório.
EXPECTED_SHAPEFILES = [
    *(spec["shp"] for spec in INDICATORS.values()),
    STATES_SHP,
    *AREA_POLYGONS.values(),
    SEMIARIDO_SOURCE_SHP,
    "shapefile_geral/semiarido/semiarido.shp",
]
ARIDEZ_QGZ = "indice_aridez/indice_aridez.qgz"
ARIDEZ_TIF = "indice_aridez/raster/indice_aridez_{year}_4674_rec.tif"
ARIDEZ_LAYER = "indice_aridez_{year}_4674_rec"
# Um PNG por área do painel, recortado pelo polígono de `areas.geojson`.
ARIDEZ_AREAS = tuple(AREA_FLAGS)
# Grade fina (o original tem 0,1°) só para a borda do recorte seguir o polígono.
ARIDEZ_CLIP_RESOLUTION_DEG = 0.01
# NoData dos `.tif` do Drive (`gdalinfo`: "NoData Value=255"); fora da área também.
ARIDEZ_NODATA = 255


def run(cmd: list[str]) -> str:
    """Único ponto de `subprocess.run`; devolve o stdout. Ex.: `run(["gdalinfo", "-json", tif])`."""
    try:
        return subprocess.run(cmd, check=True, capture_output=True, text=True, env=GDAL_ENV).stdout
    except subprocess.CalledProcessError as error:
        raise RuntimeError(
            f"comando falhou (código {error.returncode}): {' '.join(cmd)}\nstderr: {error.stderr.strip()}"
        ) from error


# ---------------------------------------------------------------- arquivos


def area_states_file(area: str) -> str:
    """Ex.: `area_states_file("sudene")` → `"estados_sudene.geojson"`."""
    return f"estados_{area}.geojson"


def area_states_outside_file(area: str) -> str:
    """Ex.: `area_states_outside_file("sudene")` → `"estados_fora_sudene.geojson"`."""
    return f"estados_fora_{area}.geojson"


# ---------------------------------------------------------------- vetores


def polygon_parts(geometry: dict) -> dict:
    """Junta só as partes poligonais de uma `GeometryCollection` num `MultiPolygon`.

    INTENTIONAL: `-simplify` + `COORDINATE_PRECISION` colapsam anéis minúsculos em
    ponto/linha (ex.: buraco submétrico em PE). Shapefile de polígono não guarda
    ponto/linha, então essas partes são artefato do pipeline, não dado do Drive.
    """
    if geometry is None or geometry["type"] != "GeometryCollection":
        return geometry
    return {"type": "MultiPolygon", "coordinates": _collection_polygons(geometry)}


def _collection_polygons(collection: dict) -> list:
    """Polígonos de uma coleção, entrando nas coleções aninhadas (o `ST_Difference` as gera)."""
    polygons = []
    for part in collection["geometries"]:
        if part["type"] == "Polygon":
            polygons.append(part["coordinates"])
        elif part["type"] == "MultiPolygon":
            polygons.extend(part["coordinates"])
        elif part["type"] == "GeometryCollection":
            polygons.extend(_collection_polygons(part))
    return polygons


def ogr_features(shp: Path, sql: str, simplify: bool = True) -> list[dict]:
    """Feições em EPSG:4326, lidas do stdout do ogr2ogr; `simplify` as simplifica e grava com 5 casas."""
    lighter = ["-simplify", str(SIMPLIFY_TOLERANCE_DEG), "-lco", f"COORDINATE_PRECISION={COORD_PRECISION}"]
    output = run([
        "ogr2ogr", "-f", "GeoJSON", "/vsistdout/", str(shp),
        "-dialect", "sqlite", "-sql", sql,
        "-t_srs", "EPSG:4326",
        *(lighter if simplify else []),
    ])
    features = json.loads(output)["features"]
    for feature in features:
        feature["geometry"] = polygon_parts(feature["geometry"])
    return features


def write_feature_collection(path: Path, features: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    collection = {"type": "FeatureCollection", "features": features}
    path.write_text(json.dumps(collection, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def layer_name(shp: Path) -> str:
    return shp.stem


def read_field_types(shp: Path) -> dict[str, str]:
    """Tipos OGR das colunas. Ex.: `{"pop_2000": "String", "pop_2010": "Integer64"}`."""
    info = json.loads(run(["ogrinfo", "-json", "-so", str(shp), layer_name(shp)]))
    return {field["name"]: field["type"] for field in info["layers"][0]["fields"]}


def read_raw_rows(shp: Path, columns: list[str]) -> list[dict]:
    """Valores crus (sem CAST, sem geometria) para as checagens verem o dado como veio."""
    sql = f"SELECT {', '.join(columns)} FROM {layer_name(shp)}"
    output = run(["ogr2ogr", "-f", "GeoJSON", "/vsistdout/", str(shp), "-dialect", "sqlite", "-sql", sql])
    return [feature["properties"] for feature in json.loads(output)["features"]]


def indicator_select(key: str, shp: Path, field_types: dict[str, str]) -> str:
    years = year_columns(list(field_types), INDICATORS[key]["prefix"])
    text_columns = {name for name in years if field_types[name] == "String"}
    select = state_indicator_select if key == "idh" else municipal_select
    return select(layer_name(shp), years, text_columns)


def build_indicator_vector(raw: Path, out: Path, key: str, field_types: dict[str, str]) -> None:
    shp = raw / INDICATORS[key]["shp"]
    features = ogr_features(shp, indicator_select(key, shp, field_types))
    write_feature_collection(out / "vector" / f"{key}.geojson", features)


def build_states_vector(raw: Path, out: Path) -> None:
    shp = raw / STATES_SHP
    write_feature_collection(out / "vector" / "estados.geojson", ogr_features(shp, states_select(layer_name(shp))))


def build_municipios_vector(raw: Path, out: Path) -> None:
    shp = raw / MUNICIPIOS_SHP
    features = ogr_features(shp, municipios_select(layer_name(shp)))
    write_feature_collection(out / "vector" / "municipios.geojson", features)


def has_polygon(feature: dict) -> bool:
    """Feição com alguma área depois de simplificar (sliver colapsado não conta)."""
    geometry = feature["geometry"]
    return geometry is not None and len(geometry["coordinates"]) > 0


# WHY: o "fora" é o estado de uma malha menos os municípios de outra; as bordas
# não coincidem e sobram milhares de fragmentos de franja (ex.: CE 721 partes, BA
# 1982), que o véu desenha como pontilhado e que inflam o arquivo (até 97%). O
# limiar (~11 km²) separa a franja das manchas reais: o maior fragmento
# descartado tem ~12 km² e nenhuma parte maior é afetada. Só vale para
# `estados_fora_<area>`; nenhuma outra camada passa por aqui.
MIN_OUTSIDE_PART_DEG2 = 1e-3


def _ring_area(ring: list) -> float:
    """Área (graus²) do anel pela fórmula do cadarço; o sinal depende do sentido, por isso o `abs`."""
    twice = sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(ring, ring[1:]))
    return abs(twice) / 2


def drop_outside_fragments(features: list[dict]) -> list[dict]:
    """Tira de cada estado as partes com anel externo menor que `MIN_OUTSIDE_PART_DEG2`.

    O estado sem nenhuma parte restante sai da lista; é o caso da UF inteira
    dentro da área, cujo "fora" são só fragmentos de franja.
    Ex.: um `MultiPolygon` com uma parte de 1° × 1° e outra de 0,01° × 0,01° fica só com a primeira.
    """
    kept = []
    for feature in features:
        geometry = feature["geometry"]
        parts = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
        large = [part for part in parts if _ring_area(part[0]) >= MIN_OUTSIDE_PART_DEG2]
        if large:
            kept.append({**feature, "geometry": {"type": "MultiPolygon", "coordinates": large}})
    return kept


def build_area_states_vectors(raw: Path, out: Path) -> None:
    """Por área, `vector/estados_<area>.geojson` (parte de cada estado dentro dela) e
    `vector/estados_fora_<area>.geojson` (a parte de fora, o véu do estado escolhido).

    No "fora", os fragmentos de franja entre as malhas são descartados
    (`drop_outside_fragments`): o estado todo dentro da área fica sem feição."""
    shp, states = raw / AREA_STATES_SHP, raw / STATES_SHP
    for area in AREA_FLAGS:
        inside = ogr_features(shp, area_states_select(layer_name(shp), area))
        write_feature_collection(out / "vector" / area_states_file(area), inside)
        sql = area_states_outside_select(layer_name(states), shp.resolve(), layer_name(shp), area)
        outside = [feature for feature in ogr_features(states, sql) if has_polygon(feature)]
        write_feature_collection(out / "vector" / area_states_outside_file(area), drop_outside_fragments(outside))


def area_features(raw: Path, simplify: bool = True) -> list[dict]:
    """Um polígono por área (`area`: nordeste, caatinga, sudene, semiarido)."""
    features = []
    for area, relative in AREA_POLYGONS.items():
        shp = raw / relative
        features += ogr_features(shp, area_select(area, layer_name(shp)), simplify)
    semiarido = raw / SEMIARIDO_SOURCE_SHP
    return features + ogr_features(semiarido, semiarido_select(layer_name(semiarido)), simplify)


def build_areas_vector(raw: Path, out: Path) -> None:
    write_feature_collection(out / "vector" / "areas.geojson", area_features(raw))


# ---------------------------------------------------------------- raster


def relief_palette(palette: list[dict]) -> str:
    """Arquivo de cores do `gdaldem color-relief`; sem dado (`nv`) fica transparente."""
    lines = [f"{item['value']} {_hex_to_rgb(item['color'])} 255" for item in palette]
    return "\n".join([*lines, "nv 0 0 0 0"]) + "\n"


def _hex_to_rgb(color: str) -> str:
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", color):
        raise ValueError(f'cor "{color}" inválida; esperado "#rrggbb"')
    return " ".join(str(int(color[i : i + 2], 16)) for i in (1, 3, 5))


def merge_palettes(palettes: dict[int, list[dict]]) -> tuple[list[dict], list[dict]]:
    """União das paletas por valor (fica a do primeiro ano); valor com cor/rótulo diferente vira Issue."""
    merged: dict[int, dict] = {}
    issues = []
    for year, palette in sorted(palettes.items()):
        for item in palette:
            first = merged.setdefault(item["value"], item)
            if (first["color"], first["label"]) != (item["color"], item["label"]):
                issues.append(_palette_conflict_issue(year, first, item))
    return [merged[value] for value in sorted(merged)], issues


def _palette_conflict_issue(year: int, first: dict, item: dict) -> dict:
    return {
        "arquivo": ARIDEZ_QGZ,
        "camada": ARIDEZ_LAYER.format(year=year),
        "campo": f"valor {item['value']}",
        "problema": "mesma classe com cor ou rótulo diferente entre anos",
        "evidencia": f'{year}: {item["color"]} "{item["label"]}"; ano anterior: {first["color"]} "{first["label"]}"',
        "esperado": "mesma cor e rótulo para o mesmo valor em todos os anos",
    }


def corner_bounds(corners: dict) -> list[list[float]]:
    """`cornerCoordinates` do `gdalinfo -json` → `[[oeste, sul], [leste, norte]]`."""
    (west, north), (east, south) = corners["upperLeft"], corners["lowerRight"]
    return [[west, south], [east, north]]


def raster_bounds(tif: Path) -> list[list[float]]:
    # SIRGAS 2000 (EPSG:4674) ≈ WGS84 (EPSG:4326) nesta escala: os cantos servem direto ao MapLibre.
    return corner_bounds(json.loads(run(["gdalinfo", "-json", str(tif)]))["cornerCoordinates"])


def aridez_png_name(year: int, area: str) -> str:
    """Nome do PNG recortado. Ex.: `aridez_png_name(2020, "semiarido")` → `"aridez_2020_semiarido.png"`."""
    return f"aridez_{year}_{area}.png"


def clip_size(bounds: list[list[float]]) -> tuple[int, int]:
    """Pixels da grade fina na mesma extensão. Ex.: 16,3° × 19,1° a 0,01° → `(1630, 1910)`."""
    (west, south), (east, north) = bounds
    return round((east - west) / ARIDEZ_CLIP_RESOLUTION_DEG), round((north - south) / ARIDEZ_CLIP_RESOLUTION_DEG)


def aridez_upsample_command(tif: Path, bounds: list[list[float]], out_tif: Path) -> list[str]:
    """`gdal_translate` para a grade fina, mesma extensão (o bounds do manifest segue valendo).

    IMPORTANT: vizinho mais próximo só repete cada pixel; nenhum valor de classe muda.
    WARNING: o gdalwarp aplica o recorte na grade da origem; sem este passo a borda
    sairia em degraus de 0,1° em vez de seguir o polígono.
    """
    width, height = clip_size(bounds)
    return ["gdal_translate", "-r", "nearest", "-outsize", str(width), str(height), str(tif), str(out_tif)]


def aridez_clip_command(tif: Path, cutline: Path, area: str, out_tif: Path) -> list[str]:
    """`gdalwarp` que recorta o raster pelo polígono da área; fora dele fica sem dado (transparente)."""
    return [
        "gdalwarp", "-overwrite", "-of", "GTiff", "-r", "near",
        "-dstnodata", str(ARIDEZ_NODATA),
        "-cutline", str(cutline), "-cwhere", f"area = '{area}'",
        str(tif), str(out_tif),
    ]


def aridez_relief_command(tif: Path, colors: Path, png: Path) -> list[str]:
    """`gdaldem color-relief` com a paleta do ano; sem dado vira transparente (`nv` da paleta)."""
    return ["gdaldem", "color-relief", str(tif), str(colors), str(png), "-of", "PNG", "-alpha", "-nearest_color_entry"]


def build_aridez_pngs(tif: Path, palette: list[dict], cutline: Path, png_dir: Path, year: int) -> list[list[float]]:
    """Um PNG por área, recortado pelo polígono dela em `cutline`; devolve o bounds do `.tif`."""
    bounds = raster_bounds(tif)
    with tempfile.TemporaryDirectory() as tmp:
        colors = Path(tmp) / "cores.txt"
        colors.write_text(relief_palette(palette), encoding="utf-8")
        fine = Path(tmp) / "fina.tif"
        run(aridez_upsample_command(tif, bounds, fine))
        for area in ARIDEZ_AREAS:
            clipped = Path(tmp) / f"{area}.tif"
            run(aridez_clip_command(fine, cutline, area, clipped))
            run(aridez_relief_command(clipped, colors, png_dir / aridez_png_name(year, area)))
    return bounds


def write_aridez_cutline(raw: Path, path: Path) -> None:
    """Áreas para o recorte do raster, sem simplificar e sem cortar casas.

    WARNING: as do `areas.geojson` (simplificadas, 5 casas) têm anéis degenerados
    e o gdalwarp recusa ("Cutline polygon is invalid", Sudene e Semiárido).
    """
    write_feature_collection(path, area_features(raw, simplify=False))


def build_aridez(raw: Path, out: Path) -> tuple[list[dict], list[list[float]], list[dict]]:
    """PNGs por ano e área com a paleta do próprio ano; devolve paleta unida, bounds e issues."""
    root = qgis_style.read_qgs(raw / ARIDEZ_QGZ)
    palettes, bounds = {}, {}
    (out / "raster").mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        cutline = Path(tmp) / "areas.geojson"
        write_aridez_cutline(raw, cutline)
        for year in ARIDEZ_YEARS:
            palettes[year] = qgis_style.raster_palette(root, ARIDEZ_LAYER.format(year=year))
            tif = raw / ARIDEZ_TIF.format(year=year)
            bounds[year] = build_aridez_pngs(tif, palettes[year], cutline, out / "raster", year)
    merged, issues = merge_palettes(palettes)
    return merged, bounds[ARIDEZ_YEARS[0]], issues + bounds_issues(bounds)


def bounds_issues(bounds: dict[int, list[list[float]]]) -> list[dict]:
    """O manifest tem um único bounds; ano com extensão diferente da do primeiro vira Issue."""
    first_year = ARIDEZ_YEARS[0]
    reference = bounds[first_year]
    return [
        {
            "arquivo": ARIDEZ_TIF.format(year=year),
            "camada": ARIDEZ_LAYER.format(year=year),
            "campo": "extensão",
            "problema": "extensão do raster diferente da dos outros anos",
            "evidencia": f"{year}: {box}; {first_year}: {reference}",
            "esperado": "mesma extensão em todos os anos",
        }
        for year, box in bounds.items()
        if any(abs(a - b) > BOUNDS_TOLERANCE_DEG for p, q in zip(box, reference) for a, b in zip(p, q))
    ]


# ---------------------------------------------------------------- estilos e manifesto


def width_px(width_mm: float) -> float:
    """Largura do QGIS (mm a 96 dpi) em px, com piso de 0.5. Ex.: `width_px(0.15)` → 0.57."""
    return max(0.5, round(width_mm * 96 / 25.4, 2))


def outline_px(outline: dict) -> dict:
    return {"color": outline["color"], "widthPx": width_px(outline["widthMm"])}


def indicator_style(root: ET.Element, layer: str) -> dict:
    return {
        "attribute": qgis_style.graduated_attribute(root, layer),
        "classes": qgis_style.graduated_classes(root, layer),
        "outline": outline_px(qgis_style.layer_outline(root, layer)),
    }


def build_styles(raw: Path, aridez_palette: list[dict]) -> dict:
    indicators = {key: indicator_style(qgis_style.read_qgs(raw / spec["qgz"]), key) for key, spec in INDICATORS.items()}
    state_root = qgis_style.read_qgs(raw / STATE_OUTLINE_QGZ)
    state_outline = outline_px(qgis_style.layer_outline(state_root, Path(STATES_SHP).stem))
    return {"indicators": indicators, "stateOutline": state_outline, "aridez": aridez_palette}


def build_manifest(fields: dict[str, list[str]], aridez_bounds: list[list[float]], generated_at: str) -> dict:
    """Anos disponíveis (crescentes) lidos das colunas de cada indicador."""
    years = {
        key: sorted(int(alias[1:]) for alias in year_columns(fields[key], spec["prefix"]).values())
        for key, spec in INDICATORS.items()
    }
    return {
        "generatedAt": generated_at,
        "years": years,
        "aridez": {"years": list(ARIDEZ_YEARS), "bounds": aridez_bounds},
    }


# ---------------------------------------------------------------- checagens


def indicator_issues(raw: Path, key: str, field_types: dict[str, str]) -> list[dict]:
    """Classes do `.qgz`, tipos das colunas de ano e valores do `.shp`, como vieram."""
    spec = INDICATORS[key]
    root = qgis_style.read_qgs(raw / spec["qgz"])
    attribute = qgis_style.graduated_attribute(root, key)
    issues = checks.check_class_ranges(spec["qgz"], key, qgis_style.graduated_classes(root, key), attribute)
    years = list(year_columns(list(field_types), spec["prefix"]))
    year_types = {name: field_types[name] for name in years}
    issues += checks.check_field_types(spec["shp"], key, year_types, spec["prefix"].rstrip("_"))
    rows = read_raw_rows(raw / spec["shp"], [spec["code"], *years])
    return issues + checks.check_values(spec["shp"], key, rows, spec["code"], years)


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build(raw: Path, out: Path, now: datetime | None = None) -> list[dict]:
    """Gera todo o `<out>/` e devolve as issues gravadas em `data-issues.json`."""
    issues = checks.check_expected_files(raw, EXPECTED_SHAPEFILES)
    field_types = {key: read_field_types(raw / spec["shp"]) for key, spec in INDICATORS.items()}
    for key in INDICATORS:
        build_indicator_vector(raw, out, key, field_types[key])
        issues += indicator_issues(raw, key, field_types[key])
    build_states_vector(raw, out)
    build_municipios_vector(raw, out)
    build_area_states_vectors(raw, out)
    build_areas_vector(raw, out)
    palette, bounds, aridez_issues = build_aridez(raw, out)
    generated_at = (now or datetime.now(timezone.utc)).isoformat(timespec="seconds")
    write_json(out / "styles.json", build_styles(raw, palette))
    write_json(out / "manifest.json", build_manifest({k: list(t) for k, t in field_types.items()}, bounds, generated_at))
    write_json(out / "data-issues.json", issues + aridez_issues)
    return issues + aridez_issues
