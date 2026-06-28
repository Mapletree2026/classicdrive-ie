import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import Header from "@/components/Header";
import CarCard from "@/components/CarCard";
import StatBar from "@/components/StatBar";
import TrendingTicker from "@/components/TrendingTicker";

const CATEGORIES = { JDM: "Performance / JDM", EURO: "Everyday / Euro Classic" };

export default function Directory() {
    const [activeCat, setActiveCat] = useState(CATEGORIES.JDM);
    const [cars, setCars] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        let c = false;
        setLoading(true); setError(null);
        api.get(`/cars`, { params: { category: activeCat } })
            .then(({ data }) => { if (!c) setCars(data || []); })
            .catch((e) => { if (!c) setError(e?.message); })
            .finally(() => { if (!c) setLoading(false); });
        return () => { c = true; };
    }, [activeCat]);

    useEffect(() => { api.get(`/cars/stats`).then(({ data }) => setStats(data)).catch(() => {}); }, []);

    const filtered = useMemo(() => {
        if (!query.trim()) return cars;
        const q = query.trim().toLowerCase();
        return cars.filter((c) => c.car_name.toLowerCase().includes(q));
    }, [cars, query]);

    const eligibleCount = filtered.filter((c) => c.is_eligible).length;

    return (
        <div className="relative min-h-screen bg-paper" data-testid="directory-page">
            <Header activeCat={activeCat} onChange={setActiveCat} categories={CATEGORIES} query={query} onQueryChange={setQuery} />
            <TrendingTicker />

            <section className="relative border-b border-[color:var(--sa-border)]" data-testid="hero-section">
                <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-20">
                    <div className="flex items-center gap-3 font-mono-tech text-xs text-[color:var(--sa-text-2)] mb-6">
                        <span className="inline-block w-2 h-2 bg-[color:var(--sa-eligible)] rounded-full" />
                        <span>IRELAND // VRT FREEDOM REGISTRY</span>
                        <span className="text-[color:var(--sa-text-2)] opacity-60">/</span><span>EST. 2026</span>
                    </div>
                    <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-8xl leading-[0.9]" data-testid="hero-title">
                        Thirty years.<br />
                        <span className="text-[color:var(--sa-text-2)]">Two hundred euro.</span><br />
                        One registry.
                    </h1>
                    <p className="mt-8 max-w-2xl text-base md:text-lg text-[color:var(--sa-text-2)] leading-relaxed">
                        Track every classic eligible for Ireland's <span className="text-[color:var(--sa-brg)] font-semibold">€200 flat-rate VRT</span> exemption. Heritage data. Live sentiment.
                    </p>
                    {stats && <StatBar stats={stats} />}
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 md:px-10 py-12" data-testid="directory-section">
                <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8 pb-4 border-b border-[color:var(--sa-border)]">
                    <div>
                        <div className="font-mono-tech text-xs text-[color:var(--sa-text-2)] mb-1">CATEGORY</div>
                        <h2 className="font-heading font-black text-3xl md:text-4xl text-[color:var(--sa-brg)]" data-testid="active-category-title">{activeCat}</h2>
                    </div>
                    <div className="flex items-center gap-6 font-mono-tech text-xs">
                        <div><span className="text-[color:var(--sa-text-2)]">TOTAL</span> <span className="text-[color:var(--sa-brg)] font-bold" data-testid="total-count">{filtered.length}</span></div>
                        <div><span className="text-[color:var(--sa-text-2)]">ELIGIBLE</span> <span className="font-bold" style={{color:'var(--sa-eligible)'}} data-testid="eligible-count">{eligibleCount}</span></div>
                        <div><span className="text-[color:var(--sa-text-2)]">PENDING</span> <span className="font-bold" style={{color:'var(--sa-amber)'}} data-testid="pending-count">{filtered.length - eligibleCount}</span></div>
                    </div>
                </div>

                {loading && <div className="font-mono-tech text-sm text-[color:var(--sa-text-2)] py-20 text-center" data-testid="loading-state">LOADING REGISTRY...</div>}
                {error && <div className="font-mono-tech text-sm py-20 text-center" style={{color:'var(--sa-sell)'}} data-testid="error-state">{error.toUpperCase()}</div>}
                {!loading && !error && filtered.length === 0 && <div className="font-mono-tech text-sm text-[color:var(--sa-text-2)] py-20 text-center" data-testid="empty-state">NO VEHICLES MATCH YOUR FILTERS.</div>}
                {!loading && !error && filtered.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="cars-grid">
                        {filtered.map((car, idx) => <CarCard key={car.id} car={car} index={idx} />)}
                    </div>
                )}
            </section>

            <footer className="border-t border-[color:var(--sa-border)] py-8 px-6 md:px-10" data-testid="footer">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 font-mono-tech text-xs text-[color:var(--sa-text-2)]">
                    <div>© {new Date().getFullYear()} RETRODRIVE.IE · IRISH CLASSIC &amp; JDM REGISTRY</div>
                    <div>VRT_REGISTRY // v1.2 // IRELAND</div>
                </div>
            </footer>
        </div>
    );
}
