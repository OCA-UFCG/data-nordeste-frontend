"use client";

import { IMetadata } from "@/utils/interfaces";

export const DataCard = ({ post }: { post: IMetadata }) => {
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
      console.error("Error", err);
    }
  };

  return (
    <div className="flex flex-col justify-between border rounded-lg p-4 ">
      <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-3">{post.description}</p>
      <p className="text-xs text-gray-500 mt-2">Versão: {post.version}</p>

      {post.license && (
        <p className="text-xs text-gray-500 mt-2">
          Licença: {post.license.title ?? post.license}
        </p>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
          {post.tags.map((tag: any, i: number) => (
            <span key={i} className="px-2 py-1 bg-gray-200 rounded">
              {tag.title ?? tag}
            </span>
          ))}
        </div>
      )}

      {post.files && post.files.length > 0 && (
        <div className="flex flex-col mt-2 text-xs">
          {post.files.map((file, i) => (
            <button
              key={i}
              onClick={() => handleDownload(file.downloadUrl, file.name)}
              className="text-blue-600 underline"
            >
              {file.name}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Publication: {post.publication_date}
      </p>
    </div>
  );
};
