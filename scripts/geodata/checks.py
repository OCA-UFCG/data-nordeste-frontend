"""Checagens de consistência dos dados do Drive.

IMPORTANT: estas funções só REPORTAM problemas (lista de `Issue`); nunca
corrigem valores, classes ou arquivos. Os textos vão para o dono dos dados
(PDF), por isso os campos do `Issue` são em português.
"""

from collections import Counter
from pathlib import Path
from typing import TypedDict

Issue = TypedDict(
    "Issue",
    {"arquivo": str, "camada": str, "campo": str, "problema": str, "evidencia": str, "esperado": str},
)

MAX_CODES_SHOWN = 20
SHAPEFILE_COMPANIONS = (".shx", ".dbf", ".prj", ".cpg")
# Áreas que existem só como atributo dos municípios, sem polígono próprio.
AREAS_WITHOUT_POLYGON = {"semiarido": ("Semiárido", "semi_21_1")}


def _issue(arquivo: str, camada: str, campo: str, problema: str, evidencia: str, esperado: str) -> Issue:
    return {
        "arquivo": arquivo,
        "camada": camada,
        "campo": campo,
        "problema": problema,
        "evidencia": evidencia,
        "esperado": esperado,
    }


def _fmt(number: float) -> str:
    return str(int(number)) if float(number).is_integer() else str(number)


