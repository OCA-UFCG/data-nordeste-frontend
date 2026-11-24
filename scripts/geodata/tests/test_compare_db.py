import json
import sys
import tempfile
import unittest
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import compare_db

FEATURES = [
    {"properties": {"code": "100", "name": "Alfa", "uf": "PB", "v2022": 1000.0, "v2023": 2000.0}},
    {"properties": {"code": "200", "name": "Beta", "uf": "PB", "v2022": 500.0, "v2023": None}},
]


class RowsSourceFake:
    """Devolve linhas por trecho do SQL e registra os SQLs recebidos (sem banco)."""

    def __init__(self, rows_by_table: dict[str, list[tuple]]):
        self.rows_by_table = rows_by_table
        self.queries: list[str] = []

    def __call__(self, sql: str) -> list[tuple]:
        self.queries.append(sql)
        for table, rows in self.rows_by_table.items():
            if table in sql:
                return rows
        raise AssertionError(f"SQL inesperado: {sql}")


class SqlTextTest(unittest.TestCase):
    def test_pib_sums_pib_total_by_municipality_and_year(self):
        sql = compare_db.INDICATOR_SQL["pib"]
        self.assertIn("eco_pib.vw_pib_municipal_pbi", sql)
        self.assertIn("SUM(pib_total)", sql)
        self.assertIn("GROUP BY", sql)

    def test_population_sums_populacao_total_from_final_demografia(self):
        sql = compare_db.INDICATOR_SQL["demografia"]
        self.assertIn("dem_demografia.final_demografia", sql)
        self.assertIn("SUM(populacao_total)", sql)

    def test_pib_and_population_restricted_to_the_four_areas_like_the_panels(self):
        pib, dem = compare_db.INDICATOR_SQL["pib"], compare_db.INDICATOR_SQL["demografia"]
        for column in ("nordeste", "semiarido", "caatinga", "sudene"):
            self.assertIn(f"{column} = 'Sim'", pib)
        for column in ("ne", "semi_21", "caat_24", "aas_21"):
            self.assertIn(f"{column} = 'Sim'", dem)

    def test_idh_uses_states_only_view_like_the_panel(self):
        sql = compare_db.INDICATOR_SQL["idh"]
        self.assertIn("des_idh.idh_geral_novo_view", sql)
        self.assertIn("regiao_metropolitana = 'Não'", sql)
        self.assertIn("RIGHT(TRIM(estado_uf), 2)", sql)

    def test_all_queries_are_selects_without_placeholders(self):
        for sql in compare_db.INDICATOR_SQL.values():
            self.assertTrue(sql.lstrip().upper().startswith("SELECT"))
            self.assertNotIn("%", sql)


class RelativeDifferenceTest(unittest.TestCase):
    def test_relative_to_database_value(self):
        self.assertAlmostEqual(compare_db.relative_difference(101.0, 100.0), 0.01)

    def test_equal_values_have_zero_difference(self):
        self.assertEqual(compare_db.relative_difference(0.0, 0.0), 0.0)

    def test_zero_in_database_with_value_in_map_is_infinite(self):
        self.assertEqual(compare_db.relative_difference(5.0, 0.0), float("inf"))

    def test_missing_map_value_is_infinite(self):
        self.assertEqual(compare_db.relative_difference(None, 100.0), float("inf"))


class IndexingTest(unittest.TestCase):
    def test_shape_values_keyed_by_code_and_year(self):
        values = compare_db.shape_values(FEATURES)
        self.assertEqual(values[("100", 2023)], 2000.0)
        self.assertIsNone(values[("200", 2023)])

    def test_db_values_normalize_code_and_decimal(self):
        values = compare_db.db_values([(" 100 ", 2023, Decimal("1999.5")), ("200", 2022, None)])
        self.assertEqual(values[("100", 2023)], 1999.5)
        self.assertNotIn(("200", 2022), values)


