/**
 * Senha da equipe: o modo do chat para o gamma, antes de haver login.
 *
 * Com DATANE_CHAT_SENHA, a página pede a senha antes de abrir. Quem acerta
 * recebe um cookie assinado que vale 30 dias, com um identificador aleatório
 * daquele navegador: é ele que separa as conversas de cada pessoa e conta o
 * limite de perguntas por dia (limites.ts). Não há nome nem e-mail.
 *
 * A assinatura do cookie sai da própria senha: trocar a senha desloga todo
 * mundo.
 *
 * IMPORTANT: as tentativas erradas são contadas juntas, não por endereço. No
 * gamma, o proxy da frente não repassa o IP de quem acessa: todo mundo chega
 * como o mesmo endereço (verificado em 25/11/2026). Uma trava por IP seria uma
 * trava de todos, e uma trava pelo X-Forwarded-For seria contornada inventando
 * o cabeçalho. O que impede adivinhar é o tamanho da senha (19 caracteres
 * aleatórios); o teto só corta abuso, e quem já tem o cookie não é afetado.
 *
 * Uso:
 *   const portao = criarPortao(process.env.DATANE_CHAT_SENHA);
 *   const r = portao?.entrar(senhaDigitada, true); // { ok, cookie } | { ok: false, erro }
 *   const pessoa = portao?.pessoa(req.headers.cookie);  // id do navegador ou null
 */
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const COOKIE_EQUIPE = "datane_chat";
const VALIDADE_MS = 30 * 24 * 3600_000;
const ERROS_POR_JANELA = 30;
const JANELA_MS = 60_000;

export type Entrada = { ok: true; cookie: string } | { ok: false; erro: string };

const resumo = (texto: string) => createHash("sha256").update(texto).digest();

/** Compara dois textos sem vazar pelo tempo de resposta quanto deles bate. */
function iguais(a: string, b: string): boolean {
  return timingSafeEqual(resumo(a), resumo(b));
}

export function cookieDe(cabecalho: string | undefined, nome: string): string | null {
  for (const parte of (cabecalho ?? "").split(";")) {
    const [chave, ...resto] = parte.trim().split("=");
    if (chave === nome) return decodeURIComponent(resto.join("="));
  }

  return null;
}

export function criarPortao(senha: string | undefined, agora: () => number = Date.now) {
  if (!senha) return null;
  const chave = resumo(`datane-chat:${senha}`);
  const assinar = (valor: string) => createHmac("sha256", chave).update(valor).digest("base64url");
  let erradas: number[] = [];

  function errosRecentes(): number[] {
    erradas = erradas.filter((t) => agora() - t < JANELA_MS);

    return erradas;
  }

  return {
    /** Confere a senha; com ela certa, devolve o cabeçalho Set-Cookie. */
    entrar(tentativa: string, https: boolean): Entrada {
      if (errosRecentes().length >= ERROS_POR_JANELA)
        return { ok: false, erro: "Muitas tentativas erradas. Espere um minuto e tente de novo." };
      if (!iguais(tentativa, senha)) {
        erradas.push(agora());

        return { ok: false, erro: "Senha errada." };
      }
      const valor = `${randomUUID().slice(0, 8)}.${agora() + VALIDADE_MS}`;
      const atributos = ["HttpOnly", "SameSite=Lax", "Path=/", `Max-Age=${VALIDADE_MS / 1000}`, ...(https ? ["Secure"] : [])];

      return { ok: true, cookie: `${COOKIE_EQUIPE}=${valor}.${assinar(valor)}; ${atributos.join("; ")}` };
    },

    /** O id do navegador, se o cookie é válido e não venceu; senão null. */
    pessoa(cabecalhoCookie: string | undefined): string | null {
      const partes = cookieDe(cabecalhoCookie, COOKIE_EQUIPE)?.split(".");
      if (partes?.length !== 3) return null;
      const [id, expira, assinatura] = partes;
      if (!iguais(assinatura, assinar(`${id}.${expira}`))) return null;

      return Number(expira) > agora() ? id : null;
    },
  };
}

export type Portao = NonNullable<ReturnType<typeof criarPortao>>;
