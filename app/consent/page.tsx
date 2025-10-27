// app/consent/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type InviteState = {
  ok: boolean;
  reason?: string;
  patientId?: string;
  hasPrivacyConsent?: boolean;
  onboardingCompleted?: boolean;
};

export default function ConsentPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [privacy, setPrivacy] = useState(false);
  const [tos, setTos] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Controlla stato invito all'apertura
  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError("Token mancante o non valido.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/invite/state?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const st: InviteState = await res.json();
        if (!st.ok) {
          setError(st.reason === "expired" ? "Invito scaduto." : "Link non valido.");
          setLoading(false);
          return;
        }
        // Se privacy già accettata, salta direttamente all'onboarding
        if (st.hasPrivacyConsent) {
          router.replace(`/onboarding?token=${encodeURIComponent(token)}`);
          return;
        }
      } catch (e) {
        setError("Errore di verifica invito.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token, router]);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (!privacy) {
        setError("Devi accettare la privacy per procedere.");
        setSubmitting(false);
        return;
      }
      const consents = [
        { consentType: "privacy", accepted: privacy },
        { consentType: "tos", accepted: tos },
        { consentType: "analytics", accepted: analytics },
      ].filter(c => c.accepted);

      const res = await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteToken: token || undefined, consents }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Errore invio consensi");

      router.replace(`/onboarding?token=${encodeURIComponent(token)}`);
    } catch (e: any) {
      setError(e?.message ?? "Errore imprevisto");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Verifica invito…</h1>
        <p className="text-sm text-gray-600">Controllo del token in corso.</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-semibold mb-3">Consensi</h1>
        <p className="text-sm text-amber-700">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Consensi</h1>
      <p className="text-sm text-gray-600 mb-6">
        Conferma i consensi per proseguire.
      </p>

      <div className="space-y-4 mb-6">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
          <span>Accetto l’<strong>Informativa Privacy</strong> (obbligatorio)</span>
        </label>

        <label className="flex items-start gap-3">
          <input type="checkbox" checked={tos} onChange={(e) => setTos(e.target.checked)} />
          <span>Accetto i <strong>Termini di Servizio</strong></span>
        </label>

        <label className="flex items-start gap-3">
          <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
          <span>Consento l’uso di dati di utilizzo <strong>anonimi</strong> per analisi</span>
        </label>
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting || !token}
        className="px-4 py-2 rounded-lg border shadow disabled:opacity-60"
      >
        {submitting ? "Invio in corso..." : "Conferma e continua"}
      </button>
    </main>
  );
}
