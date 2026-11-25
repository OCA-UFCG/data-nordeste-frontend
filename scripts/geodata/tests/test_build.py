import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build


class AreaStatesFileTest(unittest.TestCase):
    def test_file_names_per_area(self):
        self.assertEqual(build.area_states_file("sudene"), "estados_sudene.geojson")
        self.assertEqual(build.area_states_outside_file("caatinga"), "estados_fora_caatinga.geojson")


def _square(x: float, y: float, side: float) -> list:
    return [[[x, y], [x + side, y], [x + side, y + side], [x, y + side], [x, y]]]


def _multi(*parts: list) -> dict:
    return {"type": "Feature", "properties": {"code": "PE"}, "geometry": {"type": "MultiPolygon", "coordinates": list(parts)}}


class DropOutsideFragmentsTest(unittest.TestCase):
    def test_keeps_the_large_part_and_drops_the_sliver(self):
        big, sliver = _square(0, 0, 1), _square(5, 5, 0.01)

        kept = build.drop_outside_fragments([_multi(big, sliver)])

        self.assertEqual(len(kept), 1)
        self.assertEqual(kept[0]["geometry"], {"type": "MultiPolygon", "coordinates": [big]})
        self.assertEqual(kept[0]["properties"], {"code": "PE"})

    def test_drops_the_state_when_only_slivers_are_left(self):
        self.assertEqual(build.drop_outside_fragments([_multi(_square(0, 0, 0.01), _square(5, 5, 0.02))]), [])

    def test_threshold_separates_just_above_from_just_below(self):
        above = _square(0, 0, (build.MIN_OUTSIDE_PART_DEG2 * 1.1) ** 0.5)
        below = _square(5, 5, (build.MIN_OUTSIDE_PART_DEG2 * 0.9) ** 0.5)

        kept = build.drop_outside_fragments([_multi(above, below)])

        self.assertEqual(kept[0]["geometry"]["coordinates"], [above])

    def test_area_ignores_holes_and_a_plain_polygon_is_handled(self):
        with_hole = _square(0, 0, 1) + _square(0.4, 0.4, 0.1)
        polygon = {"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": with_hole}}

        kept = build.drop_outside_fragments([polygon])

        self.assertEqual(kept[0]["geometry"], {"type": "MultiPolygon", "coordinates": [with_hole]})


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

    def test_keeps_polygons_of_nested_collections(self):
        # O ST_Difference dos estados_fora_<area> sai assim depois do -simplify (BA no Semiárido).
        square = [[[0, 0], [1, 0], [1, 1], [0, 0]]]
        geometry = {
            "type": "GeometryCollection",
            "geometries": [
                {"type": "GeometryCollection", "geometries": [{"type": "Polygon", "coordinates": square}]},
                {"type": "MultiLineString", "coordinates": [[[0, 0], [1, 1]]]},
            ],
        }
        self.assertEqual(build.polygon_parts(geometry), {"type": "MultiPolygon", "coordinates": [square]})

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


class AridezClipTest(unittest.TestCase):
    BOUNDS = [[-48.6999985, -20.1999985], [-32.3999985, -1.0999985]]

    def test_one_png_per_area_of_the_panel(self):
        self.assertEqual(build.ARIDEZ_AREAS, ("nordeste", "semiarido", "caatinga", "sudene"))
        self.assertEqual(build.aridez_png_name(2020, "semiarido"), "aridez_2020_semiarido.png")

    def test_clip_size_keeps_extent_on_finer_grid(self):
        self.assertEqual(build.clip_size(self.BOUNDS), (1630, 1910))

    def test_mercator_size_keeps_square_pixels(self):
        # Mesma largura da grade fina; altura pelo vão em Mercator (≈ 1,02 × o vão em graus aqui).
        self.assertEqual(build.mercator_size(self.BOUNDS), (1630, 1953))

    def test_clip_command_cuts_by_area_polygon(self):
        cmd = build.aridez_clip_command(Path("f.tif"), Path("t/areas.geojson"), "caatinga", self.BOUNDS, Path("c.tif"))
        self.assertEqual(cmd[0], "gdalwarp")
        cut = cmd.index("-cutline")
        self.assertEqual(cmd[cut + 1 : cut + 4], ["t/areas.geojson", "-cwhere", "area = 'caatinga'"])
        self.assertEqual(cmd[cmd.index("-dstnodata") + 1], "255")
        self.assertNotIn("-crop_to_cutline", cmd)
        self.assertEqual(cmd[-2:], ["f.tif", "c.tif"])

    def test_clip_command_reprojects_to_web_mercator_on_same_extent(self):
        # O MapLibre estica a imagem linearmente em Web Mercator entre os cantos;
        # em lat/lon a imagem desce até ~17 km no meio do Nordeste.
        cmd = build.aridez_clip_command(Path("f.tif"), Path("t/areas.geojson"), "caatinga", self.BOUNDS, Path("c.tif"))
        self.assertEqual(cmd[cmd.index("-t_srs") + 1], "EPSG:3857")
        te = cmd.index("-te")
        self.assertEqual(cmd[te + 1 : te + 5], ["-48.6999985", "-20.1999985", "-32.3999985", "-1.0999985"])
        self.assertEqual(cmd[cmd.index("-te_srs") + 1], "EPSG:4674")
        self.assertEqual(cmd[cmd.index("-ts") + 1 : cmd.index("-ts") + 3], ["1630", "1953"])
        self.assertNotIn("-tr", cmd)

    def test_upsample_command_repeats_pixels_on_finer_grid(self):
        cmd = build.aridez_upsample_command(Path("a.tif"), self.BOUNDS, Path("f.tif"))
        self.assertEqual(cmd[0], "gdal_translate")
        self.assertEqual(cmd[cmd.index("-r") + 1], "nearest")
        self.assertEqual(cmd[cmd.index("-outsize") + 1 : cmd.index("-outsize") + 3], ["1630", "1910"])
        self.assertEqual(cmd[-2:], ["a.tif", "f.tif"])

    def test_relief_command_makes_nodata_transparent(self):
        cmd = build.aridez_relief_command(Path("c.tif"), Path("cores.txt"), Path("p.png"))
        self.assertEqual(cmd[:5], ["gdaldem", "color-relief", "c.tif", "cores.txt", "p.png"])
        self.assertIn("-alpha", cmd)
        self.assertIn("-nearest_color_entry", cmd)


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
