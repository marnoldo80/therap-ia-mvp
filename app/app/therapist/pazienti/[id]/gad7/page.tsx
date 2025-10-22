"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

type Patient = { id: string; display_name: string | null; email: string | null; };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const QUESTIONS = [
  "1) Sentirsi nervoso/a, ansioso/a o con i nervi a fior di pelle",
  "2) Non riuscire a smettere o a controllare la preoccupazione",
  "3) Preoccuparsi troppo per diverse cose",
  "4) Avere difficoltà a rilassarsi",
  "5) Essere così irrequieto/a da far fatica a stare fermo/a",
  "6) Irritabilità o facile agitazione",
  "7) Paura come se potesse succedere qualcosa di terribile",
];

function scoreToSeverity(total: number) {
  if (total <= 4) return "Minimo";
  if (total <= 9) return "Lieve";
  if (total <= 14) return "Moderato";
  return "Grave";
}

export default function Gad7Page({ params }: { params: { id: string } }) {
  const router = useRouter();
  const patientId = params.id;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [answers, setAnswers] = useState<number[]>(Array.from({ length: 7 }, () => 0));
  const [saving, setSaving] = useState(false);
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const total = useMemo(() => answers.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0), [answers]);
  const severity = useMemo(() => scoreToSeverity(total), [total]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) { router.replace("/login"); return; }
      const { data, error } = await supabase
        .from("patients")
        .select("id, display_name, email")
        .eq("id", patientId)
        .single();
      if (error) setErr(error.message); else setPatient(data as Patient);
    })();
  }, [patientId, router]);

  const setAnswer = (idx: number, val: number) =>
    setAnswers(prev => { const c = [...prev]; c[idx] = val; return c; });

  async function saveResult() {
    setSaving(true); setErr(null); setMsg(null);
    try {
      const { data, error } = await supabase
        .from("gad7_results")
        .insert({ patient_id: patientId, total, severity, answers })
        .select("id").single();
      if (error) throw error;
      setSavedRowId(data.id as string);
      setMsg("Risultato salvato.");
    } catch (e:any) { setErr(e?.message || "Errore nel salvataggio"); }
    finally { setSaving(false); }
  }

  async function sendResultsByEmail() {
    if (!patient?.email) { setErr("Email paziente mancante."); return; }
    if (!savedRowId) { setErr("Salva prima il risultato."); return; }
    setSending(true); setErr(null); setMsg(null);
    try {
      const res = await fetch("/api/send-gad7-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: patient.email,
          toName: patient.display_name || "Paziente",
          patientName: patient.display_name || "",
          total, severity, date: new Date().toLocaleString(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Invio email fallito");
      }
      setMsg("Email risultati inviata al paziente.");
    } catch (e:any) { setErr(e?.message || "Errore invio email"); }
    finally { setSending(false); }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <button onClick={() => router.push(`/app/therapist/pazienti/${patientId}`)}
                className="text-sm text-blue-600 hover:underline">← Torna alla scheda paziente</button>
      </div>

      <h1 className="text-2xl font-semibold mb-1">GAD-7 (terapeuta)</h1>
      <p className="text-gray-600 mb-6">
        Paziente: <b>{patient?.display_name || "—"}</b>{" "}
        <span className="text-gray-400">({patient?.email || "—"})</span>
      </p>

      {err && <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-red-700">{err}</div>}
      {msg && <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-emerald-700">{msg}</div>}

      <div className="space-y-5">
        {QUESTIONS.map((q, idx) => (
          <div key={idx} className="rounded-xl border p-4">
            <p className="mb-3 font-medium">{q}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[0,1,2,3].map(v => (
                <label key={v}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                    answers[idx]===v ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}>
                  <input type="radio" name={`q${idx}`} className="mr-2"
                         checked={answers[idx]===v} onChange={()=>setAnswer(idx,v)} />
                  {v===0 && "Per niente"}
                  {v===1 && "Alcuni giorni"}
                  {v===2 && "Più della metà dei giorni"}
                  {v===3 && "Quasi tutti i giorni"}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border p-4">
        <p className="text-sm text-gray-600">Somma punteggi</p>
        <p className="text-3xl font-semibold">{total} <span className="text-base font-normal">/ 21</span></p>
        <p className="mt-1 text-gray-700">Gravità: <b>{severity}</b></p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button onClick={saveResult} disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">
          💾 Salva risultato
        </button>
        <button onClick={sendResultsByEmail} disabled={!savedRowId || sending}
          className="inline-flex items-center justify-center rounded-lg border border-emerald-600 px-4 py-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
          title={!savedRowId ? "Salva prima il risultato" : ""}>
          ✉️ Invia risultati al paziente
        </button>
      </div>
    </main>
  );
}
