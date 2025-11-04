import React from "react";

interface Tag {
  label: string;
  color: string;
}

interface DataCardProps {
  title: string;
  tags: Tag[];
  description: string;
  publishedAt: string;
  version: string;
  sourceUrl: string;
  downloadUrl: string;
}

export default function DataCard({
  title,
  tags,
  description,
  publishedAt,
  version,
  sourceUrl,
  downloadUrl,
}: DataCardProps) {
  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-md shadow-sm p-6 mb-6 max-w-3xl mx-auto hover:scale-[1.01] transition-transform duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-row justify-between items-start mb-4">
        {/* Bloco do Título e Tags */}
        <div className="flex flex-col">
          <h2 className="font-bold text-xl">{title}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span
                key={tag.label}
                style={{
                  backgroundColor: tag.color,
                  color: "#fff",
                }}
                className="rounded-full px-3 py-1 text-xs font-medium"
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Bloco dos Botões */}
        <div className="flex gap-3 flex-shrink-0 ml-4">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-[#038f39] transition-all hover:bg-green-50 hover:text-green-900 hover:scale-105"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Ir para fonte
          </a>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border border-[#038f39] bg-[#038f39] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-green-900 hover:scale-105"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Baixar dados
          </a>
        </div>
      </div>

      {/* Descrição e informações adicionais */}
      <div className="mb-4 text-base text-gray-700">{description}</div>
      <div className="text-sm text-gray-500">
        <span>Publicado em: {publishedAt}</span> |{" "}
        <span>Versão: {version}</span>
      </div>
    </div>
  );
}
