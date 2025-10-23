"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Patient = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  issues: string | null;
  goals: string | null;
};

type GadRow = { id: string; total: number; severity: string | null; created_at: string };

export default function PatientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pid = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [history, setHistory] = useState<GadRow[]>([]);
  const [sending, setSending] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  // load patient + last results
  useEffect(() => {
    (async () => {
      setErr(null);
      setMsg(null);
      try {
        // session guard
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) {
          router.push("/login");
          return;
        }

        // patient
        const { data: p, error: e1 } = await supabase
          .from("patients")
          .select("id,display_name,email,phone,issues,goals")
          .eq("id", pid)
          .single();

        if (e1) throw e1;
        setPatient(p as Patient);

        // history (latest 12)
        const { data: rows, error: e2 } = await supabase
          .from("gad7_results")
          .select("id,total,severity,created_at")
          .eq("patient_id", pid)
          .order("created_at", { ascending: false })
          .limit(12);

        if (e2) throw e2;
        setHistory((rows || []) as GadRow[]);
      } catch (e: any) {
        setErr(e?.message || "Errore di caricamento.");
      } finally {
        setLoading(false);
      }
    })();
  }, [pid, router]);

  async function savePatient() {
    if (!patient) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const { error } = await supabase
        .from("patients")
        .update({
          display_name: patient.display_name,
          email: patient.email,
          phone: patient.phone,
          issues: patient.issues,
          goals: patient.goals,
        })
        .eq("id", patient.id);

      if (error) throw error;
      setMsg("Dati paziente salvati.");
    } catch (e: any) {
      setErr(e?.message || "Salvataggio fallito.");
    } finally {
      setSaving(false);
    }
  }

  // 1) genera link univoco via funzione SQL e 2) invia email con Resend (API route)
  async function sendGadInviteByEmail() {
    setSending(true);
    setErr(null);
    setMsg(null);
    try {
      if (!patient?.email) throw new Error("Email del paziente assente.");
      // genera link (usa la RPC creata prima)
      const { data: rpc, error: rpcErr } = await supabase.rpc("gad7_create_invite", {
        p_patient_id: pid,
      });
      if (rpcErr) throw rpcErr;
      const url = rpc as string;
      setInviteUrl(url);

      const res = await fetch("/api/send-gad7-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: patient.email,
          name: patient.display_name || "",
          url,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Invio email fallito.");
      setMsg("Invito GAD-7 inviato al paziente via email.");
    } catch (e: any) {
      setErr(e?.message || "Errore nell'invio dell'email.");
    } finally {
      setSending(false);
    }
  }

  function openWhatsAppManual() {
    if (!patient) return;
    const text = encodeURIComponent(
      `${patient.display_name || "Ciao"}, compila il GAD-7 a questo link:\n${inviteUrl || ""}`
    );
    const phoneDigits = (patient.phone || "").replace(/[^0-9]/g, "");
    const href = `https://wa.me/${phoneDigits}?text=${text}`;
    window.open(href, "_blank");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p>Caricamento…</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Link href="/app/therapist/pazienti" className="text-sm underline">
          ← Lista pazienti
        </Link>
        <p className="mt-6 text-red-600">{err || "Paziente non trovato."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/app/therapist/pazienti"
          className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
        >
          ← Lista pazienti
        </Link>

        <Link
          href={`/app/therapist/pazienti/${pid}/gad7`}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Esegui GAD-7 in seduta
        </Link>
      </div>

      <h1 className="mb-4 text-2xl font-semibold">Scheda paziente</h1>

      {err && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>}
      {msg && <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-green-700">{msg}</div>}

      <div className="rounded border bg-white p-4 shadow-sm">
        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-600">Nome</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={patient.display_name || ""}
            onChange={(e) => setPatient({ ...patient, display_name: e.target.value })}
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-600">Email</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={patient.email || ""}
              onChange={(e) => setPatient({ ...patient, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Telefono</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={patient.phone || ""}
              onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-600">Problemi</label>
          <textarea
            className="w-full rounded border px-3 py-2"
            rows={3}
            value={patient.issues || ""}
            onChange={(e) => setPatient({ ...patient, issues: e.target.value })}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-600">Obiettivi</label>
          <textarea
            className="w-full rounded border px-3 py-2"
            rows={3}
            value={patient.goals || ""}
            onChange={(e) => setPatient({ ...patient, goals: e.target.value })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={savePatient}
            disabled={saving}
            className="rounded border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            💾 Salva
          </button>

          {/* INVIO GAD-7 AL PAZIENTE (email Resend) */}
          <button
            onClick={sendGadInviteByEmail}
            disabled={sending}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            📧 Invia GAD-7 al paziente
          </button>

          {/* opzionale WhatsApp manuale se il link è già stato generato */}
          {inviteUrl && (
            <button
              onClick={openWhatsAppManual}
              className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
              title="Apre WhatsApp con il testo precompilato"
            >
              💬 Invia via WhatsApp (manuale)
            </button>
          )}
        </div>

        {inviteUrl && (
          <div className="mt-3 rounded border bg-gray-50 p-3 text-sm">
            <span className="font-medium">Link paziente:</span> {inviteUrl}
          </div>
        )}
      </div>

      {/* Storico risultati */}
      <h2 className="mt-8 mb-3 text-xl font-semibold">Storico GAD-7</h2>
      <div className="space-y-2">
        {history.length === 0 && (
          <div className="rounded border bg-white p-3 text-sm text-gray-500">Nessun risultato ancora.</div>
        )}
        {history.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded border bg-white px-3 py-2">
            <div>
              <span className="font-medium">Score: {r.total}</span>
              {r.severity && (
                <span className="ml-2 rounded border px-2 py-[2px] text-xs text-gray-600">{r.severity}</span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {new Date(r.created_at).toLocaleString(undefined, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
