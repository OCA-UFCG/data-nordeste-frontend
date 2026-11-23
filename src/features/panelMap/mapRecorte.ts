export type MapLevel = "area" | "estado" | "municipio";

export type MapRecorte = { uf: string[]; mun: string[] };

export const EMPTY_RECORTE: MapRecorte = { uf: [], mun: [] };

export const STATE_ZOOM = 6.5;
export const MUNICIPALITY_ZOOM = 8.5;
export const ZOOM_OUT_TOLERANCE = 0.5;

const LEVEL_RANK: Record<MapLevel, number> = {
  area: 0,
  estado: 1,
  municipio: 2,
};

export type ResolveRecorteInput = {
  zoom: number;
  fittedZoom: number;
  current: MapRecorte;
  centerUf?: string;
  centerMun?: string;
  deepest: MapLevel;
};

function shallowest(a: MapLevel, b: MapLevel): MapLevel {
  return LEVEL_RANK[a] <= LEVEL_RANK[b] ? a : b;
}

/** Nível pedido pelo zoom, limitado a `deepest`. Ex.: `levelForZoom(9, "estado")` → `"estado"`. */
export function levelForZoom(zoom: number, deepest: MapLevel): MapLevel {
  if (zoom >= MUNICIPALITY_ZOOM) return shallowest("municipio", deepest);
  if (zoom >= STATE_ZOOM) return shallowest("estado", deepest);

  return "area";
}

/** Nível do que está selecionado. Ex.: `{ uf: ["PE"], mun: [] }` → `"estado"`. */
export function levelOfRecorte(recorte: MapRecorte): MapLevel {
  if (recorte.mun.length > 0) return "municipio";
  if (recorte.uf.length > 0) return "estado";

  return "area";
}

/** Igualdade ignorando a ordem. Ex.: `["PB","PE"]` e `["PE","PB"]` são iguais. */
export function sameRecorte(a: MapRecorte, b: MapRecorte): boolean {
  return sameItems(a.uf, b.uf) && sameItems(a.mun, b.mun);
}

function sameItems(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedB = [...b].sort();

  return [...a].sort().every((item, index) => item === sortedB[index]);
}

function recorteAt(
  level: MapLevel,
  centerUf: string,
  centerMun: string | undefined,
): MapRecorte {
  if (level === "area") return EMPTY_RECORTE;
  if (level === "estado" || !centerMun) return { uf: [centerUf], mun: [] };

  return { uf: [centerUf], mun: [centerMun] };
}

// Dentro do mesmo nível, só o alvo sob o centro muda; um centro que já está na
// seleção (multi) não a desfaz.
function retarget(
  level: MapLevel,
  { current, centerUf, centerMun }: ResolveRecorteInput,
): MapRecorte {
  if (level === "area" || !centerUf) return current;
  if (level === "estado") {
    return current.uf.includes(centerUf)
      ? current
      : recorteAt("estado", centerUf, undefined);
  }
  if (!centerMun || current.mun.includes(centerMun)) return current;

  return recorteAt("municipio", centerUf, centerMun);
}

// Sem município sob o centro, o município não pode ser alvo: fica no estado.
function targetLevel(input: ResolveRecorteInput): MapLevel {
  const level = levelForZoom(input.zoom, input.deepest);

  return input.centerMun ? level : shallowest(level, "estado");
}

/**
 * Recorte territorial que o mapa aplica após o usuário mexer no zoom/centro.
 * Descer usa os limiares absolutos; subir só ao afastar além da tolerância do
 * último enquadramento, para a escolha feita na barra não ser desfeita.
 * Ex.: zoom 7 sobre PE sem filtro → `{ uf: ["PE"], mun: [] }`.
 */
export function resolveRecorte(input: ResolveRecorteInput): MapRecorte {
  const { zoom, fittedZoom, current, centerUf, centerMun } = input;

  if (!centerUf) return current;
  const currentLevel = levelOfRecorte(current);
  const level = targetLevel(input);
  const diff = LEVEL_RANK[level] - LEVEL_RANK[currentLevel];
  const zoomedOut = zoom < fittedZoom - ZOOM_OUT_TOLERANCE;

  if (diff > 0 || (diff < 0 && zoomedOut)) {
    return recorteAt(level, centerUf, centerMun);
  }

  return retarget(currentLevel, input);
}
