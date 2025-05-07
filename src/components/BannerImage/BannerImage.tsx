import { IMainBanner } from "@/utils/interfaces";
import { Icon } from "../Icon/Icon";
import Image from "next/image";
import { LinkButton } from "../LinkButton/LinkButton";

const MainBanner = ({ content }: { content: { fields: IMainBanner } }) => {
  console.log(content);
  const { title, subtitle, image } = content.fields;

  return (
    <div className="overflow-hidden relative flex justify-center items-center w-full mt-4 min-h-[450px]">
      <Image
        className="absolute w-full min-h-[450px] h-full object-cover rounded-t-md md:rounded-l-md md:rounded-tr-none z-0"
        src={`https:${image.fields.file.url}`}
        alt=""
        width={1400}
        height={1400}
      />
      <div className="absolute top-0 right-0 h-full w-[100%] bg-gradient-to-l from-black via-transparent to-transparent"></div>
      <div className="absolute top-0 left-0 h-full w-[140%] bg-gradient-to-r from-black via-transparent to-transparent"></div>
      <div className="flex w-full p-6 xl:p-0 h-full items-end justify-between max-w-[1440px] z-10">
        <div className="flex flex-col gap-4">
          <h1 className="text-white text-6xl font-semibold lg:max-w-[50%]">
            {title}
          </h1>
          <p className="text-white text-lg font-medium">{subtitle}</p>
          <LinkButton href="/posts" className="md:max-w-fit">
            Explore os dados
          </LinkButton>
        </div>
        <Icon
          id="logo-DNE"
          width={200}
          height={100}
          className="hidden lg:block self-end filter grayscale-300 mix-blend-screen brightness-[10000%] contrast-[400%]"
        />
      </div>
    </div>
  );
};

export default MainBanner;
