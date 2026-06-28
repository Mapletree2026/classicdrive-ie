// Generate affiliate / sourcing links for a given car name.
// Pure client-side logic; no API key required.

// Heuristic: list of known makes, longest-first so we strip multi-word makes correctly.
const MAKES = [
    "Mercedes-Benz", "Aston Martin", "Alfa Romeo", "Land Rover", "Range Rover",
    "Mitsubishi", "Volkswagen", "Lamborghini", "Lancia", "Porsche", "Renault",
    "Nissan", "Toyota", "Subaru", "Mazda", "Honda", "Lexus", "Ferrari",
    "Lotus", "Alpina", "Peugeot", "Audi", "BMW", "Ford"
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
    // Model = first 1-3 significant tokens, drop parens
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

    // Local Irish marketplaces — always shown
    const irish = [
        {
            id: "donedeal",
            name: "DoneDeal Ireland",
            desc: "Ireland's largest classifieds — search local listings",
            url: `https://www.donedeal.ie/cars?words=${enc(q)}`,
            region: "IE",
        },
        {
            id: "carzone",
            name: "Carzone.ie",
            desc: "Filtered used-car listings by make & model",
            url: `https://www.carzone.ie/searchresults?keyword=${enc(q)}`,
            region: "IE",
        },
        {
            id: "carsie",
            name: "Cars.ie",
            desc: "Irish dealer & private listings",
            url: `https://www.cars.ie/used-cars/?search=${enc(q)}`,
            region: "IE",
        },
    ];

    // Import platforms — JDM-specific or European depending on category
    const imports = isJDM
        ? [
              {
                  id: "beforward",
                  name: "BE FORWARD",
                  desc: "Japan-to-world exporter — auction-grade JDM stock",
                  url: `https://www.beforward.jp/used-cars-for-sale.html?stext=${enc(q)}`,
                  region: "JP",
              },
              {
                  id: "goonet",
                  name: "Goo-net Exchange",
                  desc: "Japan's domestic used-car catalogue",
                  url: `https://www.goo-net-exchange.com/usedcars/index.html?keyword=${enc(q)}`,
                  region: "JP",
              },
              {
                  id: "tradecarview",
                  name: "TradeCarView",
                  desc: "Direct Japanese auction sourcing",
                  url: `https://www.tradecarview.com/used_car/?key=${enc(q)}`,
                  region: "JP",
              },
              {
                  id: "jdmbuysell",
                  name: "JDM Buy & Sell",
                  desc: "Curated enthusiast-grade JDM exports",
                  url: `https://www.jdmbuysell.com/?s=${enc(q)}`,
                  region: "JP",
              },
          ]
        : [
              {
                  id: "mobilede",
                  name: "Mobile.de",
                  desc: "Germany's largest marketplace — premium Euro stock",
                  url: `https://suchen.mobile.de/fahrzeuge/search.html?ms=${enc(make)};${enc(model)}`,
                  region: "DE",
              },
              {
                  id: "autotrader",
                  name: "AutoTrader UK",
                  desc: "UK used-car listings — RHD imports to IE",
                  url: `https://www.autotrader.co.uk/car-search?keywords=${enc(q)}`,
                  region: "UK",
              },
              {
                  id: "autoscout24",
                  name: "AutoScout24",
                  desc: "Pan-European listings (DE, IT, ES, NL)",
                  url: `https://www.autoscout24.com/lst?atype=C&q=${enc(q)}`,
                  region: "EU",
              },
              {
                  id: "classicdriver",
                  name: "Classic Driver",
                  desc: "Premium collector listings",
                  url: `https://www.classicdriver.com/en/search/cars?keyword=${enc(q)}`,
                  region: "EU",
              },
          ];

    // Always include a Revenue.ie VRT calculator pointer
    const utility = [
        {
            id: "revenue-vrt",
            name: "Revenue.ie VRT Calculator",
            desc: "Official Irish VRT estimator",
            url: `https://www.ros.ie/vrt-enquiry-web/vrt/searchVehicle`,
            region: "IE",
        },
    ];

    return {
        meta: { make, model, year, isJDM, query: q },
        groups: [
            { id: "ie", title: "Ireland", items: irish },
            { id: "imports", title: isJDM ? "JDM Auction & Export" : "European Imports", items: imports },
            { id: "utility", title: "Utility", items: utility },
        ],
    };
}
