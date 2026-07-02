import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { BOLETIM_DETAIL_QUERY, RELATED_BOLETINS_QUERY } from "@/utils/queries";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";
import type { BoletimDetail, RelatedBoletim } from "@/features/boletim/types";
import { extractPdfFileName } from "@/features/boletim/types";
import { BoletimContent } from "./BoletimContent";
import { richTextToPlainText } from "@/utils/richText";

type BoletimDetailResponse = {
  postCollection: { items: BoletimDetail[] };
};

type RelatedBoletinsResponse = {
  postCollection: { items: RelatedBoletim[] };
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { postCollection } = await getContent<BoletimDetailResponse>(
    BOLETIM_DETAIL_QUERY,
    { id },
  );
  const boletim = postCollection?.items?.[0];

  if (!boletim) {
    return buildMetadata({ title: "Boletim", path: `/boletim/${id}` });
  }

  return buildMetadata({
    title: boletim.title,
    description: richTextToPlainText(boletim.description),
    path: `/boletim/${id}`,
    images: boletim.thumb?.url ? [boletim.thumb.url] : ["/banner.png"],
  });
}

export default async function BoletimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { postCollection } = await getContent<BoletimDetailResponse>(
    BOLETIM_DETAIL_QUERY,
    { id },
  );
  const boletim = postCollection?.items?.[0];

  if (!boletim) notFound();

  const pdfFileName = extractPdfFileName(boletim.link);
  const firstCategory = boletim.categoryCollection?.items?.[0];
  const relatedBoletins = await fetchRelatedBoletins(
    firstCategory?.sys?.id,
    boletim.sys.id,
  );

  return (
    <HubTemplate>
      <BoletimContent
        boletim={boletim}
        pdfFileName={pdfFileName}
        relatedBoletins={relatedBoletins}
      />
    </HubTemplate>
  );
}

const fetchRelatedBoletins = async (
  categoryId: string | undefined,
  excludeId: string,
): Promise<RelatedBoletim[]> => {
  if (!categoryId) return [];

  try {
    const { postCollection } = await getContent<RelatedBoletinsResponse>(
      RELATED_BOLETINS_QUERY,
      { categoryId, excludeId },
    );

    return postCollection.items;
  } catch {
    return [];
  }
};
