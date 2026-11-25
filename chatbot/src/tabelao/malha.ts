/**
 * Grava dados/malha-municipios.json (npm run malha): o contorno simplificado de
 * cada município da área da Sudene, para a página desenhar os mapas.
 *
 * Fonte: um GeoJSON de municípios com a propriedade "c" (código IBGE). O
 * padrão é o do site do SEDES (public/data/brazil-cities-overview.json, ~2 MB
 * para o Brasil todo); outro arquivo vai em DATANE_MALHA_FONTE. Só os anéis
 * externos entram: para pintar o mapa, buracos não fazem diferença.
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACOTE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FONTE = (process.env.DATANE_MALHA_FONTE ?? "~/SAP-frontend/public/data/brazil-cities-overview.json").replace(/^~/, os.homedir());
const TABELAO = process.env.DATANE_TABELAO ?? path.join(PACOTE, "dados/datane.sqlite");

type Anel = Array<[number, number]>;
type Feicao = { properties: { c?: string; codigo?: string; CD_MUN?: string }; geometry: { type: string; coordinates: unknown } };

if (!existsSync(FONTE)) throw new Error(`Não achei o GeoJSON de municípios em "${FONTE}"; defina DATANE_MALHA_FONTE com um GeoJSON que tenha o código IBGE em properties.c.`);
const db = new DatabaseSync(TABELAO, { readOnly: true });
const codigos = new Set((db.prepare("SELECT codigo FROM territorios WHERE tipo = 'municipio'").all() as Array<{ codigo: string }>).map((r) => r.codigo));
const geo = JSON.parse(readFileSync(FONTE, "utf8")) as { features: Feicao[] };
const malha: Record<string, Anel[]> = {};
for (const f of geo.features) {
  const codigo = String(f.properties.c ?? f.properties.codigo ?? f.properties.CD_MUN ?? "");
  if (!codigos.has(codigo)) continue;
  const poligonos = f.geometry.type === "Polygon" ? [f.geometry.coordinates as Anel[]] : (f.geometry.coordinates as Anel[][]);
  malha[codigo] = poligonos.map((p) => p[0]);
}
const destino = path.join(PACOTE, "dados/malha-municipios.json");
writeFileSync(destino, JSON.stringify(malha));
const faltam = [...codigos].filter((c) => !malha[c]);
console.log(`Malha gravada em ${destino}: ${Object.keys(malha).length} de ${codigos.size} municípios.${faltam.length ? ` Sem contorno: ${faltam.join(", ")}.` : ""}`);
