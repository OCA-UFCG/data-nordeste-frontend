import { Icon } from "../Icon/Icon";
import { IContact } from "@/utils/interfaces";

const ContactSection = ({ content }: { content: { fields: IContact }[] }) => {
  const email = content.find((entry) => entry.fields.type === "email")?.fields
    .name;
  const social: IContact[] = content
    .filter((entry) => entry.fields.type !== "email")
    .map((entry) => entry.fields);

  return (
    <section className="flex items-center flex-col w-full py-[36px] px-[24px] lg:pt-[24px] lg:px-[80px] lg:pb-[60px]">
      <div className="flex flex-col gap-6 w-full lg:max-w-[1440px]">
        <h2 className="font-bold text-[24px] lg:text-[30px]">Contatos</h2>
        {email && (
          <p className="text-[20px]">
            <span className="font-bold">E-mail:</span> {email}
          </p>
        )}

        <h3 className="font-bold text-green-900 text-[20px] lg:text-[24px]">
          Nos siga nas redes sociais!
        </h3>
        <div className="flex flex-wrap justify-start gap-6 lg:gap-4 items-center">
          {social.map(({ name, type }, index) => (
            <div key={index} className="flex flex-row gap-2 items-center">
              <Icon id={type} size={32} className="text-green-900" />
              <span className="text-[16px]">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
