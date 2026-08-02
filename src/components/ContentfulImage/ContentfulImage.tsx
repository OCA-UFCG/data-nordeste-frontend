import Image, { type ImageProps } from "next/image";
import type { ReactElement } from "react";

const CONTENTFUL_ASSET_PROXY_PATH = "/contentful-assets/";

/**
 * Avoids Next's internal optimizer for assets served by the Nginx cache proxy.
 *
 * @example shouldBypassContentfulImageOptimization("/contentful-assets/space/image.png")
 */
export function shouldBypassContentfulImageOptimization(
  src: ImageProps["src"],
): boolean {
  return typeof src === "string" && src.startsWith(CONTENTFUL_ASSET_PROXY_PATH);
}

/**
 * Renders Contentful cache-proxy assets without routing them through `/_next/image`.
 *
 * @example <ContentfulImage src="/contentful-assets/space/image.png" alt="" width={1} height={1} />
 */
export function ContentfulImage({
  alt,
  src,
  unoptimized,
  ...props
}: ImageProps): ReactElement {
  return (
    <Image
      {...props}
      alt={alt}
      src={src}
      unoptimized={unoptimized || shouldBypassContentfulImageOptimization(src)}
    />
  );
}
