import sqlite3
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build


def eval_sql_expression(expression: str, column: str, values: list) -> list:
    """Avalia `expression` no SQLite real (mesma semântica do `-dialect sqlite` do OGR)."""
    with sqlite3.connect(":memory:") as db:
        db.execute(f"CREATE TABLE t ({column} TEXT)")
        db.executemany("INSERT INTO t VALUES (?)", [(v,) for v in values])
        return [row[0] for row in db.execute(f"SELECT {expression} FROM t ORDER BY rowid")]


class YearColumnsTest(unittest.TestCase):
    def test_year_columns_maps_prefix_to_v(self):
        columns = build.year_columns(["cd_mun_1", "pib_2010", "pib_2023"], "pib_")
        self.assertEqual(columns, {"pib_2010": "v2010", "pib_2023": "v2023"})

    def test_year_columns_ignores_non_year_suffix(self):
        columns = build.year_columns(["pop_2000", "pop_total", "pop_20221"], "pop_")
        self.assertEqual(columns, {"pop_2000": "v2000"})


class SelectSqlTest(unittest.TestCase):
    def test_municipal_select_sql(self):
        sql = build.municipal_select("pib", {"pib_2010": "v2010"})
        self.assertIn("CAST(cd_mun_1 AS TEXT) AS code", sql)
        self.assertIn("(ne = 'Sim') AS nordeste", sql)
        self.assertIn("CAST(pib_2010 AS REAL) AS v2010", sql)
        self.assertIn("sigla_uf_1 AS uf", sql)
        self.assertIn("FROM pib", sql)

    def test_text_column_that_is_not_a_number_becomes_null(self):
        # SQLite faz CAST('abc' AS REAL) = 0.0; isso inventaria um valor.
        expression = build.numeric_expression("pop_2000", is_text=True)
        got = eval_sql_expression(expression, "pop_2000", ["597934", None, "", "abc", "12abc", " 15914 ", "1.2.3", "-7.5"])
        self.assertEqual(got, [597934.0, None, None, None, None, 15914.0, None, -7.5])

    def test_municipal_select_guards_text_columns(self):
        sql = build.municipal_select("demografia", {"pop_2000": "v2000"}, text_columns={"pop_2000"})
        self.assertIn(build.numeric_expression("pop_2000", is_text=True) + " AS v2000", sql)

    def test_municipios_select_has_identity_and_area_flags_only(self):
        sql = build.municipios_select("sudene_mun")
        self.assertIn("CAST(cd_mun_1 AS TEXT) AS code", sql)
        self.assertIn("nm_mun_1 AS name", sql)
        self.assertIn("sigla_uf_1 AS uf", sql)
        for area, column in build.AREA_FLAGS.items():
            self.assertIn(f"({column} = 'Sim') AS {area}", sql)
        self.assertIn("geometry FROM sudene_mun", sql)
        self.assertNotIn(" AS v", sql)

    def test_municipios_select_runs_on_sqlite(self):
        with sqlite3.connect(":memory:") as db:
            db.execute(
                "CREATE TABLE sudene_mun (cd_mun_1 INTEGER, nm_mun_1 TEXT, sigla_uf_1 TEXT, "
                "ne TEXT, semi_21_1 TEXT, caat_24 TEXT, aas_21_1 TEXT, geometry BLOB)"
            )
            db.execute("INSERT INTO sudene_mun VALUES (2611606, 'Recife', 'PE', 'Sim', 'Não', 'Não', 'Sim', NULL)")
            row = db.execute(build.municipios_select("sudene_mun")).fetchone()
        self.assertEqual(row, ("2611606", "Recife", "PE", 1, 0, 0, 1, None))

    def test_semiarido_is_union_of_marked_municipalities(self):
        sql = build.semiarido_select("sudene_mun")
        self.assertIn("ST_Union(geometry)", sql)
        self.assertIn("semi_21_1 = 'Sim'", sql)
        self.assertIn("'semiarido' AS area", sql)


class ConcatUnion:
    """`ST_Union` de mentira para o SQLite do stdlib: junta as geometrias (texto) com `+`."""

    def __init__(self):
        self.parts = []

    def step(self, geometry):
        self.parts.append(geometry)

    def finalize(self):
        return "+".join(sorted(self.parts))


