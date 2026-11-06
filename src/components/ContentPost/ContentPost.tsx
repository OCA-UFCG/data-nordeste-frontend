import { IPublication } from "@/utils/interfaces";
import { POST_TYPE_LABELS } from "@/features/posts/postTypes";
import { resolvePostHref } from "@/features/posts/postHref";
import Link from "next/link";
import { ContentfulImage } from "@/components/ContentfulImage/ContentfulImage";
import { Icon } from "@/components/Icon/Icon";

const CARD_CLASS_NAME =
  "group flex flex-col overflow-hidden rounded-lg w-full bg-white border border-[#EFEFEF] shadow-md h-full";
const LINKED_CARD_CLASS_NAME = `${CARD_CLASS_NAME} hover:bg-grey-100 hover:border-grey-300 cursor-pointer transition duration-300`;

const ContentPost = ({ content }: { content: IPublication }) => {
  const destination = resolvePostHref(content);

  // INTENTIONAL: a post without link still shows, unclickable, instead of
  // vanishing: it only happens to drafts in preview builds, where the editor
  // must see that the entry is incomplete. Hiding it would leave a grid gap.
  if (!destination) {
    return (
      <div className={CARD_CLASS_NAME}>
        <PostCardBody content={content} actionLabel="Link indisponível" />
      </div>
    );
  }

  return (
    <Link
      href={destination.href}
      target={destination.openInNewTab ? "_blank" : undefined}
      rel={destination.openInNewTab ? "noopener noreferrer" : undefined}
      className={LINKED_CARD_CLASS_NAME}
    >
      <PostCardBody content={content} actionLabel="Acessar" />
    </Link>
  );
};

const PostCardBody = ({
  content,
  actionLabel,
}: {
  content: IPublication;
  actionLabel: string;
}) => {
  const { title, thumb, date, type } = content;
  const formattedDate = date ? new Date(date).toLocaleDateString("pt-BR") : "";

  return (
    <>
      <div className="w-full overflow-hidden">
        <ContentfulImage
          width={300}
          height={300}
          alt=""
          src={thumb?.url || ""}
          className="w-full aspect-7/4 block object-cover object-top transition-transform group-hover:scale-102 duration-300"
        />
      </div>

      <div className="flex flex-col grow-1 justify-between">
        <div className="flex flex-row justify-between items-center bg-[#DCDBDC] px-4 py-1">
          <p className="font-semibold text-xs text-[#0F172A] leading-4">
            {POST_TYPE_LABELS[type]}
          </p>
          <p className="text-[#595557] text-[10px] leading-3">
            {formattedDate}
          </p>
        </div>

        <div className="py-3 px-4 flex gap-4 justify-between h-full items-center box-border bg-[#F8F7F8]">
          <span className="sr-only">{title}</span>
          <p className="line-clamp-2 text-sm font-medium leading-5 tracking-[-0.03em] text-[#292829]">
            {actionLabel}
          </p>
          <Icon className="md:flex size-2 min-w-2" id="expand-black" size={9} />
        </div>
      </div>
    </>
  );
};

export default ContentPost;
