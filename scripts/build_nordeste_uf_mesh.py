"""Builds public/maps/estados-nordeste.json, the state mesh used by the IDH panel map.

The IDH views only have states and metropolitan regions, so the municipal mesh
(see build_sudene_mesh.py) does not fit. Same steps as that script: keep the
nine Nordeste states, drop the oceanic islands, simplify as a coverage and
round coordinates.

Usage (geopandas >= 1.0, shapely >= 2.1, e.g. the Automatic-Reporting venv):
    python scripts/build_nordeste_uf_mesh.py \
        ../Automatic-Reporting/map_shape/BR_UF_2025/BR_UF_2025.shp \
        public/maps/estados-nordeste.json 0.01
"""

import json
import sys

import geopandas as gpd
import shapely

shapefile, output, tolerance = sys.argv[1:4]

mesh = gpd.read_file(shapefile)
mesh = mesh[mesh["SIGLA_RG"] == "NE"].to_crs(4326)
print(f"estados: {len(mesh)}")

# Drops Fernando de Noronha and Atol das Rocas, which would stretch the frame.
mainland = shapely.box(-50, -20, -34.7, 0)
mesh = mesh.assign(geometry=mesh.geometry.intersection(mainland))

geoms = shapely.coverage_simplify(mesh.geometry.values, tolerance=float(tolerance))
mesh = mesh.assign(geometry=shapely.set_precision(geoms, 0.001))

# ECharts matches series data to features by properties.name.
features = [
    {
        "type": "Feature",
        "properties": {"name": row.SIGLA_UF, "nome": row.NM_UF, "uf": row.SIGLA_UF},
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
