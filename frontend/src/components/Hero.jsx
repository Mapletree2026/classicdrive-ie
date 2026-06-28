import { useEffect, useState } from "react";
import { HERO_IMAGES } from "@/lib/images";
import { ArrowRight } from "lucide-react";

export default function Hero({ stats }) {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setIdx((i) => (i + 1) % HERO_IMAGES.length), 7000);
        return () => clearInterval(t);
    }, []);

    return (
        <section className="relative overflow-hidden border-b border-[color:var(--sa-border)]" data-testid="hero-section">
            {/* Image stack with crossfade */}
            <div className="absolute inset-0 z-0">
                {HERO_IMAGES.map((src, i) => (
                    <img
                        key={src}
                        src={src}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms]"
                        style={{ opacity: i === idx ? 1 : 0 }}
                        aria-hidden
                    />
                ))}
                {/* Dark BRG tint for legibility */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(110deg, rgba(11,49,37,0.92) 0%, rgba(11,49,37,0.78) 45%, rgba(11,49,37,0.45) 100%)",
                    }}
                />
                <div className="absolute inset-0 sa-grain opacity-40" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-12 md:pb-16">
                <div className="flex items-center gap-3 font-mono-tech text-[11px] tracking-widest mb-6" style={{ color: "rgba(247,243,233,0.7)" }}>
                    <span className="inline-block w-2 h-2 bg-[color:var(--sa-eligible)] rounded-full animate-pulse" />
                    <span>CLASSICDRIVE.IE · IRELAND&apos;S CLASSIC HUB</span>
                </div>

                <h1
                    className="font-heading font-black uppercase leading-[0.92] tracking-tight"
                    style={{ color: "#F7F3E9", fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
                    data-testid="hero-title"
                >
                    The romance<br />
                    <span style={{ color: "var(--sa-amber)" }}>of the open road</span><br />
                    is still legal.
                </h1>

                <p
                    className="mt-6 max-w-xl leading-relaxed italic"
                    style={{
                        color: "rgba(247,243,233,0.92)",
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: "clamp(1.05rem, 1.6vw, 1.35rem)",
                        fontWeight: 400,
                        letterSpacing: "0.005em",
                    }}
                    data-testid="hero-lead"
                >
                    Hand-cranked windows. Engines you can hear think.
                    The classics never went away &mdash; they just got cheaper to import.
                </p>

                {/* Compressed stat row */}
                <div
                    className="mt-10 inline-flex flex-wrap items-stretch gap-px overflow-hidden"
                    style={{ background: "rgba(247,243,233,0.18)" }}
                    data-testid="hero-stat-row"
                >
                    {stats && [
                        { label: "30 YRS", sub: "to flat VRT" },
                        { label: "€200", sub: "Cat C rate" },
                        { label: stats.total ?? "—", sub: "in the registry", testid: "hero-total" },
                        { label: stats.pending ?? "—", sub: "active countdowns", testid: "hero-pending" },
                    ].map((s, i) => (
                        <div
                            key={i}
                            className="px-5 py-3"
                            style={{ background: "rgba(11,49,37,0.85)" }}
                            data-testid={s.testid}
                        >
                            <div className="font-heading font-black text-xl md:text-2xl" style={{ color: "#F7F3E9" }}>
                                {s.label}
                            </div>
                            <div className="font-mono-tech text-[9px] uppercase tracking-widest mt-0.5" style={{ color: "rgba(247,243,233,0.6)" }}>
                                {s.sub}
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    className="mt-8 font-mono-tech text-[11px] uppercase tracking-widest inline-flex items-center gap-2"
                    style={{ color: "rgba(247,243,233,0.7)" }}
                    data-testid="hero-subtitle"
                >
                    <ArrowRight size={12} />
                    <span>30 Years. €200. One Elite Destination.</span>
                </div>
            </div>
        </section>
    );
}