class AreaStatesSelectTest(unittest.TestCase):
    ROWS = [
        ("MG", "Minas Gerais", "Não", "Sim", "MG1"),
        ("MG", "Minas Gerais", "Não", "Não", "MG2"),
        ("MG", "Minas Gerais", "Não", "Sim", "MG3"),
        ("PE", "Pernambuco", "Sim", "Sim", "PE1"),
        ("ES", "Espírito Santo", "Não", "Não", "ES1"),
    ]

    def run_select(self, area: str) -> list:
        with sqlite3.connect(":memory:") as db:
            db.create_aggregate("ST_Union", 1, ConcatUnion)
            db.execute("CREATE TABLE sudene_mun (sigla_uf_1 TEXT, uf TEXT, ne TEXT, semi_21_1 TEXT, geometry TEXT)")
            db.executemany("INSERT INTO sudene_mun VALUES (?, ?, ?, ?, ?)", self.ROWS)
            return db.execute(build.area_states_select("sudene_mun", area) + " ORDER BY code").fetchall()

    def test_one_state_per_uf_with_only_the_municipalities_in_the_area(self):
        self.assertEqual(
            self.run_select("semiarido"),
            [("MG", "Minas Gerais", "MG1+MG3"), ("PE", "Pernambuco", "PE1")],
        )

    def test_uses_the_area_flag_of_the_municipal_vectors(self):
        self.assertEqual(self.run_select("nordeste"), [("PE", "Pernambuco", "PE1")])
        for area, column in build.AREA_FLAGS.items():
            self.assertIn(f"{column} = 'Sim'", build.area_states_select("sudene_mun", area))

    def test_file_name_per_area(self):
        self.assertEqual(build.area_states_file("sudene"), "estados_sudene.geojson")


def fake_difference(state, cut):
    """`ST_Difference` de mentira: tira de `state` (texto "A,B,C") as partes que estão em `cut`."""
    cut_parts = set(cut.split("+"))
    return ",".join(part for part in state.split(",") if part not in cut_parts)


class AreaStatesOutsideSelectTest(unittest.TestCase):
    STATES = [("MG", "Minas Gerais", "MG1,MG2,MG3"), ("PE", "Pernambuco", "PE1"), ("SP", "São Paulo", "SP1")]
    MUNICIPIOS = [("MG", "Sim", "MG1"), ("MG", "Não", "MG2"), ("PE", "Sim", "PE1"), ("SP", "Não", "SP1")]

    def run_select(self, municipios_path: str) -> list:
        with sqlite3.connect(":memory:") as db:
            db.create_aggregate("ST_Union", 1, ConcatUnion)
            db.create_function("ST_Difference", 2, fake_difference)
            db.create_function("ST_IsEmpty", 1, lambda geometry: int(geometry == ""))
            db.execute("ATTACH ':memory:' AS ?", (municipios_path,))
            db.execute("CREATE TABLE estados (uf TEXT, estado TEXT, geometry TEXT)")
            db.execute(f'CREATE TABLE "{municipios_path}".sudene_mun (sigla_uf_1 TEXT, aas_21_1 TEXT, geometry TEXT)')
            db.executemany("INSERT INTO estados VALUES (?, ?, ?)", self.STATES)
            db.executemany(f'INSERT INTO "{municipios_path}".sudene_mun VALUES (?, ?, ?)', self.MUNICIPIOS)
            sql = build.area_states_outside_select("estados", Path(municipios_path), "sudene_mun", "sudene")
            return db.execute(sql + " ORDER BY code").fetchall()

    def test_full_state_minus_the_part_in_the_area_dropping_empty_ones(self):
        # PE está todo na área (sobra vazio) e SP não tem município nela: os dois saem.
        self.assertEqual(self.run_select("/raw/sudene_mun.shp"), [("MG", "Minas Gerais", "MG2,MG3")])

    def test_quotes_the_other_datasource_path(self):
        sql = build.area_states_outside_select("estados", Path("/raw/d'água/m.shp"), "m", "sudene")
        self.assertIn("'/raw/d''água/m.shp'.m", sql)

    def test_file_name_per_area(self):
        self.assertEqual(build.area_states_outside_file("caatinga"), "estados_fora_caatinga.geojson")


class PolygonPartsTest(unittest.TestCase):
    def test_keeps_only_polygon_parts_of_collection(self):
        # Simplificar + arredondar a 5 casas colapsa anéis minúsculos em ponto/linha.
        square = [[[0, 0], [1, 0], [1, 1], [0, 0]]]
        geometry = {
            "type": "GeometryCollection",
            "geometries": [
                {"type": "MultiPolygon", "coordinates": [square]},
                {"type": "Point", "coordinates": [0.5, 0.5]},
                {"type": "Polygon", "coordinates": square},
            ],
        }
        self.assertEqual(build.polygon_parts(geometry), {"type": "MultiPolygon", "coordinates": [square, square]})

    def test_keeps_polygons_of_nested_collections(self):
        # O ST_Difference dos estados_fora_<area> sai assim depois do -simplify (BA no Semiárido).
        square = [[[0, 0], [1, 0], [1, 1], [0, 0]]]
        geometry = {
            "type": "GeometryCollection",
            "geometries": [
                {"type": "GeometryCollection", "geometries": [{"type": "Polygon", "coordinates": square}]},
                {"type": "MultiLineString", "coordinates": [[[0, 0], [1, 1]]]},
            ],
        }
        self.assertEqual(build.polygon_parts(geometry), {"type": "MultiPolygon", "coordinates": [square]})

    def test_polygon_untouched(self):
        polygon = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]}
        self.assertIs(build.polygon_parts(polygon), polygon)


