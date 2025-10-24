"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type GadRow = {
  id: string;
  total: number | null;
  severity: string | null;
  created_at: string | null;
  patient_id: string | null;
  patients?: { display_name: string | null } | null;
};

type PatientRow = {
  id: string;
  display_name: string | null;
  created_at: string | null;
};

type TherapistProfile = {
  display_name: string | null;
  address: string | null;
  vat_number: string | null;
};

export default function TherapistHome() {
  const router = useRouter();

  const [therapistName, setTherapistName] = useState<string | null>(null);
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [recentResults, setRecentResults] = useState<GadRow[]>([]);
  const [recentPatients, setRecentPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) utente
        const { data: au } = await supabase.auth.getUser();
        const uid = au?.user?.id;
        const email = au?.user?.email ?? null;
        if (!uid) {
          router.replace("/login");
          return;
        }

        // 2) profilo terapeuta
        const { data: t, error: te } = await supabase
          .from("therapists")
          .select("display_name,address,vat_number")
          .eq("user_id", uid)
          .maybeSingle();
        if (te) console.warn("therapists error:", te.message);

        setProfile({
          display_name: t?.display_name ?? null,
          address: t?.address ?? null,
          vat_number: t?.vat_number ?? null,
        });
        setTherapistName(t?.display_name || email);

        // 3) ultimi GAD-7
        const { data: g, error: ge } = await supabase
          .from("gad7_results")
          .select("id,total,severity,created_at,patient_id,patients(display_name)")
          .order("created_at", { ascending: false })
          .limit(5);
        if (ge) throw ge;

        const normG = (g ?? []).map((row: any) => ({
          ...row,
          patients: Array.isArray(row.patients)
            ? row.patients[0] ?? null
            : row.patients ?? null,
        })) as GadRow[];
        setRecentResults(normG);

        // 4) ultimi pazienti
        const { data: p, error: pe } = await supabase
          .from("patients")
          .select("id,display_name,created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        if (pe) throw pe;
        setRecentPatients(p ?? []);
      } catch (e: any) {
        setErr(e?.message || "Errore");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">
        {therapistName ? `Ciao, ${therapistName}` : "Area Terapeuta"}
      </h1>

      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-700 px-4 py-2">
          {err}
        </div>
      )}

      {/* Profilo terapeuta */}
      <section className="rounded-lg border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500">Profilo terapeuta</div>
            <div className="mt-1 font-medium">
              {profile?.display_name || therapistName || "—"}
            </div>
            <div className="text-sm text-gray-600">
              {profile?.address ? profile.address : "Indirizzo non impostato"}
            </div>
            <div className="text-sm text-gray-600">
              {profile?.vat_number
                ? `P. IVA: ${profile.vat_number}`
                : "P. IVA non impostata"}
            </div>
          </div>
          <a
            href="/app/therapist/onboarding"
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Modifica profilo
          </a>
        </div>
      </section>

      {loading ? (
        <div className="text-gray-500">Caricamento…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="rounded-lg border p-4">
            <h2 className="font-medium mb-3">Ultimi risultati GAD-7</h2>
            <ul className="space-y-2">
              {(recentResults ?? []).length === 0 && (
                <li className="text-sm text-gray-500">Nessun risultato.</li>
              )}
              {(recentResults ?? []).map((r) => (
                <li key={r.id} className="rounded border px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {r.patients?.display_name || "Paziente"} —{" "}
                        <span className="font-normal">score: {r.total ?? "-"}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.severity || "-"} •{" "}
                        {r.created_at
                          ? new Date(r.created_at).toLocaleString()
                          : "-"}
                      </div>
                    </div>
                    {r.patient_id && (
                      <a
                        className="text-sm underline"
                        href={`/app/therapist/pazienti/${r.patient_id}`}
                      >
                        Apri paziente
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="font-medium mb-3">Pazienti recenti</h2>
            <ul className="space-y-2">
              {(recentPatients ?? []).length === 0 && (
                <li className="text-sm text-gray-500">Nessun paziente.</li>
              )}
              {(recentPatients ?? []).map((p) => (
                <li
                  key={p.id}
                  className="rounded border px-3 py-2 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{p.display_name || "—"}</div>
                    <div className="text-xs text-gray-500">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                  <a
                    className="text-sm underline"
                    href={`/app/therapist/pazienti/${p.id}`}
                  >
                    Apri
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
