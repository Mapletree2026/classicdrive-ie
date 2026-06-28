import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Header from "@/components/Header";
import CarCard from "@/components/CarCard";
import StatBar from "@/components/StatBar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORIES = {
    JDM: "Performance / JDM",
    EURO: "Everyday / Euro Classic",
};

export default function Directory() {
    const [activeCat, setActiveCat] = useState(CATEGORIES.JDM);
    const [cars, setCars] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        axios
            .get(`${API}/cars`, { params: { category: activeCat } })
            .then((res) => {
                if (!cancelled) setCars(res.data || []);
            })
            .catch((e) => {
                if (!cancelled) setError(e?.message || "Failed to load cars");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [activeCat]);

    useEffect(() => {
        axios
            .get(`${API}/cars/stats`)
            .then((res) => setStats(res.data))
            .catch(() => {});
    }, []);

    const filtered = useMemo(() => {
        if (!query.trim()) return cars;
        const q = query.trim().toLowerCase();
        return cars.filter((c) => c.car_name.toLowerCase().includes(q));
    }, [cars, query]);

    const eligibleCount = filtered.filter((c) => c.is_eligible).length;

    return (
        <div className="relative min-h-screen" data-testid="directory-page">
            <Header
                activeCat={activeCat}
                onChange={setActiveCat}
                categories={CATEGORIES}
                query={query}
                onQueryChange={setQuery}
            />

            {/* Hero */}
            <section className="relative border-b border-white/10" data-testid="hero-section">
                <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-20">
                    <div className="flex items-center gap-3 font-mono-tech text-xs text-white/50 mb-6">
                        <span className="inline-block w-2 h-2 bg-[#00ff66]" />
                        <span>IRELAND // VRT FREEDOM REGISTRY</span>
                        <span className="text-white/30">/</span>
                        <span>EST. 2026</span>
                    </div>
                    <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-8xl leading-[0.9] tracking-tight" data-testid="hero-title">
                        Thirty years.<br />
                        <span className="text-white/40">Two hundred euro.</span><br />
                        One registry.
                    </h1>
                    <p className="mt-8 max-w-2xl text-base md:text-lg text-white/60 leading-relaxed">
                        Track every classic eligible for Ireland's <span className="text-white">€200 flat-rate VRT</span> exemption. Live countdowns. Sharp data. No fluff.
                    </p>

                    {stats && <StatBar stats={stats} />}
                </div>

                {/* ticker */}
                <div className="border-t border-white/10 overflow-hidden bg-[#0a0a0a]">
                    <div className="flex sa-marquee whitespace-nowrap py-3 font-mono-tech text-xs text-white/40">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="flex shrink-0 gap-12 pr-12">
                                {[
                                    "VRT FREEDOM — 30 YEARS FROM REGISTRATION",
                                    "FLAT RATE — €200",
                                    "JDM // EURO CLASSIC",
                                    "REVENUE.IE // SECTION 135C",
                                    "LIVE COUNTDOWN ENGINE",
                                    "SOVEREIGN AUTOMOTIVE",
                                ].map((t, j) => (
                                    <span key={j}>◆ {t}</span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Directory grid */}
            <section className="max-w-7xl mx-auto px-6 md:px-10 py-12" data-testid="directory-section">
                <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8 pb-4 border-b border-white/10">
                    <div>
                        <div className="font-mono-tech text-xs text-white/40 mb-1">CATEGORY</div>
                        <h2 className="font-heading font-black text-3xl md:text-4xl" data-testid="active-category-title">
                            {activeCat}
                        </h2>
                    </div>
                    <div className="flex items-center gap-6 font-mono-tech text-xs">
                        <div>
                            <span className="text-white/40">TOTAL</span>{" "}
                            <span className="text-white font-bold" data-testid="total-count">{filtered.length}</span>
                        </div>
                        <div>
                            <span className="text-white/40">ELIGIBLE</span>{" "}
                            <span className="text-[#00ff66] font-bold" data-testid="eligible-count">{eligibleCount}</span>
                        </div>
                        <div>
                            <span className="text-white/40">PENDING</span>{" "}
                            <span className="text-[#ff5500] font-bold" data-testid="pending-count">{filtered.length - eligibleCount}</span>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="font-mono-tech text-sm text-white/40 py-20 text-center" data-testid="loading-state">
                        LOADING REGISTRY...
                    </div>
                )}

                {error && (
                    <div className="font-mono-tech text-sm text-[#ff5500] py-20 text-center" data-testid="error-state">
                        {error.toUpperCase()}
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="font-mono-tech text-sm text-white/40 py-20 text-center" data-testid="empty-state">
                        NO VEHICLES MATCH YOUR FILTERS.
                    </div>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="cars-grid">
                        {filtered.map((car, idx) => (
                            <CarCard
                                key={car.id}
                                car={car}
                                index={idx}
                            />
                        ))}
                    </div>
                )}
            </section>

            <footer className="border-t border-white/10 py-8 px-6 md:px-10" data-testid="footer">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 font-mono-tech text-xs text-white/40">
                    <div>© {new Date().getFullYear()} SOVEREIGN AUTOMOTIVE</div>
                    <div>VRT_REGISTRY // v1.0 // IRELAND</div>
                </div>
            </footer>
        </div>
    );
}
