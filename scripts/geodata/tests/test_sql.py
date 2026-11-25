import sqlite3
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import sql


def eval_sql_expression(expression: str, column: str, values: list) -> list:
    """Avalia `expression` no SQLite real (mesma semântica do `-dialect sqlite` do OGR)."""
    with sqlite3.connect(":memory:") as db:
        db.execute(f"CREATE TABLE t ({column} TEXT)")
        db.executemany("INSERT INTO t VALUES (?)", [(v,) for v in values])
        return [row[0] for row in db.execute(f"SELECT {expression} FROM t ORDER BY rowid")]


class YearColumnsTest(unittest.TestCase):
    def test_year_columns_maps_prefix_to_v(self):
        columns = sql.year_columns(["cd_mun_1", "pib_2010", "pib_2023"], "pib_")
        self.assertEqual(columns, {"pib_2010": "v2010", "pib_2023": "v2023"})

    def test_year_columns_ignores_non_year_suffix(self):
        columns = sql.year_columns(["pop_2000", "pop_total", "pop_20221"], "pop_")
        self.assertEqual(columns, {"pop_2000": "v2000"})


class SelectSqlTest(unittest.TestCase):
    def test_municipal_select_sql(self):
        query = sql.municipal_select("pib", {"pib_2010": "v2010"})
        self.assertIn("CAST(cd_mun_1 AS TEXT) AS code", query)
        self.assertIn("(ne = 'Sim') AS nordeste", query)
        self.assertIn("CAST(pib_2010 AS REAL) AS v2010", query)
        self.assertIn("sigla_uf_1 AS uf", query)
        self.assertIn("FROM pib", query)

    def test_text_column_that_is_not_a_number_becomes_null(self):
        # SQLite faz CAST('abc' AS REAL) = 0.0; isso inventaria um valor.
        expression = sql.numeric_expression("pop_2000", is_text=True)
        got = eval_sql_expression(expression, "pop_2000", ["597934", None, "", "abc", "12abc", " 15914 ", "1.2.3", "-7.5"])
        self.assertEqual(got, [597934.0, None, None, None, None, 15914.0, None, -7.5])

    def test_municipal_select_guards_text_columns(self):
        query = sql.municipal_select("demografia", {"pop_2000": "v2000"}, text_columns={"pop_2000"})
        self.assertIn(sql.numeric_expression("pop_2000", is_text=True) + " AS v2000", query)

    def test_municipios_select_has_identity_and_area_flags_only(self):
        query = sql.municipios_select("sudene_mun")
        self.assertIn("CAST(cd_mun_1 AS TEXT) AS code", query)
        self.assertIn("nm_mun_1 AS name", query)
        self.assertIn("sigla_uf_1 AS uf", query)
        for area, column in sql.AREA_FLAGS.items():
            self.assertIn(f"({column} = 'Sim') AS {area}", query)
        self.assertIn("geometry FROM sudene_mun", query)
        self.assertNotIn(" AS v", query)

    def test_municipios_select_runs_on_sqlite(self):
        with sqlite3.connect(":memory:") as db:
            db.execute(
                "CREATE TABLE sudene_mun (cd_mun_1 INTEGER, nm_mun_1 TEXT, sigla_uf_1 TEXT, "
                "ne TEXT, semi_21_1 TEXT, caat_24 TEXT, aas_21_1 TEXT, geometry BLOB)"
            )
            db.execute("INSERT INTO sudene_mun VALUES (2611606, 'Recife', 'PE', 'Sim', 'Não', 'Não', 'Sim', NULL)")
            row = db.execute(sql.municipios_select("sudene_mun")).fetchone()
        self.assertEqual(row, ("2611606", "Recife", "PE", 1, 0, 0, 1, None))

    def test_semiarido_is_union_of_marked_municipalities(self):
        query = sql.semiarido_select("sudene_mun")
        self.assertIn("ST_Union(geometry)", query)
        self.assertIn("semi_21_1 = 'Sim'", query)
        self.assertIn("'semiarido' AS area", query)


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
            return db.execute(sql.area_states_select("sudene_mun", area) + " ORDER BY code").fetchall()

    def test_one_state_per_uf_with_only_the_municipalities_in_the_area(self):
        self.assertEqual(
            self.run_select("semiarido"),
            [("MG", "Minas Gerais", "MG1+MG3"), ("PE", "Pernambuco", "PE1")],
        )

    def test_uses_the_area_flag_of_the_municipal_vectors(self):
        self.assertEqual(self.run_select("nordeste"), [("PE", "Pernambuco", "PE1")])
        for area, column in sql.AREA_FLAGS.items():
            self.assertIn(f"{column} = 'Sim'", sql.area_states_select("sudene_mun", area))


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
            query = sql.area_states_outside_select("estados", Path(municipios_path), "sudene_mun", "sudene")
            return db.execute(query + " ORDER BY code").fetchall()

    def test_full_state_minus_the_part_in_the_area_dropping_empty_ones(self):
        # PE está todo na área (sobra vazio) e SP não tem município nela: os dois saem.
        self.assertEqual(self.run_select("/raw/sudene_mun.shp"), [("MG", "Minas Gerais", "MG2,MG3")])

    def test_quotes_the_other_datasource_path(self):
        query = sql.area_states_outside_select("estados", Path("/raw/d'água/m.shp"), "m", "sudene")
        self.assertIn("'/raw/d''água/m.shp'.m", query)


if __name__ == "__main__":
    unittest.main()
