import { useState } from "react";
import { Ship, Truck, MapPin, ChevronDown, ExternalLink } from "lucide-react";

const ROUTES = [
    {
        id: "jp",
        flag: "🇯🇵",
        title: "Japan (JDM)",
        lead: "Auction-grade RHD imports. 6-10 weeks door-to-Ireland. Highest reward, longest logistics.",
        steps: [
            { h: "1. Source", t: "Bid through a Japanese auction agent (BE FORWARD, Goo-net, JDM Buy & Sell) or a UK-based JDM importer. Aim for Auction Grade 4+ and a fresh shaken inspection." },
            { h: "2. Export", t: "Agent handles deregistration, export certificate, marine insurance, and Roll-on/Roll-off booking from Yokohama or Kobe to Cork or Dublin Port (via Antwerp/Zeebrugge transhipment)." },
            { h: "3. Customs (Revenue)", t: "Pay 10% Customs Duty + Irish Import VAT (23%, or 13.5% for eligible 30+ year vehicles) on CIF value." },
            { h: "4. VRT", t: "Book a NCTS appointment within 30 days. 30+ year cars → flat €200 Category C VRT, zero NOx levy. Bring V5/Export Certificate, BoL, invoice." },
            { h: "5. Registration", t: "Receive Irish plates. Done." },
        ],
    },
    {
        id: "uk",
        flag: "🇬🇧",
        title: "United Kingdom (GB)",
        lead: "Largest pool of right-hand-drive Euro classics. 1-2 weeks. Cheapest logistics, full customs apply since Brexit.",
        steps: [
            { h: "1. Source", t: "AutoTrader UK, Pistonheads, Car & Classic, classified Facebook groups. Insist on a V5C and HPI check before deposit." },
            { h: "2. Cross to Ireland", t: "Drive onto Holyhead-Dublin / Pembroke-Rosslare ferry or use a transport company (€350-€600 typical)." },
            { h: "3. Customs (Revenue)", t: "10% Customs Duty + Import VAT (23% standard / 13.5% historic) on declared value. File a Customs Declaration before arrival." },
            { h: "4. VRT", t: "Book NCTS within 30 days. 30+ year cars → flat €200 Category C VRT. Bring V5C, invoice, ferry ticket." },
            { h: "5. Re-register", t: "Plates issued. Insurance + NCT roadworthiness if applicable." },
        ],
        warning: "Coming from Northern Ireland? Provide an NI V5C proving private ownership in NI (or Windsor Framework proof) to skip Customs Duty and Import VAT entirely.",
    },
    {
        id: "eu",
        flag: "🇪🇺",
        title: "Mainland Europe (EU)",
        lead: "LHD Euro classics from Germany, Italy, the Netherlands. 1-3 weeks. Customs-free, VRT only.",
        steps: [
            { h: "1. Source", t: "Mobile.de, AutoScout24, Classic Driver. German TÜV history is gold. Verify VAT-paid status." },
            { h: "2. Transport", t: "Open-trailer transport €700-€1,400 to Dublin. Or self-drive via Calais-Dublin route (3 days)." },
            { h: "3. Customs (Revenue)", t: "Zero Customs Duty (EU single market). Zero Import VAT if vehicle is VAT-paid in EU." },
            { h: "4. VRT", t: "Book NCTS within 30 days of arrival. 30+ year cars → flat €200 Category C VRT, zero NOx levy." },
            { h: "5. Registration", t: "Receive Irish plates and crack on." },
        ],
    },
];

function Route({ route, open, onToggle }) {
    const isOpen = open === route.id;
    return (
        <div className="border border-[color:var(--sa-border)] bg-[color:var(--sa-surface)]" data-testid={`import-route-${route.id}`}>
            <button
                onClick={() => onToggle(route.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white transition"
                data-testid={`import-route-toggle-${route.id}`}
            >
                <div className="flex items-center gap-4 min-w-0">
                    <span className="text-2xl shrink-0" aria-hidden>{route.flag}</span>
                    <div className="min-w-0">
                        <div className="font-heading font-black text-lg md:text-xl uppercase text-[color:var(--sa-brg)] leading-tight">
                            {route.title}
                        </div>
                        <div className="font-mono-tech text-[11px] text-[color:var(--sa-text-2)] leading-snug truncate">
                            {route.lead}
                        </div>
                    </div>
                </div>
                <ChevronDown size={16} className={`shrink-0 text-[color:var(--sa-text-2)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-[color:var(--sa-border)] space-y-3" data-testid={`import-route-body-${route.id}`}>
                    {route.steps.map((s, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="font-heading font-black text-xl text-[color:var(--sa-brg)] opacity-30 leading-none w-8 shrink-0 pt-0.5">
                                0{i + 1}
                            </div>
                            <div>
                                <div className="font-heading font-bold text-sm uppercase text-[color:var(--sa-brg)] mb-0.5">{s.h}</div>
                                <div className="font-mono-tech text-xs text-[color:var(--sa-text)] leading-relaxed">{s.t}</div>
                            </div>
                        </div>
                    ))}
                    {route.warning && (
                        <div className="mt-3 p-3 border" style={{ borderColor: "var(--sa-amber)", background: "var(--sa-amber-soft)" }}>
                            <div className="font-heading font-bold uppercase text-xs mb-1" style={{ color: "var(--sa-amber)" }}>
                                NI loophole
                            </div>
                            <div className="font-mono-tech text-[11px] text-[color:var(--sa-text)] leading-relaxed">{route.warning}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ImportGuide() {
    const [open, setOpen] = useState("jp");
    return (
        <section
            className="border-y border-[color:var(--sa-border)] bg-paper"
            data-testid="import-guide-section"
        >
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
                <div className="grid md:grid-cols-[280px_1fr] gap-10">
                    <div>
                        <div className="inline-flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-[color:var(--sa-text-2)] mb-3">
                            <MapPin size={12} style={{ color: "var(--sa-brg)" }} />
                            IMPORT PIPELINE
                        </div>
                        <h2 className="font-heading font-black text-3xl md:text-4xl uppercase text-[color:var(--sa-brg)] leading-[0.95]" data-testid="import-guide-title">
                            How to actually<br />get it here.
                        </h2>
                        <p className="font-mono-tech text-xs text-[color:var(--sa-text-2)] mt-4 leading-relaxed">
                            Three end-to-end roadmaps — Japan, UK, and the EU — covering sourcing, shipping, customs, and VRT.
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 font-mono-tech text-[11px] text-[color:var(--sa-brg)] font-bold">
                            <Ship size={12} />
                            <span>One click from any car detail →</span>
                            <ExternalLink size={12} />
                        </div>
                        <p className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] mt-2 leading-relaxed">
                            ClassicDrive deep-links each registry entry directly into the matching marketplace search (DoneDeal, Mobile.de, BE FORWARD, AutoTrader UK) so you go from historical record to live inventory instantly.
                        </p>
                    </div>

                    <div className="space-y-3" data-testid="import-routes-list">
                        {ROUTES.map((r) => (
                            <Route key={r.id} route={r} open={open} onToggle={(id) => setOpen(open === id ? null : id)} />
                        ))}
                        <div className="text-right">
                            <a
                                href="https://www.revenue.ie/en/importing-vehicles-duty-free-allowances/importing-vehicle-to-ireland/index.aspx"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-mono-tech text-[11px] text-[color:var(--sa-text-2)] hover:text-[color:var(--sa-brg)] underline"
                                data-testid="import-guide-revenue-link"
                            >
                                Official Revenue.ie reference <ExternalLink size={11} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
