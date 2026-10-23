"use client";

import Script from "next/script";

const VLIBRAS_URL = "https://vlibras.gov.br/app";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
  }
}

// The plugin finds its mount points by these bare attributes (vw, vw-access-button,
// vw-plugin-wrapper), which JSX has no typed props for, so they go in via spread.
export const VLibras = () => (
  <>
    <div {...{ vw: "" }} className="enabled">
      <div {...{ "vw-access-button": "" }} className="active" />
      <div {...{ "vw-plugin-wrapper": "" }}>
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
    <Script
      src={`${VLIBRAS_URL}/vlibras-plugin.js`}
      strategy="afterInteractive"
      onLoad={() => {
        if (window.VLibras) new window.VLibras.Widget(VLIBRAS_URL);
      }}
    />
  </>
);
