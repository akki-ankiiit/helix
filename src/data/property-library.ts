import type {
  PropertyDefinition,
  Target,
  PropertyTemplate,
} from "../domain/models";
const groups: Record<string, string[]> = {
  Chemical: [
    "Binder type",
    "Binder content",
    "Polymer type",
    "Polymer content",
    "Polymer-to-cement ratio",
    "Water demand",
    "pH",
    "Solids content",
    "VOC",
    "Chloride content",
    "Alkali content",
    "Mix ratio",
    "Chemical resistance",
    "Shelf life",
    "Hazard class",
  ],
  "Rheological — fresh state": [
    "Viscosity",
    "Yield stress",
    "Thixotropy",
    "Flow",
    "Sag",
    "Slip",
    "Open time",
    "Adjustability",
    "Pot life",
    "Setting time",
    "Water retention",
    "Wetting",
    "Fresh density",
    "Air content",
    "Bleeding",
  ],
  "Mechanical — hardened state": [
    "Tensile adhesion — initial",
    "Tensile adhesion — water",
    "Tensile adhesion — heat",
    "Tensile adhesion — freeze-thaw",
    "Shear adhesion",
    "Compressive strength",
    "Flexural strength",
    "Transverse deformation",
    "Elongation",
    "Crack bridging",
    "Modulus",
    "Shrinkage",
    "Abrasion",
    "Hardness",
    "Pull-off bond",
  ],
  Durability: [
    "Water absorption",
    "Permeability",
    "Vapour transmission",
    "Freeze-thaw performance",
    "UV resistance",
    "Service temperature",
    "Efflorescence",
    "Coverage",
  ],
};
export const properties: PropertyDefinition[] = Object.entries(groups).flatMap(
  ([group, names]) =>
    names.map((name) => ({
      id: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-$/, ""),
      name,
      plain:
        (
          {
            Slip: "Resistance to sliding",
            "Open time": "Time available to place tiles",
            "Tensile adhesion — initial": "Bond strength after curing",
            "Water absorption": "How much water it absorbs",
          } as Record<string, string>
        )[name] || name,
      group,
      unit: /strength|adhesion|bond|Modulus/.test(name)
        ? "MPa"
        : /time|Adjustability|Pot life/.test(name)
          ? "min"
          : /Slip|Sag|Flow|deformation|bridging|Shrinkage/.test(name)
            ? "mm"
            : /content|demand|retention|absorption|Elongation|Bleeding/.test(
                  name,
                )
              ? "%"
              : name === "Coverage"
                ? "kg/m²"
                : name === "Viscosity"
                  ? "mPa·s"
                  : name === "Service temperature"
                    ? "°C"
                    : name === "Shelf life"
                      ? "months"
                      : name === "Fresh density"
                        ? "kg/m³"
                        : name === "VOC"
                          ? "g/L"
                          : name === "Yield stress"
                            ? "Pa"
                            : "—",
      method: "Project method · confirm with R&D",
      kind: /type|class|resistance|performance|Wetting|Efflorescence/.test(name)
        ? ("text" as const)
        : ("number" as const),
    })),
);
export const propertyFor = (id: string) => properties.find((p) => p.id === id)!;
// Family-specific starting sets, all explicitly draft. These are property
// choices, not validated limits or a certification/classification system.
const familyPropertySets: Record<string, string[]> = {
  "concrete-1": ["setting-time", "compressive-strength", "chloride-content"],
  "concrete-2": ["modulus", "elongation", "flexural-strength"],
  "concrete-3": [
    "solids-content",
    "chloride-content",
    "viscosity",
    "shelf-life",
  ],
  "concrete-4": ["water-retention", "solids-content", "voc", "coverage"],
  "concrete-5": ["viscosity", "solids-content", "voc", "coverage"],
  "masonry-0": [
    "compressive-strength",
    "water-retention",
    "open-time",
    "pull-off-bond",
  ],
  "masonry-1": [
    "compressive-strength",
    "flexural-strength",
    "setting-time",
    "water-retention",
  ],
  "masonry-2": ["pull-off-bond", "water-retention", "coverage", "shrinkage"],
  "masonry-3": ["pull-off-bond", "solids-content", "viscosity"],
  "masonry-4": ["fresh-density", "compressive-strength", "water-absorption"],
  "waterproofing-1": ["elongation", "water-absorption", "crack-bridging"],
  "waterproofing-2": ["elongation", "modulus", "service-temperature"],
  "waterproofing-3": ["viscosity", "pot-life", "water-absorption"],
  "tile-1": [
    "shrinkage",
    "abrasion",
    "water-absorption",
    "compressive-strength",
  ],
  "tile-2": [
    "compressive-strength",
    "abrasion",
    "chemical-resistance",
    "pot-life",
  ],
  "tile-3": ["water-absorption", "voc", "coverage"],
  "tile-4": ["flow", "shrinkage", "compressive-strength", "setting-time"],
  "tile-5": ["compressive-strength", "flexural-strength", "shrinkage"],
  "tile-6": ["abrasion", "hardness", "compressive-strength"],
  "tile-7": ["abrasion", "hardness", "pull-off-bond", "pot-life", "voc"],
  "repair-0": [
    "compressive-strength",
    "flexural-strength",
    "pull-off-bond",
    "shrinkage",
  ],
  "repair-1": ["compressive-strength", "flow", "shrinkage"],
  "repair-2": ["viscosity", "pot-life", "pull-off-bond"],
  "repair-3": ["flow", "compressive-strength", "shrinkage", "bleeding"],
  "repair-4": ["pull-off-bond", "pot-life", "compressive-strength"],
  "repair-5": ["modulus", "elongation"],
  "repair-6": ["chemical-resistance", "uv-resistance", "voc", "pull-off-bond"],
  "specialty-0": ["coverage", "solids-content", "voc"],
  "specialty-1": ["setting-time", "compressive-strength", "water-retention"],
  "specialty-2": ["pot-life", "pull-off-bond", "fresh-density", "elongation"],
};
export function templateFor(subcategoryId: string): PropertyTemplate {
  return {
    id: subcategoryId,
    propertyIds:
      subcategoryId === "tile-0"
        ? ["tensile-adhesion-initial", "slip", "open-time", "water-demand"]
        : subcategoryId === "waterproofing-0"
          ? ["water-absorption", "crack-bridging", "pull-off-bond"]
          : subcategoryId === "concrete-0"
            ? ["flow", "setting-time", "compressive-strength"]
            : familyPropertySets[subcategoryId] || [],
    status: "Draft",
    version: 1,
    ...(subcategoryId === "tile-0"
      ? {
          standard: {
            identifier: "EN 12004-1",
            edition: "2017 · edition to confirm",
            method: "EN 12004-2 · method to confirm",
            source: "Reference identifier only; licensed source not connected",
            status: "Unverified" as const,
          },
        }
      : {}),
  };
}
export function defaultTargets(sub: string): Target[] {
  return templateFor(sub).propertyIds.map((id) => ({
    propertyId: id,
    operator:
      propertyFor(id).kind === "text"
        ? "="
        : id === "slip" || id === "water-absorption"
          ? "≤"
          : "≥",
    value: !["tile-0", "waterproofing-0", "concrete-0"].includes(sub)
      ? ""
      : (
          {
            "tensile-adhesion-initial": "1",
            slip: "0.5",
            "open-time": "30",
            "water-demand": "24",
            "water-absorption": "5",
            "crack-bridging": "0.75",
            "pull-off-bond": "0.8",
            flow: "200",
            "setting-time": "90",
            "compressive-strength": "40",
          } as Record<string, string>
        )[id] || "",
    max: "",
    priority: propertyFor(id).kind === "text" ? "Important" : "Must",
    unit: propertyFor(id).unit,
    method: propertyFor(id).method,
    condition: "Project conditioning · 23 °C",
  }));
}
