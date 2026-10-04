import type { Category } from "../domain/models";
const groups = [
  [
    "concrete",
    "Concrete and cement",
    "Better performance, from mix to cure.",
    "Boxes",
    [
      "Admixtures",
      "Shotcrete accelerators",
      "Fibres",
      "Cement grinding aids",
      "Curing compounds",
      "Release agents",
    ],
  ],
  [
    "masonry",
    "Masonry and wall build-up",
    "Build, bond, and finish with confidence.",
    "BrickWall",
    [
      "Block-jointing mortar",
      "Plaster",
      "Wall putty and skim coat",
      "Bonding agents and primers",
      "Thermal insulation mortars",
    ],
  ],
  [
    "waterproofing",
    "Waterproofing and sealing",
    "Protection against water and exposure.",
    "Droplets",
    [
      "Waterproofing coatings",
      "Membranes",
      "Joint sealants",
      "Injection systems for leaks",
    ],
  ],
  [
    "tile",
    "Tile, stone and flooring",
    "Adhesion and finishes that go further.",
    "Grid2X2",
    [
      "Tile and stone adhesives",
      "Tile grouts",
      "Epoxy grouts",
      "Stone care and sealers",
      "Self-levelling compounds",
      "Screeds",
      "Floor hardeners",
      "Resin floors",
    ],
  ],
  [
    "repair",
    "Repair, strengthening and protection",
    "Restore strength. Extend service life.",
    "ShieldCheck",
    [
      "Repair mortars",
      "Micro-concrete",
      "Structural injection resins",
      "Precision grouts",
      "Anchors",
      "Fibre wrap",
      "Anti-corrosion and protective coatings",
    ],
  ],
  [
    "specialty",
    "Specialty",
    "Purpose-built for demanding applications.",
    "Sparkles",
    [
      "Fire protection",
      "Tunnelling and mining chemicals",
      "Construction adhesives and foams",
    ],
  ],
] as const;
export const taxonomy: Category[] = groups.map(
  ([id, name, description, icon, names]) => ({
    id,
    name,
    description,
    icon,
    subcategories: names.map((name, i) => ({
      id: `${id}-${i}`,
      name,
      chemistry:
        /resin|Epoxy|sealant|foam|Membrane|coating|Curing|Release|primer/i.test(
          name,
        )
          ? "Polymer-based"
          : /Admixture|accelerator|grinding/i.test(name)
            ? "Aqueous chemistry"
            : "Mineral-based",
      form: /resin|sealant|coating|Curing|Release|primer|Admixture|accelerator|grinding/i.test(
        name,
      )
        ? "Liquid / paste"
        : /Fibres|wrap|Membrane/.test(name)
          ? "Solid article"
          : "Dry powder",
    })),
  }),
);
export const categoryFor = (id: string) => taxonomy.find((c) => c.id === id);
export const subcategoryFor = (id: string) =>
  taxonomy.flatMap((c) => c.subcategories).find((s) => s.id === id);
export const examples: Record<string, string> = {
  "concrete-0":
    "Plasticisers, superplasticisers, retarders, accelerators, air entrainers, waterproofing admixtures, and corrosion inhibitors.",
  "masonry-1": "Ready-mix plaster and gypsum plaster.",
  "waterproofing-0":
    "Cementitious, acrylic, polyurethane, bituminous, and crystalline systems.",
  "tile-7": "Epoxy and polyurethane systems.",
  "specialty-0": "Intumescent coatings and firestop.",
};
