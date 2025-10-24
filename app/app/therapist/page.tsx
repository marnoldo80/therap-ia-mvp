"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type TherapistRow = {
  display_name: string | null;
  codice_cliente: string | null;
};

type ApptRow = {
  id: string;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  patient_id: string | null;
  patients?: { display_name: string | null }[]; // join supabase restituisce array
};

type GadRow = {
  id: string;
  created_at: string | null;
  total: number | null;
  severity: string | null;
  patient_id: string | null;
  patients?: { display_name: string | null }[];
};

type PatientRow = {
  id: string;
  display_name: string | null;
  created_at: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TherapistHome() {
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [me, setMe] = useState<TherapistRow | null>(null);

  const [nextAppts, setNextAppts] = useState<ApptRow[]>([]);
  const [recentResults, setRecentResults] = useState<GadRow[]>([]);
  const [recentPatients, setRecentPatients] = useState<PatientRow[]>([]);

  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);

      // 1) Utente loggato
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user || null;
      if (!user) {
        router.replace("/login");
        return;
      }
      setEmail(user.email ?? null);

      // 2) I miei dati (tabella therapists)
      {
        const { data, error } = await supabase
          .from("therapists")
          .select("display_name, codice_cliente")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) setErr(error.message);
        setMe((data as TherapistRow) || null);
      }

      // 3) Prossimi appuntamenti (prossimi 5)
      {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from("appointments")
          .select("id, starts_at, ends_at, location, patient_id, patients ( display_name )")
          .eq("therapist_user_id", user.id)
          .gte("starts_at", nowIso)
          .order("starts_at", { ascending: true })
          .limit(5);
        if (error) setErr(error.message);
        setNextAppts((data as ApptRow[]) || []);
      }

      // 4) Ultimi GAD-7 (5) con nome paziente
      {
        const { data, error } = await supabase
          .from("gad7_results")
          .select("id, created_at, total, severity, patient_id, patients ( display_name )")
          .eq("therapist_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (error) setErr(error.message);
        setRecentResults((data as GadRow[]) || []);
      }

      // 5) Ultimi pazienti creati (5)
      {
        const { data, error } = await supabase
          .from("patients")
          .select("id, display_name, created_at")
          .eq("therapist_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (error) setErr(error.message);
        setRecentPatients((data as PatientRow[]) || []);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-[70vh] flex justify-center px-4">
      <div className="w-full max-w-5xl py-8">
        <h1 className="text-2xl font-semibold mb-1">Area Terapeuta</h1>
        <p className="text-sm text-gray-600 mb-6">
          {email ? `Accesso: ${email}` : ""}
        </p>

        {err && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
            {err}
          </div>
        )}

        {/* Sezione: I miei dati */}
        <section className="mb-6 rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">I miei dati</h2>
            <Link
              className="text-sm underline hover:opacity-80"
              href="/app/therapist/onboarding"
            >
              Modifica profilo
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Nome visualizzato</div>
              <div className="font-medium">{me?.display_name || "—"}</div>
            </div>
            <div>
              <div className="text-gray-500">Codice cliente</div>
              <div className="font-medium">{me?.codice_cliente || "—"}</div>
            </div>
          </div>
        </section>

        {/* Azioni rapide */}
        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <Link href="/app/therapist/pazienti" className="rounded-xl border p-4 hover:bg-gray-50">
            <div className="font-semibold">Lista pazienti →</div>
            <div className="text-sm text-gray-600">Visualizza e gestisci i pazienti</div>
          </Link>
          <Link href="/app/therapist/pazienti/nuovo" className="rounded-xl border p-4 hover:bg-gray-50">
            <div className="font-semibold">Aggiungi paziente →</div>
            <div className="text-sm text-gray-600">Crea una nuova scheda</div>
          </Link>
          <Link href="/app/therapist/pazienti" className="rounded-xl border p-4 hover:bg-gray-50">
            <div className="font-semibold">Somministra GAD-7 →</div>
            <div className="text-sm text-gray-600">Avvia da scheda paziente</div>
          </Link>
        </section>

        {/* Prossimi appuntamenti */}
        <section className="mb-6 rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Prossimi appuntamenti</h2>
            <Link href="#" className="text-sm underline pointer-events-none opacity-50">
              Nuovo appuntamento (presto)
            </Link>
          </div>
          {nextAppts.length === 0 ? (
            <div className="text-sm text-gray-600">Nessun appuntamento in calendario.</div>
          ) : (
            <ul className="space-y-2">
              {nextAppts.map(a => {
                const name = a.patients && a.patients[0]?.display_name ? a.patients[0].display_name : "Paziente";
                const when = a.starts_at ? new Date(a.starts_at).toLocaleString() : "—";
                return (
                  <li key={a.id} className="rounded-lg border px-3 py-2">
                    <div className="text-sm">
                      <b>{name}</b> — {when}
                    </div>
                    <div className="text-xs text-gray-500">
                      {a.location || "—"}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Ultimi risultati GAD-7 */}
        <section className="mb-6 rounded-xl border p-4">
          <h2 className="font-semibold mb-2">Ultimi risultati GAD-7</h2>
          {recentResults.length === 0 ? (
            <div className="text-sm text-gray-600">Nessun risultato disponibile.</div>
          ) : (
            <ul className="space-y-2">
              {recentResults.map(r => {
                const name = r.patients && r.patients[0]?.display_name ? r.patients[0].display_name : "Paziente";
                return (
                  <li key={r.id} className="rounded-lg border px-3 py-2">
                    <div className="text-sm">
                      <b>{name}</b> — Totale: {r.total ?? "—"} · Gravità: {r.severity ?? "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Ultimi pazienti */}
        <section className="mb-8 rounded-xl border p-4">
          <h2 className="font-semibold mb-2">Ultimi pazienti creati</h2>
          {recentPatients.length === 0 ? (
            <div className="text-sm text-gray-600">Nessun paziente.</div>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-2">
              {recentPatients.map(p => (
                <li key={p.id} className="rounded-lg border px-3 py-2">
                  <div className="text-sm font-medium">{p.display_name || "Senza nome"}</div>
                  <div className="text-xs text-gray-500">
                    {p.created_at ? new Date(p.created_at).toLocaleString() : ""}
                  </div>
                  <div className="mt-1">
                    <Link
                      className="text-xs underline"
                      href={`/app/therapist/pazienti/${p.id}`}
                    >
                      Apri scheda →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
