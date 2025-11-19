"use client";
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

const Header = ({ content }: { content: ISection[] }) => {
  return (
    <div className="flex items-center justify-between px-[80px] py-[18px] border-b-2 shadow-sm bg-white z-10">
      <Link href="/" className="flex items-center gap-2">
        <Icon id="logo-DNE" width={99} height={47} />
      </Link>

      <NavigationMenu>
        <NavigationMenuList className="flex items-center">
          {content
            .filter((item) => item.appears)
            .map((item, idx) => (
              <NavigationMenuItem key={idx}>
                {item.childrenCollection?.items.length ? (
                  <>
                    <NavigationMenuTrigger
                      className={"text-md cursor-pointer"}
                      itemID={item.id}
                    >
                      {item.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-white shadow-md p-2 rounded-md w-auto flex flex-col mt-15 ">
                      {item.childrenCollection.items.map((child) => (
                        <NavigationMenuLink
                          key={child.id}
                          href={child.path}
                          className="flex flex-row items-center py-[6px] px-3 w-full whitespace-nowrap gap-2 rounded"
                        >
                          <Icon
                            id={macroThemes[child.id] || "list"}
                            size={14}
                          />
                          {child.name}
                        </NavigationMenuLink>
                      ))}
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink
                    href={item.path}
                    className="px-4 py-2 text-md"
                  >
                    {item.name}
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