class CompareIndicatorTest(unittest.TestCase):
    def test_within_threshold_yields_no_issue(self):
        rows = [("100", 2022, 1004.0), ("100", 2023, 2000), ("200", 2022, 500)]
        self.assertEqual(compare_db.compare_indicator("pib", FEATURES, rows), [])

    def test_exactly_at_threshold_is_not_a_divergence(self):
        rows = [("100", 2022, 1000.0 / 1.005)]
        features = [{"properties": {"code": "100", "name": "Alfa", "v2022": 1000.0}}]
        self.assertEqual(compare_db.compare_indicator("pib", features, rows), [])

    def test_above_threshold_yields_issue_with_evidence(self):
        rows = [("100", 2022, 900.0), ("100", 2023, 2000.0), ("200", 2022, 500.0)]
        [issue] = compare_db.compare_indicator("pib", FEATURES, rows)
        self.assertEqual(issue["arquivo"], "pib/shapefile/pib.shp")
        self.assertEqual(issue["camada"], "pib")
        self.assertTrue(issue["problema"].startswith(compare_db.COMPARISON_PREFIX))
        self.assertIn("100 Alfa (PB) v2022: mapa 1000, banco 900", issue["evidencia"])
        self.assertIn("1 de 3", issue["evidencia"])
        self.assertIn("0,5%", issue["esperado"])

    def test_null_in_map_with_value_in_database_is_a_divergence(self):
        rows = [("100", 2022, 1000.0), ("200", 2023, 700.0)]
        [issue] = compare_db.compare_indicator("pib", FEATURES, rows)
        self.assertIn("200 Beta (PB) v2023: mapa sem valor, banco 700", issue["evidencia"])

    def test_examples_limited_and_worst_first(self):
        features = [
            {"properties": {"code": str(n), "name": f"M{n}", "uf": "PB", "v2020": 100.0 + n}}
            for n in range(1, 16)
        ]
        rows = [(str(n), 2020, 100.0) for n in range(1, 16)]
        [issue] = compare_db.compare_indicator("pib", features, rows, max_examples=10)
        self.assertEqual(issue["evidencia"].count("; mapa") + issue["evidencia"].count(" v2020:"), 10)
        self.assertIn("15 M15", issue["evidencia"])
        self.assertNotIn(" M1 (PB)", issue["evidencia"])
        self.assertIn("15 de 15", issue["evidencia"])

    def test_codes_without_counterpart_become_their_own_issue(self):
        rows = [("100", 2022, 1000.0), ("999", 2022, 1.0)]
        issues = compare_db.compare_indicator("pib", FEATURES, rows)
        [missing] = [i for i in issues if "sem correspondência" in i["problema"]]
        self.assertIn("200", missing["evidencia"])
        self.assertIn("999", missing["evidencia"])

    def test_idh_compares_state_code(self):
        features = [{"properties": {"code": "PB", "name": "Paraíba (PB)", "uf": "PB", "v2023": 0.7}}]
        [issue] = compare_db.compare_indicator("idh", features, [("PB", 2023, 0.76)])
        self.assertEqual(issue["arquivo"], "idh/shapefile/idh.shp")
        self.assertIn("v2023: mapa 0.7, banco 0.76", issue["evidencia"])


class MergeIssuesTest(unittest.TestCase):
    def test_replaces_previous_comparison_issues_and_keeps_others(self):
        other = {"arquivo": "a", "camada": "b", "campo": "c", "problema": "outro", "evidencia": "e", "esperado": "x"}
        old = {**other, "problema": compare_db.COMPARISON_PREFIX + " antigo"}
        new = {**other, "problema": compare_db.COMPARISON_PREFIX + " novo"}
        merged = compare_db.merge_issues([other, old], [new])
        self.assertEqual(merged, [other, new])


class RunComparisonTest(unittest.TestCase):
    def write_geodata(self, directory: Path) -> None:
        (directory / "vector").mkdir()
        for key in ("pib", "demografia", "idh"):
            collection = {"type": "FeatureCollection", "features": FEATURES}
            (directory / "vector" / f"{key}.geojson").write_text(json.dumps(collection), encoding="utf-8")
        (directory / "data-issues.json").write_text("[]", encoding="utf-8")

    def test_appends_issues_to_data_issues_json(self):
        source = RowsSourceFake(
            {
                "eco_pib": [("100", 2022, 900.0)],
                "dem_demografia": [],
                "des_idh": [],
            }
        )
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            self.write_geodata(directory)
            total = compare_db.run_comparison(directory, source)
            saved = json.loads((directory / "data-issues.json").read_text(encoding="utf-8"))
        self.assertEqual(len(saved), total)
        self.assertTrue(any("pib" == issue["camada"] for issue in saved))
        self.assertEqual(len(source.queries), 3)

    def test_second_run_does_not_duplicate_issues(self):
        source = RowsSourceFake({"eco_pib": [("100", 2022, 900.0)], "dem_demografia": [], "des_idh": []})
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            self.write_geodata(directory)
            first = compare_db.run_comparison(directory, source)
            second = compare_db.run_comparison(directory, source)
        self.assertEqual(first, second)


class ConnectionTest(unittest.TestCase):
    def test_missing_url_error_names_variable(self):
        with self.assertRaises(SystemExit) as raised:
            compare_db.require_db_url({})
        self.assertIn("DATA_DB_URL", str(raised.exception))

    def test_readonly_option_is_set(self):
        self.assertIn("default_transaction_read_only=on", compare_db.READ_ONLY_OPTIONS)


if __name__ == "__main__":
    unittest.main()
