import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import checks

MEDIO = "Médio (> 50 mil e ≤ 100 mil habitantes)"
DEMOGRAFIA = [
    {"lower": 0.0, "upper": 50000.0, "label": "Pequeno (≤ 50 mil habitantes)", "color": "#efcfdc"},
    {"lower": 50000.0, "upper": 10000.0, "label": MEDIO, "color": "#e7a4bf"},
    {"lower": 10000.0, "upper": 4000000.0, "label": "Grande (≥ 100 mil habitantes)", "color": "#e482a9"},
]


def pib_classes(first_lower: float) -> list[dict]:
    return [
        {"lower": first_lower, "upper": 500e6, "label": "≤ R$ 500 Mi", "color": "#000000"},
        {"lower": 500e6, "upper": 1e9, "label": "> R$ 500 Mi - R$ 1 Bi", "color": "#111111"},
    ]


class CheckClassRangesTest(unittest.TestCase):
    def test_flags_inverted_range(self):
        issues = checks.check_class_ranges("demografia.qgz", "demografia", DEMOGRAFIA, "pop_2022")
        inverted = [i for i in issues if "limite inferior 50000 maior que o superior 10000" in i["problema"]]
        self.assertEqual(len(inverted), 1)
        self.assertEqual(inverted[0]["campo"], "pop_2022")
        self.assertEqual(inverted[0]["camada"], "demografia")
        self.assertEqual(inverted[0]["arquivo"], "demografia.qgz")
        self.assertIn("≤ 100 mil", inverted[0]["esperado"])
        self.assertIn(MEDIO, inverted[0]["evidencia"])

    def test_flags_class_starting_below_previous_class(self):
        issues = checks.check_class_ranges("demografia.qgz", "demografia", DEMOGRAFIA, "pop_2022")
        overlaps = [i for i in issues if "sobrepõe" in i["problema"]]
        self.assertEqual(len(overlaps), 1)
        self.assertIn("Grande", overlaps[0]["evidencia"])

    def test_flags_negative_lower(self):
        issues = checks.check_class_ranges("pib.qgz", "pib", pib_classes(-190464340.0), "pib_2023")
        self.assertEqual(len(issues), 1)
        self.assertIn("negativo", issues[0]["problema"])
        self.assertIn("-190464340", issues[0]["evidencia"])

    def test_negative_lower_allowed_when_indicator_admits_negatives(self):
        issues = checks.check_class_ranges(
            "x.qgz", "x", pib_classes(-5.0), "x_2023", admits_negative=True
        )
        self.assertEqual(issues, [])

    def test_flags_gap_between_consecutive_classes(self):
        classes = pib_classes(0.0)
        classes[1]["lower"] = 600e6
        issues = checks.check_class_ranges("pib.qgz", "pib", classes, "pib_2023")
        self.assertEqual(len(issues), 1)
        self.assertIn("lacuna", issues[0]["problema"])

    def test_clean_classes_have_no_issues(self):
        self.assertEqual(checks.check_class_ranges("pib.qgz", "pib", pib_classes(0.0), "pib_2023"), [])


class CheckFieldTypesTest(unittest.TestCase):
    def test_flags_text_year(self):
        fields = {"pop_2000": "String", "pop_2010": "Integer64", "pop_2022": "Integer64", "nome": "String"}
        issues = checks.check_field_types("demografia.shp", "demografia", fields, "pop")
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]["campo"], "pop_2000")
        self.assertIn("String", issues[0]["evidencia"])
        self.assertIn("Integer64", issues[0]["esperado"])

    def test_same_types_have_no_issues(self):
        fields = {"pib_2022": "Real", "pib_2023": "Real"}
        self.assertEqual(checks.check_field_types("pib.shp", "pib", fields, "pib"), [])


