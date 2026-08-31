/** Référentiels catalogue (valeurs proposées dans l'admin et les filtres). Extensibles via Product.attributes. */
export const PRODUCT_TYPES: Record<string, string> = { WIG: "Wig", BUNDLE: "Bundle", EXTENSION: "Extension", CLOSURE: "Closure", FRONTAL: "Frontal", HAIR_CARE: "Hair care", ACCESSORY: "Accessory", KIT: "Set / Kit" };
export const HAIR_MATERIALS = ["Human Hair", "Remy Human Hair", "Virgin Hair", "Synthetic"];
export const HAIR_ORIGINS = ["Brazilian", "Peruvian", "Indian", "Malaysian", "Cambodian", "Vietnamese"];
export const TEXTURES = ["Straight", "Body Wave", "Deep Wave", "Loose Wave", "Water Wave", "Curly", "Kinky Curly", "Afro Kinky", "Kinky Straight"];
export const DENSITIES = ["130%", "150%", "180%", "200%", "250%"];
export const LACE_TYPES = ["4x4", "5x5", "6x6", "13x4", "13x6", "360", "Full Lace", "HD Lace", "Transparent Lace"];
export const LENGTHS = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40];
export const COLORS = ["Natural Black", "1B", "#2", "#4", "#27", "#30", "#613 Blonde", "Ombre 1B/27", "Ombre 1B/30", "Highlight P4/27", "Burgundy", "Chocolate Brown"];
export const CAP_SIZES = ["S", "M", "L"];
export const WIG_TYPES = ["Lace Front", "Full Lace", "Closure Wig", "Headband Wig", "U-Part", "V-Part", "Glueless", "Bob"];
export const HAIR_GRADES = ["8A", "9A", "10A", "12A", "15A"];
export const CLOSURE_TYPES = ["Free Part", "Middle Part", "Three Part"];

/** Clés d'options de variantes reconnues (ordre d'affichage). */
export const OPTION_KEYS = ["texture", "length", "density", "lace", "color", "capSize", "size"] as const;
export type OptionKey = (typeof OPTION_KEYS)[number];
export const OPTION_LABELS: Record<OptionKey, string> = { texture: "Texture", length: "Length", density: "Density", lace: "Lace", color: "Color", capSize: "Cap size", size: "Size" };

export const variantLabel = (options: Record<string, string> | null | undefined, fallback: string) => {
  if (!options) return fallback;
  const parts = OPTION_KEYS.filter((k) => options[k]).map((k) => (k === "length" ? `${options[k]}"` : options[k]));
  return parts.length ? parts.join(" · ") : fallback;
};

/** Type d'attributs affichés selon le type de produit. */
export const HAIR_PRODUCT_TYPES = ["WIG", "BUNDLE", "EXTENSION", "CLOSURE", "FRONTAL"];
