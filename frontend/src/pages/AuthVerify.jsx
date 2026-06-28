import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function AuthVerify() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const navigate = useNavigate();
    const { setSession } = useAuth();
    const [state, setState] = useState("loading"); // loading | ok | error
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) {
            setState("error");
            setError("Missing token");
            return;
        }
        api
            .get(`/auth/verify`, { params: { token } })
            .then(({ data }) => {
                setSession(data.access_token, data.user);
                setState("ok");
                setTimeout(() => navigate("/", { replace: true }), 800);
            })
            .catch((err) => {
                const d = err?.response?.data?.detail;
                setError(typeof d === "string" ? d : "Verification failed");
                setState("error");
            });
    }, [token, navigate, setSession]);

    return (
        <div className="min-h-screen flex items-center justify-center px-6" data-testid="auth-verify-page">
            <div className="w-full max-w-md border border-white/15 bg-[#0a0a0a] p-8">
                <div className="font-mono-tech text-[10px] text-white/40 tracking-widest mb-4">
                    CLASSICDRIVE.IE · AUTH
                </div>
                {state === "loading" && (
                    <div className="flex items-center gap-3 text-white" data-testid="auth-verify-loading">
                        <Loader2 className="animate-spin" size={18} />
                        <span className="font-heading font-bold uppercase">Verifying link...</span>
                    </div>
                )}
                {state === "ok" && (
                    <div className="flex items-center gap-3 text-[#00ff66]" data-testid="auth-verify-success">
                        <CheckCircle2 size={18} />
                        <span className="font-heading font-bold uppercase">Signed in. Redirecting...</span>
                    </div>
                )}
                {state === "error" && (
                    <div data-testid="auth-verify-error">
                        <div className="flex items-center gap-3 text-[#ff5500] mb-3">
                            <AlertTriangle size={18} />
                            <span className="font-heading font-bold uppercase">{error}</span>
                        </div>
                        <button
                            onClick={() => navigate("/")}
                            className="font-mono-tech text-xs text-white/60 hover:text-white underline"
                        >
                            Return to directory
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
