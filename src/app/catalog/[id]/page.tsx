import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HubTemplate from "@/templates/HubTemplate";
import { buildMetadata, stripHtml, truncateDescription } from "@/config/seo";
import {
  buildZenodoArchiveFileName,
  buildZenodoFilesArchiveUrl,
  getZenodoRecord,
} from "@/lib/zenodo";
import { formatCatalogPublicationDate } from "@/features/catalog/records";

type DatasetPageProps = {
  params: Promise<{ id: string }>;
};

const getDataset = async (id: string) => {
  try {
    return await getZenodoRecord(id);
  } catch {
    return null;
  }
};

export async function generateMetadata({
  params,
}: DatasetPageProps): Promise<Metadata> {
  const { id } = await params;
  const record = await getDataset(id);

  if (!record) {
    return buildMetadata({
      title: "Dataset",
      path: `/catalog/${id}`,
    });
  }

  return buildMetadata({
    title: record.title,
    description: truncateDescription(record.description),
    path: `/catalog/${record.id}`,
  });
}

export default async function DatasetPage({ params }: DatasetPageProps) {
  const { id } = await params;
  const record = await getDataset(id);

  if (!record) notFound();

  const tags = record.tags ?? [];
  const formattedDate = formatCatalogPublicationDate(record.publication_date);
  const plainDescription = stripHtml(record.description);
  const archiveUrl = buildZenodoFilesArchiveUrl(record.id);
  const archiveName = buildZenodoArchiveFileName(record.title);

  return (
    <HubTemplate>
      <main className="w-full max-w-[1120px] mx-auto px-6 py-12 lg:px-20">
        <nav className="mb-8 text-sm text-grey-600">
          <Link href="/catalog" className="font-semibold text-[#018F39]">
            Catalogo
          </Link>
          <span className="mx-2">/</span>
          <span>{record.id}</span>
        </nav>

        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase text-[#018F39]">
              Dataset
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-[#292829] lg:text-5xl">
              {record.title}
            </h1>
            {!!plainDescription && (
              <p className="max-w-4xl text-lg leading-8 text-[#292829]">
                {plainDescription}
              </p>
            )}
          </div>

          <dl className="grid gap-4 rounded-lg bg-grey-100 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase text-grey-600">
                Publicacao
              </dt>
              <dd className="mt-1 text-sm text-[#292829]">{formattedDate}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-grey-600">
                Fonte
              </dt>
              <dd className="mt-1 text-sm text-[#292829]">Zenodo</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-grey-600">
                Licenca
              </dt>
              <dd className="mt-1 text-sm text-[#292829]">{record.license}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-grey-600">
                Versao
              </dt>
              <dd className="mt-1 text-sm text-[#292829]">{record.version}</dd>
            </div>
          </dl>

          {!!tags.length && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => {
                const label = typeof tag === "string" ? tag : tag.name;
                const key =
                  typeof tag === "string" ? tag : tag.slug || tag.name;

                return (
                  <span
                    key={`${key}-${index}`}
                    className="rounded-full bg-[#018F39] px-3 py-1 text-xs font-semibold text-white"
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href={record.html}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-[#DCDBDC] px-4 py-2 text-sm font-semibold text-[#018F39]"
            >
              Ver registro no Zenodo
            </Link>
            {!!record.files.length && (
              <Link
                href={archiveUrl}
                download={archiveName}
                className="rounded-md bg-[#018F39] px-4 py-2 text-sm font-semibold text-white"
              >
                Baixar todos os arquivos
              </Link>
            )}
          </div>

          {!!record.files.length && (
            <section className="flex flex-col gap-3">
              <h2 className="text-2xl font-semibold">Arquivos</h2>
              <ul className="divide-y divide-grey-200 rounded-lg border border-grey-200">
                {record.files.map((file) => (
                  <li
                    key={file.name}
                    className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="break-all text-sm font-medium">
                      {file.name}
                    </span>
                    <Link
                      href={file.downloadUrl}
                      className="text-sm font-semibold text-[#018F39]"
                    >
                      Baixar arquivo
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      </main>
    </HubTemplate>
  );
}
