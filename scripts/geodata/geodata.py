"""CLI do pipeline de geodados dos painéis de mapa.

Uso: python3 -I scripts/geodata/geodata.py download <raw_dir>
     python3 -I scripts/geodata/geodata.py build <raw_dir> <out_dir>
"""

import argparse
import json
import sys
from pathlib import Path

# IMPORTANT: com `python3 -I` o diretório do script não entra no sys.path.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import build
import drive

MANIFEST_PATH = Path(__file__).resolve().parent / "drive_manifest.json"


def run_download(args: argparse.Namespace) -> int:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    written = drive.download_all(manifest, Path(args.raw_dir), drive.fetch_with_urllib)
    print(f"{len(written)} arquivos baixados em {args.raw_dir}")
    return 0


def run_build(args: argparse.Namespace) -> int:
    issues = build.build(Path(args.raw_dir), Path(args.out_dir))
    print(f"geodados gerados em {args.out_dir}; {len(issues)} problemas em data-issues.json")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Pipeline de geodados dos painéis.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    download = subparsers.add_parser("download", help="baixa a pasta do Drive")
    download.add_argument("raw_dir", help="diretório de destino dos arquivos brutos")
    download.set_defaults(run=run_download)
    build_cmd = subparsers.add_parser("build", help="gera geojson, png, estilos e manifesto")
    build_cmd.add_argument("raw_dir", help="diretório com os arquivos baixados do Drive")
    build_cmd.add_argument("out_dir", help="diretório de saída (GEODATA_DIR)")
    build_cmd.set_defaults(run=run_build)
    return parser


def main(argv: list[str]) -> int:
    args = build_parser().parse_args(argv)
    return args.run(args)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
