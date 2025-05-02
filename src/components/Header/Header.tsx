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
    <div className="flex items-center justify-between px-[80px] py-[18px] border-b-2 shadow-sm border-b bg-white">
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo-DNE.png" alt="Logo" className="w-[99px] h-[47px]" />
      </Link>

      <NavigationMenu>
        <NavigationMenuList className="flex items-center">
          {content
            .filter((item) => item.fields.appears)
            .map((item, idx) => (
              <NavigationMenuItem key={idx} className="px-4 py-2">
                {item.fields.children ? (
                  <>
                    <NavigationMenuTrigger>
                      {item.fields.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-white shadow-md p-2 rounded-md w-auto flex flex-col">
                      {item.fields.children.map((child, i) => (
                        <Link href={child.fields.path} key={i} passHref>
                          <NavigationMenuLink
                            href={child.fields.path}
                            className="flex flex-row py-[6px] px-3 w-full whitespace-nowrap gap-2 hover:bg-gray-100 rounded"
                          >
                            <Icon
                              id={macroThemes[child.fields.id] || "list"}
                              size={14}
                            />
                            {child.fields.name}
                          </NavigationMenuLink>
                        </Link>
                      ))}
                    </NavigationMenuContent>
                  </>
                ) : (
                  <Link href={item.fields.path} passHref>
                    <NavigationMenuLink
                      href={item.fields.path}
                      className="px-4 py-2"
                    >
                      {item.fields.name}
                    </NavigationMenuLink>
                  </Link>
                )}
              </NavigationMenuItem>
            ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

export default Header;
