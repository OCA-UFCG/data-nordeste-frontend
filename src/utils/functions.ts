export const capitalize = (inputString: string): string => {
  return inputString
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const sortContentByDesiredOrder = <T extends { id: string }>(
  content: T[],
  desiredOrder: string[],
): T[] => {
  return [...content].sort((a, b) => {
    const aIndex = desiredOrder.indexOf(a.id);
    const bIndex = desiredOrder.indexOf(b.id);

    return (
      (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex)
    );
  });
};

export const createQueryString = (newParams: { [key: string]: string }) => {
  const searchParams = new URLSearchParams();

  Object.entries(newParams).forEach(([name, value]) => {
    searchParams.set(name, value);
  });

  return searchParams.toString();
};

export const isHrefActive = (
  pathname: string,
  category: string | null,
  href?: string | null,
): boolean => {
  if (!href) return false;

  const [hrefPath, hrefQuery] = href.split("?");
  const hrefParams = new URLSearchParams(hrefQuery).get("category");

  return pathname === hrefPath && hrefParams === category;
};
