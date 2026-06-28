// Quiz definition for "Find Your Classic Match".
// Each option carries a `traits` object that maps onto Car tags returned by the
// /api/quiz/match endpoint. The backend scores cars on overlap.

export const QUIZ_QUESTIONS = [
    {
        id: "use_case",
        title: "How will you actually use it?",
        subtitle: "Daily driver or weekend escape?",
        options: [
            { value: "daily",   label: "Daily driver",       icon: "calendar",  traits: { use_case: "daily",   maintenance_tier: "low" } },
            { value: "weekend", label: "Weekend cruiser",    icon: "sun",       traits: { use_case: "weekend" } },
            { value: "show",    label: "Show & collector",   icon: "trophy",    traits: { use_case: "show", price_tier: "premium" } },
        ],
    },
    {
        id: "seats",
        title: "Passengers & practicality",
        subtitle: "Who's coming with you?",
        options: [
            { value: 2, label: "Just me (2-seater)",     icon: "user",        traits: { seats: 2 } },
            { value: 4, label: "Me + 1 friend (2+2)",    icon: "users",       traits: { seats: 4 } },
            { value: 5, label: "Family / 4 passengers",  icon: "users-three", traits: { seats: 5 } },
        ],
    },
    {
        id: "reliability",
        title: "Mechanical comfort level",
        subtitle: "How bullet-proof do you need it?",
        options: [
            { value: 5, label: "Bullet-proof — must start every morning", icon: "shield-check", traits: { reliability: 5 } },
            { value: 3, label: "Solid — happy with weekend tinkering",     icon: "wrench",       traits: { reliability: 3 } },
            { value: 1, label: "I love a project — character over comfort",icon: "spark",        traits: { reliability: 1 } },
        ],
    },
    {
        id: "maintenance_tier",
        title: "Maintenance budget",
        subtitle: "Annual upkeep tolerance",
        options: [
            { value: "low",  label: "< €1,500 / yr",   icon: "euro",   traits: { maintenance_tier: "low" } },
            { value: "mid",  label: "€1,500 – 4,000",  icon: "euro",   traits: { maintenance_tier: "mid" } },
            { value: "high", label: "€4,000+",         icon: "diamond",traits: { maintenance_tier: "high" } },
        ],
    },
    {
        id: "price_tier",
        title: "Acquisition budget",
        subtitle: "What you're ready to put down",
        options: [
            { value: "budget",  label: "Under €15k",          icon: "wallet", traits: { price_tier: "budget" } },
            { value: "mid",     label: "€15k – €40k",         icon: "wallet", traits: { price_tier: "mid" } },
            { value: "premium", label: "€40k – €100k",        icon: "gem",    traits: { price_tier: "premium" } },
            { value: "exotic",  label: "Sky's the limit",     icon: "crown",  traits: { price_tier: "exotic" } },
        ],
    },
];
