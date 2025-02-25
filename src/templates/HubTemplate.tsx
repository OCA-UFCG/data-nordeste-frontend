import Footer from "@/components/Footer/Footer";
import { getContent } from "@/utils/functions";

const HubTemplate = async () => {
  const { header } = await getContent(["header"]);

  return (
    <>
      <Footer content={header} />
    </>
  );
};

export default HubTemplate;
