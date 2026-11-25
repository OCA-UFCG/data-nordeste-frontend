"""Lê classes, cores e contornos dos projetos `.qgz` do Drive.

O `.qgz` é dado não confiável: só `zipfile` + `xml.etree`, nunca `eval`/import.
Os valores saem exatamente como estão no arquivo (nada é corrigido aqui).
"""

import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

_COLOR_PREFIX = re.compile(r"^\s*(\d{1,3}),(\d{1,3}),(\d{1,3})")


def read_qgs(qgz_path: Path) -> ET.Element:
    """Abre o zip e devolve a raiz do único `*.qgs`. Ex.: `read_qgs(Path("pib.qgz"))`."""
    with zipfile.ZipFile(qgz_path) as archive:
        names = [n for n in archive.namelist() if n.endswith(".qgs")]
        if len(names) != 1:
            raise ValueError(
                f'"{qgz_path}" deveria ter exatamente um *.qgs, mas tem {len(names)}: {names}'
            )
        return ET.fromstring(archive.read(names[0]))


def qgs_color_to_hex(value: str) -> str:
    """Converte `"239,207,220,255,rgb:..."` em `"#efcfdc"` (usa só os 3 primeiros inteiros)."""
    match = _COLOR_PREFIX.match(value)
    if not match:
        raise ValueError(f'cor QGIS "{value}" inválida; esperado "r,g,b,a,rgb:..."')
    r, g, b = (int(part) for part in match.groups())
    return f"#{r:02x}{g:02x}{b:02x}"


def _find_layer(root: ET.Element, layer_name: str) -> ET.Element:
    layers = {ml.findtext("layername"): ml for ml in root.iter("maplayer")}
    if layer_name not in layers:
        raise ValueError(
            f'camada "{layer_name}" não encontrada no .qgs; camadas disponíveis: {sorted(layers)}'
        )
    return layers[layer_name]


def _renderer(root: ET.Element, layer_name: str, expected_type: str) -> ET.Element:
    renderer = _find_layer(root, layer_name).find("renderer-v2")
    found = renderer.get("type") if renderer is not None else None
    if found != expected_type:
        raise ValueError(
            f'camada "{layer_name}" usa renderer "{found}"; esperado "{expected_type}"'
        )
    return renderer


def _symbol_options(renderer: ET.Element, symbol_name: str) -> dict[str, str]:
    # `symbols/symbol` direto: o `colorramp` e o `sourceSymbol` repetem o nome "0".
    for symbol in renderer.findall("symbols/symbol"):
        if symbol.get("name") == symbol_name:
            return _first_layer_options(symbol)
    raise ValueError(f'símbolo "{symbol_name}" não existe no renderer')


def _first_layer_options(symbol: ET.Element) -> dict[str, str]:
    layer = symbol.find("layer")
    if layer is None:
        raise ValueError("símbolo sem <layer>; esperado SimpleFill")
    return {o.get("name"): o.get("value") for o in layer.findall("Option/Option")}


def graduated_attribute(root: ET.Element, layer_name: str) -> str:
    """Campo classificado pelo renderer graduado. Ex.: `"pib_2023"`."""
    return _renderer(root, layer_name, "graduatedSymbol").get("attr")


def graduated_classes(root: ET.Element, layer_name: str) -> list[dict]:
    """Classes na ordem do arquivo, sem validar limites (isso é de `checks.py`)."""
    renderer = _renderer(root, layer_name, "graduatedSymbol")
    classes = []
    for item in renderer.findall("ranges/range"):
        options = _symbol_options(renderer, item.get("symbol"))
        classes.append(
            {
                "lower": float(item.get("lower")),
                "upper": float(item.get("upper")),
                "label": item.get("label"),
                "color": qgs_color_to_hex(options["color"]),
            }
        )
    return classes


def layer_outline(root: ET.Element, layer_name: str) -> dict:
    """Contorno do símbolo 0 do renderer. Ex.: `{"color": "#666666", "widthMm": 0.15}`."""
    renderer = _find_layer(root, layer_name).find("renderer-v2")
    if renderer is None:
        raise ValueError(f'camada "{layer_name}" sem renderer-v2; esperado camada vetorial')
    options = _symbol_options(renderer, "0")
    return {
        "color": qgs_color_to_hex(options["outline_color"]),
        "widthMm": float(options["outline_width"]),
    }


def raster_palette(root: ET.Element, layer_name: str) -> list[dict]:
    """Itens do `colorrampshader` do raster pseudocolor. Ex.: `{"value": 2, "color": "#d7191b", "label": "Árido"}`."""
    renderer = _find_layer(root, layer_name).find("pipe/rasterrenderer")
    found = renderer.get("type") if renderer is not None else None
    if found != "singlebandpseudocolor":
        raise ValueError(
            f'camada "{layer_name}" usa rasterrenderer "{found}"; esperado "singlebandpseudocolor"'
        )
    return [
        {"value": _integer_value(i.get("value")), "color": i.get("color").lower(), "label": i.get("label")}
        for i in renderer.findall(".//colorrampshader/item")
    ]


def _integer_value(raw: str) -> int:
    number = float(raw)
    if not number.is_integer():
        raise ValueError(f'valor de classe raster "{raw}" não é inteiro; esperado código inteiro')
    return int(number)
