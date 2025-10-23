"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Row = Record<string, any>;

export default function SchedaPaziente() {
  const router = useRouter();
  const params = useParams();
  const pid = (params?.id as string) || "";

  const [patient, setPatient] = useState<Row | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [therapistId, setTherapistId] = useState<string>("");

  // sessione
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) setTherapistId(data.user.id);
    })();
  }, []);

  // anagrafica paziente
  useEffect(() => {
    if (!pid) return;
    (async () => {
      const { data } = await supabase.from("patients").select("*").eq("id", pid).single();
      if (data) setPatient(data as Row);
    })();
  }, [pid]);

  // storico GAD7
  useEffect(() => {
    if (!therapistId || !pid) return;
    (async () => {
      const { data, error } = await supabase
        .from("gad7_results")
        .select("*")
        .eq("patient_id", pid)
        .eq("therapist_user_id", therapistId)
        .order("created_at", { ascending: false });
      if (!error && data) setRows(data as Row[]);
    })();
  }, [therapistId, pid]);

  const scoreOf = (r: Row) =>
    r.score ?? r.total ?? r.total_score ?? r.gad7_score ?? r.value ?? r.result ?? null;

  // helper campi nome
  const fullName =
    (patient?.full_name as string) ||
    ([patient?.first_name, patient?.last_name].filter(Boolean).join(" ").trim() || "") ||
    (patient?.name as string) ||
    "";

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => router.push("/app/therapist/pazienti")}
          style={{ border: "1px solid #222", padding: "10px 14px", borderRadius: 8 }}>
          ← Lista pazienti
        </button>
        <a href={`/app/therapist/pazienti/${pid}/gad7`}
           style={{ border: "1px solid #222", padding: "10px 14px", borderRadius: 8, textDecoration: "none" }}>
          ➕ Esegui GAD-7 in seduta
        </a>
      </div>

      {/* ANAGRAFICA */}
      <h1 className="text-2xl font-semibold">Scheda paziente {pid}</h1>
      <section style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
        <h2 className="text-xl font-semibold" style={{ marginBottom: 8 }}>Anagrafica</h2>
        {!patient && <p className="text-gray-600">Dati paziente non disponibili.</p>}
        {patient && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><strong>Nome</strong><div>{fullName || "—"}</div></div>
            <div><strong>Email</strong><div>{(patient.email as string) || "—"}</div></div>
            <div><strong>Telefono</strong><div>{(patient.phone as string) || "—"}</div></div>
            <div><strong>Data nascita</strong><div>{(patient.birth_date as string) || "—"}</div></div>
            <div style={{ gridColumn: "1 / -1" }}>
              <strong>Note</strong>
              <div>{(patient.notes as string) || (patient.note as string) || "—"}</div>
            </div>
            {/* Debug minimale: mostra altri campi non standard se servono */}
            <details style={{ gridColumn: "1 / -1", marginTop: 8 }}>
              <summary style={{ cursor: "pointer" }}>Altri campi</summary>
              <pre style={{ fontSize: 12, color: "#666", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(patient, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </section>

      {/* STORICO GAD-7 */}
      <section style={{ marginTop: 24 }}>
        <h2 className="text-xl font-semibold">Storico GAD-7</h2>
        {!rows.length && <p className="text-gray-600">Nessun esito registrato.</p>}
        {!!rows.length && (
          <ul style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {rows.map((r) => (
              <li key={r.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                  <div>Score: <strong>{scoreOf(r) ?? "—"}</strong></div>
                  <div>{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
