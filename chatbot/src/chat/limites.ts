/**
 * Limites de uso, contados no horário de Fortaleza: perguntas por pessoa por
 * dia, gasto do chat todo por dia e por mês. Valem além do limite de gasto da
 * conta no Console da Anthropic: se algo der errado, o pior caso é o chat
 * parar de responder até o dia ou o mês virar, não a conta crescer.
 *
 * O gasto é a estimativa do motor (tokens × preço da tabela em motor-api.ts);
 * a fatura de verdade está no Console. Por isso o teto do Console é a
 * garantia, e este é o freio que avisa a pessoa antes.
 *
 * As contagens começam do que já está gravado nas conversas, então reiniciar
 * o servidor não zera o dia nem o mês. Veio do chat do SEDES (só diário); o
 * teto mensal é do Data Nordeste (US$ 50, decisão da equipe em 24/11/2026).
 *
 * Variáveis de ambiente (0 = sem limite):
 *   DATANE_CHAT_PERGUNTAS_POR_DIA   perguntas por pessoa por dia (padrão 40)
 *   DATANE_CHAT_TETO_DIARIO_USD     gasto máximo por dia (padrão 5)
 *   DATANE_CHAT_TETO_MENSAL_USD     gasto máximo por mês (padrão 50)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const diaDe = (quando: Date | string | number = new Date()) =>
  new Date(quando).toLocaleDateString("sv-SE", { timeZone: "America/Fortaleza" });
const mesDe = (quando: Date | string | number = new Date()) => diaDe(quando).slice(0, 7);

type Contagem = { dia: string; mes: string; gastoDia: number; gastoMes: number; perguntas: Map<string, number> };

/** Relê das conversas gravadas o gasto do mês e do dia e as perguntas de hoje. */
function contarDoDisco(diretorio: string, agora: number): Contagem {
  const c: Contagem = { dia: diaDe(agora), mes: mesDe(agora), gastoDia: 0, gastoMes: 0, perguntas: new Map() };
  const inicio = agora - 32 * 24 * 3600_000;
  for (const f of readdirSync(diretorio).filter((f) => f.endsWith(".jsonl"))) {
    const arquivo = path.join(diretorio, f);
    if (statSync(arquivo).mtimeMs < inicio) continue;
    let pessoa: string | undefined;
    for (const linha of readFileSync(arquivo, "utf8").split("\n")) {
      try {
        const r = linha ? JSON.parse(linha) : null;
        if (r?.tipo === "inicio") pessoa = r.pessoa ?? undefined;
        if (r?.tipo !== "turno" || !r.em || mesDe(r.em) !== c.mes) continue;
        c.gastoMes += Number(r.custo_usd ?? 0);
        if (diaDe(r.em) !== c.dia) continue;
        c.gastoDia += Number(r.custo_usd ?? 0);
        if (pessoa) c.perguntas.set(pessoa, (c.perguntas.get(pessoa) ?? 0) + 1);
      } catch {
        // linha cortada no meio de uma gravação: ignora
      }
    }
  }

  return c;
}

export function criarLimites(diretorio: string, env: NodeJS.ProcessEnv = process.env, agora: () => number = Date.now) {
  const porPessoa = Number(env.DATANE_CHAT_PERGUNTAS_POR_DIA ?? 40);
  const tetoDia = Number(env.DATANE_CHAT_TETO_DIARIO_USD ?? 5);
  const tetoMes = Number(env.DATANE_CHAT_TETO_MENSAL_USD ?? 50);
  let c = contarDoDisco(diretorio, agora());

  function virar() {
    const dia = diaDe(agora());
    if (dia === c.dia) return;
    if (mesDe(agora()) !== c.mes) c = { ...c, mes: mesDe(agora()), gastoMes: 0 };
    c = { ...c, dia, gastoDia: 0, perguntas: new Map() };
  }

  return {
    /** Motivo para recusar a pergunta, ou null se pode perguntar. */
    recusa(pessoa: string | null): string | null {
      virar();
      if (tetoMes > 0 && c.gastoMes >= tetoMes) return "O chat atingiu o limite de uso deste mês. Ele volta no mês que vem.";
      if (tetoDia > 0 && c.gastoDia >= tetoDia) return "O chat atingiu o limite de uso de hoje. Ele volta amanhã.";
      if (pessoa && porPessoa > 0 && (c.perguntas.get(pessoa) ?? 0) >= porPessoa)
        return `Você chegou a ${porPessoa} perguntas hoje, o limite por pessoa durante o teste. Amanhã libera de novo.`;

      return null;
    },
    contarPergunta(pessoa: string | null) {
      virar();
      if (pessoa) c.perguntas.set(pessoa, (c.perguntas.get(pessoa) ?? 0) + 1);
    },
    contarGasto(usd: number | undefined) {
      virar();
      c.gastoDia += usd ?? 0;
      c.gastoMes += usd ?? 0;
    },
    situacao() {
      virar();

      return { dia: c.dia, gastoDia: c.gastoDia, gastoMes: c.gastoMes, tetoDia, tetoMes, porPessoa };
    },
  };
}
