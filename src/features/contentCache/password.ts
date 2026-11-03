import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Compara a senha sem vazar pelo tempo de resposta quantos caracteres batem. */
export function isContentCachePasswordValid(
  password: string,
  expected: string,
): boolean {
  return timingSafeEqual(digest(password), digest(expected));
}