class RasterStyleTest(unittest.TestCase):
    def test_relief_palette_text(self):
        palette = [{"value": 3, "color": "#fe7f00", "label": "Semiárido"}]
        self.assertEqual(build.relief_palette(palette), "3 254 127 0 255\nnv 0 0 0 0\n")

    def test_merge_palettes_unions_by_value(self):
        palettes = {
            1990: [{"value": 3, "color": "#fe7f00", "label": "Semiárido"}],
            2020: [{"value": 2, "color": "#d7191b", "label": "Árido"}, {"value": 3, "color": "#fe7f00", "label": "Semiárido"}],
        }
        merged, issues = build.merge_palettes(palettes)
        self.assertEqual([p["value"] for p in merged], [2, 3])
        self.assertEqual(issues, [])

    def test_merge_palettes_reports_conflicting_color(self):
        palettes = {
            1990: [{"value": 3, "color": "#fe7f00", "label": "Semiárido"}],
            2020: [{"value": 3, "color": "#000000", "label": "Semiárido"}],
        }
        merged, issues = build.merge_palettes(palettes)
        self.assertEqual(merged[0]["color"], "#fe7f00")
        self.assertEqual(len(issues), 1)
        self.assertIn("#000000", issues[0]["evidencia"])

    def test_corner_bounds(self):
        corners = {"upperLeft": [-48.7, -1.1], "lowerRight": [-32.4, -20.2]}
        self.assertEqual(build.corner_bounds(corners), [[-48.7, -20.2], [-32.4, -1.1]])


class AridezClipTest(unittest.TestCase):
    BOUNDS = [[-48.6999985, -20.1999985], [-32.3999985, -1.0999985]]

    def test_one_png_per_area_of_the_panel(self):
        self.assertEqual(build.ARIDEZ_AREAS, ("nordeste", "semiarido", "caatinga", "sudene"))
        self.assertEqual(build.aridez_png_name(2020, "semiarido"), "aridez_2020_semiarido.png")

    def test_clip_size_keeps_extent_on_finer_grid(self):
        self.assertEqual(build.clip_size(self.BOUNDS), (1630, 1910))

    def test_clip_command_cuts_by_area_polygon(self):
        cmd = build.aridez_clip_command(Path("f.tif"), Path("t/areas.geojson"), "caatinga", Path("c.tif"))
        self.assertEqual(cmd[0], "gdalwarp")
        cut = cmd.index("-cutline")
        self.assertEqual(cmd[cut + 1 : cut + 4], ["t/areas.geojson", "-cwhere", "area = 'caatinga'"])
        self.assertEqual(cmd[cmd.index("-dstnodata") + 1], "255")
        self.assertNotIn("-crop_to_cutline", cmd)
        self.assertEqual(cmd[-2:], ["f.tif", "c.tif"])

    def test_upsample_command_repeats_pixels_on_finer_grid(self):
        cmd = build.aridez_upsample_command(Path("a.tif"), self.BOUNDS, Path("f.tif"))
        self.assertEqual(cmd[0], "gdal_translate")
        self.assertEqual(cmd[cmd.index("-r") + 1], "nearest")
        self.assertEqual(cmd[cmd.index("-outsize") + 1 : cmd.index("-outsize") + 3], ["1630", "1910"])
        self.assertEqual(cmd[-2:], ["a.tif", "f.tif"])

    def test_relief_command_makes_nodata_transparent(self):
        cmd = build.aridez_relief_command(Path("c.tif"), Path("cores.txt"), Path("p.png"))
        self.assertEqual(cmd[:5], ["gdaldem", "color-relief", "c.tif", "cores.txt", "p.png"])
        self.assertIn("-alpha", cmd)
        self.assertIn("-nearest_color_entry", cmd)


class StylesTest(unittest.TestCase):
    def test_width_px_from_mm(self):
        self.assertEqual(build.width_px(0.15), 0.57)
        self.assertEqual(build.width_px(0.05), 0.5)


class ManifestTest(unittest.TestCase):
    def test_build_manifest_years_sorted(self):
        fields = {
            "pib": ["cd_mun_1", "pib_2023", "pib_2010", "pib_2015"],
            "demografia": ["pop_2022", "pop_2000", "pop_2010"],
            "idh": ["uf", "idh_2024", "idh_2012"],
        }
        bounds = [[-48.7, -20.2], [-32.4, -1.1]]
        manifest = build.build_manifest(fields, bounds, "2026-11-23T12:00:00+00:00")
        self.assertEqual(manifest["years"]["pib"], [2010, 2015, 2023])
        self.assertEqual(manifest["years"]["demografia"], [2000, 2010, 2022])
        self.assertEqual(manifest["years"]["idh"], [2012, 2024])
        self.assertEqual(manifest["aridez"], {"years": [1990, 2000, 2010, 2020], "bounds": bounds})
        self.assertEqual(manifest["generatedAt"], "2026-11-23T12:00:00+00:00")


class RunTest(unittest.TestCase):
    def test_run_error_cites_command_and_stderr(self):
        with self.assertRaises(RuntimeError) as ctx:
            build.run([sys.executable, "-c", "import sys; sys.stderr.write('boom'); sys.exit(3)"])
        self.assertIn("boom", str(ctx.exception))
        self.assertIn(sys.executable, str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
