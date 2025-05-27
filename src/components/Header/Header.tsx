import { ISection } from "@/utils/interfaces";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { Icon } from "../Icon/Icon";
import { macroThemes } from "@/utils/constants";

const Header = ({ content }: { content: { fields: ISection }[] }) => {
  return (
    <div className="flex items-center justify-between px-[80px] py-[18px] border-b-2 shadow-sm bg-white">
      <Link href="/" className="flex items-center gap-2">
        <Icon id="logo-DNE" width={99} height={47} />
      </Link>

      <NavigationMenu>
        <NavigationMenuList className="flex items-center">
          {content
            .filter((item) => item.fields.appears)
            .map((item, idx) => (
              <NavigationMenuItem key={idx} className="px-4 py-2">
                {item.fields.children ? (
                  <>
                    <NavigationMenuTrigger
                      className={"text-md cursor-pointer"}
                      itemId={item.fields.id}
                    >
                      {item.fields.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-white shadow-md p-2 rounded-md w-auto flex flex-col mt-15 ">
                      {item.fields.children.map((child) => (
                        <NavigationMenuLink
                          key={child.fields.id}
                          href={child.fields.path}
                          className="flex flex-row items-center py-[6px] px-3 w-full whitespace-nowrap gap-2 rounded"
                        >
                          <Icon
                            id={macroThemes[child.fields.id] || "list"}
                            size={14}
                          />
                          {child.fields.name}
                        </NavigationMenuLink>
                      ))}
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink
                    href={item.fields.path}
                    className="px-4 py-2 text-md"
                  >
                    {item.fields.name}
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

export default Header;
