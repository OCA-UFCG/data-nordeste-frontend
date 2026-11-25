/** Minúsculas, sem acento e sem pontuação: "Olho-d'Água" vira "olho d agua". */
export function semAcento(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
