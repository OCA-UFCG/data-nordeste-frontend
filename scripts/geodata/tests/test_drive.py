import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import drive

MANIFEST_PATH = Path(__file__).resolve().parents[1] / "drive_manifest.json"


class DriveFetchFake:
    """Grava `content` no destino e registra as URLs pedidas (sem rede)."""

    def __init__(self, content: bytes = b"ok"):
        self.content = content
        self.urls: list[str] = []

    def __call__(self, url: str, destination: Path) -> None:
        self.urls.append(url)
        destination.write_bytes(self.content)


class DriveUrlTest(unittest.TestCase):
    def test_drive_url_uses_usercontent_with_confirm(self):
        self.assertEqual(
            drive.drive_url("abc"),
            "https://drive.usercontent.google.com/download?id=abc&export=download&confirm=t",
        )


class DownloadAllTest(unittest.TestCase):
    def test_download_all_writes_tree(self):
        manifest = {
            "folderId": "root",
            "files": [{"id": "id1", "path": "a/x.qgz"}, {"id": "id2", "path": "a/b/y.shp"}],
        }
        fake = DriveFetchFake()
        with tempfile.TemporaryDirectory() as tmp:
            written = drive.download_all(manifest, Path(tmp), fake)
            self.assertEqual(written, [Path(tmp) / "a/x.qgz", Path(tmp) / "a/b/y.shp"])
            self.assertEqual((Path(tmp) / "a/x.qgz").read_bytes(), b"ok")
            self.assertEqual((Path(tmp) / "a/b/y.shp").read_bytes(), b"ok")
        self.assertEqual([drive.drive_url("id1"), drive.drive_url("id2")], fake.urls)

    def test_download_all_rejects_html_page(self):
        manifest = {"folderId": "root", "files": [{"id": "id1", "path": "a/x.qgz"}]}
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError) as raised:
                drive.download_all(manifest, Path(tmp), DriveFetchFake(b"<!DOCTYPE html>"))
        self.assertIn("a/x.qgz", str(raised.exception))
        self.assertIn("expected file bytes, got an HTML page", str(raised.exception))


class ManifestTest(unittest.TestCase):
    def test_manifest_paths_are_unique_and_relative(self):
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        paths = [entry["path"] for entry in manifest["files"]]
        for path in paths:
            self.assertFalse(path.startswith("/"), path)
            self.assertNotIn("..", path.split("/"), path)
        self.assertEqual(len(paths), len(set(paths)))
        self.assertIn("pib/pib.qgz", paths)
        self.assertIn("indice_aridez/raster/indice_aridez_2020_4674_rec.tif", paths)


if __name__ == "__main__":
    unittest.main()
