import type { Category } from "./model";
import { categoryFor, subcategoryFor, taxonomy } from "../data/taxonomy";

// Which formulation types each product family supports. Families without a
// dedicated template use "General formulation" (no suggested components).
const byFamily: Record<string, Category[]> = {
  "tile-0": ["Tile adhesive", "Epoxy adhesive"],
  "tile-1": ["Cementitious grout"],
  "tile-2": ["Epoxy grout"],
  "tile-8": ["Tile cleaner"],
  "waterproofing-0": ["Waterproofing coating"],
  "repair-2": ["Epoxy adhesive"],
  "specialty-2": ["Epoxy adhesive"],
};

export function formulationTypesFor(subcategoryId: string): Category[] {
  return [...(byFamily[subcategoryId] || []), "General formulation"];
}

export const familyLabel = (categoryId: string, subcategoryId: string) =>
  [categoryFor(categoryId)?.name, subcategoryFor(subcategoryId)?.name].filter(Boolean).join(" › ");

/** Default family for projects saved before families existed. */
export const defaultFamilyFor: Record<Category, [string, string]> = {
  "Tile cleaner": ["tile", "tile-8"],
  "Tile adhesive": ["tile", "tile-0"],
  "Cementitious grout": ["tile", "tile-1"],
  "Epoxy grout": ["tile", "tile-2"],
  "Epoxy adhesive": ["tile", "tile-0"],
  "Waterproofing coating": ["waterproofing", "waterproofing-0"],
  "General formulation": ["specialty", "specialty-2"],
};

export { taxonomy, categoryFor, subcategoryFor };
