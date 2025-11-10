"use client";

import { useMemo } from "react";
import { Icon } from "@/components/Icon/Icon";
import { macroThemes } from "@/utils/constants";
import { IMetadata, MacroTheme } from "@/utils/interfaces";
import { normalizeKey } from "@/utils/functions";
import DOMPurify from "dompurify";

const buildThemeLookup = (themes: MacroTheme[]) => {
  const map: Record<string, MacroTheme> = {};

  themes.forEach((theme) => {
    if (!theme) return;
    const candidates = new Set<string>();

    const idKey = normalizeKey(theme.id);
    const sysIdKey = normalizeKey(theme.sys?.id);
    const nameKey = normalizeKey(theme.name);

    [idKey, sysIdKey, nameKey].forEach((key) => key && candidates.add(key));
    if (nameKey) {
      candidates.add(nameKey.replace(/_/g, "-"));
      candidates.add(nameKey.replace(/-/g, "_"));
    }

    Object.keys(macroThemes).forEach((macroKey) => {
      const macroNormalized = normalizeKey(macroKey);
      if ([idKey, sysIdKey, nameKey].includes(macroNormalized)) {
        candidates.add(macroNormalized);
      }
    });

    candidates.forEach((key) => {
      if (!map[key]) {
        map[key] = theme;
      }
    });
  });

  return map;
};

export const DataCard = ({
  post,
  themes,
}: {
  post: IMetadata & { tags?: { name: string; slug?: string }[] };
  themes: MacroTheme[];
}) => {
  const primaryFile = post.files?.[0];
  const additionalFiles = post.files?.slice(1) ?? [];

  const themeLookup = buildThemeLookup(themes);

  const normalizedTags = (post.tags || []).map(({ name, slug }, index) => {
    const normalized = normalizeKey(slug ?? name);
    const themeMatch =
      themeLookup[normalized] ||
      themeLookup[normalized.replace(/-/g, "_")] ||
      themeLookup[normalized.replace(/_/g, "-")] ||
      themeLookup[normalizeKey(name)];

    const finalLabel = themeMatch?.name ?? name;
    const color = themeMatch?.color ?? "#018F39";

    return {
      key: `${normalized}-${index}`,
      label: finalLabel,
      color,
      iconId: themeMatch ? macroThemes[themeMatch.id] : undefined,
    };
  });

  const formattedDate = (() => {
    if (!post.publication_date) return "-";
    const parsed = new Date(post.publication_date);
    if (Number.isNaN(parsed.getTime())) return post.publication_date;

    return parsed.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  })();

  const sourceUrlFromId =
    post.id && /^\d+$/.test(post.id)
      ? `https://zenodo.org/records/${post.id}`
      : "test"; // <-- change this later for proper redirect button workflow

  const sourceUrl =
    (post as any)?.recordUrl ??
    (post as any)?.url ??
    (post as any)?.source ??
    sourceUrlFromId;

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = name;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Erro ao baixar arquivo:", err);
    }
  };

  const sanitizedDescription = useMemo(() => {
    if (!post.description) return "";
    return DOMPurify.sanitize(post.description, {
      USE_PROFILES: { html: true },
    });
  }, [post.description]);

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg bg-grey-100 p-4 transition-bg duration-300 hover:bg-grey-200">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold leading-4 text-[#292829]">
              {post.title}
            </h2>

            {normalizedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {normalizedTags.map(({ key, label, color }) => (
                  <span
                    key={key}
                    style={{
                      backgroundColor: color ?? "var(--color-green-800)",
                    }}
                    className="
                        rounded-full px-3 py-1 text-xs text-white"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {sanitizedDescription && (
            <div
              className="text-base font-normal leading-[150%] text-[#292829]"
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-grey-600">
            <span>Publicado em: {formattedDate}</span>
            <span className="text-[#7E797B]">|</span>
            <span>Versão: {post.version || "N/A"}</span>
          </div>
        </div>

        {(sourceUrl || primaryFile) && (
          <div className="flex w-full flex-row flex-wrap items-center justify-between gap-3 lg:w-auto lg:flex-nowrap lg:justify-end">
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-[138px] items-center justify-center gap-2 rounded-md border border-[#DCDBDC] bg-white px-4 py-2 text-sm font-semibold text-[#038F39] transition-all hover:bg-emerald-50 hover:text-emerald-900 hover:scale-105"
              >
                <Icon id="icon-external" size={16} className="text-green-800" />
                Ir para fonte
              </a>
            )}

            {primaryFile && (
              <button
                type="button"
                onClick={() =>
                  handleDownload(primaryFile.downloadUrl, primaryFile.name)
                }
                className="flex items-center justify-center gap-2 rounded-md border border-green-800 bg-green-800 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-900 cursor-pointer"
              >
                <Icon id="icon-download" size={16} className="text-white" />
                Baixar dados
              </button>
            )}
          </div>
        )}
      </div>

      {additionalFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Arquivos adicionais
          </h3>
          <div className="flex flex-wrap gap-2">
            {additionalFiles.map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => handleDownload(file.downloadUrl, file.name)}
                className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Icon
                  id="icon-download"
                  size={14}
                  className="text-emerald-700"
                />
                {file.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
