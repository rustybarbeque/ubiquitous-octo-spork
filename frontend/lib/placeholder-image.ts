/**
 * Generated placehold.co images in each category's colors, matching the
 * seeded catalog (see DatabaseSeeder.PlaceholderImage on the backend).
 */

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  "Graphics Cards": { bg: "16532d", fg: "bbf7d0" },
  Processors: { bg: "1e3a8a", fg: "bfdbfe" },
  Motherboards: { bg: "581c87", fg: "e9d5ff" },
  Memory: { bg: "9a3412", fg: "fed7aa" },
  Storage: { bg: "115e59", fg: "99f6e4" },
  "Power Supplies": { bg: "7f1d1d", fg: "fecaca" },
  Cooling: { bg: "155e75", fg: "a5f3fc" },
  Cases: { bg: "27272a", fg: "d4d4d8" },
  Monitors: { bg: "312e81", fg: "c7d2fe" },
};

const DEFAULT_COLORS = { bg: "27272a", fg: "d4d4d8" };

/** A 600x600 placeholder that shows the product name, one word per line. */
export function placeholderImageUrl(name: string, category: string): string {
  const { bg, fg } = CATEGORY_COLORS[category] ?? DEFAULT_COLORS;
  const label = encodeURIComponent((name.trim() || "Product").replace(/ /g, "\n"));
  return `https://placehold.co/600x600/${bg}/${fg}.png?text=${label}&font=roboto`;
}
