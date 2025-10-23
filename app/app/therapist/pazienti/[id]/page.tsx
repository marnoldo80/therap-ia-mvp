"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  issues: string | null;
  goals: string | null;
};

type GadRow = { created_at: string; total: number; severity: string };

export default function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // form
  const [p, setP] = useState<Patient | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [issues, setIssues] = useState("");
  const [goals, setGoals] = useState("");

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // invite
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) {
        router.replace("/login");
        return;
      }

      // patient
      const { data, error } = await supabase
        .from("patients")
        .select("id,display_name,email,phone,issues,goals")
        .eq("id", id)
        .single();

      if (error) {
        setErr(error.message);
        return;
      }
      setP(data);
      setDisplayName(data.display_name || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setIssues(data.issues || "");
      setGoals(data.goals || "");

      // existing latest invite (optional)
      const { data: inv } = await supabase
        .from("gad7_invites")
        .select("token")
        .eq("patient_id", id)
        .is("consumed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (inv?.token) setInviteToken(inv.token);
    })();
  }, [id, router]);

  async function savePatient() {
    setMsg(null);
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase
        .from("patients")
        .update({
          display_name: displayName,
          email,
          phone,
          issues,
          goals,
        })
        .eq("id", id);
      if (error) throw error;
      setMsg("Salvato.");
    } catch (e: any) {
      setErr(e?.message || "Errore salvataggio");
    } finally {
      setLoading(false);
    }
  }

  async function generateInvite() {
    setMsg(null);
    setErr(null);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("gad7_create_invite", { p_patient_id: id });
      if (error) throw error;
      setInviteToken(data as string);
      setMsg("Link generato.");
    } catch (e: any) {
      setErr(e?.message || "Errore generazione link");
    } finally {
      setLoading(false);
    }
  }

  async function sendInviteEmail() {
    setMsg(null);
    setErr(null);
    if (!inviteToken) return setErr("Nessun link generato.");
    if (!email) return setErr("Email paziente mancante.");

    const url = `${window.location.origin}/q/gad7/${inviteToken}`;
    try {
      const res = await fetch("/api/send-gad7-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          name: displayName || "Paziente",
          url,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Invio fallito");
      setMsg("Invito GAD-7 inviato al paziente via email.");
    } catch (e: any) {
      setErr(e?.message || "Errore invio email");
    }
  }

  function openWhatsApp() {
    if (!inviteToken) return setErr("Nessun link generato.");
    const url = `${window.location.origin}/q/gad7/${inviteToken}`;
    const text = encodeURIComponent(
      `${displayName || ""}, compila il GAD-7 qui: ${url}`
    );
    const phoneDigits = (phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phoneDigits}?text=${text}`, "_blank");
  }

  const inviteLink =
    inviteToken && typeof window !== "undefined"
      ? `${window.location.origin}/q/gad7/${inviteToken}`
      : "";

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/app/therapist/pazienti"
          className="rounded border px-3 py-2 hover:bg-gray-50"
        >
          ← Lista pazienti
        </Link>

        {/* Spostato qui accanto agli altri pulsanti (coerente con richiesta) */}
        <button
          onClick={() => router.push(`/app/therapist/pazienti/${id}/gad7`)}
          className="rounded bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
        >
          + Esegui GAD-7 in seduta
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-4">Scheda paziente</h1>

      {msg && (
        <div className="mb-4 rounded bg-green-50 text-green-700 px-4 py-3">
          {msg}
        </div>
      )}
      {err && (
        <div className="mb-4 rounded bg-red-50 text-red-700 px-4 py-3">
          {err}
        </div>
      )}

      <div className="rounded border p-4 space-y-4 mb-4">
        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Telefono</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Problemi</label>
          <textarea
            className="w-full min-h-[110px] rounded border px-3 py-2"
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Obiettivi</label>
          <textarea
            className="w-full min-h-[110px] rounded border px-3 py-2"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
          />
        </div>

        {/* RIGA AZIONI */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={savePatient}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded border px-3 py-2 hover:bg-gray-50 disabled:opacity-60"
          >
            💾 Salva
          </button>

          {/* Esegui in seduta – spostato qui accanto agli altri */}
          <button
            onClick={() => router.push(`/app/therapist/pazienti/${id}/gad7`)}
            className="inline-flex items-center gap-2 rounded bg-indigo-600 text-white px-3 py-2 hover:bg-indigo-700"
          >
            ➕ Esegui GAD-7 in seduta
          </button>

          <button
            onClick={async () => {
              await generateInvite();
              await sendInviteEmail();
            }}
            className="inline-flex items-center gap-2 rounded bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700"
          >
            ✉️ Invia GAD-7 al paziente
          </button>

          <button
            onClick={openWhatsApp}
            className="inline-flex items-center gap-2 rounded border px-3 py-2 hover:bg-gray-50"
          >
            💬 Invia via WhatsApp (manuale)
          </button>
        </div>

        {inviteToken && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Link paziente:</span>{" "}
            <span className="select-all">{inviteLink}</span>
          </div>
        )}
      </div>

      {/* Storico sintetico */}
      <ResultsList patientId={id} />
    </div>
  );
}

function ResultsList({ patientId }: { patientId: string }) {
  const [rows, setRows] = useState<GadRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("gad7_results")
        .select("created_at,total,severity")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(30);
      setRows(data || []);
    })();
  }, [patientId]);

  if (!rows.length) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-3">Storico GAD-7</h2>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="rounded border px-3 py-2 flex items-center justify-between">
            <div>
              <span className="font-medium">Score:</span> {r.total}{" "}
              <span className="text-xs text-gray-600 border rounded px-2 py-0.5 ml-2">
                {r.severity}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {new Date(r.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
