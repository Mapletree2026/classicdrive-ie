// Generate affiliate / sourcing links for a given car name.
// Pure client-side logic — no API key required.
//
// PARTNER CONFIGURATION
// ---------------------
// Drop real referral IDs / partner codes here once you have partner accounts.
// Anything left as an empty string is silently skipped (no broken params).
// Optionally override at deploy time via REACT_APP_* env vars.
export const PARTNER_IDS = {
    donedeal:       process.env.REACT_APP_AFF_DONEDEAL       || "", // e.g. "retrodrive-ie"
    carzone:        process.env.REACT_APP_AFF_CARZONE        || "",
    carsie:         process.env.REACT_APP_AFF_CARSIE         || "",
    beforward:      process.env.REACT_APP_AFF_BEFORWARD      || "", // BE FORWARD affiliate code
    goonet:         process.env.REACT_APP_AFF_GOONET         || "",
    tradecarview:   process.env.REACT_APP_AFF_TRADECARVIEW   || "",
    jdmbuysell:     process.env.REACT_APP_AFF_JDMBUYSELL     || "",
    mobilede:       process.env.REACT_APP_AFF_MOBILEDE       || "", // Mobile.de PARTNER_ID
    autotrader:     process.env.REACT_APP_AFF_AUTOTRADER     || "",
    autoscout24:    process.env.REACT_APP_AFF_AUTOSCOUT24    || "",
    classicdriver:  process.env.REACT_APP_AFF_CLASSICDRIVER  || "",
    "revenue-vrt":  "", // Revenue.ie is utility, no affiliate
};

// Some partners use a different query-string key for their referral.
// Map: partnerId -> param name to use when injecting PARTNER_IDS[id]
const PARTNER_PARAM = {
    donedeal:      "ref",
    carzone:       "ref",
    carsie:        "ref",
    beforward:     "af",       // BE FORWARD historically uses ?af=
    goonet:        "partner",
    tradecarview:  "partner",
    jdmbuysell:    "ref",
    mobilede:      "partnerid", // Mobile.de PARTNER_ID
    autotrader:    "afid",
    autoscout24:   "partner",
    classicdriver: "ref",
};

// Default UTM payload — same for every outbound click.
export const DEFAULT_UTM = {
    utm_source: "retrodrive_ie",
    utm_medium: "affiliate",
    utm_campaign: "vrt_sourcing",
};

/**
 * Append UTM parameters (and an optional partner ID) to a URL.
 * Safe with URLs that already contain a query string. Empty values are dropped.
 */
export function applyUtm(url, { partnerId, extra } = {}) {
    if (!url) return url;
    try {
        const u = new URL(url);
        Object.entries(DEFAULT_UTM).forEach(([k, v]) => {
            if (v && !u.searchParams.has(k)) u.searchParams.set(k, v);
        });
        if (partnerId && PARTNER_IDS[partnerId]) {
            const paramName = PARTNER_PARAM[partnerId] || "ref";
            if (!u.searchParams.has(paramName)) {
                u.searchParams.set(paramName, PARTNER_IDS[partnerId]);
            }
            if (!u.searchParams.has("utm_content")) {
                u.searchParams.set("utm_content", partnerId);
            }
        }
        if (extra && typeof extra === "object") {
            Object.entries(extra).forEach(([k, v]) => {
                if (v != null && v !== "" && !u.searchParams.has(k)) {
                    u.searchParams.set(k, String(v));
                }
            });
        }
        return u.toString();
    } catch {
        return url; // malformed URL — return untouched
    }
}

// ---------- Car-name parsing ----------
const MAKES = [
    "Mercedes-Benz", "Aston Martin", "Alfa Romeo", "Land Rover", "Range Rover",
    "Mitsubishi", "Volkswagen", "Lamborghini", "Lancia", "Porsche", "Renault",
    "Nissan", "Toyota", "Subaru", "Mazda", "Honda", "Lexus", "Ferrari",
    "Lotus", "Alpina", "Peugeot", "Audi", "BMW", "Ford",
];

