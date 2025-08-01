import { IMainBanner } from "@/utils/interfaces";
import { Icon } from "../Icon/Icon";
import Image from "next/image";
import { LinkButton } from "../LinkButton/LinkButton";

const MainBanner = ({ content }: { content: IMainBanner }) => {
  const { title, subtitle, image } = content;

  return (
    <div className="overflow-hidden relative flex justify-center items-center w-full lg:mt-4 min-h-[380px] lg:min-h-[510px]">
      <Image
        className="absolute w-full min-h-[450px] h-full object-cover rounded-t-md md:rounded-l-md md:rounded-tr-none z-0"
        src={`${image.url}`}
        alt=""
        width={1000}
        height={600}
      />
      <div className="absolute top-0 right-0 h-full w-[100%] bg-gradient-to-l from-black via-transparent to-transparent"></div>
      <div className="absolute top-0 left-0 h-full w-[140%] bg-gradient-to-r from-black via-transparent to-transparent"></div>
      <div className="flex w-full p-6 2xl:p-0 h-full items-end justify-between max-w-[1440px] z-1">
        <div className="flex flex-col gap-4 lg:gap-8">
          <h1 className="text-white text-4xl leading-[40px] lg:leading-[68px] lg:text-6xl font-semibold lg:max-w-[50%]">
            {title}
          </h1>
          <p className="text-white text-lg font-medium">{subtitle}</p>
          <LinkButton href="/explore" className="md:max-w-fit">
            Explore os dados
          </LinkButton>
        </div>
        <Icon
          id="logo-DNE"
          width={200}
          height={100}
          className="hidden lg:block self-end filter brightness-0 invert"
        />
      </div>
    </div>
  );
};

export default MainBanner;
