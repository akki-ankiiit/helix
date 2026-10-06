import type { SourceKind, SourceRef } from "./model";

// Every source below was fetched and read on 6 Oct 2026. Versions are as
// printed on the documents. Finished-product data sheets (TDS) are used only
// as benchmarks for intended use, handling and targets — never as recipes.
const accessed = "2026-10-06";
const TDS_NOTE = "Finished-product data sheet: describes a commercial product, not its formulation.";

const src = (
  id: string,
  kind: SourceKind,
  title: string,
  publisher: string,
  url: string,
  version: string,
  usedFor: string,
  note?: string,
): SourceRef => ({ id, kind, title, publisher, url, version, accessed, usedFor, note, selected: true });

export const S = {
  // Tile cleaner -------------------------------------------------------------
  stepan1115: src("stepan-1115", "Supplier formulation", "Naturally-Derived Tub and Tile Cleaner, Formulation No. 1115", "Stepan Company", "https://www.stepan.com/content/dam/stepan-dot-com/webdam/website-product-documents/starter-formulations/StepanFormulation1115.pdf", "Revision 03/25/2019 (first published 11/30/2009)", "Disclosed starting formulation (water, citric acid, amine oxide), pH 2–3, stability tests", "Supplier starting point for development; percentages are as listed, active basis not stated."),
  stepan1126: src("stepan-1126", "Supplier formulation", "Tub and Tile Cleaner, Formulation No. 1126", "Stepan Company", "https://www.stepan.com/content/dam/stepan-dot-com/webdam/website-product-documents/starter-formulations/StepanFormulation1126.pdf", "Revision 03/25/2019 (first published 01/26/2010)", "Glycol-ether variant, pH adjustment with citric acid, 4–5 minute contact time"),
  filaDeterdek: src("fila-deterdek", "Technical data sheet", "DETERDEK PRO — end-of-work cleaning", "FILA Solutions S.p.A.", "https://download.filasolutions.com/public/copyfiles/deterdekpro-ing.pdf", "REV. 00 – 14/09/2026", "Buffered-acid cement-haze removal: suitable and unsuitable substrates, dilution, contact time", TDS_NOTE),
  filaSds: src("fila-sds", "Safety data sheet", "DETERDEK PRO ECO ADVANCED FORMULA — Safety Data Sheet", "FILA Solutions S.p.A.", "https://download.filasolutions.com/public/download_file.php?file=6bmwie4mx7xg.pdf&filename=DETERDEK%20PRO%20ECO%20ADVANCED%20FORMULA_EN_2.pdf&time=1791289956", "Revision 2, 18/12/2024", "Hazard class (Eye Dam. 1), ingredient ranges (8–15% sulphamidic acid), pH 0.50, incompatibility with alkalis", "Ingredient ranges only; not a recipe."),
  faber: src("faber-cement-remover", "Technical data sheet", "CEMENT REMOVER — technical data sheet", "Faber Chimica Srl", "https://www.fabersurfacecare.com/media/product/233/Cement_Remover_TDS_EN_Rev4.0.pdf", "Rev4.0 – 12/09/2022", "Acid cleaner pH 1.5 ± 0.5, acid-resistant surfaces only, 5–10 min contact, wait 2 days after grouting", TDS_NOTE),
  filaCleanerPro: src("fila-cleaner-pro", "Technical data sheet", "CLEANER PRO — professional maintenance", "FILA Solutions S.p.A.", "https://download.filasolutions.com/public/copyfiles/cleanerpro-ing.pdf", "REV. 00 – 14/09/2026", "Neutral maintenance cleaner route: dilution 1:30–1:200, no rinse at high dilution", TDS_NOTE),
  iso10545: src("iso-10545-13", "Standard", "ISO 10545-13:2016 Ceramic tiles — Part 13: Determination of chemical resistance", "ISO", "https://www.iso.org/standard/60975.html", "Edition 2, 2016-11 (confirmed 2022)", "Test method for chemical resistance of ceramic tiles", "Catalogue page only; test solutions and limits not read."),
  // Tile adhesive ------------------------------------------------------------
  dowTechline: src("dow-techline-9", "Supplier formulation", "Techline 9 — International norms for tile adhesives & grouts", "Dow Construction Chemicals", "https://web.archive.org/web/20230313061624id_/https://www.dow.com/content/dam/dcc/documents/en-us/tech-art/840/840-02001-01-techline-9-improving-the-quality-of-building-materials-international-norms-for-tile-adhesives-and-grouts.pdf", "Version August 2012 (archived copy)", "C2TE starting formulation (parts by weight), water demand 28%, ingredient roles, typical ranges", "Pre-dates EN 12004-1:2017; formulations are tentative starting points without test results."),
  laticrete335: src("laticrete-335-in", "Technical data sheet", "LATICRETE 335 Super Flex Multipurpose Floor and Wall Adhesive", "MYK LATICRETE India Pvt Ltd", "https://media.myklaticrete.com/mykl/2025/02/LATICRETE-335-Super-Flex_TDS.pdf", "MYKL-TDS-L 335 – REV 00, 11/2024", "Benchmark: C2TE S1 / IS 15477 Type 3 claims, mixing water, open time, pot life", TDS_NOTE),
  laticrete335eu: src("laticrete-335-eu", "Technical data sheet", "335 SUPER FLEX — Product Datasheet", "LATICRETE Europe S.r.l.", "https://cdn-global.laticrete.com/-/media/project/laticrete-international/europe/product-documents/product-data-sheets/ds-886-en.pdf?rev=af66426384ea4d8f95da7e3f8d2ae262&sc_lang=en", "DS-886-0824", "EN 12004-1 requirement column and test clauses; water 27–29% of powder", TDS_NOTE),
  is15477: src("is-15477", "Standard", "IS 15477:2019 Adhesives for Use with Ceramic, Mosaic and Stone Tiles — Specification", "Bureau of Indian Standards", "https://archive.org/download/gov.in.is.15477.2019/IS15477%3A2019_djvu.txt", "IS 15477:2019 (Amendment No. 1 not reviewed)", "Adhesive types 1–5, Table 1 minimum adhesion strengths, slip ≤ 0.5 mm, conditioning 27 ± 2 °C", "Scanned public copy with OCR errors."),
  en12004: src("en-12004", "Standard", "EN 12004-1:2017 / EN 12004-2:2017 Adhesives for ceramic tiles", "CEN (catalogue: Genorma)", "https://genorma.com/en/standards/en-12004-2-2017", "Published 2017-05-15", "Test methods: open time (8.1), slip (8.2), tensile adhesion (8.3), transverse deformation", "Catalogue page; numeric class criteria taken from Dow Techline 9 and Laticrete Europe."),
  // Epoxy --------------------------------------------------------------------
  epon828: src("epon-828", "Raw-material data sheet", "EPON Resin 828 Technical Data Bulletin", "Hexion (now Westlake Epoxy)", "https://www.spacematdb.com/spacemat/manudatasheets/Epon828.pdf", "RP 3075, re-issued September 2005 (third-party copy)", "EEW 185–192 g/eq, viscosity, use in grouts, inert fillers"),
  der331: src("der-331", "Raw-material data sheet", "D.E.R. 331 Liquid Epoxy Resin — Product Information", "The Dow Chemical Company (now Olin)", "https://cstjmateriauxcomposites.files.wordpress.com/2017/11/der331.pdf", "Form No. 296-01408-0109X-TD (third-party copy)", "EEW 182–192 g/eq, storage above 25 °C to avoid crystallisation"),
  evonikGuide: src("evonik-guide", "Raw-material data sheet", "Epoxy Curing Agents — product guide (Americas)", "Evonik Corporation", "https://products.evonik.com/assets/90/41/Epoxy_curing_agents_product_guide_Americas_EN_Asset_819041.pdf", "125-11-034-US-E, November 2024", "AHEW, use level (phr) with EEW 182–192 resin, gel time (150 g at 77 °F); Ancamide 503 for tile grouts; Ancamine MCA for concrete bonding"),
  dowHandbook: src("dow-epoxy-handbook", "Technical publication", "DOW Liquid Epoxy Resins (formulating handbook)", "The Dow Chemical Company", "https://www.nmt.edu/academics/mtls/faculty/mccoy/docs2/chemistry/DowEpoxyResins.pdf", "Form No. 296-00224-0199, January 1999", "phr = AHEW × 100 / EEW; filler loadings; fumed silica as thixotrope"),
  kerapoxy: src("mapei-kerapoxy", "Technical data sheet", "Kerapoxy — two-component epoxy grout", "Mapei S.p.A.", "https://cdnmedia.mapei.com/docs/librariesprovider2/products-documents/1_00141_kerapoxy_en_72e5c8f6010d4340b8511fed1174ce90.pdf?sfvrsn=3eec1c4e_0", "141-9-2026 en", "Benchmark: RG/R2T classes, A:B = 9:1, pot life 45 min at +23 °C, cleaning window, cure times", TDS_NOTE),
  spectralock: src("laticrete-spectralock", "Technical data sheet", "SPECTRALOCK PRO Premium Grout", "LATICRETE International", "https://cdnmdm.laticrete.com/ProductAssets/Product%20Documents/ds-681-la-en.pdf", "DS-681-0926", "Benchmark: working time by temperature, water cleanability (ANSI A118.3 E5.1), three-part kit", TDS_NOTE),
  sikadur31: src("sikadur-31", "Technical data sheet", "Sikadur-31 CF Normal — Product Data Sheet", "Sika Ireland Ltd", "https://irl.sika.com/content/dam/dms/ie01/w/sikadur_-31_cf_normal.pdf", "May 2020, Version 01.01", "Benchmark: A:B = 2:1, pot life 55 min at +23 °C (200 g), substrate preparation, mixing ≤ 300 rpm", TDS_NOTE),
  latapoxy300: src("latapoxy-300", "Technical data sheet", "LATAPOXY 300 Epoxy Adhesive", "MYK LATICRETE India Pvt Ltd", "https://media.myklaticrete.com/mykl/2024/08/LATAPOXY_300_TDS.pdf", "MYKL-TDS-L 300 – REV 00, 11/2024", "Benchmark: R2T / IS 15477 Type 5 claims, substrate preparation, grout after 24 h", TDS_NOTE),
  en13888: src("en-13888", "Standard", "EN 13888-1:2022 Grouts for ceramic tiles — Part 1 (preview)", "CEN (preview: iTeh Standards)", "https://cdn.standards.iteh.ai/samples/69726/869381c268db40a29e0e52e9eb38b561/SIST-EN-13888-1-2022.pdf", "EN 13888-1:2022", "RG definition and test references; Table 3 limits are not in the free preview", "Preview only: RG limit values not verified."),
  // Waterproofing ------------------------------------------------------------
  basfPatent: src("basf-wo2016142339", "Technical publication", "WO2016142339A1 Flexible cementitious waterproofing slurry", "BASF SE (Google Patents)", "https://patents.google.com/patent/WO2016142339A1/en", "Published 2016-09-15", "Typical 2K slurry composition ranges, wet:dry ratio 1:2–3:1, polymer/cement > 0.6, two coats ~1 mm each", "Patent text: ranges describe prior art, not a validated product."),
  acronal: src("basf-acronal-5442", "Raw-material data sheet", "Acronal 5442 — Technical Data Sheet", "BASF SE", "https://download.basf.com/p1/8a80824f99704a54019971b10f5e03b1/en/Acronal_5442_Technical_Data_Sheet_English.pdf", "June 2025 (supersedes July 2022)", "Styrene-acrylic dispersion for cementitious membranes: solids 52.5–54.5%, crosslinks in alkaline pH, thickener placement"),
  wacker: src("wacker-7402", "Technical publication", "Waterproofing Solutions for Sustainable Building", "Wacker Chemicals (South Asia)", "https://www.wacker.com/h/medias/7402-EN.pdf", "7402e/11.16", "How 2K systems are built: dry-mix powder + dispersion mixed on site"),
  pidifin: src("drfixit-pidifin-2k", "Technical data sheet", "Dr. Fixit Pidifin 2K", "Pidilite Industries Ltd", "https://www.drfixit.co.in/resources/library/technical-data/home-owners/112-dr-fixit-pidifin-2k", "112 Pidifin 2K – 05/01/26", "Benchmark: 1 part polymer : 2 parts powder, coats, recoat 6–8 h, air cure 3–5 days, pot life 40 min at 30 °C", TDS_NOTE),
  sikatop: src("sikatop-107", "Technical data sheet", "SikaTop-107 Seal IN — Product Data Sheet", "Sika India Pvt Ltd", "https://ind.sika.com/dam/dms/in01/p/sikatop_seal-107in.pdf", "August 2022, Version 02.01", "Benchmark: Part A : Part B = 1 : 4, two coats, cure 7 days", TDS_NOTE),
  mapelastic: src("mapei-mapelastic", "Technical data sheet", "Mapelastic — two-component cementitious membrane", "Mapei S.p.A.", "https://cdnmedia.mapei.com/docs/librariesprovider2/products-documents/1_07587_mapelastic_en_06693be8d3aa45beb5e7e4f4c2b1a831.pdf?sfvrsn=20554d7f_0", "7587-7-2026 en", "Benchmark: EN 14891 CM O2 P requirement column (adhesion ≥ 0.5 N/mm², crack bridging ≥ 0.75 mm), 5 days before tiling", TDS_NOTE),
  en14891: src("en-14891-summary", "Standard", "EN 14891 Liquid applied water impermeable products under tiling — summary", "Benfer / Schomburg (secondary summary)", "https://www.benfer.it/userfiles/Normativa/files/STANDARDSIMPERMEABLEPRODUCTS.pdf", "Describes EN 14891:2007", "Classes CM/DM/RM; adhesion ≥ 0.5 N/mm², crack bridging ≥ 0.75 mm, no water penetration", "Secondary summary of the 2007 edition; current edition not read."),
  is2645: src("is-2645", "Standard", "IS 2645:2003 Integral Waterproofing Compounds for Cement Mortar and Concrete", "Bureau of Indian Standards (Public.Resource.Org)", "https://law.resource.org/pub/in/bis/S03/is.2645.2003.pdf", "IS 2645:2003 (Second Revision)", "Shows that the Indian standard covers integral admixtures, not surface coatings", "Not applicable as a specification for this coating."),
};

export const sourceKinds: SourceKind[] = [
  "Technical data sheet",
  "Supplier formulation",
  "Raw-material data sheet",
  "Safety data sheet",
  "Standard",
  "Technical publication",
  "Test data",
];
