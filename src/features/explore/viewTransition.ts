type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => void;
};

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Runs an explore layout update with a native transition when available. Example: `runExploreTransition(updateUrl)`. */
export function runExploreTransition(update: () => void): void {
  const transitionDocument = document as ViewTransitionDocument;
  if (prefersReducedMotion() || !transitionDocument.startViewTransition) {
    update();

    return;
  }

  transitionDocument.startViewTransition(update);
}

/** Produces a stable CSS transition name for one Contentful post. Example: `exploreCardTransitionName("post:1")`. */
export function exploreCardTransitionName(postId: string): string {
  return `explore-card-${postId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
