import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

// Atrasa a resposta de senha errada para dificultar tentativas em sequência.
const WRONG_PASSWORD_DELAY_MS = 1000;

/** Espera antes de responder "senha incorreta". Ex.: `await waitAfterWrongPassword()`. */
export const waitAfterWrongPassword = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, WRONG_PASSWORD_DELAY_MS));

/** Compara a senha sem vazar pelo tempo de resposta quantos caracteres batem. */
export function isContentCachePasswordValid(
  password: string,
  expected: string,
): boolean {
  return timingSafeEqual(digest(password), digest(expected));
}
