"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Row = Record<string, any>;

export default function SchedaPaziente() {
  const router = useRouter();
  const params = useParams();
  const pid = params?.id as string;

  const [rows, setRows] = useState<Row[]>([]);
  const [therapistId, setTherapistId] = useState<string>("");

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) setTherapistId(data.user.id);
    };
    loadSession();
  }, []);

  useEffect(() => {
    if (!therapistId || !pid) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("gad7_results")
        .select("*")
        .eq("patient_id", pid)
        .eq("therapist_user_id", therapistId)
        .order("created_at", { ascending: false });
      if (!error && data) setRows(data as Row[]);
    };
    load();
  }, [therapistId, pid]);

  const displayScore = (r: Row) =>
    r.score ?? r.total ?? r.total_score ?? r.gad7_score ?? r.value ?? r.result ?? null;

  return (
    <div style={{ padding: 24 }}>
      <button
        onClick={() => router.push("/app/therapist/pazienti")}
        style={{ border: "1px solid #222", padding: "10px 14px", borderRadius: 8, marginBottom: 20 }}
      >
        ← Lista pazienti
      </button>

      <h1 className="text-2xl font-semibold mb-4">Scheda paziente {pid}</h1>

      <section style={{ marginTop: 24 }}>
        <h2 className="text-xl font-semibold">Questionari</h2>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <a
            href={`/app/therapist/pazienti/${pid}/gad7`}
            style={{ border: "1px solid #222", padding: "8px 12px", borderRadius: 8, textDecoration: "none" }}
          >
            ➕ Esegui GAD-7 in seduta
          </a>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3 className="text-lg font-medium">Storico GAD-7</h3>
          {!rows.length && <p className="text-gray-600">Nessun esito registrato.</p>}
          {!!rows.length && (
            <ul style={{ marginTop: 8, display: "grid", gap: 8 }}>
              {rows.map((r: Row) => (
                <li key={r.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Score: <strong>{displayScore(r) ?? "—"}</strong></span>
                    <span>{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</span>
                  </div>
                  {!displayScore(r) && (
                    <pre style={{ marginTop: 8, fontSize: 12, color: "#666", whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(r, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
