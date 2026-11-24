"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon/Icon";
import { IMetadata, MacroTheme } from "@/utils/interfaces";
import DOMPurify from "dompurify";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  buildCatalogTagViews,
  formatCatalogPublicationDate,
} from "@/features/catalog/records";
import { downloadFile } from "@/lib/download";
import { getReadableTextColor } from "@/features/colors/contrast";

export const DataCard = ({
  post,
  themes,
}: {
  post: IMetadata;
  themes: MacroTheme[];
}) => {
  const files = post.files || [];
  const normalizedTags = buildCatalogTagViews(post.tags, themes);
  const formattedDate = formatCatalogPublicationDate(post.publication_date);

  const handleDownload = async (url: string, name: string) => {
    try {
      await downloadFile(url, name);
    } catch (err) {
      console.error("Erro ao baixar arquivo:", err);
    }
  };

  const [sanitizedDescription, setSanitizedDescription] = useState("");

  useEffect(() => {
    if (!post.description) {
      setSanitizedDescription("");

      return;
    }

    const purifier =
      typeof DOMPurify.sanitize === "function" ? DOMPurify : DOMPurify(window);

    setSanitizedDescription(
      purifier.sanitize(post.description, {
        USE_PROFILES: { html: true },
      }),
    );
  }, [post.description]);

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg bg-grey-100 p-4 transition-bg duration-300 hover:bg-grey-200">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold leading-4 text-[#292829]">
              <Link href={`/catalog/${post.id}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>

            {normalizedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {normalizedTags
                  .filter(({ label }) => !!label)
                  .map(({ key, label, color }) => (
                    <span
                      key={key}
                      style={{
                        backgroundColor: color,
                        color: getReadableTextColor(color),
                      }}
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

        <div className="hidden sm:flex flex-row justify-center gap-[18px] sm:justify-normal items-center">
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
              <Button
                asChild
                variant="primary"
                className="w-full text-[14px] font-medium text-[#F8F7F8]"
              >
                <Link href={`/catalog/${post.id}`}>
                  <Icon id="icon-download" size={16} />
                  Baixar arquivos
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[12px] font-semibold text-gray-700">
            Arquivos recentes
          </h3>

          <div className="flex flex-col gap-3 sm:hidden">
            <div className="grid grid-cols-2 gap-2">
              {files.slice(0, 2).map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => handleDownload(file.downloadUrl, file.name)}
                  className="flex min-w-0 items-center justify-center gap-2 rounded-md border border-[#DCDBDC] bg-transparent px-3 text-[12px] font-medium text-green-800 transition-colors hover:bg-gray-100"
                >
                  <Icon
                    id="icon-download"
                    size={14}
                    className="shrink-0 text-emerald-700"
                  />
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
            </div>

            <Button
              asChild
              variant="primary"
              className="w-full text-[14px] font-medium text-[#F8F7F8]"
            >
              <Link href={`/catalog/${post.id}`}>
                <Icon id="icon-download" size={16} />
                Baixar arquivos
              </Link>
            </Button>
          </div>

          <div className="flex gap-2 items-center h-auto justify-between">
            <div className="hidden sm:flex flex-wrap self-end">
              {files.slice(0, 3).map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => handleDownload(file.downloadUrl, file.name)}
                  className="flex items-center gap-2 rounded-full bg-transparent px-3 py-1 md:text-[14px] font-medium text-green-800 transition-colors hover:bg-gray-100 cursor-pointer text-[12px]"
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
        </div>
      )}
    </div>
  );
};
