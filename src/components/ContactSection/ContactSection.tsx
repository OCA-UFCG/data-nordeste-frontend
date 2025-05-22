import { Icon } from "../Icon/Icon";
import { IContact } from "@/utils/interfaces";

const ContactSection = ({ content }: { content: { fields: IContact }[] }) => {
  const email = content.find((entry) => entry.fields.type === "email")?.fields
    .name;
  const social: IContact[] = content
    .filter((entry) => entry.fields.type !== "email")
    .map((entry) => entry.fields);

  return (
    <section className="flex justify-center w-full px-6 py-9 lg:px-20">
      <div className="flex flex-col items-left w-full max-w-[1440px] gap-6">
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
          {social.map(({ name, type, path }, index) => (
            <a
              key={index}
              href={path}
              target="_blank"
              className="flex flex-row gap-2 items-center hover:underline cursor-pointer"
            >
              <Icon id={type} size={32} className="text-green-900" />
              <span className="text-[16px]">{name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
