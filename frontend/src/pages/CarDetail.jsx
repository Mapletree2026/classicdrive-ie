import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import LoginDialog from "@/components/LoginDialog";
import SourcingSection from "@/components/SourcingSection";
import NotifyWidget from "@/components/NotifyWidget";
import VRTDisclaimer from "@/components/VRTDisclaimer";
import { getCarImage } from "@/lib/images";
import { ArrowLeft, TrendingUp, Minus, TrendingDown, Lock, Timer, ChevronDown } from "lucide-react";

function formatDate(iso) {
    try { return new Date(iso).toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(); }
    catch { return iso; }
}

const VOTE_META = {
    buy:  { label: "Buy",  color: "var(--sa-buy)",  soft: "var(--sa-buy-soft)",  icon: TrendingUp },
    hold: { label: "Hold", color: "var(--sa-hold)", soft: "var(--sa-hold-soft)", icon: Minus },
    sell: { label: "Sell", color: "var(--sa-sell)", soft: "var(--sa-sell-soft)", icon: TrendingDown },
};

export default function CarDetail() {
    const { carId } = useParams();
    const { user } = useAuth();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [voting, setVoting] = useState(null);
    const [showLogin, setShowLogin] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.get(`/cars/${carId}`)
            .then(({ data }) => setCar(data))
            .catch((e) => setError(e?.response?.data?.detail || e.message))
            .finally(() => setLoading(false));
    }, [carId, user?.id]);

    const onVote = async (sentiment) => {
        if (!user) { setShowLogin(true); return; }
        setVoting(sentiment);
        try {
            const { data } = await api.post(`/cars/${carId}/vote`, { sentiment });
            setCar((p) => p ? { ...p, sentiment: data } : p);
        } catch (e) { setError(e?.response?.data?.detail || "Vote failed"); }
        finally { setVoting(null); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-mono-tech text-sm text-[color:var(--sa-text-2)]" data-testid="detail-loading">LOADING VEHICLE...</div>;
    if (error || !car) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-paper" data-testid="detail-error">
            <div className="font-heading font-bold text-2xl uppercase" style={{color:'var(--sa-sell)'}}>{error || "Not found"}</div>
            <Link to="/" className="font-mono-tech text-xs text-[color:var(--sa-text-2)] underline">Back to directory</Link>
        </div>
    );

    const s = car.sentiment || { buy:0, hold:0, sell:0, total:0, buy_pct:0, hold_pct:0, sell_pct:0, user_vote:null };

    return (
        <div className="min-h-screen pb-20 bg-paper" data-testid="car-detail-page">
            <div className="border-b border-[color:var(--sa-border)] sticky top-0 z-40 bg-[color:var(--sa-bg)]">
                <div className="max-w-5xl mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2 font-mono-tech text-xs text-[color:var(--sa-text-2)] hover:text-[color:var(--sa-brg)]" data-testid="detail-back-link">
                        <ArrowLeft size={14} /> BACK TO REGISTRY
                    </Link>
                    <div className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] tracking-widest">VEHICLE DETAIL</div>
                </div>
            </div>

            {/* Hero image + title */}
            <div className="relative" data-testid="detail-hero">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <img src={getCarImage(car)} alt={car.car_name} className="w-full h-full object-cover" data-testid="detail-car-image" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,49,37,0.55) 0%, rgba(11,49,37,0.92) 100%)" }} />
                </div>
                <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-8">
                    <div className="font-mono-tech text-xs mb-3" style={{ color: "rgba(247,243,233,0.7)" }} data-testid="detail-category">{car.category.toUpperCase()}</div>
                    <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl leading-[0.95]" style={{ color: "#F7F3E9" }} data-testid="detail-car-name">{car.car_name}</h1>
                    <div className="mt-6 inline-flex">
                        {car.is_eligible ? (
                            <div className="inline-flex items-center gap-2 px-3 py-2 text-sm font-heading font-bold uppercase"
                                style={{ background: 'var(--sa-eligible-soft)', color: 'var(--sa-eligible)', border: '1.5px solid var(--sa-eligible)' }}
                                data-testid="detail-badge-eligible">👑 €200 FLAT VRT ELIGIBLE</div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-2 text-sm font-heading font-black uppercase sa-stopwatch tracking-wider"
                                style={{ background: 'var(--sa-amber-soft)', color: 'var(--sa-amber)', border: '1.5px solid var(--sa-amber)' }}
                                data-testid="detail-badge-active"><Timer size={14}/>⏳ COUNTDOWN ACTIVE</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 md:px-10 pt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[color:var(--sa-border)] border border-[color:var(--sa-border)]">
                    {[
                        { label: "LAUNCH YEAR", value: new Date(car.launch_date).getFullYear() },
                        { label: "VRT FREEDOM DATE", value: formatDate(car.vrt_freedom_date) },
                        { label: "STATUS", value: car.is_eligible ? "ELIGIBLE" : "PENDING", color: car.is_eligible ? 'var(--sa-eligible)' : 'var(--sa-amber)' },
                        { label: "TIME LEFT", value: car.is_eligible ? "—" : (car.countdown_display || "—") },
                    ].map((it) => (
                        <div key={it.label} className="bg-[color:var(--sa-surface)] px-5 py-4">
                            <div className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] mb-2">{it.label}</div>
                            <div className="font-heading font-bold text-lg" style={{ color: it.color || 'var(--sa-brg)' }}>{it.value}</div>
                        </div>
                    ))}
                </div>

                <VRTDisclaimer />

                {/* Two-column layout: where-to-buy + notify on left, compact sentiment on right */}
                <div className="mt-10 grid lg:grid-cols-[1fr_320px] gap-10 items-start">
                    <div className="space-y-10">
                        <SourcingSection carName={car.car_name} category={car.category} />
                        {!car.is_eligible && (
                            <NotifyWidget
                                carId={car.id}
                                carName={car.car_name}
                                countdownDisplay={car.countdown_display}
                            />
                        )}
                    </div>

                    <aside
                        className="lg:sticky lg:top-20 border border-[color:var(--sa-border)] bg-[color:var(--sa-surface)]"
                        data-testid="sentiment-section"
                    >
                        <details open={false}>
                            <summary className="list-none cursor-pointer p-4 flex items-center justify-between gap-3 hover:bg-white transition" data-testid="sentiment-toggle">
                                <div>
                                    <div className="font-mono-tech text-[10px] tracking-widest text-[color:var(--sa-text-2)] mb-0.5">
                                        COMMUNITY SENTIMENT
                                    </div>
                                    <div className="font-heading font-bold text-base text-[color:var(--sa-brg)]">
                                        Buy / Hold / Sell
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)]">VOTES</div>
                                    <div className="font-heading font-bold text-lg text-[color:var(--sa-brg)]" data-testid="sentiment-total">{s.total}</div>
                                </div>
                                <ChevronDown size={14} className="text-[color:var(--sa-text-2)]" />
                            </summary>

                            <div className="px-4 pb-4 pt-1 border-t border-[color:var(--sa-border)] space-y-3">
                                <div className="sa-progress-track h-3 flex" data-testid="sentiment-stacked-bar">
                                    <div style={{ width: `${s.buy_pct}%`, color: 'var(--sa-buy)' }} className="sa-progress-fill" />
                                    <div style={{ width: `${s.hold_pct}%`, color: 'var(--sa-hold)' }} className="sa-progress-fill" />
                                    <div style={{ width: `${s.sell_pct}%`, color: 'var(--sa-sell)' }} className="sa-progress-fill" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {["buy", "hold", "sell"].map((key) => {
                                        const m = VOTE_META[key], Icon = m.icon;
                                        const pct = s[`${key}_pct`], count = s[key], mine = s.user_vote === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => onVote(key)}
                                                disabled={voting === key}
                                                data-testid={`vote-button-${key}`}
                                                className="text-center bg-white hover:bg-[color:var(--sa-surface-2)] py-2 px-1 transition disabled:opacity-60"
                                                style={{ border: mine ? `2px solid ${m.color}` : '1px solid var(--sa-border)' }}
                                            >
                                                <div className="inline-flex items-center gap-1 font-heading font-bold uppercase text-[11px]" style={{ color: m.color }}>
                                                    <Icon size={11} /> {m.label}
                                                </div>
                                                <div className="font-mono-tech text-base font-bold text-[color:var(--sa-brg)] mt-0.5" data-testid={`vote-${key}-pct`}>{pct.toFixed(0)}%</div>
                                                <div className="font-mono-tech text-[9px] text-[color:var(--sa-text-2)]" data-testid={`vote-${key}-count`}>{count}</div>
                                                {mine && <div className="font-mono-tech text-[8px] uppercase font-bold mt-0.5" style={{color:m.color}} data-testid={`vote-${key}-your-choice`}>YOURS</div>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {!user && (
                                    <button
                                        onClick={() => setShowLogin(true)}
                                        className="w-full h-9 inline-flex items-center justify-center gap-2 bg-[color:var(--sa-brg)] text-[color:var(--sa-bg)] font-heading font-bold uppercase text-[11px] hover:bg-[color:var(--sa-brg-2)]"
                                        data-testid="sentiment-login-button"
                                    >
                                        <Lock size={11} /> Sign in to vote
                                    </button>
                                )}
                            </div>
                        </details>
                    </aside>
                </div>
            </div>

            <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
        </div>
    );
}
