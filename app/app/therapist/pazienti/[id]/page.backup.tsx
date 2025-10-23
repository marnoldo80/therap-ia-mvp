"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Gad7Result = {
  id: string;
  patient_id: string;
  therapist_user_id: string;
  score: number;
  created_at: string;
};

export default function SchedaPaziente() {
  const router = useRouter();
  const params = useParams();
  const pid = params?.id as string;

  const [gad7Results, setGad7Results] = useState<Gad7Result[]>([]);
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
    const loadResults = async () => {
      const { data, error } = await supabase
        .from("gad7_results")
        .select("*")
        .eq("patient_id", pid)
        .eq("therapist_user_id", therapistId)
        .order("created_at", { ascending: false });
      if (!error && data) setGad7Results(data as Gad7Result[]);
    };
    loadResults();
  }, [therapistId, pid]);

  return (
    <div style={{ padding: 24 }}>
      <button
        onClick={() => router.push("/app/therapist/pazienti")}
        style={{
          border: "1px solid #222",
          padding: "10px 14px",
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        ← Lista pazienti
      </button>

      <h1 className="text-2xl font-semibold mb-4">
        Scheda paziente {pid}
      </h1>

      <section style={{ marginTop: 24 }}>
        <h2 className="text-xl font-semibold">Questionari</h2>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <a
            href={`/app/therapist/pazienti/${pid}/gad7`}
            style={{
              border: "1px solid #222",
              padding: "8px 12px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            ➕ Esegui GAD-7 in seduta
          </a>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3 className="text-lg font-medium">Storico GAD-7</h3>
          {!gad7Results.length && (
            <p className="text-gray-600">Nessun esito registrato.</p>
          )}
          {!!gad7Results.length && (
            <ul style={{ marginTop: 8, display: "grid", gap: 8 }}>
              {gad7Results.map((r) => (
                <li
                  key={r.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      Score: <strong>{r.score}</strong>
                    </span>
                    <span>
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
