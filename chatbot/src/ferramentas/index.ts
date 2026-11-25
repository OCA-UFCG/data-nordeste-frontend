/**
 * As ferramentas do assistente do Data Nordeste, todas só de leitura: o
 * tabelão abre em modo read-only e o conteúdo do portal é um arquivo local.
 * Servem aos dois motores: o servidor MCP (servidor.ts, para o claude da
 * linha de comando) e o motor da API (chat/motor-api.ts).
 */
import { buscarTerritorio } from "./territorio.ts";
import { consultarSql } from "./consultar.ts";
import { detalharIndicador } from "./catalogo.ts";
import { conteudoDoPortal } from "./portal.ts";
import type { Ferramenta } from "./tipos.ts";

export type { Contexto, Ferramenta } from "./tipos.ts";
export { GERADO_EM, TABELAO } from "./banco.ts";
export { catalogoIndice, catalogoResumido, paineisDasConsultas, SO_INDICE } from "./catalogo.ts";
export { dadosDoMapa } from "./consultar.ts";
export { encerrarFerramentas } from "./sql.ts";

export const FERRAMENTAS: Ferramenta[] = [buscarTerritorio, consultarSql, detalharIndicador, conteudoDoPortal];
