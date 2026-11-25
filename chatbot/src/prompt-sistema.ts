/**
 * O prompt do sistema dos dois motores: prompt.md, o texto sobre o portal, o
 * catálogo de indicadores resumido e a data de hoje. Rodado direto (npm run
 * prompt), imprime o prompt; o comum.sh grava o resultado para o claude da
 * linha de comando.
 *
 * DATANE_PROMPT troca o prompt.md por outro arquivo (para comparar versões na
 * avaliação). DATANE_CATALOGO_NO_PROMPT=0 tira o catálogo (o modelo passa a
 * depender de detalhar_indicador).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { catalogoResumido, GERADO_EM } from "./ferramentas/index.ts";
import { dataBr } from "./ferramentas/banco.ts";

const PACOTE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sobreOPortal() {
  return readFileSync(path.join(PACOTE, "conhecimento/sobre-o-datane.md"), "utf8")
    .replace(/^<!--[\s\S]*?-->\n*/, "")
    .replace(/^#/gm, "##");
}

export function promptDoSistema(agora = new Date()) {
  const hoje = agora.toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" });
  const arquivo = process.env.DATANE_PROMPT ?? path.join(PACOTE, "prompt.md");
  const partes = [readFileSync(arquivo, "utf8").trim(), sobreOPortal().trim()];
  if (process.env.DATANE_CATALOGO_NO_PROMPT !== "0")
    partes.push(
      `## Catálogo de indicadores\n\nDados copiados do banco do portal em ${dataBr(GERADO_EM)}. "razão das somas" quer dizer que o valor de estados e recortes já está calculado somando numerador e denominador dos municípios.\n\n${catalogoResumido()}`,
    );
  // A data fica no fim: o resto do prompt é igual o dia todo e vai para o cache.
  partes.push(`Data de hoje: ${hoje}.`);

  return partes.join("\n\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.stdout.write(promptDoSistema() + "\n");
