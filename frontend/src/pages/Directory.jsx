import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import Header from "@/components/Header";
import CarCard from "@/components/CarCard";
import StatBar from "@/components/StatBar";
import TrendingTicker from "@/components/TrendingTicker";
import SuggestionForm from "@/components/SuggestionForm";

const CATEGORIES = { JDM: "Performance / JDM", EURO: "Everyday / Euro Classic" };

export default function Directory() {
    const [activeCat, setActiveCat] = useState(CATEGORIES.JDM);
    const [cars, setCars] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [yearFrom, setYearFrom] = useState("");
    const [yearTo, setYearTo] = useState("");

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
        let out = cars;
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            out = out.filter((c) => c.car_name.toLowerCase().includes(q));
        }
        if (yearFrom) out = out.filter((c) => new Date(c.launch_date).getFullYear() >= Number(yearFrom));
        if (yearTo) out = out.filter((c) => new Date(c.launch_date).getFullYear() <= Number(yearTo));
        return out;
    }, [cars, query, yearFrom, yearTo]);

    const years = useMemo(() => {
        const ys = new Set(cars.map((c) => new Date(c.launch_date).getFullYear()));
        return Array.from(ys).sort((a, b) => a - b);
    }, [cars]);

    const eligibleCount = filtered.filter((c) => c.is_eligible).length;

    return (
        <div className="relative min-h-screen bg-paper" data-testid="directory-page">
            <Header activeCat={activeCat} onChange={setActiveCat} categories={CATEGORIES} query={query} onQueryChange={setQuery} />
            <TrendingTicker />

            <section className="relative border-b border-[color:var(--sa-border)]" data-testid="hero-section">
                <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-20">
                    <div className="flex items-center gap-3 font-mono-tech text-xs text-[color:var(--sa-text-2)] mb-6">
                        <span className="inline-block w-2 h-2 bg-[color:var(--sa-eligible)] rounded-full" />
                        <span>RETRODRIVE.IE // THE ELITE REGISTRY</span>
                        <span className="text-[color:var(--sa-text-2)] opacity-60">/</span><span>EST. 2026</span>
                    </div>
                    <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-8xl leading-[0.9]" data-testid="hero-title">
                        Thirty years.<br />
                        <span className="text-[color:var(--sa-text-2)]">Two hundred euro.</span><br />
                        One elite registry.
                    </h1>
                    <p className="mt-8 max-w-2xl text-base md:text-lg text-[color:var(--sa-text-2)] leading-relaxed">
                        <span className="text-[color:var(--sa-brg)] font-semibold">The Elite Registry</span> — a hand-curated catalogue of classic JDM &amp; European cars eligible for Ireland's <span className="text-[color:var(--sa-brg)] font-semibold">€200 flat-rate VRT</span> exemption. Heritage data. Live sentiment. Monthly drops.
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

                {!loading && !error && (
                    <div className="flex flex-wrap items-end gap-4 mb-6 pb-4 border-b border-[color:var(--sa-border)]" data-testid="filter-bar">
                        <label className="flex flex-col">
                            <span className="font-mono-tech text-[9px] text-[color:var(--sa-text-2)] tracking-widest mb-1.5">YEAR FROM</span>
                            <select value={yearFrom} onChange={(e) => setYearFrom(e.target.value)}
                                data-testid="filter-year-from"
                                className="bg-[color:var(--sa-surface)] border border-[color:var(--sa-border-strong)] px-3 h-10 font-mono-tech text-xs text-[color:var(--sa-text)] outline-none focus:border-[color:var(--sa-brg)] min-w-[110px]">
                                <option value="">Any</option>
                                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col">
                            <span className="font-mono-tech text-[9px] text-[color:var(--sa-text-2)] tracking-widest mb-1.5">YEAR TO</span>
                            <select value={yearTo} onChange={(e) => setYearTo(e.target.value)}
                                data-testid="filter-year-to"
                                className="bg-[color:var(--sa-surface)] border border-[color:var(--sa-border-strong)] px-3 h-10 font-mono-tech text-xs text-[color:var(--sa-text)] outline-none focus:border-[color:var(--sa-brg)] min-w-[110px]">
                                <option value="">Any</option>
                                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </label>
                        <div className="flex flex-col opacity-60 select-none" title="Price filter unlocks when richer dataset (price/mileage) ships in the next drop">
                            <span className="font-mono-tech text-[9px] text-[color:var(--sa-text-2)] tracking-widest mb-1.5">BUDGET (€)</span>
                            <div className="border border-dashed border-[color:var(--sa-border-strong)] px-3 h-10 flex items-center font-mono-tech text-xs text-[color:var(--sa-text-2)] min-w-[110px]" data-testid="filter-budget-locked">
                                COMING SOON
                            </div>
                        </div>
                        <div className="flex flex-col opacity-60 select-none" title="Mileage filter unlocks when richer dataset (price/mileage) ships in the next drop">
                            <span className="font-mono-tech text-[9px] text-[color:var(--sa-text-2)] tracking-widest mb-1.5">MILEAGE · KM / MI</span>
                            <div className="border border-dashed border-[color:var(--sa-border-strong)] px-3 h-10 flex items-center font-mono-tech text-xs text-[color:var(--sa-text-2)] min-w-[140px]" data-testid="filter-mileage-locked">
                                COMING SOON
                            </div>
                        </div>
                        {(yearFrom || yearTo) && (
                            <button onClick={() => { setYearFrom(""); setYearTo(""); }}
                                data-testid="filter-reset"
                                className="h-10 px-4 font-mono-tech text-[11px] uppercase text-[color:var(--sa-text-2)] hover:text-[color:var(--sa-brg)] underline">
                                Reset
                            </button>
                        )}
                        <div className="ml-auto font-mono-tech text-[11px] text-[color:var(--sa-text-2)] pb-2">
                            <span className="text-[color:var(--sa-brg)] font-bold" data-testid="filter-result-count">{filtered.length}</span> of {cars.length}
                        </div>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && <div className="font-mono-tech text-sm text-[color:var(--sa-text-2)] py-20 text-center" data-testid="empty-state">NO VEHICLES MATCH YOUR FILTERS.</div>}
                {!loading && !error && filtered.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="cars-grid">
                        {filtered.map((car, idx) => <CarCard key={car.id} car={car} index={idx} />)}
                    </div>
                )}

                <SuggestionForm />
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
