import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import LanguageToggle from "@/components/LanguageToggle";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language !== "en";
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase recovery link redirects with a session in the URL hash; the
    // client picks it up automatically. We just wait until a session exists.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(t("auth.passwordMin"));
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => navigate({ to: "/" }), 1500);
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-[#050609] text-slate-100 flex items-center justify-center px-4"
    >
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-3"><LanguageToggle /></div>
        <div className="bg-[#0a0d14]/80 backdrop-blur-md border border-amber-500/20 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-center text-transparent bg-clip-text bg-gradient-to-l from-amber-200 via-amber-400 to-amber-600 mb-6">
            {t("auth.resetTitle")}
          </h1>

          {done ? (
            <p className="text-emerald-400 text-sm text-center font-bold">
              {t("auth.passwordUpdated")}
            </p>
          ) : !ready ? (
            <p className="text-slate-400 text-sm text-center">…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs p-3 rounded-xl text-center font-bold">
                  {error}
                </div>
              )}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t("auth.newPassword")}
                </label>
                <input
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#050609] border border-slate-800 text-sm text-slate-200 rounded-xl p-3 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-black text-sm py-3.5 rounded-xl transition"
              >
                {t("auth.updatePassword")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}