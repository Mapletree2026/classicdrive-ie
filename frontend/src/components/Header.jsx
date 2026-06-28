import { useState } from "react";
import { Search, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import LoginDialog from "@/components/LoginDialog";

export default function Header({ activeCat, onChange, categories, query, onQueryChange }) {
    const { user, logout } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    return (
        <header className="sticky top-0 z-50 bg-[color:var(--sa-bg)] border-b border-[color:var(--sa-border)]" data-testid="site-header">
            <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-6">
                <a href="/" className="flex items-center gap-2 shrink-0" data-testid="brand-logo">
                    <div className="w-7 h-7 bg-[color:var(--sa-brg)] flex items-center justify-center">
                        <span className="text-[color:var(--sa-bg)] font-heading font-black text-sm leading-none">S</span>
                    </div>
                    <div className="leading-none">
                        <div className="font-heading font-black text-base text-[color:var(--sa-brg)] tracking-wide">RETRODRIVE</div>
                        <div className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] tracking-widest">.IE · IRISH CLASSIC &amp; JDM</div>
                    </div>
                </a>
                {categories && (
                    <nav className="hidden md:flex border border-[color:var(--sa-border-strong)] bg-[color:var(--sa-surface)] p-1" role="tablist" data-testid="category-toggle">
                        {Object.entries(categories).map(([key, label]) => {
                            const active = activeCat === label;
                            return (
                                <button key={key} onClick={() => onChange(label)} role="tab" aria-selected={active}
                                    data-testid={`category-toggle-${key.toLowerCase()}`}
                                    className={["px-5 py-2 font-heading font-bold text-sm uppercase transition-colors duration-150",
                                        active ? "bg-[color:var(--sa-brg)] text-[color:var(--sa-bg)]"
                                               : "text-[color:var(--sa-text-2)] hover:text-[color:var(--sa-brg)] hover:bg-[color:var(--sa-surface-2)]"].join(" ")}>
                                    {label}
                                </button>);
                        })}
                    </nav>
                )}
                <div className="flex items-center gap-3">
                    {onQueryChange && (
                        <div className="hidden lg:flex items-center gap-2 border border-[color:var(--sa-border)] bg-[color:var(--sa-surface)] px-3 h-10 min-w-[220px]">
                            <Search size={14} className="text-[color:var(--sa-text-2)]" />
                            <input type="text" placeholder="Search vehicles..." value={query} onChange={(e) => onQueryChange(e.target.value)}
                                className="bg-transparent outline-none font-mono-tech text-xs text-[color:var(--sa-text)] placeholder:text-[color:var(--sa-text-2)] w-full" data-testid="search-input" />
                        </div>
                    )}
                    {user ? (
                        <div className="flex items-center gap-2 border border-[color:var(--sa-border)] bg-[color:var(--sa-surface)] h-10 px-3" data-testid="user-menu">
                            <User size={13} className="text-[color:var(--sa-text-2)]" />
                            <span className="font-mono-tech text-[11px] text-[color:var(--sa-text)] truncate max-w-[140px]" data-testid="user-email">{user.email}</span>
                            <button onClick={logout} className="text-[color:var(--sa-text-2)] hover:text-[color:var(--sa-sell)]" data-testid="logout-button" aria-label="Sign out"><LogOut size={13} /></button>
                        </div>
                    ) : (
                        <button onClick={() => setShowLogin(true)}
                            className="h-10 px-4 bg-[color:var(--sa-brg)] text-[color:var(--sa-bg)] font-heading font-bold uppercase text-xs hover:bg-[color:var(--sa-brg-2)]" data-testid="header-login-button">
                            Sign in
                        </button>
                    )}
                </div>
            </div>
            {categories && (
                <div className="md:hidden border-t border-[color:var(--sa-border)] px-4 py-3 flex gap-2" data-testid="category-toggle-mobile">
                    {Object.entries(categories).map(([key, label]) => {
                        const active = activeCat === label;
                        return (
                            <button key={key} onClick={() => onChange(label)} data-testid={`category-toggle-mobile-${key.toLowerCase()}`}
                                className={["flex-1 py-2 font-heading font-bold text-xs uppercase border",
                                    active ? "bg-[color:var(--sa-brg)] text-[color:var(--sa-bg)] border-[color:var(--sa-brg)]"
                                           : "text-[color:var(--sa-text)] border-[color:var(--sa-border-strong)]"].join(" ")}>
                                {label}
                            </button>);
                    })}
                </div>
            )}
            <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
        </header>
    );
}
