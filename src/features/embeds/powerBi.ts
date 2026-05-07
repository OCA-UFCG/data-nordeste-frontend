export const buildPowerBiSource = (
  source: string,
  pageName?: string,
): string => {
  if (!pageName) return source;

  try {
    const url = new URL(source);
    url.searchParams.set("pageName", pageName);

    return url.toString();
  } catch {
    const separator = source.includes("?") ? "&" : "?";

    return `${source}${separator}pageName=${encodeURIComponent(pageName)}`;
  }
};
