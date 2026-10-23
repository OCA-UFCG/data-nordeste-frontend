import HeaderSection from "@/components/Header/Section/HeaderSection";
import React, { ReactNode, Suspense } from "react";
import Footer from "@/components/Footer/Footer";
import { MAIN_CONTENT_ID, SkipLink } from "@/components/SkipLink/SkipLink";

import "../app/globals.css";
import { getNavigationSections } from "@/features/navigation/content";

type HubTemplateProps = {
  children?: ReactNode;
  showFooter?: boolean;
};

const HubTemplate = ({ children, showFooter = true }: HubTemplateProps) => {
  return (
    <>
      <SkipLink />
      <Suspense fallback={<HeaderPlaceholder />}>
        <NavigationHeader />
      </Suspense>
      {/* tabIndex -1 lets the skip link move focus here, not only scroll. */}
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex flex-col items-center flex-1 min-h-0 w-full border-box focus:outline-none"
      >
        {children}
      </main>
      {showFooter && (
        <Suspense fallback={null}>
          <NavigationFooter />
        </Suspense>
      )}
    </>
  );
};

const NavigationHeader = async () => (
  <HeaderSection content={await getNavigationSections()} />
);

const NavigationFooter = async () => (
  <Footer content={await getNavigationSections()} />
);

const HeaderPlaceholder = () => (
  <div className="h-20 w-full border-b-2 border-grey-200 bg-white" />
);

export default HubTemplate;
