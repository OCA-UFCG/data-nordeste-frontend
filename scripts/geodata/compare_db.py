"""Compara os valores dos GeoJSON dos painéis com os do banco (somente leitura).

Para cada indicador (PIB, população, IDH), compara `v<ano>` de cada feição com a
soma/valor do banco usado pelo painel; diferença relativa acima de 0,5% vira
`Issue`, anexada ao `data-issues.json`. IMPORTANT: só REPORTA; nunca corrige o
mapa nem escreve no banco (sessão `default_transaction_read_only=on`).

Uso: `DATA_DB_URL=... ../Automatic-Reporting/.venv/bin/python -I scripts/geodata/compare_db.py <geodata_dir>`
(`<geodata_dir>` é o `out_dir` do `geodata.py build`). `psycopg2` é importado só ao
conectar, para os testes rodarem sem ele.
"""

import json
import sys
from pathlib import Path
from typing import Callable, Mapping

# IMPORTANT: com `python3 -I` o diretório do script não entra no sys.path.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import build

THRESHOLD = 0.005
MAX_EXAMPLES = 10
COMPARISON_PREFIX = "Shape × banco:"
READ_ONLY_OPTIONS = "-c default_transaction_read_only=on"
DB_URL_ENV = "DATA_DB_URL"

# Mesmas views/colunas dos painéis (src/features/panels/*/…Panel.ts). PIB e população
# só das 4 áreas (mesmo filtro dos painéis, ver buildTerritorialWhere): sem isso, município
# do banco fora delas apareceria como "só no banco" num relatório para o dono dos dados.
INDICATOR_SQL = {
    "pib": """SELECT TRIM(cd_mun::text) AS code, ano, SUM(pib_total) AS value
FROM eco_pib.vw_pib_municipal_pbi
WHERE nordeste = 'Sim' OR semiarido = 'Sim' OR caatinga = 'Sim' OR sudene = 'Sim'
GROUP BY TRIM(cd_mun::text), ano""",
    "demografia": """SELECT TRIM(cd_mun::text) AS code, ano, SUM(populacao_total) AS value
FROM dem_demografia.final_demografia
WHERE ne = 'Sim' OR semi_21 = 'Sim' OR caat_24 = 'Sim' OR aas_21 = 'Sim'
GROUP BY TRIM(cd_mun::text), ano""",
    # Como o painel: só estados (as views também têm linhas de região metropolitana).
    "idh": """SELECT RIGHT(TRIM(estado_uf), 2) AS code, ano, idh AS value
FROM des_idh.idh_geral_novo_view WHERE regiao_metropolitana = 'Não'""",
}
INDICATOR_LABEL = {"pib": "PIB (R$)", "demografia": "população", "idh": "IDH"}

Key = tuple[str, int]
RowsSource = Callable[[str], list[tuple]]


def relative_difference(shape: float | None, db: float) -> float:
    """Diferença relativa ao valor do banco; `inf` se o mapa não tem valor ou o banco é 0 e o mapa não."""
    if shape is None:
        return float("inf")
    if shape == db:
        return 0.0
    if db == 0:
        return float("inf")
    return abs(shape - db) / abs(db)


def shape_values(features: list[dict]) -> dict[Key, float | None]:
    """`{(code, ano): valor}` das propriedades `v<ano>` das feições (valor ausente = `None`)."""
    values: dict[Key, float | None] = {}
    for feature in features:
        props = feature["properties"]
        for name, value in props.items():
            if name.startswith("v") and name[1:].isdigit():
                values[(str(props["code"]).strip(), int(name[1:]))] = value
    return values


def db_values(rows: list[tuple]) -> dict[Key, float]:
    """`{(code, ano): valor}` das linhas `(code, ano, valor)`; valor nulo fica de fora."""
    return {(str(code).strip(), int(year)): float(value) for code, year, value in rows if value is not None}


def _number(value: float) -> str:
    return str(int(value)) if float(value).is_integer() else str(value)


def _percent(ratio: float) -> str:
    return f"{ratio * 100:.1f}%".replace(".", ",")


def _describe(key: Key, shape: float | None, db: float, names: dict[str, str]) -> str:
    code, year = key
    mapa = "sem valor" if shape is None else _number(shape)
    return f"{code} {names.get(code, '?')} v{year}: mapa {mapa}, banco {_number(db)}"


def find_divergences(
    shapes: dict[Key, float | None], dbs: dict[Key, float], threshold: float
) -> tuple[list[tuple[Key, float]], int]:
    """Pares `(chave, diferença)` acima do limite (maior primeiro) e quantos pares foram comparados."""
    common = [key for key in shapes if key in dbs]
    found = [(key, relative_difference(shapes[key], dbs[key])) for key in common]
    over = [(key, diff) for key, diff in found if diff > threshold]
    return sorted(over, key=lambda pair: (-pair[1], pair[0])), len(common)


def _feature_names(features: list[dict]) -> dict[str, str]:
    names = {}
    for feature in features:
        props = feature["properties"]
        label = props["name"] if not props.get("uf") else f"{props['name']} ({props['uf']})"
        names[str(props["code"]).strip()] = label
    return names


