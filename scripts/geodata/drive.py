"""Download dos arquivos de mapa de uma pasta pública do Google Drive."""

import urllib.request
from pathlib import Path
from typing import Callable

DRIVE_DOWNLOAD_URL = "https://drive.usercontent.google.com/download?id={id}&export=download&confirm=t"
HTML_PREFIXES = (b"<!doctype html", b"<html")

Fetch = Callable[[str, Path], None]


def drive_url(file_id: str) -> str:
    """URL de download anônimo de um arquivo do Drive.

    Exemplo: drive_url("abc") -> ".../download?id=abc&export=download&confirm=t"
    """
    return DRIVE_DOWNLOAD_URL.format(id=file_id)


def fetch_with_urllib(url: str, destination: Path) -> None:
    urllib.request.urlretrieve(url, destination)


def looks_like_html(path: Path) -> bool:
    with path.open("rb") as handle:
        head = handle.read(64).lstrip().lower()
    return head.startswith(HTML_PREFIXES)


def download_one(entry: dict, raw_dir: Path, fetch: Fetch) -> Path:
    destination = raw_dir / entry["path"]
    destination.parent.mkdir(parents=True, exist_ok=True)
    fetch(drive_url(entry["id"]), destination)
    if looks_like_html(destination):
        destination.unlink()
        raise ValueError(
            f'Drive download of "{entry["path"]}" (id "{entry["id"]}") failed: '
            "expected file bytes, got an HTML page (file not public or quota exceeded)."
        )
    return destination


def download_all(manifest: dict, raw_dir: Path, fetch: Fetch) -> list[Path]:
    """Baixa cada arquivo do manifesto para `raw_dir`, reproduzindo a árvore do Drive.

    Exemplo: download_all(manifest, Path("raw"), fetch_with_urllib)
    """
    return [download_one(entry, raw_dir, fetch) for entry in manifest["files"]]
