import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import LoginDialog from "@/components/LoginDialog";
import SourcingSection from "@/components/SourcingSection";
import { ArrowLeft, ExternalLink, TrendingUp, Minus, TrendingDown, Lock, Timer } from "lucide-react";

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
                <div className="max-w-5xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2 font-mono-tech text-xs text-[color:var(--sa-text-2)] hover:text-[color:var(--sa-brg)]" data-testid="detail-back-link">
                        <ArrowLeft size={14} /> BACK TO REGISTRY
                    </Link>
                    <div className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] tracking-widest">VEHICLE DETAIL</div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 md:pt-14">
                <div className="font-mono-tech text-xs text-[color:var(--sa-text-2)] mb-3" data-testid="detail-category">{car.category.toUpperCase()}</div>
                <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl leading-[0.9] text-[color:var(--sa-brg)]" data-testid="detail-car-name">{car.car_name}</h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[color:var(--sa-border)] border border-[color:var(--sa-border)] mt-10">
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

                <div className="mt-8 inline-flex">
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

                <section className="mt-16 border-t border-[color:var(--sa-border)] pt-10" data-testid="sentiment-section">
                    <div className="flex items-baseline justify-between mb-2">
                        <div>
                            <div className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] tracking-widest mb-1">SENTIMENT INDEX</div>
                            <h2 className="font-heading font-black text-3xl md:text-4xl uppercase text-[color:var(--sa-brg)]">Buy / Hold / Sell</h2>
                        </div>
                        <div className="font-mono-tech text-xs text-[color:var(--sa-text-2)]">
                            <span className="text-[color:var(--sa-brg)] font-bold" data-testid="sentiment-total">{s.total}</span> VOTES
                        </div>
                    </div>
                    <p className="font-mono-tech text-xs text-[color:var(--sa-text-2)] mb-8 max-w-xl">
                        Live community sentiment on this vehicle's investment trajectory.{!user && " Sign in to cast your vote."}
                    </p>

                    <div className="sa-progress-track h-4 flex" data-testid="sentiment-stacked-bar">
                        <div style={{ width: `${s.buy_pct}%`, color: 'var(--sa-buy)' }} className="sa-progress-fill" />
                        <div style={{ width: `${s.hold_pct}%`, color: 'var(--sa-hold)' }} className="sa-progress-fill" />
                        <div style={{ width: `${s.sell_pct}%`, color: 'var(--sa-sell)' }} className="sa-progress-fill" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {["buy", "hold", "sell"].map((key) => {
                            const m = VOTE_META[key], Icon = m.icon;
                            const pct = s[`${key}_pct`], count = s[key], mine = s.user_vote === key;
                            return (
                                <button key={key} onClick={() => onVote(key)} disabled={voting === key}
                                    data-testid={`vote-button-${key}`}
                                    className="group text-left bg-[color:var(--sa-surface)] hover:bg-white p-5 transition disabled:opacity-60"
                                    style={{ border: mine ? `2px solid ${m.color}` : '1px solid var(--sa-border)' }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="inline-flex items-center gap-2 font-heading font-bold uppercase text-lg" style={{ color: m.color }}>
                                            <Icon size={16} /> {m.label}
                                        </div>
                                        {mine && <span className="font-mono-tech text-[10px] uppercase font-bold" style={{color:m.color}} data-testid={`vote-${key}-your-choice`}>YOUR VOTE</span>}
                                        {!user && <Lock size={12} className="text-[color:var(--sa-text-2)]" />}
                                    </div>
                                    <div className="font-mono-tech text-3xl font-bold text-[color:var(--sa-brg)]" data-testid={`vote-${key}-pct`}>{pct.toFixed(1)}%</div>
                                    <div className="font-mono-tech text-[11px] text-[color:var(--sa-text-2)] mt-1">
                                        <span data-testid={`vote-${key}-count`}>{count}</span> vote{count===1?'':'s'}
                                    </div>
                                    <div className="mt-3 sa-progress-track h-2">
                                        <div className="sa-progress-fill" style={{ width: `${pct}%`, color: m.color }} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {!user && (
                        <div className="mt-8 border border-[color:var(--sa-border)] bg-[color:var(--sa-surface)] p-5 flex flex-wrap items-center justify-between gap-4" data-testid="sentiment-login-prompt">
                            <div className="font-mono-tech text-xs text-[color:var(--sa-text-2)]">Sign in with email to cast or change your vote.</div>
                            <button onClick={() => setShowLogin(true)} className="px-4 h-10 bg-[color:var(--sa-brg)] text-[color:var(--sa-bg)] font-heading font-bold uppercase text-xs hover:bg-[color:var(--sa-brg-2)]" data-testid="sentiment-login-button">Sign in to vote</button>
                        </div>
                    )}
                </section>

                <SourcingSection carName={car.car_name} category={car.category} />
            </div>

            <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
        </div>
    );
}
