import { useState } from "react";
import api from "@/lib/api";
import { Send, CheckCircle2, Loader2 } from "lucide-react";

const CATS = ["Performance / JDM", "Everyday / Euro Classic"];

export default function SuggestionForm() {
    const [carName, setCarName] = useState("");
    const [category, setCategory] = useState("");
    const [notes, setNotes] = useState("");
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!carName.trim()) return;
        setSubmitting(true); setError("");
        try {
            await api.post("/suggestions", {
                car_name: carName.trim(),
                category: category || undefined,
                notes: notes.trim() || undefined,
                email: email.trim().toLowerCase() || undefined,
            });
            setDone(true);
        } catch (err) {
            const d = err?.response?.data?.detail;
            setError(typeof d === "string" ? d : "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="mt-16 border-t border-[color:var(--sa-border)] pt-12" data-testid="suggestion-section">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10">
                <div>
                    <div className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] tracking-widest mb-2">COMMUNITY DROPS</div>
                    <h2 className="font-heading font-black text-3xl md:text-4xl uppercase text-[color:var(--sa-brg)] leading-tight">
                        Suggest a car
                    </h2>
                    <p className="font-mono-tech text-xs text-[color:var(--sa-text-2)] mt-3 leading-relaxed max-w-sm">
                        Spotted a classic that belongs in The Elite Registry? Drop it below — curated additions ship in monthly drops.
                    </p>
                </div>

                {done ? (
                    <div className="bg-[color:var(--sa-surface)] border border-[color:var(--sa-eligible)] p-6 flex items-center gap-3" data-testid="suggestion-success">
                        <CheckCircle2 size={20} style={{ color: 'var(--sa-eligible)' }} />
                        <div>
                            <div className="font-heading font-bold uppercase text-[color:var(--sa-brg)]">Submitted</div>
                            <div className="font-mono-tech text-xs text-[color:var(--sa-text-2)] mt-1">
                                Thanks — we review every submission for the next drop.
                            </div>
                        </div>
                        <button
                            onClick={() => { setDone(false); setCarName(""); setCategory(""); setNotes(""); setEmail(""); }}
                            className="ml-auto font-mono-tech text-xs text-[color:var(--sa-text-2)] hover:text-[color:var(--sa-brg)] underline"
                            data-testid="suggestion-add-another"
                        >
                            Suggest another
                        </button>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[color:var(--sa-surface)] border border-[color:var(--sa-border)] p-6" data-testid="suggestion-form">
                        <label className="md:col-span-2 block">
                            <span className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] tracking-widest">CAR NAME *</span>
                            <input
                                required value={carName} onChange={(e) => setCarName(e.target.value)}
                                placeholder="e.g. 1995 Toyota Supra RZ"
                                className="mt-2 w-full bg-[color:var(--sa-surface-2)] border border-[color:var(--sa-border-strong)] px-3 h-11 font-mono-tech text-sm text-[color:var(--sa-text)] outline-none focus:border-[color:var(--sa-brg)]"
                                data-testid="suggestion-car-name"
                            />
                        </label>
                        <label className="block">
                            <span className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] tracking-widest">CATEGORY</span>
                            <select
                                value={category} onChange={(e) => setCategory(e.target.value)}
                                className="mt-2 w-full bg-[color:var(--sa-surface-2)] border border-[color:var(--sa-border-strong)] px-3 h-11 font-mono-tech text-sm text-[color:var(--sa-text)] outline-none focus:border-[color:var(--sa-brg)]"
                                data-testid="suggestion-category"
                            >
                                <option value="">Select…</option>
                                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] tracking-widest">YOUR EMAIL (OPTIONAL)</span>
                            <input
                                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="mt-2 w-full bg-[color:var(--sa-surface-2)] border border-[color:var(--sa-border-strong)] px-3 h-11 font-mono-tech text-sm text-[color:var(--sa-text)] outline-none focus:border-[color:var(--sa-brg)]"
                                data-testid="suggestion-email"
                            />
                        </label>
                        <label className="md:col-span-2 block">
                            <span className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] tracking-widest">WHY IT BELONGS (OPTIONAL)</span>
                            <textarea
                                value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                                placeholder="A short note on what makes this car registry-worthy…"
                                className="mt-2 w-full bg-[color:var(--sa-surface-2)] border border-[color:var(--sa-border-strong)] px-3 py-2 font-mono-tech text-sm text-[color:var(--sa-text)] outline-none focus:border-[color:var(--sa-brg)] resize-none"
                                data-testid="suggestion-notes"
                            />
                        </label>
                        {error && <div className="md:col-span-2 font-mono-tech text-xs" style={{color:'var(--sa-sell)'}} data-testid="suggestion-error">{error}</div>}
                        <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
                            <span className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)]">
                                Submissions are reviewed for the next monthly drop.
                            </span>
                            <button
                                type="submit" disabled={submitting || !carName.trim()}
                                className="h-11 px-6 bg-[color:var(--sa-brg)] text-[color:var(--sa-bg)] font-heading font-bold uppercase text-sm hover:bg-[color:var(--sa-brg-2)] disabled:opacity-50 inline-flex items-center gap-2"
                                data-testid="suggestion-submit"
                            >
                                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                {submitting ? "Submitting…" : "Submit suggestion"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
}
