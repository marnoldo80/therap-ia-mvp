"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type GadRow = {
  id: string;
  created_at: string | null;
  total: number | null;
  severity: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PazienteHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [gadResults, setGadResults] = useState<GadRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null); setMsg(null);
      // 1) Utente
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user || null;
      if (!user) { router.replace("/login"); return; }
      setEmail(user.email ?? null);

      // 2) Trova il record paziente collegato a questa email (MVP: primo match)
      let patientId: string | null = null;
      if (user.email) {
        const { data: pRes, error: pErr } = await supabase
          .from("patients")
          .select("id, display_name")
          .eq("email", user.email)
          .limit(1)
          .maybeSingle();
        if (pErr) setErr(pErr.message);
        if (pRes?.id) {
          patientId = pRes.id;
          setDisplayName(pRes.display_name || "");
        }
      }

      // 3) Carica ultimi GAD-7
      if (patientId) {
        const { data: gRes, error: gErr } = await supabase
          .from("gad7_results")
          .select("id, created_at, total, severity")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false })
          .limit(5);
        if (gErr) setErr(gErr.message);
        setGadResults(gRes || []);
      }

      setLoading(false);
    })();
  }, [router]);

  async function logout() {
    setErr(null); setMsg(null);
    const { error } = await supabase.auth.signOut();
    if (error) { setErr(error.message); return; }
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-600">
        Caricamento…
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Area Paziente</h1>
          <button
            onClick={logout}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Esci
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Benvenuto{displayName ? `, ${displayName}` : email ? `, ${email}` : ""}.
        </p>

        {err && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{err}</div>}
        {msg && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">{msg}</div>}

        <div className="grid gap-4">
          <section className="rounded-lg border p-4">
            <h2 className="font-semibold mb-2">I tuoi dati</h2>
            <div className="text-sm text-gray-700">
              <div>Nome visualizzato: <b>{displayName || "—"}</b></div>
              <div>Email: <b>{email || "—"}</b></div>
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="font-semibold mb-2">Questionari (ultimi GAD-7)</h2>
            {gadResults.length === 0 ? (
              <div className="text-sm text-gray-600">Nessun risultato disponibile.</div>
            ) : (
              <ul className="space-y-2">
                {gadResults.map(r => (
                  <li key={r.id} className="rounded-md border px-3 py-2">
                    <div className="text-sm">
                      <b>Totale:</b> {r.total ?? "—"} &nbsp;·&nbsp; <b>Gravità:</b> {r.severity ?? "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="font-semibold mb-2">Piano terapeutico</h2>
            <div className="text-sm text-gray-600">In arrivo nell’MVP (obiettivi, compiti, scadenze).</div>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="font-semibold mb-2">Appuntamenti</h2>
            <div className="text-sm text-gray-600">In arrivo nell’MVP (prossime sedute).</div>
          </section>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 underline">Torna alla home</a>
        </div>
      </div>
    </div>
  );
}
