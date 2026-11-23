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

    def test_semiarido_is_union_of_marked_municipalities(self):
        sql = build.semiarido_select("sudene_mun")
        self.assertIn("ST_Union(geometry)", sql)
        self.assertIn("semi_21_1 = 'Sim'", sql)
        self.assertIn("'semiarido' AS area", sql)


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
