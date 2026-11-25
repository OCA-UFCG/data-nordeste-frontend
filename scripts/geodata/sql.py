"""SELECTs (dialeto sqlite do `ogr2ogr -sql`) que o `build.py` roda nos shapefiles do Drive.

Só montam texto SQL: quem executa é o `build.py` (`ogr_features`). IMPORTANT: nome de
coluna que vem do Drive só entra no SQL depois de validado (`year_columns`).

Uso: `municipal_select("pib", year_columns(campos, "pib_"))`.
"""

import re
from pathlib import Path

AREA_FLAGS = {"nordeste": "ne", "semiarido": "semi_21_1", "caatinga": "caat_24", "sudene": "aas_21_1"}


def year_columns(fields: list[str], prefix: str) -> dict[str, str]:
    """Colunas `<prefix><ano>` → `v<ano>`. Ex.: `year_columns(["pib_2023"], "pib_")` → `{"pib_2023": "v2023"}`.

    IMPORTANT: só nomes que casam `^<prefix>\\d{4}$` entram no SQL (nome de coluna vem do Drive).
    """
    pattern = re.compile(rf"^{re.escape(prefix)}(\d{{4}})$")
    matches = ((name, pattern.match(name)) for name in fields)
    return {name: f"v{match.group(1)}" for name, match in matches if match}


def numeric_expression(column: str, is_text: bool = False) -> str:
    """Expressão SQLite que dá o número da coluna, ou NULL.

    WARNING: no SQLite `CAST('abc' AS REAL)` é 0.0 e `CAST('12abc' AS REAL)` é 12.0;
    para coluna texto só convertemos decimal simples (`-12.5`, `597934`), o resto vira NULL.
    """
    if not is_text:
        return f"CAST({column} AS REAL)"
    value = f"trim({column})"
    looks_decimal = (
        f"{value} GLOB '*[0-9]*' AND {value} NOT GLOB '*[^0-9.-]*' "
        f"AND {value} NOT GLOB '?*-*' AND {value} NOT GLOB '*.*.*'"
    )
    return f"CASE WHEN {looks_decimal} THEN CAST({value} AS REAL) END"


def _value_columns(years: dict[str, str], text_columns: set[str]) -> list[str]:
    return [f"{numeric_expression(column, column in text_columns)} AS {alias}" for column, alias in years.items()]


def municipal_select(layer: str, years: dict[str, str], text_columns: set[str] = frozenset()) -> str:
    """SELECT (dialeto sqlite) das feições municipais com propriedades do mapa.

    Ex.: `municipal_select("pib", {"pib_2023": "v2023"})`.
    """
    flags = [f"({column} = 'Sim') AS {area}" for area, column in AREA_FLAGS.items()]
    columns = [
        "CAST(cd_mun_1 AS TEXT) AS code",
        "nm_mun_1 AS name",
        "sigla_uf_1 AS uf",
        *flags,
        *_value_columns(years, text_columns),
        "geometry",
    ]
    return f"SELECT {', '.join(columns)} FROM {layer}"


def municipios_select(layer: str) -> str:
    """SELECT da malha municipal sem valores: `code`, `name`, `uf` e as flags de área.

    Ex.: `municipios_select("sudene_mun")`. Mesmas colunas do `municipal_select`, sem anos.
    """
    return municipal_select(layer, {})


def state_indicator_select(layer: str, years: dict[str, str], text_columns: set[str] = frozenset()) -> str:
    """SELECT do IDH (um polígono por estado do Nordeste). Ex.: `state_indicator_select("idh", {...})`."""
    columns = ["uf AS code", "Estado_UF AS name", "uf AS uf", "1 AS nordeste", *_value_columns(years, text_columns)]
    return f"SELECT {', '.join(columns)}, geometry FROM {layer}"


def states_select(layer: str) -> str:
    return f"SELECT uf AS code, estado AS name, uf AS uf, geometry FROM {layer}"


def area_select(area: str, layer: str) -> str:
    return f"SELECT '{area}' AS area, geometry FROM {layer}"


def semiarido_select(layer: str) -> str:
    """Semiárido = união dos municípios marcados (não há polígono próprio no Drive)."""
    return f"SELECT 'semiarido' AS area, ST_Union(geometry) AS geometry FROM {layer} WHERE semi_21_1 = 'Sim'"


def area_states_select(layer: str, area: str) -> str:
    """Um polígono por UF: a união dos municípios marcados na área (flag do `AREA_FLAGS`).

    Ex.: `area_states_select("sudene_mun", "sudene")` → MG só com os municípios da Sudene.
    WHY `MIN(uf)` e sem alias `uf`: na malha, `uf` é o nome do estado (mesmo texto
    do `estados.geojson`); um alias com esse nome deixaria o GROUP BY ambíguo.
    """
    return (
        f"SELECT sigla_uf_1 AS code, MIN(uf) AS name, ST_Union(geometry) AS geometry "
        f"FROM {layer} WHERE {AREA_FLAGS[area]} = 'Sim' GROUP BY sigla_uf_1"
    )


def area_states_outside_select(states_layer: str, municipios_shp: Path, municipios_layer: str, area: str) -> str:
    """Parte de cada estado fora da área: o estado inteiro menos a união dos municípios dela.

    Só UFs com município na área; a que fica toda dentro (sobra vazia) sai.
    WHY o JOIN no nível de cima: o OGR só acha a malha de outro arquivo
    (`'<caminho>'.<camada>`) no FROM/JOIN principal, não numa subconsulta.
    Ex.: `area_states_outside_select("brasil_estado_4674", Path("m.shp"), "sudene_mun", "sudene")`.
    """
    other = "'" + str(municipios_shp).replace("'", "''") + "'"
    grouped = (
        "SELECT s.uf AS code, s.estado AS name, s.geometry AS state, ST_Union(m.geometry) AS cut "
        f"FROM {states_layer} s JOIN {other}.{municipios_layer} m "
        f"ON m.sigla_uf_1 = s.uf AND m.{AREA_FLAGS[area]} = 'Sim' GROUP BY s.uf, s.estado"
    )
    return f"SELECT code, name, ST_Difference(state, cut) AS geometry FROM ({grouped}) WHERE NOT ST_IsEmpty(geometry)"
