"use client";

import { useMemo } from "react";
import { Icon } from "@/components/Icon/Icon";
import { macroThemes } from "@/utils/constants";
import { IMetadata, MacroTheme, Tag } from "@/utils/interfaces";
import { normalizeKey } from "@/utils/functions";
import DOMPurify from "dompurify";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ZENODO_BASE_URL } from "@/utils/constants";

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
  post: IMetadata;
  themes: MacroTheme[];
}) => {
  const files = post.files || [];

  const themeLookup = buildThemeLookup(themes);

  const normalizedTags = ((post.tags ?? []) as Tag[]).map((tag: Tag, index) => {
    const tagName = typeof tag === "string" ? tag : tag.name ?? "";
    const tagSlug = typeof tag === "string" ? tag : tag.slug ?? tagName;

    const normalized = normalizeKey(tagSlug || tagName);
    const themeMatch =
      themeLookup[normalized] ||
      themeLookup[normalized.replace(/-/g, "_")] ||
      themeLookup[normalized.replace(/_/g, "-")] ||
      themeLookup[normalizeKey(tagName)];

    const finalLabel = themeMatch?.name ?? tagName;
    const color = themeMatch?.color ?? "#018F39";

    return {
      key: `${normalized || `tag-${index}`}-${index}`,
      label: finalLabel,
      color,
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
      timeZone: "UTC",
    });
  })();
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

  const handleDownloadZippedFiles = async () => {
    const zipUrl = `${ZENODO_BASE_URL}/${post.id}/files-archive`;
    const fileName = post.title.replace(/\s+/g, "_").toLowerCase() + ".zip";
    await handleDownload(zipUrl, fileName);
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
                {normalizedTags
                  .filter(({ label }) => !!label)
                  .map(({ key, label, color }) => (
                    <span
                      key={key}
                      style={{ backgroundColor: color, color: "#ffffff" }}
                      className="flex items-center justify-center min-h-[20px] min-w-[51px] rounded-full border border-[#E2E8F0] px-[10px] py-[4px] text-xs leading-4 text-center font-semibold"
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
          </div>
        </div>

        <div className="flex flex-row justify-center gap-[16px] sm:justify-normal items-center">
          {files.length > 0 && (
            <div className="flex sm:hidden flex-row flex-wrap items-center justify-between gap-3 lg:flex-nowrap lg:justify-end  w-[150px] h-[40px]">
              {
                <Button
                  asChild
                  variant="secondary"
                  className="bg-transparent border border-1 border-[#DCDBDC] md:w-[225px] w-full"
                >
                  <Link
                    href={post.html}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon
                      id="icon-external"
                      size={16}
                      className="text-[#038f39]"
                    />
                    Ir para fonte
                  </Link>
                </Button>
              }
            </div>
          )}
          {files.length > 0 && (
            <div className="flex flex-row flex-wrap items-center justify-between gap-3 lg:flex-nowrap lg:justify-end w-[150px] sm:w-[225px] h-[40px]">
              {
                <Button
                  variant="primary"
                  onClick={handleDownloadZippedFiles}
                  className="w-full text-[14px] font-medium text-[#F8F7F8]"
                >
                  <Icon id="icon-download" size={16} />
                  <span className="hidden sm:block">
                    Baixar Todos os Arquivos
                  </span>

                  <span className="block sm:hidden">Baixar Dados</span>
                </Button>
              }
            </div>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="hidden sm:block text-[12px] font-semibold text-gray-700">
            Arquivos recentes
          </h3>
          <div className="flex gap-2 items-center h-auto justify-between">
            <div className="hidden sm:flex flex-wrap self-end">
              {files.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => handleDownload(file.downloadUrl, file.name)}
                  className="flex items-center gap-2 rounded-full bg-transparent px-3 py-1 md:text-[14px] font-medium text-[#018F39] transition-colors hover:bg-gray-100 cursor-pointer text-[12px]"
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
            <div className="hidden sm:block self-end">
              <Button
                asChild
                variant="secondary"
                className="bg-transparent border border-1 border-[#DCDBDC] md:w-[225px] w-[100px]"
              >
                <Link
                  href={post.html}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon
                    id="icon-external"
                    size={16}
                    className="text-[#038f39]"
                  />
                  <span className="hidden sm:block">Ver todos</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
