"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

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

export default function PatientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pid = params.id;

  const [p, setP] = useState<Patient | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) { router.replace("/login"); return; }
      const { data, error } = await supabase
        .from("patients")
        .select("id,display_name,email,phone,issues,goals")
        .eq("id", pid).single();
      if (error) setErr(error.message);
      else setP(data as Patient);
    })();
  }, [pid, router]);

  async function save() {
    if (!p) return;
    setMsg(null); setErr(null); setLoading(true);
    try {
      const up = {
        display_name: p.display_name,
        email: p.email,
        phone: p.phone,
        issues: p.issues,
        goals: p.goals,
      };
      const { error } = await supabase.from("patients").update(up).eq("id", pid);
      if (error) throw error;
      setMsg("Dati paziente salvati.");
    } catch (e: any) {
      setErr(e?.message || "Errore salvataggio");
    } finally { setLoading(false); }
  }

  async function genInvite() {
    setMsg(null); setErr(null); setInviteUrl(null); setLoading(true);
    try {
      const { data, error } = await supabase.rpc("gad7_create_invite", { p_patient_id: pid });
      if (error) throw error;
      setInviteUrl(`${window.location.origin}/q/gad7/${data}`);
      setMsg("Link GAD-7 generato.");
    } catch (e:any) {
      setErr(e?.message || "Errore generazione link");
    } finally { setLoading(false); }
  }

  async function sendInviteEmail() {
    if (!p?.email || !inviteUrl) { setErr("Serve email del paziente e un link generato."); return; }
    setMsg(null); setErr(null); setLoading(true);
    try {
      const res = await fetch("/api/send-gad7-invite", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          toEmail: p.email,
          toName: p.display_name || "Paziente",
          url: inviteUrl
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j?.error || "Invio email fallito");
      }
      setMsg("Email inviata.");
    } catch (e:any) {
      setErr(e?.message || "Errore invio email");
    } finally { setLoading(false); }
  }

  function sendInviteWhatsapp() {
    if (!p?.phone || !inviteUrl) { setErr("Serve telefono e un link generato."); return; }
    const text = encodeURIComponent(
      `Ciao ${p.display_name || ""}, per favore compila questo GAD-7: ${inviteUrl}`
    );
    const phone = (p.phone || "").replace(/[^0-9]/g,"");
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  }

  if (!p) return <main className="p-6">Caricamento…</main>;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <button className="mb-4 text-sm text-blue-600 hover:underline"
              onClick={() => router.push("/app/therapist/pazienti")}>← Lista pazienti</button>

      <h1 className="text-2xl font-semibold mb-1">Scheda paziente</h1>
      {err && <div className="mb-3 rounded border border-red-300 bg-red-50 px-4 py-2 text-red-700">{err}</div>}
      {msg && <div className="mb-3 rounded border border-emerald-300 bg-emerald-50 px-4 py-2 text-emerald-700">{msg}</div>}

      <div className="space-y-5">
        <div>
          <label className="block text-sm text-gray-600">Nome</label>
          <input className="mt-1 w-full rounded border px-3 py-2"
                 value={p.display_name || ""} onChange={e=>setP({...p, display_name:e.target.value})}/>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Email</label>
          <input className="mt-1 w-full rounded border px-3 py-2"
                 value={p.email || ""} onChange={e=>setP({...p, email:e.target.value})}/>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Telefono</label>
          <input className="mt-1 w-full rounded border px-3 py-2"
                 value={p.phone || ""} onChange={e=>setP({...p, phone:e.target.value})}/>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Problemi</label>
          <textarea className="mt-1 w-full rounded border px-3 py-2 min-h-[80px]"
                    value={p.issues || ""} onChange={e=>setP({...p, issues:e.target.value})}/>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Obiettivi</label>
          <textarea className="mt-1 w-full rounded border px-3 py-2 min-h-[80px]"
                    value={p.goals || ""} onChange={e=>setP({...p, goals:e.target.value})}/>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={save} disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">💾 Salva</button>

        <a href={`/app/therapist/pazienti/${pid}/gad7`}
           className="rounded border px-4 py-2 hover:bg-gray-50">🧪 Esegui GAD-7 in seduta</a>

        <button onClick={genInvite} disabled={loading}
          className="rounded border px-4 py-2 hover:bg-gray-50">🔗 Genera link GAD-7</button>
      </div>

      {inviteUrl && (
        <div className="mt-4 rounded border px-4 py-3">
          <div className="text-sm"><b>Link paziente:</b> <span className="break-all">{inviteUrl}</span></div>
          <div className="mt-2 flex gap-3">
            <button onClick={sendInviteEmail} className="rounded border px-3 py-1 hover:bg-gray-50">✉️ Invia email</button>
            <button onClick={sendInviteWhatsapp} className="rounded border px-3 py-1 hover:bg-gray-50">🟢 Invia via WhatsApp</button>
          </div>
        </div>
      )}
    </main>
  );
}
