"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TherapistDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [therapist, setTherapist] = useState<any>(null);
  const [gadResults, setGadResults] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) {
          router.push("/login");
          return;
        }

        // PROFILO TERAPEUTA
        const { data: tData, error: tErr } = await supabase
          .from("therapists")
          .select("display_name,address,vat_number")
          .eq("user_id", user.id)
          .maybeSingle();
        if (tErr) throw tErr;
        setTherapist(tData || { display_name: user.email });

        // ULTIMI RISULTATI GAD-7
        const { data: gData, error: gErr } = await supabase
          .from("gad7_results")
          .select("id,total,severity,created_at,patient_id,patients(display_name)")
          .order("created_at", { ascending: false })
          .limit(5);
        if (gErr) throw gErr;

        const results = (gData ?? []).map((r: any) => ({
          ...r,
          patient_name: Array.isArray(r.patients)
            ? r.patients[0]?.display_name
            : r.patients?.display_name,
        }));
        setGadResults(results);

        // ULTIMI PAZIENTI
        const { data: pData, error: pErr } = await supabase
          .from("patients")
          .select("id,display_name,created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        if (pErr) throw pErr;
        setPatients(pData ?? []);

        // APPUNTAMENTI
        const { data: aData, error: aErr } = await supabase
          .from("appointments")
          .select("id,date,time,patient_id,patients(display_name)")
          .order("date", { ascending: true })
          .limit(5);
        if (aErr) {
          // se non esiste la tabella, ignora
          console.warn("appointments table missing, skipping");
        } else {
          const mapped = (aData ?? []).map((a: any) => ({
            ...a,
            patient_name: Array.isArray(a.patients)
              ? a.patients[0]?.display_name
              : a.patients?.display_name,
          }));
          setAppointments(mapped);
        }
      } catch (e: any) {
        setError(e.message || "Errore");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">
        {therapist?.display_name
          ? `Ciao, ${therapist.display_name}`
          : "Area Terapeuta"}
      </h1>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-700 px-4 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Caricamento...</p>
      ) : (
        <>
          {/* PROFILO TERAPEUTA */}
          <section className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Profilo terapeuta</div>
                <div className="font-medium">{therapist?.display_name}</div>
                <div className="text-sm text-gray-600">
                  {therapist?.address || "Indirizzo non impostato"}
                </div>
                <div className="text-sm text-gray-600">
                  {therapist?.vat_number
                    ? `P. IVA: ${therapist.vat_number}`
                    : "P. IVA non impostata"}
                </div>
              </div>
              <a
                href="/app/therapist/onboarding"
                className="border px-3 py-2 rounded-md text-sm hover:bg-gray-50"
              >
                Modifica profilo
              </a>
            </div>
          </section>

          {/* SEZIONI DASHBOARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ultimi risultati GAD-7 */}
            <section className="rounded-lg border p-4">
              <h2 className="font-medium mb-3">Ultimi risultati GAD-7</h2>
              <ul className="space-y-2">
                {gadResults.length === 0 && (
                  <li className="text-sm text-gray-500">Nessun risultato.</li>
                )}
                {gadResults.map((r) => (
                  <li key={r.id} className="border rounded px-3 py-2">
                    <div className="font-medium">
                      {r.patient_name || "Paziente"} — score {r.total}
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.severity || "-"} •{" "}
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                    {r.patient_id && (
                      <a
                        href={`/app/therapist/pazienti/${r.patient_id}`}
                        className="text-sm underline"
                      >
                        Apri paziente
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Pazienti recenti */}
            <section className="rounded-lg border p-4">
              <h2 className="font-medium mb-3">Pazienti recenti</h2>
              <ul className="space-y-2">
                {patients.length === 0 && (
                  <li className="text-sm text-gray-500">Nessun paziente.</li>
                )}
                {patients.map((p) => (
                  <li
                    key={p.id}
                    className="border rounded px-3 py-2 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{p.display_name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(p.created_at).toLocaleString()}
                      </div>
                    </div>
                    <a
                      href={`/app/therapist/pazienti/${p.id}`}
                      className="text-sm underline"
                    >
                      Apri
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            {/* Appuntamenti */}
            <section className="rounded-lg border p-4">
              <h2 className="font-medium mb-3">Prossimi appuntamenti</h2>
              <ul className="space-y-2">
                {appointments.length === 0 && (
                  <li className="text-sm text-gray-500">
                    Nessun appuntamento programmato.
                  </li>
                )}
                {appointments.map((a) => (
                  <li key={a.id} className="border rounded px-3 py-2">
                    <div className="font-medium">
                      {a.patient_name || "Paziente"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {a.date} {a.time}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
