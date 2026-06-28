// Centralised image URL resolution.
// - Absolute URLs (https://, http://) are returned as-is (e.g. Unsplash, CDN).
// - Relative paths (starting with "/") are prefixed with REACT_APP_BACKEND_URL so they
//   resolve against the live API host instead of the Vercel front-end origin.
// - Falsy / empty inputs fall back to a category-aware placeholder.
const BACKEND = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");

export function resolveImageUrl(src, fallback) {
    if (!src) return fallback || "";
    if (/^https?:\/\//i.test(src)) return src;
    if (src.startsWith("/")) return BACKEND ? `${BACKEND}${src}` : src;
    return src;
}

// Curated, verified-vintage car photos from Wikimedia Commons (all 30+ years old).
// Wikimedia thumb URLs are stable and CC-licensed; using 1920px for hero, 800px for cards.
const WM = (path, w) => path.replace(/\/\d+px-/, `/${w}px-`);

const RX7_1994       = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/1994_Mazda_RX-7_R2_in_Vintage_Red%2C_front_left_%28Lime_Rock%29.jpg/3840px-1994_Mazda_RX-7_R2_in_Vintage_Red%2C_front_left_%28Lime_Rock%29.jpg";
const FAIRLADY_Z     = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/1970-1973_Nissan_Fairlady_Z.jpg/3840px-1970-1973_Nissan_Fairlady_Z.jpg";
const ESCORT_COSSIE  = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/1996_Ford_Escort_RS_Cosworth_2.0_Front.jpg/3840px-1996_Ford_Escort_RS_Cosworth_2.0_Front.jpg";

// Hero rotation — all confirmed vintage classics (1970, 1994, 1996).
export const HERO_IMAGES = [
    WM(RX7_1994, 1920),
    WM(FAIRLADY_Z, 1920),
    WM(ESCORT_COSSIE, 1920),
];

// Per-category placeholder for car cards when no individual image is set.
export const CATEGORY_IMAGES = {
    "Performance / JDM": WM(RX7_1994, 800),
    "Everyday / Euro Classic": WM(ESCORT_COSSIE, 800),
};

// Map a single car to its display image:
//  1. Use car.image_url if provided (absolute or relative — resolved via resolveImageUrl)
//  2. Fall back to the category-specific Unsplash placeholder
export function getCarImage(car) {
    if (!car) return "";
    if (car.image_url) return resolveImageUrl(car.image_url);
    return CATEGORY_IMAGES[car.category] || CATEGORY_IMAGES["Performance / JDM"];
}
