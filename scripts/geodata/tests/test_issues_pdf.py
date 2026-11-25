import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import issues_pdf

ISSUE = {
    "arquivo": "pib/pib.qgz",
    "camada": "pib",
    "campo": "pib_2023",
    "problema": "limite inferior negativo",
    "evidencia": 'faixa "<= R$ 500 Mi": limite inferior -190464340',
    "esperado": "limite inferior maior ou igual a 0",
}
OTHER = {**ISSUE, "arquivo": "idh/idh.qgz", "camada": "idh", "campo": "idh_2020"}


class ChromeRunnerFake:
    """Grava um PDF falso no destino e registra o comando (sem Chrome)."""

    def __init__(self, returncode: int = 0):
        self.returncode = returncode
        self.commands: list[list[str]] = []

    def __call__(self, command: list[str]) -> int:
        self.commands.append(command)
        pdf_arg = next(part for part in command if part.startswith("--print-to-pdf="))
        Path(pdf_arg.split("=", 1)[1]).write_bytes(b"%PDF-fake")
        return self.returncode


class RenderIssuesHtmlTest(unittest.TestCase):
    def test_contains_file_name_and_problem(self):
        html = issues_pdf.render_issues_html([ISSUE], date(2026, 11, 23))
        self.assertIn("pib/pib.qgz", html)
        self.assertIn("limite inferior negativo", html)

    def test_header_date_source_and_columns(self):
        html = issues_pdf.render_issues_html([ISSUE], date(2026, 11, 23))
        self.assertIn("Mapas dos painéis — problemas nos dados", html)
        self.assertIn("23/11/2026", html)
        self.assertIn("1zXWbyU02PrbuZj9JQQRjf9bwZf-GoKg6", html)
        for column in ("Arquivo", "Camada", "Campo", "Problema", "Evidência", "O que se espera"):
            self.assertIn(f"<th>{column}</th>", html)

    def test_escapes_angle_brackets(self):
        html = issues_pdf.render_issues_html([ISSUE], date(2026, 11, 23))
        self.assertIn("&lt;= R$ 500 Mi", html)
        self.assertNotIn('faixa "<= R$', html)

    def test_escapes_injected_markup_in_every_field(self):
        evil = {key: "<script>x</script>" for key in ISSUE}
        html = issues_pdf.render_issues_html([evil], date(2026, 11, 23))
        self.assertNotIn("<script>", html)

    def test_groups_by_file_with_one_heading_per_file(self):
        html = issues_pdf.render_issues_html([ISSUE, OTHER, ISSUE], date(2026, 11, 23))
        self.assertEqual(html.count("<h2>pib/pib.qgz</h2>"), 1)
        self.assertEqual(html.count("<h2>idh/idh.qgz</h2>"), 1)

    def test_states_that_nothing_was_corrected(self):
        html = issues_pdf.render_issues_html([ISSUE], date(2026, 11, 23))
        self.assertIn("nada foi corrigido", html)

    def test_empty_list_says_no_problems(self):
        html = issues_pdf.render_issues_html([], date(2026, 11, 23))
        self.assertIn("Nenhum problema", html)


class IssuesToPdfTest(unittest.TestCase):
    def test_runs_chrome_headless_with_print_to_pdf(self):
        runner = ChromeRunnerFake()
        with tempfile.TemporaryDirectory() as tmp:
            pdf = Path(tmp) / "out.pdf"
            issues_pdf.issues_to_pdf([ISSUE], pdf, runner, date(2026, 11, 23))
            self.assertTrue(pdf.exists())
        command = runner.commands[0]
        self.assertEqual(command[0], "google-chrome")
        self.assertIn("--headless", command)
        self.assertIn("--no-pdf-header-footer", command)
        self.assertTrue(command[-1].startswith("file://"))

    def test_failed_chrome_raises_with_code_and_pdf_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            pdf = Path(tmp) / "out.pdf"
            with self.assertRaises(RuntimeError) as raised:
                issues_pdf.issues_to_pdf([ISSUE], pdf, ChromeRunnerFake(returncode=3), date(2026, 11, 23))
        self.assertIn("3", str(raised.exception))
        self.assertIn("out.pdf", str(raised.exception))


if __name__ == "__main__":
    unittest.main()
