import { ExternalLink } from "lucide-react";
import { buildSourcingLinks } from "@/lib/sourcingLinks";

export default function SourcingSection({ carName, category }) {
    const { meta, groups } = buildSourcingLinks(carName, category);

    return (
        <section className="mt-16 border-t border-white/10 pt-10" data-testid="sourcing-section">
            <div className="flex flex-wrap items-baseline justify-between gap-4 mb-2">
                <div>
                    <div className="font-mono-tech text-[10px] text-white/40 tracking-widest mb-1">
                        SOURCING &amp; IMPORTS
                    </div>
                    <h2 className="font-heading font-black text-3xl md:text-4xl uppercase">
                        Where to buy
                    </h2>
                </div>
                <div className="font-mono-tech text-[11px] text-white/40">
                    QUERY ·{" "}
                    <span className="text-white" data-testid="sourcing-query">
                        {meta.query || "—"}
                    </span>
                </div>
            </div>
            <p className="font-mono-tech text-xs text-white/40 mb-8 max-w-xl">
                Live deep-links into trusted Irish marketplaces and{" "}
                {meta.isJDM ? "Japanese auction exporters" : "European import platforms"} — pre-filtered by this vehicle.
            </p>

            <div className="space-y-8">
                {groups.map((group) => (
                    <div key={group.id} data-testid={`sourcing-group-${group.id}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="font-mono-tech text-[10px] text-white/40 tracking-widest">
                                {group.title.toUpperCase()}
                            </div>
                            <div className="flex-1 h-px bg-white/10" />
                            <div className="font-mono-tech text-[10px] text-white/30">
                                {group.items.length} LINKS
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
                            {group.items.map((it) => (
                                <a
                                    key={it.id}
                                    href={it.url}
                                    target="_blank"
                                    rel="noopener noreferrer sponsored"
                                    className="group flex items-start justify-between gap-4 bg-[#0a0a0a] hover:bg-[#141414] px-5 py-4 transition-colors duration-150"
                                    data-testid={`sourcing-link-${it.id}`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-heading font-bold uppercase text-base text-white truncate">
                                                {it.name}
                                            </span>
                                            <span className="font-mono-tech text-[9px] text-white/40 border border-white/15 px-1.5 py-px shrink-0">
                                                {it.region}
                                            </span>
                                        </div>
                                        <div className="font-mono-tech text-[11px] text-white/50 leading-relaxed">
                                            {it.desc}
                                        </div>
                                    </div>
                                    <ExternalLink
                                        size={16}
                                        className="text-white/30 group-hover:text-white shrink-0 mt-1 transition-colors"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <p className="font-mono-tech text-[10px] text-white/30 mt-6 leading-relaxed">
                External listings are deep-linked search results, not endorsements. Sovereign Automotive may receive a referral fee from partner platforms.
            </p>
        </section>
    );
}
