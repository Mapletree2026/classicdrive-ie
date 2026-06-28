import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import LoginDialog from "@/components/LoginDialog";
import { ArrowLeft, ExternalLink, TrendingUp, Minus, TrendingDown, Lock } from "lucide-react";

function formatDate(iso) {
    try {
        return new Date(iso).toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
    } catch {
        return iso;
    }
}

const VOTE_META = {
    buy: { label: "Buy", color: "#00ff66", icon: TrendingUp },
    hold: { label: "Hold", color: "#ffaa00", icon: Minus },
    sell: { label: "Sell", color: "#ff5500", icon: TrendingDown },
};

export default function CarDetail() {
    const { carId } = useParams();
    const { user } = useAuth();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [voting, setVoting] = useState(null);
    const [showLogin, setShowLogin] = useState(false);

    const load = () =>
        api
            .get(`/cars/${carId}`)
            .then(({ data }) => setCar(data))
            .catch((e) => setError(e?.response?.data?.detail || e.message))
            .finally(() => setLoading(false));

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [carId, user?.id]);

    const onVote = async (sentiment) => {
        if (!user) {
            setShowLogin(true);
            return;
        }
        setVoting(sentiment);
        try {
            const { data } = await api.post(`/cars/${carId}/vote`, { sentiment });
            setCar((prev) => (prev ? { ...prev, sentiment: data } : prev));
        } catch (e) {
            setError(e?.response?.data?.detail || "Vote failed");
        } finally {
            setVoting(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center font-mono-tech text-sm text-white/40" data-testid="detail-loading">
                LOADING VEHICLE...
            </div>
        );
    }
    if (error || !car) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4" data-testid="detail-error">
                <div className="font-heading font-bold text-2xl uppercase text-[#ff5500]">{error || "Not found"}</div>
                <Link to="/" className="font-mono-tech text-xs text-white/60 underline">
                    Back to directory
                </Link>
            </div>
        );
    }

    const s = car.sentiment || { buy: 0, hold: 0, sell: 0, total: 0, buy_pct: 0, hold_pct: 0, sell_pct: 0, user_vote: null };

    return (
        <div className="min-h-screen pb-20" data-testid="car-detail-page">
            <div className="border-b border-white/10 sticky top-0 z-40 bg-[#050505]">
                <div className="max-w-5xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2 font-mono-tech text-xs text-white/60 hover:text-white" data-testid="detail-back-link">
                        <ArrowLeft size={14} /> BACK TO REGISTRY
                    </Link>
                    <div className="font-mono-tech text-[10px] text-white/40 tracking-widest">VEHICLE DETAIL</div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 md:pt-14">
                <div className="font-mono-tech text-xs text-white/40 mb-3" data-testid="detail-category">
                    {car.category.toUpperCase()}
                </div>
                <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl leading-[0.9]" data-testid="detail-car-name">
                    {car.car_name}
                </h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10 mt-10">
                    {[
                        { label: "LAUNCH YEAR", value: new Date(car.launch_date).getFullYear() },
                        { label: "VRT FREEDOM DATE", value: formatDate(car.vrt_freedom_date) },
                        { label: "STATUS", value: car.is_eligible ? "ELIGIBLE" : "PENDING", color: car.is_eligible ? "text-[#00ff66]" : "text-[#ff5500]" },
                        { label: "TIME LEFT", value: car.is_eligible ? "—" : (car.countdown_display || "—") },
                    ].map((it) => (
                        <div key={it.label} className="bg-[#0a0a0a] px-5 py-4">
                            <div className="font-mono-tech text-[10px] text-white/40 mb-2">{it.label}</div>
                            <div className={`font-heading font-bold text-lg ${it.color || "text-white"}`}>{it.value}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 inline-flex">
                    {car.is_eligible ? (
                        <div className="inline-flex items-center gap-2 px-3 py-2 text-sm font-heading font-bold uppercase bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30" data-testid="detail-badge-eligible">
                            👑 €200 FLAT VRT ELIGIBLE
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-2 text-sm font-heading font-bold uppercase bg-[#ff5500]/10 text-[#ff5500] border border-[#ff5500]/30" data-testid="detail-badge-active">
                            ⏳ COUNTDOWN ACTIVE
                        </div>
                    )}
                </div>

                {car.external_link && (
                    <a
                        href={car.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1 font-mono-tech text-xs text-white/60 hover:text-white"
                    >
                        <ExternalLink size={12} /> SOURCE
                    </a>
                )}

                {/* Sentiment Index */}
                <section className="mt-16 border-t border-white/10 pt-10" data-testid="sentiment-section">
                    <div className="flex items-baseline justify-between mb-2">
                        <div>
                            <div className="font-mono-tech text-[10px] text-white/40 tracking-widest mb-1">SENTIMENT INDEX</div>
                            <h2 className="font-heading font-black text-3xl md:text-4xl uppercase">Buy / Hold / Sell</h2>
                        </div>
                        <div className="font-mono-tech text-xs text-white/40">
                            <span className="text-white font-bold" data-testid="sentiment-total">{s.total}</span> VOTES
                        </div>
                    </div>
                    <p className="font-mono-tech text-xs text-white/40 mb-8 max-w-xl">
                        Live community sentiment on this vehicle's investment trajectory. {!user && "Sign in to cast your vote."}
                    </p>

                    {/* Stacked bar */}
                    <div className="h-3 w-full bg-[#0a0a0a] border border-white/10 flex" data-testid="sentiment-stacked-bar">
                        <div className="h-full bg-[#00ff66] transition-all duration-300" style={{ width: `${s.buy_pct}%` }} />
                        <div className="h-full bg-[#ffaa00] transition-all duration-300" style={{ width: `${s.hold_pct}%` }} />
                        <div className="h-full bg-[#ff5500] transition-all duration-300" style={{ width: `${s.sell_pct}%` }} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {["buy", "hold", "sell"].map((key) => {
                            const meta = VOTE_META[key];
                            const Icon = meta.icon;
                            const pct = s[`${key}_pct`];
                            const count = s[key];
                            const isUserChoice = s.user_vote === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => onVote(key)}
                                    disabled={voting === key}
                                    data-testid={`vote-button-${key}`}
                                    className={[
                                        "group text-left border bg-[#0a0a0a] hover:bg-[#111111] p-5 transition-colors duration-150 disabled:opacity-60",
                                        isUserChoice ? "border-white" : "border-white/15 hover:border-white/30",
                                    ].join(" ")}
                                    style={isUserChoice ? { boxShadow: `inset 0 0 0 1px ${meta.color}` } : undefined}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="inline-flex items-center gap-2 font-heading font-bold uppercase text-lg" style={{ color: meta.color }}>
                                            <Icon size={16} /> {meta.label}
                                        </div>
                                        {isUserChoice && (
                                            <span className="font-mono-tech text-[10px] uppercase text-white/60" data-testid={`vote-${key}-your-choice`}>
                                                YOUR VOTE
                                            </span>
                                        )}
                                        {!user && (
                                            <Lock size={12} className="text-white/30" />
                                        )}
                                    </div>
                                    <div className="font-mono-tech text-3xl font-bold text-white" data-testid={`vote-${key}-pct`}>
                                        {pct.toFixed(1)}%
                                    </div>
                                    <div className="font-mono-tech text-[11px] text-white/40 mt-1">
                                        <span data-testid={`vote-${key}-count`}>{count}</span> vote{count === 1 ? "" : "s"}
                                    </div>
                                    <div className="mt-3 h-1 bg-white/5 overflow-hidden">
                                        <div className="h-full transition-all duration-300" style={{ width: `${pct}%`, background: meta.color }} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {!user && (
                        <div className="mt-8 border border-white/15 bg-[#0a0a0a] p-5 flex flex-wrap items-center justify-between gap-4" data-testid="sentiment-login-prompt">
                            <div className="font-mono-tech text-xs text-white/60">
                                Sign in with email to cast or change your vote.
                            </div>
                            <button
                                onClick={() => setShowLogin(true)}
                                className="px-4 h-10 bg-white text-black font-heading font-bold uppercase text-xs hover:bg-white/90"
                                data-testid="sentiment-login-button"
                            >
                                Sign in to vote
                            </button>
                        </div>
                    )}
                </section>
            </div>

            <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
        </div>
    );
}