function parseCar(name) {
    if (!name) return { make: "", model: "", year: null };
    const yearMatch = name.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : null;
    let stripped = name.replace(yearMatch ? yearMatch[0] : "", "").trim();

    let make = "";
    for (const m of MAKES) {
        if (stripped.toLowerCase().startsWith(m.toLowerCase())) {
            make = m;
            stripped = stripped.slice(m.length).trim();
            break;
        }
    }
    const model = stripped.replace(/\(.*?\)/g, "").trim().split(/\s+/).slice(0, 3).join(" ");
    return { make, model, year };
}

const JDM_MAKES = new Set(["Nissan", "Toyota", "Honda", "Mazda", "Subaru", "Mitsubishi", "Lexus"]);

function enc(s) {
    return encodeURIComponent((s || "").trim());
}

export function buildSourcingLinks(carName, category) {
    const { make, model, year } = parseCar(carName);
    const q = [make, model].filter(Boolean).join(" ");
    const isJDM = category?.toLowerCase().includes("jdm") || JDM_MAKES.has(make);

    const rawIrish = [
        { id: "donedeal", name: "DoneDeal Ireland", desc: "Ireland's largest classifieds — search local listings",
          url: `https://www.donedeal.ie/cars?words=${enc(q)}`, region: "IE" },
        { id: "carzone", name: "Carzone.ie", desc: "Filtered used-car listings by make & model",
          url: `https://www.carzone.ie/searchresults?keyword=${enc(q)}`, region: "IE" },
        { id: "carsie", name: "Cars.ie", desc: "Irish dealer & private listings",
          url: `https://www.cars.ie/used-cars/?search=${enc(q)}`, region: "IE" },
    ];

    const rawImports = isJDM
        ? [
              { id: "beforward", name: "BE FORWARD", desc: "Japan-to-world exporter — auction-grade JDM stock",
                url: `https://www.beforward.jp/used-cars-for-sale.html?stext=${enc(q)}`, region: "JP" },
              { id: "goonet", name: "Goo-net Exchange", desc: "Japan's domestic used-car catalogue",
                url: `https://www.goo-net-exchange.com/usedcars/index.html?keyword=${enc(q)}`, region: "JP" },
              { id: "tradecarview", name: "TradeCarView", desc: "Direct Japanese auction sourcing",
                url: `https://www.tradecarview.com/used_car/?key=${enc(q)}`, region: "JP" },
              { id: "jdmbuysell", name: "JDM Buy & Sell", desc: "Curated enthusiast-grade JDM exports",
                url: `https://www.jdmbuysell.com/?s=${enc(q)}`, region: "JP" },
          ]
        : [
              { id: "mobilede", name: "Mobile.de", desc: "Germany's largest marketplace — premium Euro stock",
                url: `https://suchen.mobile.de/fahrzeuge/search.html?ms=${enc(make)};${enc(model)}`, region: "DE" },
              { id: "autotrader", name: "AutoTrader UK", desc: "UK used-car listings — RHD imports to IE",
                url: `https://www.autotrader.co.uk/car-search?keywords=${enc(q)}`, region: "UK" },
              { id: "autoscout24", name: "AutoScout24", desc: "Pan-European listings (DE, IT, ES, NL)",
                url: `https://www.autoscout24.com/lst?atype=C&q=${enc(q)}`, region: "EU" },
              { id: "classicdriver", name: "Classic Driver", desc: "Premium collector listings",
                url: `https://www.classicdriver.com/en/search/cars?keyword=${enc(q)}`, region: "EU" },
          ];

    const rawUtility = [
        { id: "revenue-vrt", name: "Revenue.ie VRT Calculator", desc: "Official Irish VRT estimator",
          url: `https://www.ros.ie/vrt-enquiry-web/vrt/searchVehicle`, region: "IE" },
    ];

    // Apply UTM tagging + partner IDs to every outbound link.
    const decorate = (item) => ({ ...item, url: applyUtm(item.url, { partnerId: item.id }) });

    return {
        meta: { make, model, year, isJDM, query: q },
        groups: [
            { id: "ie",      title: "Ireland",                                       items: rawIrish.map(decorate) },
            { id: "imports", title: isJDM ? "JDM Auction & Export" : "European Imports", items: rawImports.map(decorate) },
            { id: "utility", title: "Utility",                                       items: rawUtility.map(decorate) },
        ],
    };
}
