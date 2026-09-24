"use client";
import { usePathname } from "next/navigation";
import { useRef } from "react";
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
import { macroThemes, THEMES_NAVIGATION_ORDER } from "@/utils/constants";
import { sortContentByDesiredOrder } from "@/utils/functions";
import { SearchBar } from "@/components/SearchBar/SearchBar";
import { useExploreNavigation } from "@/features/explore/navigation";
import { setExploreSearchFocusOwner } from "@/features/explore/searchFocus";
import { useMergedExploreSearch } from "./useMergedExploreSearch";

const Header = ({ content }: { content: ISection[] }) => {
  const pathname = usePathname();
  const headerRef = useRef<HTMLDivElement>(null);
  const { replaceQuery } = useExploreNavigation();
  const mergedExploreSearch = useMergedExploreSearch(
    headerRef,
    pathname === "/explore",
  );
  const updateExploreQuery = (query: string) => {
    replaceQuery({ q: query || null, page: "1" });
  };

  return (
    <div className="w-full border-b-2 border-grey-200 bg-white" ref={headerRef}>
      <div className="flex w-full max-w-[1440px] items-center justify-between gap-6 px-20 py-[18px] mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Icon id="logo-DNE" width={99} height={47} />
        </Link>

        <SearchBar
          className="peer flex-1"
          variant="header"
          initialQuery={
            mergedExploreSearch.active ? mergedExploreSearch.query : ""
          }
          focusOnActivate={mergedExploreSearch.active}
          hideSuggestions={mergedExploreSearch.active}
          hideViewAll={mergedExploreSearch.active}
          onQueryChange={
            mergedExploreSearch.active ? updateExploreQuery : undefined
          }
          onUserFocus={() => setExploreSearchFocusOwner("header")}
          onSubmit={mergedExploreSearch.active ? updateExploreQuery : undefined}
        />

        <NavigationMenu className="flex-none peer-focus-within:hidden">
          <NavigationMenuList className="flex items-center gap-6 h-10">
            {content
              .filter((item) => item.appears)
              .map((item, idx) => (
                <NavigationMenuItem key={idx}>
                  {item.childrenCollection?.items.length ? (
                    <>
                      <NavigationMenuTrigger
                        className={
                          "h-10 text-md cursor-pointer whitespace-nowrap"
                        }
                        itemID={item.id}
                      >
                        {item.name}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="bg-white shadow-md p-2 rounded-md w-auto flex flex-col mt-15">
                        {sortContentByDesiredOrder(
                          item.childrenCollection.items,
                          THEMES_NAVIGATION_ORDER,
                        ).map((child) => (
                          <NavigationMenuLink
                            key={child.id}
                            href={
                              child.id === "ver_todos"
                                ? "/explore"
                                : `/macrothemes/${child.id.replace(/_/g, "-")}`
                            }
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
                      className="h-10 px-4 py-2 text-md whitespace-nowrap"
                    >
                      {item.name}
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};

export default Header;