def _divergence_issue(
    key: str, divergences: list[tuple[Key, float]], compared: int, ctx: dict, max_examples: int
) -> dict:
    spec = build.INDICATORS[key]
    examples = "; ".join(
        f"{_describe(k, ctx['shapes'][k], ctx['dbs'][k], ctx['names'])}"
        + ("" if diff == float("inf") else f" ({_percent(diff)})")
        for k, diff in divergences[:max_examples]
    )
    return {
        "arquivo": spec["shp"],
        "camada": key,
        "campo": f"{spec['prefix']}<ano>",
        "problema": f"{COMPARISON_PREFIX} valores do {INDICATOR_LABEL[key]} divergem do banco",
        "evidencia": (
            f"{len(divergences)} de {compared} comparações (município/estado × ano) com diferença acima de "
            f"{_percent(ctx['threshold'])}; maiores: {examples}"
        ),
        "esperado": f"valores iguais aos do banco (diferença relativa de até {_percent(ctx['threshold'])})",
    }


def _unmatched_issue(key: str, only_shape: list[str], only_db: list[str], max_examples: int) -> dict:
    spec = build.INDICATORS[key]
    parts = []
    if only_shape:
        parts.append(f"{len(only_shape)} código(s) só no mapa: {', '.join(only_shape[:max_examples])}")
    if only_db:
        parts.append(f"{len(only_db)} código(s) só no banco: {', '.join(only_db[:max_examples])}")
    return {
        "arquivo": spec["shp"],
        "camada": key,
        "campo": spec["code"],
        "problema": f"{COMPARISON_PREFIX} códigos sem correspondência entre mapa e banco",
        "evidencia": "; ".join(parts),
        "esperado": "mesmo conjunto de códigos no mapa e no banco",
    }


def compare_indicator(
    key: str, features: list[dict], rows: list[tuple], threshold: float = THRESHOLD, max_examples: int = MAX_EXAMPLES
) -> list[dict]:
    """Issues de um indicador: divergência de valores e códigos sem correspondência.

    Ex.: `compare_indicator("pib", features, [("2507507", 2023, 2.8e10)])`.
    """
    shapes, dbs = shape_values(features), db_values(rows)
    divergences, compared = find_divergences(shapes, dbs, threshold)
    ctx = {"shapes": shapes, "dbs": dbs, "names": _feature_names(features), "threshold": threshold}
    issues = [_divergence_issue(key, divergences, compared, ctx, max_examples)] if divergences else []
    shape_codes, db_codes = {c for c, _ in shapes}, {c for c, _ in dbs}
    only_shape, only_db = sorted(shape_codes - db_codes), sorted(db_codes - shape_codes)
    if only_shape or only_db:
        issues.append(_unmatched_issue(key, only_shape, only_db, max_examples))
    return issues


def merge_issues(existing: list[dict], new: list[dict]) -> list[dict]:
    """Troca as issues de comparações anteriores pelas novas e mantém as demais (rodar de novo não duplica)."""
    kept = [issue for issue in existing if not issue["problema"].startswith(COMPARISON_PREFIX)]
    return kept + new


def run_comparison(geodata_dir: Path, rows_source: RowsSource) -> int:
    """Compara os 3 indicadores e regrava `data-issues.json`; devolve o total de issues do arquivo."""
    found: list[dict] = []
    for key, sql in INDICATOR_SQL.items():
        collection = json.loads((geodata_dir / "vector" / f"{key}.geojson").read_text(encoding="utf-8"))
        found += compare_indicator(key, collection["features"], rows_source(sql))
    issues_path = geodata_dir / "data-issues.json"
    merged = merge_issues(json.loads(issues_path.read_text(encoding="utf-8")), found)
    issues_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return len(merged)


def require_db_url(env: Mapping[str, str]) -> str:
    url = env.get(DB_URL_ENV)
    if not url:
        raise SystemExit(f"{DB_URL_ENV} ausente no ambiente; esperado a URL postgresql://... do banco (via túnel).")
    return url


def connect_rows_source(url: str) -> tuple[RowsSource, Callable[[], None]]:
    """Fonte de linhas sobre uma conexão só leitura; devolve também o `close`."""
    import psycopg2  # lazy: os testes unitários rodam sem psycopg2

    connection = psycopg2.connect(url, options=READ_ONLY_OPTIONS)
    connection.set_session(readonly=True)

    def fetch(sql: str) -> list[tuple]:
        with connection.cursor() as cursor:
            cursor.execute(sql)
            return cursor.fetchall()

    return fetch, connection.close


def main(argv: list[str], env: Mapping[str, str]) -> int:
    if len(argv) != 1:
        raise SystemExit("uso: compare_db.py <geodata_dir>; esperado exatamente 1 argumento (o diretório gerado pelo build).")
    fetch, close = connect_rows_source(require_db_url(env))
    try:
        total = run_comparison(Path(argv[0]), fetch)
    finally:
        close()
    print(f"comparação com o banco concluída; {total} problemas em {argv[0]}/data-issues.json")
    return 0


if __name__ == "__main__":
    import os

    sys.exit(main(sys.argv[1:], os.environ))
