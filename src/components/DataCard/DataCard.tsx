"use client";

import { useMemo } from "react";
import { Icon } from "@/components/Icon/Icon";
import { macroThemes } from "@/utils/constants";
import { IMetadata, MacroTheme } from "@/utils/interfaces";

const normalizeKey = (value?: string) =>
  value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
    .toLowerCase() ?? "";

export const DataCard = ({
  post,
  themes,
}: {
  post: IMetadata & { tagSlugs?: string[] };
  themes: MacroTheme[];
}) => {
  const primaryFile = post.files?.[0];
  const additionalFiles = post.files?.slice(1) ?? [];

  const themeLookup = useMemo(() => {
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
  }, [themes]);

  const normalizedTags = (post.tags || []).map((label, index) => {
    const rawKey = post.tagSlugs?.[index] ?? label;
    const normalized = normalizeKey(rawKey);
    const themeMatch =
      themeLookup[normalized] ||
      themeLookup[normalized.replace(/-/g, "_")] ||
      themeLookup[normalized.replace(/_/g, "-")] ||
      themeLookup[normalizeKey(label)];

    const finalLabel = themeMatch?.name ?? label;
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

  return (
    <div className="flex min-h-[176px] w-full flex-col gap-6 rounded-lg border border-[#EFEFEF] bg-[#F8F7F8] px-4 py-4 transition-transform duration-300 hover:scale-[1.01]">
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
                      backgroundColor: color ?? "#018F39",
                      color: "#fff",
                    }}
                    className="min-h-[20px] min-w-[51px] rounded-full border border-[#E2E8F0] px-[10px] py-[2px] text-xs font-medium leading-4"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {post.description && (
            <p className="text-base font-normal leading-[150%] text-[#292829]">
              {post.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs font-normal leading-5 text-[#7E797B]">
            <span>
              Publicado em: {formattedDate} | Versão: {post.version || "N/A"}
            </span>
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
                <Icon id="icon-external" size={16} className="text-[#038F39]" />
                Ir para fonte
              </a>
            )}

            {primaryFile && (
              <button
                type="button"
                onClick={() =>
                  handleDownload(primaryFile.downloadUrl, primaryFile.name)
                }
                className="flex min-w-[145px] items-center justify-center gap-2 rounded-md border border-[#018F39] bg-[#018F39] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-900 hover:scale-105"
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