class CheckValuesTest(unittest.TestCase):
    YEARS = ["pop_2010", "pop_2022"]

    def run_checks(self, rows):
        return checks.check_values("demografia.shp", "demografia", rows, "cod_mun", self.YEARS)

    def test_flags_duplicates_nulls_negatives(self):
        rows = [
            {"cod_mun": "2301", "pop_2010": 10, "pop_2022": 12},
            {"cod_mun": "2301", "pop_2010": 11, "pop_2022": 13},
            {"cod_mun": "2302", "pop_2010": None, "pop_2022": 5},
            {"cod_mun": "2303", "pop_2010": 7, "pop_2022": -4},
        ]
        issues = self.run_checks(rows)
        self.assertEqual(len(issues), 3)
        by_problem = {i["problema"]: i for i in issues}
        self.assertIn("2301", by_problem["código duplicado"]["evidencia"])
        self.assertIn("2302", by_problem["valor ausente"]["evidencia"])
        self.assertEqual(by_problem["valor ausente"]["campo"], "pop_2010")
        self.assertIn("2303", by_problem["valor negativo"]["evidencia"])
        self.assertEqual(by_problem["valor negativo"]["campo"], "pop_2022")

    def test_flags_non_numeric_text_but_not_numeric_text(self):
        rows = [
            {"cod_mun": "1", "pop_2010": "123", "pop_2022": 1},
            {"cod_mun": "2", "pop_2010": "...", "pop_2022": 1},
        ]
        issues = self.run_checks(rows)
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]["problema"], "texto não numérico")
        self.assertIn("'...'", issues[0]["evidencia"])
        self.assertIn("2", issues[0]["evidencia"])

    def test_blank_text_counts_as_missing(self):
        issues = self.run_checks([{"cod_mun": "9", "pop_2010": "  ", "pop_2022": 1}])
        self.assertEqual([i["problema"] for i in issues], ["valor ausente"])

    def test_negative_allowed_when_indicator_admits_negatives(self):
        rows = [{"cod_mun": "1", "pop_2010": -1, "pop_2022": 1}]
        issues = checks.check_values(
            "x.shp", "x", rows, "cod_mun", self.YEARS, admits_negative=True
        )
        self.assertEqual(issues, [])

    def test_long_code_list_is_truncated_with_total(self):
        rows = [{"cod_mun": str(n), "pop_2010": None, "pop_2022": 1} for n in range(30)]
        evidence = self.run_checks(rows)[0]["evidencia"]
        self.assertIn("30 registros", evidence)
        self.assertIn("e mais 10", evidence)

    def test_clean_rows_have_no_issues(self):
        rows = [{"cod_mun": "1", "pop_2010": 1, "pop_2022": 2}]
        self.assertEqual(self.run_checks(rows), [])


class CheckExpectedFilesTest(unittest.TestCase):
    def make_raw(self, names: list[str]) -> Path:
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        raw = Path(tmp.name)
        for name in names:
            path = raw / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(b"")
        return raw

    def complete(self, stem: str, folder: str, skip: tuple[str, ...] = ()) -> list[str]:
        exts = [e for e in (".shp", ".shx", ".dbf", ".prj", ".cpg") if e not in skip]
        return [f"{folder}/{stem}{e}" for e in exts]

    def test_flags_cpg_with_different_name(self):
        names = self.complete("sudene_mun", "area", skip=(".cpg",)) + ["area/municipio_sudene.cpg"]
        issues = checks.check_expected_files(self.make_raw(names), ["area/sudene_mun.shp"])
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]["campo"], ".cpg")
        self.assertIn("municipio_sudene.cpg", issues[0]["evidencia"])
        self.assertIn("sudene_mun.cpg", issues[0]["esperado"])

    def test_ignores_companion_that_belongs_to_another_shapefile_in_folder(self):
        names = self.complete("sudene_mun", "area", skip=(".cpg",)) + self.complete("limite", "area")
        issues = checks.check_expected_files(self.make_raw(names), ["area/sudene_mun.shp"])
        self.assertEqual(len(issues), 1)
        self.assertIn("ausente", issues[0]["problema"])

    def test_flags_missing_companion_file(self):
        names = self.complete("idh", "idh", skip=(".cpg",))
        issues = checks.check_expected_files(self.make_raw(names), ["idh/idh.shp"])
        self.assertEqual([i["campo"] for i in issues], [".cpg"])
        self.assertIn("ausente", issues[0]["problema"])

    def test_complete_shapefile_has_no_issues(self):
        names = self.complete("pib", "pib")
        self.assertEqual(checks.check_expected_files(self.make_raw(names), ["pib/pib.shp"]), [])

    def test_missing_semiarido_is_recorded_as_gap(self):
        raw = self.make_raw(self.complete("pib", "pib"))
        issues = checks.check_expected_files(raw, ["shapefile_geral/semiarido/semiarido.shp"])
        self.assertEqual(len(issues), 1)
        self.assertTrue(issues[0]["problema"].startswith("lacuna"))
        self.assertIn("Semiárido", issues[0]["problema"])
        self.assertIn("semi_21_1", issues[0]["esperado"])

    def test_missing_other_shapefile_is_reported_as_absent(self):
        issues = checks.check_expected_files(self.make_raw([]), ["pib/pib.shp"])
        self.assertEqual(len(issues), 1)
        self.assertIn("ausente", issues[0]["problema"])


if __name__ == "__main__":
    unittest.main()
