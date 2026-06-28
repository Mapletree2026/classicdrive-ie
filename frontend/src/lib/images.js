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

const E30            = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/BMW_E30_in_silver_%28facelift%29%2C_front_left_2024-08-18.jpg/3840px-BMW_E30_in_silver_%28facelift%29%2C_front_left_2024-08-18.jpg";
const PORSCHE_964    = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/1991_Porsche_964_Turbo_in_Summer_Yellow%2C_front_right.jpg/3840px-1991_Porsche_964_Turbo_in_Summer_Yellow%2C_front_right.jpg";
const MINI_MK1       = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Morris_Mini-Minor_1959_%28621_AOK%29.jpg/3840px-Morris_Mini-Minor_1959_%28621_AOK%29.jpg";
const RX7_1994       = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/1994_Mazda_RX-7_R2_in_Vintage_Red%2C_front_left_%28Lime_Rock%29.jpg/3840px-1994_Mazda_RX-7_R2_in_Vintage_Red%2C_front_left_%28Lime_Rock%29.jpg";
const ESCORT_COSSIE  = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/1996_Ford_Escort_RS_Cosworth_2.0_Front.jpg/3840px-1996_Ford_Escort_RS_Cosworth_2.0_Front.jpg";

// Hero rotation — three iconic confirmed-vintage classics.
export const HERO_IMAGES = [
    WM(E30, 1920),         // BMW E30 (1982-1994)
    WM(PORSCHE_964, 1920), // 1991 Porsche 911 (964) Turbo
    WM(MINI_MK1, 1920),    // 1959 Morris Mini (Mk1 era)
];

// Per-category placeholder for car cards when no individual image is set.
// 1280px is the smallest Wikimedia-supported thumbnail size for these specific
// source files (smaller widths like 800px return HTTP 400). The browser scales
// down for the actual card render so payload is still modest.
export const CATEGORY_IMAGES = {
    "Performance / JDM": WM(RX7_1994, 1280),
    "Everyday / Euro Classic": WM(ESCORT_COSSIE, 1280),
};

// Map a single car to its display image:
//  1. Use car.image_url if provided (absolute or relative — resolved via resolveImageUrl)
//  2. Fall back to the category-specific Unsplash placeholder
export function getCarImage(car) {
    if (!car) return "";
    if (car.image_url) return resolveImageUrl(car.image_url);
    return CATEGORY_IMAGES[car.category] || CATEGORY_IMAGES["Performance / JDM"];
}
