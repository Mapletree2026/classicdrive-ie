import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Bell, CheckCircle2, Users } from "lucide-react";

export default function NotifyWidget({ carId, carName, countdownDisplay }) {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(null); // { watchers, already_subscribed }
    const [watchers, setWatchers] = useState(0);

    useEffect(() => {
        let alive = true;
        api.get(`/cars/${carId}/notify/count`)
            .then(({ data }) => { if (alive) setWatchers(data.watchers || 0); })
            .catch(() => {});
        return () => { alive = false; };
    }, [carId]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!email || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            const { data } = await api.post(`/cars/${carId}/notify`, { email });
            setDone(data);
            setWatchers(data.watchers || 0);
        } catch (err) {
            setError(err?.response?.data?.detail || "Could not subscribe. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section
            className="mt-16 border-t border-[color:var(--sa-border)] pt-10"
            data-testid="notify-section"
        >
            <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                <div>
                    <div className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] tracking-widest mb-1">
                        VRT FREEDOM ALERT
                    </div>
                    <h2 className="font-heading font-black text-3xl md:text-4xl uppercase text-[color:var(--sa-brg)]">
                        Notify me at €200
                    </h2>
                </div>
                <div
                    className="inline-flex items-center gap-2 font-mono-tech text-xs text-[color:var(--sa-text-2)]"
                    data-testid="notify-watchers"
                >
                    <Users size={12} />
                    <span className="text-[color:var(--sa-brg)] font-bold" data-testid="notify-watchers-count">
                        {watchers}
                    </span>{" "}
                    watching
                </div>
            </div>

            <p className="font-mono-tech text-xs text-[color:var(--sa-text-2)] mb-6 max-w-xl">
                Drop your email and we&apos;ll ping you the moment the{" "}
                <span className="text-[color:var(--sa-brg)] font-bold">{carName}</span> crosses the
                30-year line and qualifies for Ireland&apos;s €200 flat-rate VRT.{" "}
                {countdownDisplay && (
                    <span className="block mt-1 text-[color:var(--sa-amber)] font-bold">
                        Currently: {countdownDisplay}
                    </span>
                )}
            </p>

            {done ? (
                <div
                    className="border bg-[color:var(--sa-eligible-soft)] p-5 flex items-start gap-3"
                    style={{ borderColor: "var(--sa-eligible)" }}
                    data-testid="notify-success"
                >
                    <CheckCircle2 size={20} style={{ color: "var(--sa-eligible)" }} className="shrink-0 mt-0.5" />
                    <div>
                        <div className="font-heading font-bold uppercase text-base" style={{ color: "var(--sa-eligible)" }}>
                            {done.already_subscribed ? "You're already on the list" : "You're on the list"}
                        </div>
                        <div className="font-mono-tech text-xs text-[color:var(--sa-text-2)] mt-1">
                            We&apos;ll email you the day this car becomes VRT-eligible. No spam, single notification.
                        </div>
                    </div>
                </div>
            ) : (
                <form
                    onSubmit={onSubmit}
                    className="flex flex-col sm:flex-row gap-3 max-w-xl"
                    data-testid="notify-form"
                >
                    <div className="relative flex-1">
                        <Bell
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--sa-text-2)]"
                        />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full h-12 pl-9 pr-3 bg-[color:var(--sa-surface)] border border-[color:var(--sa-border)] font-mono-tech text-sm text-[color:var(--sa-brg)] placeholder:text-[color:var(--sa-text-2)] focus:outline-none focus:border-[color:var(--sa-brg)]"
                            data-testid="notify-email-input"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="h-12 px-6 bg-[color:var(--sa-brg)] text-[color:var(--sa-bg)] font-heading font-bold uppercase text-xs tracking-wider hover:bg-[color:var(--sa-brg-2)] disabled:opacity-60"
                        data-testid="notify-submit-button"
                    >
                        {submitting ? "Subscribing..." : "Notify Me"}
                    </button>
                </form>
            )}

            {error && (
                <div
                    className="mt-3 font-mono-tech text-xs"
                    style={{ color: "var(--sa-sell)" }}
                    data-testid="notify-error"
                >
                    {error}
                </div>
            )}
        </section>
    );
}
