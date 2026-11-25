// Tipos de markdown.js (JavaScript puro, servido direto ao navegador), para os testes.
import type { Marked, marked } from "marked";

export function configurarMarkdown(m: Marked | typeof marked): void;
export function escaparHtml(s: unknown): string;
