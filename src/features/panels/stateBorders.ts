import type { LonLat, MapFeature } from "@/features/panels/mapFraming";

export type BorderSegment = [LonLat, LonLat];

type Ring = LonLat[];

// Polygon: [anel]; MultiPolygon: [[anel]]. Pela profundidade, sem ler o `type`.
const ringsOf = ({ coordinates }: MapFeature["geometry"]): Ring[] => {
  const isMultiPolygon = Array.isArray((coordinates as unknown[][][])[0][0][0]);

  return isMultiPolygon
    ? (coordinates as unknown as Ring[][]).flat()
    : (coordinates as unknown as Ring[]);
};

const segmentKey = ([a, b]: BorderSegment): string => {
  const [first, second] = [a.join(","), b.join(",")].sort();

  return `${first}|${second}`;
};

type SegmentUse = { segment: BorderSegment; ufs: Set<string>; count: number };

const countSegments = (features: MapFeature[]): Map<string, SegmentUse> => {
  const uses = new Map<string, SegmentUse>();

  for (const feature of features) {
    for (const ring of ringsOf(feature.geometry)) {
      for (let index = 1; index < ring.length; index += 1) {
        const segment: BorderSegment = [ring[index - 1], ring[index]];
        const key = segmentKey(segment);
        const use = uses.get(key) ?? { segment, ufs: new Set(), count: 0 };

        use.ufs.add(feature.properties.uf);
        use.count += 1;
        uses.set(key, use);
      }
    }
  }

  return uses;
};

/**
 * State limits drawn from a municipal mesh: a segment is a border when only
 * one municipality uses it (the mesh outline) or when it separates two states.
 * Pass the whole mesh, not a filtered subset, or the subset's outline shows up
 * as a border. Needs a coverage mesh, where neighbours share exact coordinates.
 * @example const borders = getStateBorders(meshFeatures);
 */
export const getStateBorders = (features: MapFeature[]): BorderSegment[] =>
  [...countSegments(features).values()]
    .filter(({ count, ufs }) => count === 1 || ufs.size > 1)
    .map(({ segment }) => segment);
