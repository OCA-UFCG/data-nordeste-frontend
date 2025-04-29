import { IPublication } from "@/utils/interfaces";
import { POST_TYPES } from "@/utils/constants";
import { Box, Card, Text, Strong, Flex } from "@radix-ui/themes";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";

const ContentPost = ({ content }: { content: { fields: IPublication } }) => {
  const { title, thumb, link, date, type, description } = content.fields;
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  return (
    <Link href={link} className="block">
      <Card className="rounded-t-md overflow-hidden m-0">
        <Box className="relative group">
          <img
            alt=""
            src={`https:${thumb.fields.file.url}`}
            className="h-[225px] w-full block object-cover transition-opacity duration-300 group-hover:opacity-75"
          />
          <Box className="absolute inset-0 flex items-center justify-center bg-black opacity-0 group-hover:opacity-80 transition-opacity duration-300">
            <Text className="text-white text-sm p-4 text-center drop-shadow-sm">
              {description || "Acessar conteúdo"}
            </Text>
          </Box>
          <Box className="absolute top-2 left-2 bg-white rounded-lg px-2 bg-gray-50">
            <Strong>
              {
                POST_TYPES[
                  type as "additional-content" | "data-panel" | "newsletter"
                ]
              }
            </Strong>
          </Box>
        </Box>

        <Box className="flex items-center justify-between bg-gray-50 px-4 py-3 h-[95px]">
          <Flex direction="column" gap="0.5">
            <Text className="block break-words whitespace-normal leading-tight overflow-hidden font-bold">
              {title}
            </Text>
            <Text className="text-[#7E797B] text-xs">{formattedDate}</Text>
          </Flex>
          <ChevronRightIcon />
        </Box>
      </Card>
    </Link>
  );
};

export default ContentPost;
