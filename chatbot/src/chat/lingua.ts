/**
 * A língua da pergunta, para lembrar o modelo de responder nela. Só o pedido
 * no prompt não bastava: o prompt, as ferramentas e os dados são todos em
 * português, e o Haiku respondia em português a 3 de 4 perguntas em inglês ou
 * espanhol. O lembrete vai junto da pergunta enviada ao modelo; a pessoa não o
 * vê e ele não fica gravado na conversa.
 */

// Palavras comuns que só aparecem numa das três línguas.
const PALAVRAS: Record<"en" | "es" | "pt", Set<string>> = {
  en: new Set(
    "the is are was what which how who why where when will would does do did of and with for there in on it this that right now population income literacy municipalities municipality very high low most state states than".split(
      " ",
    ),
  ),
  es: new Set(
    "el los las del y en es son cuál cuáles qué cómo dónde cuándo más lo hay población municipios municipio mayor menor estado estados muy pobreza".split(
      " ",
    ),
  ),
  pt: new Set(
    "o os da do das dos em no na nos nas é são qual quais que como onde quando mais população município municípios maior menor não está estão tem muito pobreza taxa e".split(
      " ",
    ),
  ),
};

export function linguaDa(texto: string): "en" | "es" | "pt" {
  const palavras = texto.toLowerCase().match(/[\p{L}]+/gu) ?? [];
  const conta = (l: keyof typeof PALAVRAS) =>
    palavras.filter((p) => PALAVRAS[l].has(p)).length;
  const pt = conta("pt");
  const en = conta("en");
  const es = conta("es") + (/[¿¡ñ]/.test(texto) ? 2 : 0);
  if (en >= 2 && en > pt && en > es) return "en";
  if (es >= 2 && es > pt && es > en) return "es";
  return "pt";
}

/**
 * A resposta saiu em português quando a pergunta era em outra língua? Mesmo
 * com o lembrete, o Haiku respondeu "La população de Recife é de..." a
 * "¿Cuál es la población de Recife?" (rodada c4-v0, ES01), e a revisão das
 * frases disse OK. Exige palavras típicas do português, para não acusar uma
 * resposta curta só de números.
 */
export function respostaNaLinguaErrada(pergunta: string, resposta: string): "en" | "es" | null {
  const esperada = linguaDa(pergunta);
  if (esperada === "pt") return null;
  const palavras = resposta.toLowerCase().match(/[\p{L}]+/gu) ?? [];
  const pt = palavras.filter((p) => PALAVRAS.pt.has(p)).length;
  const outra = palavras.filter((p) => PALAVRAS[esperada].has(p)).length;

  return pt >= 3 && pt > outra ? esperada : null;
}

export const NOME_DA_LINGUA = { en: "inglês", es: "espanhol" } as const;

// Explícito sobre os dados em português: com "(Responde en español.)" só, uma
// pergunta de previsão (muita saída de ferramenta) ainda saiu em português.
const LEMBRETE = {
  en: "(Write the whole answer in English, even though the tools and data are in Portuguese.)",
  es: "(Escribe toda la respuesta en español, no en portugués, aunque las herramientas y los datos estén en portugués.)",
};

/** A pergunta como vai para o modelo: com o lembrete, se não for português. */
export function paraOModelo(pergunta: string) {
  const l = linguaDa(pergunta);
  return l === "pt" ? pergunta : `${pergunta}\n\n${LEMBRETE[l]}`;
}
