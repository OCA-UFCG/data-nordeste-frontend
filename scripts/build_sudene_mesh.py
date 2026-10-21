"""Builds public/maps/municipios-sudene.json, the municipal mesh used by panel maps.

Keeps only the municipalities in the Nordeste or the Sudene area, simplifies them
as a coverage (shared borders stay shared, no gaps between neighbours) and rounds
coordinates, taking the IBGE mesh from ~100 MB to ~1 MB (~250 KB gzipped).

Usage (geopandas >= 1.0, shapely >= 2.1, e.g. the Automatic-Reporting venv):
    python scripts/build_sudene_mesh.py \
        ../Automatic-Reporting/map_shape/BR_Municipios_2025/BR_Municipios_2025.shp \
        codigos.txt public/maps/municipios-sudene.json 0.02

codigos.txt holds comma-separated IBGE codes, exported with:
    SELECT string_agg(DISTINCT cd_mun, ',') FROM eco_pib.vw_pib_municipal_pbi
    WHERE nordeste = 'Sim' OR sudene = 'Sim';
"""

import json
import sys

import geopandas as gpd
import shapely

shapefile, codes_file, output, tolerance = sys.argv[1:5]
codes = set(open(codes_file).read().strip().split(","))

mesh = gpd.read_file(shapefile)
mesh = mesh[mesh["CD_MUN"].isin(codes)].to_crs(4326)
print(f"municipios: {len(mesh)} de {len(codes)}")

geoms = shapely.coverage_simplify(mesh.geometry.values, tolerance=float(tolerance))
mesh = mesh.assign(geometry=shapely.set_precision(geoms, 0.001))

# ECharts matches series data to features by properties.name, so the IBGE code
# goes there and the readable name in "nome".
features = [
    {
        "type": "Feature",
        "properties": {"name": row.CD_MUN, "nome": row.NM_MUN, "uf": row.SIGLA_UF},
        "geometry": json.loads(shapely.to_geojson(row.geometry)),
    }
    for row in mesh.itertuples()
]

with open(output, "w") as file:
    json.dump(
        {"type": "FeatureCollection", "features": features},
        file,
        separators=(",", ":"),
        ensure_ascii=False,
    )
