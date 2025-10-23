"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type Patient = { id: string; display_name: string | null };
type GadRow = {
  id: string;
  total: number | null;
  severity: string | null;
  created_at: string | null;
  patient_id: string | null;
  patients?: { display_name: string | null } | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TherapistDashboard() {
  const [name, setName] = useState<string>("");
  const [recentResults, setRecentResults] = useState<GadRow[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        setLoading(true);

        // 1) Utente loggato
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) throw new Error("Sessione non valida.");

        // 2) Nome terapeuta
        const { data: t, error: te } = await supabase
          .from("therapists")
          .select("display_name")
          .eq("user_id", user.id)
          .single();
        if (te) throw te;
        setName(t?.display_name || "Terapeuta");

        // 3) Ultimi 5 risultati GAD-7
        const { data: g, error: ge } = await supabase
          .from("gad7_results")
          .select("id,total,severity,created_at,patient_id,patients(display_name)")
          .eq("therapist_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (ge) throw ge;

        // Normalizza: se patients è un array, prendi il primo elemento
        const normalized: GadRow[] = (g || []).map((r: any) => ({
          id: r.id,
          total: r.total,
          severity: r.severity,
          created_at: r.created_at,
          patient_id: r.patient_id,
          patients: Array.isArray(r.patients) ? (r.patients[0] || null) : r.patients ?? null,
        }));
        setRecentResults(normalized);

        // 4) Ultimi 5 pazienti creati
        const { data: p, error: pe } = await supabase
          .from("patients")
          .select("id,display_name")
          .eq("therapist_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (pe) throw pe;
        setRecentPatients((p || []) as Patient[]);
      } catch (e: any) {
        setErr(e?.message || "Errore");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ciao, {name}</h1>
        <div className="flex gap-3">
          <Link href="/app/therapist/pazienti" className="rounded border px-3 py-2 hover:bg-gray-50">
            + Nuovo / Lista pazienti
          </Link>
        </div>
      </div>

      {err && (
        <div className="rounded border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          {err}
        </div>
      )}

      {loading ? (
        <div className="rounded border px-4 py-6">Caricamento…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Riquadro ultimi risultati */}
          <section className="rounded border p-4">
            <h2 className="font-medium mb-3">Ultimi GAD-7</h2>
            <ul className="space-y-2">
              {recentResults.length === 0 && <li className="text-sm text-gray-500">Nessun risultato.</li>}
              {recentResults.map(r => (
                <li key={r.id} className="rounded border px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm">
                        Paziente:{" "}
                        <span className="font-medium">
                          {r.patients?.display_name || r.patient_id || "—"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(r.created_at || "").toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Score: <b>{r.total ?? "—"}</b></div>
                      <div className="text-xs text-gray-600">{r.severity || "—"}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-right">
              <Link href="/app/therapist/pazienti" className="text-sm underline">
                Vai ai pazienti
              </Link>
            </div>
          </section>

          {/* Riquadro ultimi pazienti */}
          <section className="rounded border p-4">
            <h2 className="font-medium mb-3">Ultimi pazienti</h2>
            <ul className="space-y-2">
              {recentPatients.length === 0 && <li className="text-sm text-gray-500">Nessun paziente.</li>}
              {recentPatients.map(p => (
                <li key={p.id} className="rounded border px-3 py-2 flex items-center justify-between">
                  <span>{p.display_name || p.id}</span>
                  <Link
                    href={`/app/therapist/pazienti/${p.id}`}
                    className="text-sm underline"
                  >
                    Apri scheda
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-right">
              <Link href="/app/therapist/pazienti" className="text-sm underline">
                Gestisci pazienti
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
