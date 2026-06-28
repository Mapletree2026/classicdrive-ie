import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Flame, Timer, ChevronRight, ArrowRight } from "lucide-react";

function Skeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="most-watched-skeleton">
            {[0, 1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="bg-[color:var(--sa-surface)] border border-[color:var(--sa-border)] p-5 h-[180px] animate-pulse"
                />
            ))}
        </div>
    );
}

export default function MostWatchedCarousel() {
    const [items, setItems] = useState(null);
    const [error, setError] = useState(null);
    const scrollerRef = useRef(null);

    useEffect(() => {
        let alive = true;
        api.get("/cars/most-watched", { params: { limit: 8 } })
            .then(({ data }) => { if (alive) setItems(data || []); })
            .catch((e) => { if (alive) setError(e?.message); });
        return () => { alive = false; };
    }, []);

    if (error) return null;
    if (items === null) {
        return (
            <section className="border-b border-[color:var(--sa-border)] bg-paper" data-testid="most-watched-section">
                <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
                    <Skeleton />
                </div>
            </section>
        );
    }
    if (items.length === 0) return null;

    const scrollBy = (dx) => {
        if (scrollerRef.current) {
            scrollerRef.current.scrollBy({ left: dx, behavior: "smooth" });
        }
    };

    return (
        <section
            className="border-b border-[color:var(--sa-border)] bg-paper"
            data-testid="most-watched-section"
        >
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-4 border-b border-[color:var(--sa-border)]">
                    <div>
                        <div className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] tracking-widest mb-1">
                            VRT FREEDOM WATCHLIST
                        </div>
                        <h2 className="font-heading font-black text-3xl md:text-4xl uppercase text-[color:var(--sa-brg)] flex items-center gap-2" data-testid="most-watched-title">
                            <Flame size={22} style={{ color: "var(--sa-amber)" }} />
                            Most-Watched Releases
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="font-mono-tech text-[11px] text-[color:var(--sa-text-2)] hidden sm:block">
                            Sorted by community interest · closest to €200 VRT
                        </div>
                        <div className="hidden md:flex items-center gap-1">
                            <button
                                onClick={() => scrollBy(-400)}
                                aria-label="Scroll left"
                                className="w-9 h-9 inline-flex items-center justify-center border border-[color:var(--sa-border-strong)] hover:border-[color:var(--sa-brg)] hover:text-[color:var(--sa-brg)]"
                                data-testid="most-watched-scroll-left"
                            >
                                <ChevronRight size={16} className="rotate-180" />
                            </button>
                            <button
                                onClick={() => scrollBy(400)}
                                aria-label="Scroll right"
                                className="w-9 h-9 inline-flex items-center justify-center border border-[color:var(--sa-border-strong)] hover:border-[color:var(--sa-brg)] hover:text-[color:var(--sa-brg)]"
                                data-testid="most-watched-scroll-right"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    ref={scrollerRef}
                    className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none scrollbar-thin -mx-6 md:mx-0 px-6 md:px-0 pb-2 md:pb-0"
                    data-testid="most-watched-scroller"
                >
                    {items.map((c, idx) => (
                        <Link
                            key={c.id}
                            to={`/car/${c.id}`}
                            className="group snap-start shrink-0 w-[78vw] sm:w-[60vw] md:w-auto bg-[color:var(--sa-surface)] hover:bg-white border border-[color:var(--sa-border)] hover:border-[color:var(--sa-brg)] p-5 transition flex flex-col gap-3"
                            data-testid={`most-watched-card-${idx}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono-tech text-[9px] uppercase tracking-widest text-[color:var(--sa-text-2)]">
                                    {c.category}
                                </span>
                                <span
                                    className="inline-flex items-center gap-1 font-mono-tech text-[10px] font-bold px-2 py-1"
                                    style={{
                                        background: "var(--sa-amber-soft)",
                                        color: "var(--sa-amber)",
                                        border: "1px solid var(--sa-amber)",
                                    }}
                                    data-testid={`most-watched-watchers-${idx}`}
                                >
                                    <Flame size={10} /> {c.watchers} {c.watchers === 1 ? "watching" : "watching"}
                                </span>
                            </div>

                            <div className="font-heading font-black text-lg md:text-xl leading-tight text-[color:var(--sa-brg)] group-hover:underline" data-testid={`most-watched-name-${idx}`}>
                                {c.car_name}
                            </div>

                            <div className="mt-auto pt-3 border-t border-[color:var(--sa-border)] flex items-center justify-between">
                                <div className="inline-flex items-center gap-1.5 font-mono-tech text-[11px]" style={{ color: "var(--sa-amber)" }}>
                                    <Timer size={12} />
                                    <span data-testid={`most-watched-countdown-${idx}`}>{c.countdown_display}</span>
                                </div>
                                <ArrowRight size={14} className="text-[color:var(--sa-text-2)] group-hover:text-[color:var(--sa-brg)] group-hover:translate-x-0.5 transition" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
