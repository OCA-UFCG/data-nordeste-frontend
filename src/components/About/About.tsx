import { LinkButton } from "../LinkButton/LinkButton";

export const AboutSection = ({ header }: { header: { fields: any } }) => {
  const { title, subtitle, thumb } = header.fields;

  return (
    <section className="flex w-full justify-center items-center bg-grey-100 gap-6 px-6 py-8 lg:px-20 lg:py-12">
      <div className="flex flex-col gap-6">
        <h2 className="text-[24px] lg:text-[30px] leading-[36px] tracking-[-0.0075em] font-bold text-left lg:text-left text-center">
          {title}
        </h2>
        <div className="flex flex-col lg:flex-row gap-6">
          <img
            alt=""
            src={`https:${thumb.fields.file.url}`}
            className="w-full lg:w-[462px] lg:h-[374px] rounded-lg"
          />
          <div className="flex flex-col items-start justify-between lg:max-h-[375px] lg:max-w-[800px] gap-6">
            <p className="text-left whitespace-pre-line h-fit lg:overflow-auto">
              {subtitle}
            </p>
            <LinkButton href="/" className="mt-auto w-full md:w-[300px]">
              Saiba mais
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
};
