import { channels } from "@/utils/constants";
import { Icon } from "../Icon/Icon";

const ContactSection = () => {
  return (
    <section className="flex items-center flex-col w-full min-h-[348px] gap-[24px] lg:gap-[48px] py-[36px] px-[24px] lg:pt-[24px] lg:px-[80px] lg:pb-[60px]">
      <div className="flex flex-col gap-6 w-full lg:max-w-[1440px]">
        <h2 className="font-bold text-[24px] lg:text-[30px]">Contatos</h2>
        <p className="text-[20px]">
          <b>E-mail</b>: datanordeste@sudene.gov.br
        </p>

        <h3 className="font-bold text-green-900 text-[20px] lg:text-[24px]">
          Nos siga nas redes sociais!
        </h3>
        <div className="flex flex-wrap justify-start gap-6 lg:gap-4 items-center">
          {channels.map(({ name, icon, size }, index) => (
            <div key={index} className="flex flex-row gap-2 items-center">
              <Icon id={icon} size={size} className="text-green-900" />
              <span className="text-[16px]">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
