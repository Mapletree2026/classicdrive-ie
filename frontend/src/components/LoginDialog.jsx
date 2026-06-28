import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import api from "@/lib/api";
import { Mail, Loader2, CheckCircle2, ExternalLink } from "lucide-react";

export default function LoginDialog({ open, onOpenChange }) {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [devLink, setDevLink] = useState(null);
    const [error, setError] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!email.trim()) return;
        setSubmitting(true);
        try {
            const { data } = await api.post("/auth/request-link", { email: email.trim().toLowerCase() });
            setSent(true);
            if (data.magic_link) setDevLink(data.magic_link);
        } catch (err) {
            const d = err?.response?.data?.detail;
            setError(typeof d === "string" ? d : "Failed to send link.");
        } finally {
            setSubmitting(false);
        }
    };

    const reset = () => {
        setSent(false);
        setEmail("");
        setDevLink(null);
        setError("");
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) reset();
                onOpenChange(v);
            }}
        >
            <DialogContent
                className="bg-[#0a0a0a] border border-white/15 rounded-none text-white max-w-md p-0"
                data-testid="login-dialog"
            >
                <div className="border-b border-white/10 px-6 py-5">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-black text-2xl uppercase tracking-wide">
                            Sign in
                        </DialogTitle>
                        <DialogDescription className="font-mono-tech text-xs text-white/50 mt-1">
                            EMAIL MAGIC LINK · NO PASSWORD
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6">
                    {!sent ? (
                        <form onSubmit={onSubmit} className="space-y-4" data-testid="login-form">
                            <label className="block">
                                <span className="font-mono-tech text-[10px] text-white/40 tracking-widest">EMAIL</span>
                                <div className="flex items-center gap-2 border border-white/15 bg-[#050505] px-3 h-11 mt-2">
                                    <Mail size={14} className="text-white/40" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="bg-transparent outline-none font-mono-tech text-sm text-white placeholder:text-white/30 w-full"
                                        data-testid="login-email-input"
                                        autoFocus
                                    />
                                </div>
                            </label>
                            {error && (
                                <div className="font-mono-tech text-xs text-[#ff5500]" data-testid="login-error">
                                    {error}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-11 bg-white text-black font-heading font-bold uppercase text-sm hover:bg-white/90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                data-testid="login-submit-button"
                            >
                                {submitting && <Loader2 size={14} className="animate-spin" />}
                                {submitting ? "Sending..." : "Send magic link"}
                            </button>
                            <p className="font-mono-tech text-[10px] text-white/40 leading-relaxed pt-2">
                                We'll email you a one-time link. Browsing & filtering are always public — sign in only to vote on the Sentiment Index.
                            </p>
                        </form>
                    ) : (
                        <div data-testid="login-sent-state" className="space-y-4">
                            <div className="flex items-center gap-2 text-[#00ff66]">
                                <CheckCircle2 size={18} />
                                <span className="font-heading font-bold uppercase">Link sent</span>
                            </div>
                            <p className="font-mono-tech text-xs text-white/60 leading-relaxed">
                                We sent a magic link to{" "}
                                <span className="text-white">{email}</span>. It expires in 15 minutes.
                            </p>
                            {devLink && (
                                <div className="border border-[#ff5500]/30 bg-[#ff5500]/5 p-3">
                                    <div className="font-mono-tech text-[10px] text-[#ff5500] uppercase tracking-widest mb-2">
                                        DEV MODE · Click the link to sign in
                                    </div>
                                    <a
                                        href={devLink}
                                        className="font-mono-tech text-xs text-white underline break-all inline-flex items-center gap-1"
                                        data-testid="login-dev-magic-link"
                                    >
                                        <ExternalLink size={12} /> Open magic link
                                    </a>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={reset}
                                className="font-mono-tech text-xs text-white/50 hover:text-white"
                                data-testid="login-restart-button"
                            >
                                Use a different email
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
