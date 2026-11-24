import sys
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import qgis_style

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "mini.qgs"

# Rótulos copiados do arquivo real: o Drive é a fonte, não se corrige.
LABELS = [
    "Pequeno (≤ 50 mil habitantes)",
    "Médio (> 50 mil e ≤ 100 mil habitantes)",
    "Grande (≥ 100 mil habitantes)",
]


class QgisStyleTest(unittest.TestCase):
    def setUp(self):
        self.root = ET.parse(FIXTURE).getroot()

    def test_graduated_classes_reads_as_is(self):
        classes = qgis_style.graduated_classes(self.root, "demografia")
        limits = [[c["lower"], c["upper"]] for c in classes]
        self.assertEqual(limits, [[0, 50000], [50000, 10000], [10000, 4000000]])
        self.assertEqual([c["color"] for c in classes], ["#efcfdc", "#e7a4bf", "#e482a9"])
        self.assertEqual([c["label"] for c in classes], LABELS)

    def test_graduated_attribute_reads_renderer_attr(self):
        self.assertEqual(qgis_style.graduated_attribute(self.root, "demografia"), "pop_2022")

    def test_layer_outline_state_limit(self):
        outline = qgis_style.layer_outline(self.root, "brasil_estado_4674")
        self.assertEqual(outline, {"color": "#666666", "widthMm": 0.15})

    def test_layer_outline_graduated_uses_symbol_zero(self):
        outline = qgis_style.layer_outline(self.root, "demografia")
        self.assertEqual(outline, {"color": "#666666", "widthMm": 0.15})

    def test_raster_palette_reads_items(self):
        palette = qgis_style.raster_palette(self.root, "indice_aridez_2020_4674_rec")
        got = [(p["value"], p["color"], p["label"]) for p in palette]
        self.assertEqual(
            got,
            [
                (2, "#d7191b", "Árido"),
                (3, "#fe7f00", "Semiárido"),
                (4, "#c6e8ac", "Subúmido seco"),
                (5, "#2c83b9", "Úmido"),
            ],
        )

    def test_unknown_layer_names_layer_and_available_ones(self):
        with self.assertRaises(ValueError) as ctx:
            qgis_style.graduated_classes(self.root, "pib")
        message = str(ctx.exception)
        self.assertIn('"pib"', message)
        self.assertIn("demografia", message)

    def test_wrong_renderer_names_found_type(self):
        with self.assertRaises(ValueError) as ctx:
            qgis_style.graduated_classes(self.root, "brasil_estado_4674")
        self.assertIn("singleSymbol", str(ctx.exception))

    def test_qgs_color_uses_first_three_integers(self):
        value = "239,207,220,255,rgb:0.93,0.81,0.86,1"
        self.assertEqual(qgis_style.qgs_color_to_hex(value), "#efcfdc")

    def test_qgs_color_rejects_malformed_value(self):
        with self.assertRaises(ValueError) as ctx:
            qgis_style.qgs_color_to_hex("azul")
        self.assertIn('"azul"', str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
