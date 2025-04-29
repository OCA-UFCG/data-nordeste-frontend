import { IPublication } from "@/utils/interfaces";
import { POST_TYPES } from "@/utils/constants";
import { Box, Card, Text, Strong, Flex } from "@radix-ui/themes";
import { ChevronRightIcon } from "@radix-ui/react-icons";

const ContentPost = ({ content }: { content: { fields: IPublication } }) => {
  const { title, thumb, date, type } = content.fields;
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  return (
    <Card className="rounded-t-md overflow-hidden m-0">
      <Box className="relative">
        <img
          alt=""
          src={`https:${thumb.fields.file.url}`}
          className="h-[225px] w-full block object-cover"
        />
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
  );
};

export default ContentPost;
