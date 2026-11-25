"""Relatório (PDF) dos problemas encontrados nos dados dos mapas dos painéis.

Lê `data-issues.json` (gerado por `build.py` e complementado por `compare_db.py`)
e gera um PDF em português para o dono dos dados, agrupado por arquivo.
IMPORTANT: o relatório só descreve; nada aqui corrige dado do Drive.

Uso: `issues_to_pdf(issues, Path("saida.pdf"))`
"""

import html
import subprocess
import tempfile
from datetime import date
from pathlib import Path
from typing import Callable

DRIVE_FOLDER_NAME = "Mapas_painéis"
DRIVE_FOLDER_ID = "1zXWbyU02PrbuZj9JQQRjf9bwZf-GoKg6"
TITLE = "Mapas dos painéis — problemas nos dados"
COLUMNS = (
    ("Arquivo", "arquivo"),
    ("Camada", "camada"),
    ("Campo", "campo"),
    ("Problema", "problema"),
    ("Evidência", "evidencia"),
    ("O que se espera", "esperado"),
)
STYLE = """
@page { size: A4 landscape; margin: 14mm; }
body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 9.5pt; color: #1a1a1a; }
h1 { font-size: 17pt; margin: 0 0 4pt; }
h2 { font-size: 11.5pt; margin: 16pt 0 5pt; padding-bottom: 2pt; border-bottom: 1px solid #888; break-after: avoid; }
p { margin: 3pt 0; line-height: 1.4; }
.meta { color: #444; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th, td { border: 1px solid #bbb; padding: 3pt 5pt; vertical-align: top; text-align: left; overflow-wrap: anywhere; }
th { background: #eee; }
tr { break-inside: avoid; }
"""

COLUMN_WIDTHS = (16, 8, 8, 20, 28, 20)
ChromeRunner = Callable[[list[str]], int]


def _cell(value: object, tag: str = "td") -> str:
    return f"<{tag}>{html.escape(str(value))}</{tag}>"


def _group_by_file(issues: list[dict]) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = {}
    for issue in issues:
        groups.setdefault(issue["arquivo"], []).append(issue)
    return groups


def _table(issues: list[dict]) -> str:
    head = "".join(_cell(label, "th") for label, _ in COLUMNS)
    rows = "".join("<tr>" + "".join(_cell(issue[key]) for _, key in COLUMNS) + "</tr>" for issue in issues)
    widths = "".join(f'<col style="width:{width}%">' for width in COLUMN_WIDTHS)
    return f"<table><colgroup>{widths}</colgroup><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table>"


def _file_section(arquivo: str, issues: list[dict]) -> str:
    return f"<h2>{html.escape(arquivo)}</h2>{_table(issues)}"


def _intro(total: int, files: int, today: date) -> str:
    summary = f"{total} problema(s) em {files} arquivo(s)." if total else "Nenhum problema encontrado."
    return (
        f'<p class="meta">Data: {today.strftime("%d/%m/%Y")} · Origem: pasta do Drive '
        f"“{html.escape(DRIVE_FOLDER_NAME)}” (id {DRIVE_FOLDER_ID}).</p>"
        "<p>O mapa dos painéis usa os arquivos exatamente como foram entregues; nada foi corrigido. "
        "Os pontos abaixo foram encontrados ao ler os arquivos e ao comparar com o banco de dados, "
        "e dependem do dono dos dados para serem revistos.</p>"
        f"<p><strong>{summary}</strong></p>"
    )


def render_issues_html(issues: list[dict], today: date | None = None) -> str:
    """HTML completo do relatório, com tabelas por arquivo; todo texto vindo dos dados é escapado.

    Ex.: `render_issues_html(json.loads(path.read_text()), date.today())`.
    """
    today = today or date.today()
    groups = _group_by_file(issues)
    body = "".join(_file_section(arquivo, items) for arquivo, items in groups.items())
    return (
        '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
        f"<title>{html.escape(TITLE)}</title><style>{STYLE}</style></head><body>"
        f"<h1>{html.escape(TITLE)}</h1>{_intro(len(issues), len(groups), today)}{body}</body></html>"
    )


def run_chrome(command: list[str]) -> int:
    return subprocess.run(command, capture_output=True, check=False).returncode


def chrome_command(html_path: Path, pdf_path: Path) -> list[str]:
    return [
        "google-chrome",
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path.resolve().as_uri(),
    ]


def issues_to_pdf(
    issues: list[dict], pdf_path: Path, runner: ChromeRunner = run_chrome, today: date | None = None
) -> None:
    """Gera o PDF com o Chrome headless a partir de um HTML temporário.

    Ex.: `issues_to_pdf(issues, Path("relatorio.pdf"))`.
    """
    with tempfile.TemporaryDirectory() as tmp:
        html_path = Path(tmp) / "problemas.html"
        html_path.write_text(render_issues_html(issues, today), encoding="utf-8")
        code = runner(chrome_command(html_path, pdf_path))
    if code != 0 or not pdf_path.exists():
        raise RuntimeError(f"google-chrome saiu com código {code} ao gerar {pdf_path}; esperado código 0 e o PDF gravado.")
