import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function TrendingTicker() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        api.get("/cars/trending", { params: { limit: 10 } })
            .then(({ data }) => setItems(data || []))
            .catch(() => setItems([]));
    }, []);

    if (items.length === 0) return null;

    const renderItem = (it, idx) => {
        const lead =
            it.buy_pct >= it.hold_pct && it.buy_pct >= it.sell_pct ? "buy"
          : it.sell_pct >= it.hold_pct ? "sell" : "hold";
        const Icon = lead === "buy" ? TrendingUp : lead === "sell" ? TrendingDown : Minus;
        const color = lead === "buy" ? "var(--sa-buy)" : lead === "sell" ? "var(--sa-sell)" : "var(--sa-hold)";
        return (
            <Link
                key={`${it.car_id}-${idx}`}
                to={`/car/${it.car_id}`}
                className="group inline-flex items-center gap-3 px-5 border-r border-[color:var(--sa-border)] hover:bg-white"
                data-testid={`ticker-item-${it.car_id}`}
            >
                <Icon size={14} style={{ color }} />
                <span className="font-heading font-bold uppercase text-sm text-[color:var(--sa-text)] whitespace-nowrap">
                    {it.car_name}
                </span>
                {it.total > 0 ? (
                    <span className="font-mono-tech text-[11px]" style={{ color }}>
                        {lead.toUpperCase()} {Math[lead === "buy" ? "round" : lead === "sell" ? "round" : "round"](
                            lead === "buy" ? it.buy_pct : lead === "sell" ? it.sell_pct : it.hold_pct
                        )}%
                    </span>
                ) : (
                    <span className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)]">NEW</span>
                )}
                <span className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)]">
                    · {it.total} {it.total === 1 ? "vote" : "votes"}
                </span>
            </Link>
        );
    };

    return (
        <div
            className="border-y border-[color:var(--sa-border)] bg-[color:var(--sa-surface)] overflow-hidden"
            data-testid="trending-ticker"
        >
            <div className="max-w-7xl mx-auto flex items-stretch">
                <div className="shrink-0 px-5 py-3 bg-[color:var(--sa-brg)] text-[color:var(--sa-bg)] flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-[color:var(--sa-amber)] rounded-full sa-stopwatch" />
                    <span className="font-heading font-black uppercase text-xs tracking-widest whitespace-nowrap">
                        Trending Market Sentiment
                    </span>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <div className="flex sa-marquee-fast whitespace-nowrap py-3">
                        {[0, 1].map((cycle) => (
                            <div key={cycle} className="flex shrink-0">
                                {items.map((it, idx) => renderItem(it, idx + cycle * items.length))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
