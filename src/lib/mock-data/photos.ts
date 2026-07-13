// Maps design image-slot IDs to public image paths. Unknown slots return
// null so components can fall back to a placeholder.
const knownSlots: ReadonlySet<string> = new Set([
  "vme-hero",
  "vme-w1",
  "vme-w2",
  "vme-w3",
  "vme-care1",
  "vme-care2",
  "vme-care3",
  "care-vme-care1",
  "care-vme-care2",
  "care-vme-care3",
  "life-g1",
  "life-g2",
  "life-g3",
  "life-g4",
  "life-g5",
  "home-exterior",
  "home-map",
  "contact-map",
  "wing-Rātā",
  "wing-Kōwhai",
  "wing-Tōtara",
  "vme-fam",
  "vme-feed1",
  "vme-feed2",
]);

// slot id -> real file in public/images. Empty until photos are supplied;
// every slot then falls back to the Photo placeholder. To enable a real
// image, add its file to public/images and map it here, e.g.
//   ["vme-hero", "/images/vme-hero.jpg"]
const mapped: ReadonlyMap<string, string> = new Map<string, string>([]);

export function photoSrc(slot: string): string | null {
  return mapped.get(slot) ?? null;
}

/** Reference list of every image-slot id used across the design. */
export const IMAGE_SLOTS = knownSlots;