def to_number(value: object) -> float | None:
    """Número de um valor de coluna; `None` se for texto que não é número."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).strip())
    except ValueError:
        return None


def _is_missing(value: object) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def check_class_ranges(
    arquivo: str, camada: str, classes: list[dict], campo: str, admits_negative: bool = False
) -> list[Issue]:
    """Aponta classes com limites incoerentes, sem alterá-las.

    `admits_negative=False` (PIB, população, IDH) sinaliza limite inferior negativo.
    Ex.: `check_class_ranges("pib.qgz", "pib", classes, "pib_2023")`.
    """
    issues: list[Issue] = []
    for index, current in enumerate(classes):
        issues += _inverted_issues(arquivo, camada, campo, current)
        if not admits_negative:
            issues += _negative_issues(arquivo, camada, campo, current)
        if index > 0:
            issues += _sequence_issues(arquivo, camada, campo, classes[index - 1], current)
    return issues


def _inverted_issues(arquivo: str, camada: str, campo: str, cls: dict) -> list[Issue]:
    if cls["lower"] <= cls["upper"]:
        return []
    problema = f"limite inferior {_fmt(cls['lower'])} maior que o superior {_fmt(cls['upper'])}"
    evidencia = f'faixa "{cls["label"]}": inferior {_fmt(cls["lower"])}, superior {_fmt(cls["upper"])}'
    # O rótulo é a única referência do que a faixa deveria cobrir.
    esperado = f'limites coerentes com o rótulo "{cls["label"]}" (inferior menor que o superior)'
    return [_issue(arquivo, camada, campo, problema, evidencia, esperado)]


def _negative_issues(arquivo: str, camada: str, campo: str, cls: dict) -> list[Issue]:
    if cls["lower"] >= 0:
        return []
    evidencia = f'faixa "{cls["label"]}": limite inferior {_fmt(cls["lower"])}'
    return [
        _issue(arquivo, camada, campo, "limite inferior negativo", evidencia,
               "limite inferior maior ou igual a 0 (indicador não admite valor negativo)")
    ]


def _sequence_issues(arquivo: str, camada: str, campo: str, prev: dict, cur: dict) -> list[Issue]:
    if cur["lower"] < prev["lower"] or cur["lower"] < prev["upper"]:
        problema = "faixa se sobrepõe à anterior"
    elif cur["lower"] > prev["upper"]:
        problema = "lacuna entre faixas consecutivas"
    else:
        return []
    evidencia = (
        f'faixa "{cur["label"]}" começa em {_fmt(cur["lower"])}; '
        f'faixa anterior "{prev["label"]}" vai de {_fmt(prev["lower"])} a {_fmt(prev["upper"])}'
    )
    esperado = "limite inferior igual ao limite superior da faixa anterior"
    return [_issue(arquivo, camada, campo, problema, evidencia, esperado)]


def check_field_types(arquivo: str, camada: str, fields: dict[str, str], year_prefix: str) -> list[Issue]:
    """Aponta colunas do mesmo prefixo (`pop_2000`, `pop_2010`...) com tipo diferente do predominante."""
    same_prefix = {n: t for n, t in fields.items() if n.startswith(f"{year_prefix}_")}
    if not same_prefix:
        return []
    dominant = Counter(same_prefix.values()).most_common(1)[0][0]
    return [
        _issue(arquivo, camada, name, "tipo de coluna diferente das demais colunas do mesmo indicador",
               f"{name} é {kind}; as demais colunas {year_prefix}_* são {dominant}",
               f"{dominant}, como as outras colunas {year_prefix}_*")
        for name, kind in same_prefix.items()
        if kind != dominant
    ]


def check_values(
    arquivo: str,
    camada: str,
    rows: list[dict],
    code_field: str,
    year_fields: list[str],
    admits_negative: bool = False,
) -> list[Issue]:
    """Aponta código duplicado e, por coluna de ano, valor ausente, texto não numérico e negativo.

    Uma `Issue` por (campo, problema), listando os códigos (evita milhares de linhas no PDF).
    """
    issues = _duplicate_code_issues(arquivo, camada, rows, code_field)
    for field in year_fields:
        issues += _year_issues(arquivo, camada, rows, code_field, field, admits_negative)
    return issues


def _codes_text(codes: list[str]) -> str:
    shown = ", ".join(codes[:MAX_CODES_SHOWN])
    extra = len(codes) - MAX_CODES_SHOWN
    return f"{shown} e mais {extra}" if extra > 0 else shown


def _duplicate_code_issues(arquivo: str, camada: str, rows: list[dict], code_field: str) -> list[Issue]:
    counts = Counter(str(row.get(code_field)) for row in rows)
    repeated = [code for code, n in counts.items() if n > 1]
    if not repeated:
        return []
    evidencia = f"{len(repeated)} códigos repetidos: {_codes_text(repeated)}"
    return [_issue(arquivo, camada, code_field, "código duplicado", evidencia, "um registro por código")]


def _year_issues(
    arquivo: str, camada: str, rows: list[dict], code_field: str, field: str, admits_negative: bool
) -> list[Issue]:
    missing, texts, negatives = [], [], []
    for row in rows:
        code, value = str(row.get(code_field)), row.get(field)
        if _is_missing(value):
            missing.append(code)
        elif to_number(value) is None:
            texts.append((code, value))
        elif to_number(value) < 0 and not admits_negative:
            negatives.append(code)
    found = [
        ("valor ausente", missing, "valor numérico preenchido"),
        ("texto não numérico", [f"{c} ({v!r})" for c, v in texts], "número"),
        ("valor negativo", negatives, "valor maior ou igual a 0"),
    ]
    return [
        _issue(arquivo, camada, field, problema, f"{len(codes)} registros, códigos: {_codes_text(codes)}", esperado)
        for problema, codes, esperado in found
        if codes
    ]


def check_expected_files(raw_dir: Path, expected: list[str]) -> list[Issue]:
    """Confere shapefiles esperados (caminhos `.shp` relativos a `raw_dir`) e seus arquivos irmãos.

    Ex.: `check_expected_files(raw, ["shapefile_geral/area_sudene/sudene_mun.shp"])`.
    """
    issues: list[Issue] = []
    for relative in expected:
        shp = raw_dir / relative
        if not shp.exists():
            issues.append(_missing_shapefile_issue(relative, shp))
            continue
        for ext in SHAPEFILE_COMPANIONS:
            issues += _companion_issues(relative, shp, ext)
    return issues


def _missing_shapefile_issue(relative: str, shp: Path) -> Issue:
    area = AREAS_WITHOUT_POLYGON.get(shp.stem.lower())
    if area:
        nome, atributo = area
        return _issue(relative, shp.stem, ".shp", f"lacuna: não há polígono próprio do {nome}",
                      f"arquivo {relative} não existe no Drive",
                      f"polígono do {nome}, ou aceitar a área apenas como atributo {atributo} dos municípios")
    return _issue(relative, shp.stem, ".shp", "arquivo .shp ausente",
                  f"arquivo {relative} não existe no Drive", f"arquivo {relative}")


def _companion_issues(relative: str, shp: Path, ext: str) -> list[Issue]:
    if shp.with_suffix(ext).exists():
        return []
    expected_name = f"{shp.stem}{ext}"
    # Ignora irmãos que pertencem a outro .shp da mesma pasta (ex.: limite_sudene.cpg).
    others = sorted(
        p.name for p in shp.parent.glob(f"*{ext}") if not p.with_suffix(".shp").exists()
    )
    if others:
        return [_issue(relative, shp.stem, ext, f"arquivo {ext} com nome diferente do .shp",
                       f"encontrado {', '.join(others)}; o .shp é {shp.name}",
                       f"{expected_name} (mesmo nome do .shp)")]
    return [_issue(relative, shp.stem, ext, f"arquivo {ext} ausente",
                   f"não há nenhum {ext} ao lado de {shp.name}", expected_name)]
