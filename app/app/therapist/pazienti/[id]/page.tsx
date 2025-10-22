"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

type Patient = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  issues: string | null;
  goals: string | null;
  created_at?: string | null;
};

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const patientId = params?.id as string;

  const [data, setData] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [msg, setMsg] = useState<string>("");

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(""); setMsg(""); setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) { router.push("/login"); return; }

      const { data: p, error } = await supabase
        .from("patients")
        .select("id,display_name,email,phone,issues,goals,created_at")
        .eq("id", patientId)
        .single();

      if (error) setErr(error.message); else setData(p as Patient);
      setLoading(false);
    })();
  }, [patientId, router]);

  async function save() {
    if (!data) return;
    setErr(""); setMsg("");
    const { error } = await supabase
      .from("patients")
      .update({
        display_name: data.display_name,
        email: data.email,
        phone: data.phone,
        issues: data.issues,
        goals: data.goals,
      })
      .eq("id", data.id);
    if (error) setErr(error.message); else setMsg("Salvato.");
  }

  // Crea token e link tramite funzione SQL (RPC) già creata su Supabase
  async function generateGad7Invite() {
    try {
      setErr(""); setMsg("Generazione link…");
      const { data: rpc, error } = await supabase
        .rpc("gad7_create_invite", { p_patient_id: patientId }); // ritorna {token}
      if (error) throw error;
      const token = (rpc as any)?.token || rpc;
      if (!token) throw new Error("Token non ricevuto.");
      const url = `${window.location.origin}/q/gad7/${token}`;
      setInviteUrl(url);
      setMsg("Link generato.");
    } catch (e: any) {
      setErr(e?.message || "Errore generazione link");
      setInviteUrl(null);
    }
  }

  async function sendEmailViaAPI() {
    try {
      setErr(""); setMsg("Invio email…");
      if (!inviteUrl) throw new Error("Genera prima il link.");
      if (!data?.email) throw new Error("Email paziente mancante.");
      const res = await fetch("/api/send-gad7-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: data.email,
          name: data.display_name || "",
          url: inviteUrl,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("Email inviata.");
    } catch (e: any) {
      setErr(e?.message || "Errore invio email");
    }
  }

  function openWhatsApp() {
    if (!inviteUrl) { setErr("Genera prima il link."); return; }
    const displayName = data?.display_name || "";
    const text = encodeURIComponent(
      `Ciao ${displayName}, questo è il link per compilare il test GAD-7:\n\n${inviteUrl}\n\nGrazie!`
    );
    const phoneSan = (data?.phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phoneSan}?text=${text}`, "_blank");
  }

  if (loading) return <div>Caricamento…</div>;
  if (!data) return <div>Paziente non trovato.</div>;

  return (
    <div style={{maxWidth: 760, margin: "24px auto", padding: 16}}>
      <button onClick={() => router.back()} style={{marginBottom: 16}}>← Indietro</button>
      <h1>Scheda paziente</h1>

      {err && <div style={{color:"crimson",margin:"8px 0"}}>{err}</div>}
      {msg && <div style={{color:"green",margin:"8px 0"}}>{msg}</div>}

      <label>Nome</label>
      <input
        value={data.display_name || ""}
        onChange={e => setData(d => ({...(d as Patient), display_name: e.target.value}))}
        required
        style={{width:"100%",padding:10,margin:"6px 0 12px"}}
      />

      <label>Email</label>
      <input
        value={data.email || ""}
        onChange={e => setData(d => ({...(d as Patient), email: e.target.value}))}
        style={{width:"100%",padding:10,margin:"6px 0 12px"}}
      />

      <label>Telefono</label>
      <input
        value={data.phone || ""}
        onChange={e => setData(d => ({...(d as Patient), phone: e.target.value}))}
        style={{width:"100%",padding:10,margin:"6px 0 12px"}}
      />

      <label>Problemi</label>
      <textarea
        value={data.issues || ""}
        onChange={e => setData(d => ({...(d as Patient), issues: e.target.value}))}
        style={{width:"100%",padding:10,margin:"6px 0 12px", minHeight: 90}}
      />

      <label>Obiettivi</label>
      <textarea
        value={data.goals || ""}
        onChange={e => setData(d => ({...(d as Patient), goals: e.target.value}))}
        style={{width:"100%",padding:10,margin:"6px 0 12px", minHeight: 90}}
      />

      <div style={{display:"flex", gap:12, flexWrap:"wrap", marginTop:8}}>
        <button onClick={save} style={{padding:"10px 14px"}}>💾 Salva</button>
        <a href={`/app/therapist/pazienti/${data.id}/gad7`} style={{textDecoration:"none"}}>
          <button style={{padding:"10px 14px"}}>🧪 Esegui GAD-7 in seduta</button>
        </a>
        <button onClick={generateGad7Invite} style={{padding:"10px 14px"}}>🔗 Genera link GAD-7</button>
      </div>

      {inviteUrl && (
        <div style={{marginTop:16, padding:12, border:"1px solid #ddd", borderRadius:8}}>
          <div><b>Link paziente:</b> {inviteUrl}</div>
          <div style={{display:"flex", gap:12, marginTop:10}}>
            <button onClick={sendEmailViaAPI} style={{padding:"8px 12px"}}>📧 Invia email (Resend)</button>
            <button onClick={openWhatsApp} style={{padding:"8px 12px"}}>🟢 Invia via WhatsApp (manuale)</button>
          </div>
        </div>
      )}

      <h3 style={{marginTop:28}}>Risultati GAD-7 (ultimi)</h3>
      <Results patientId={data.id}/>
    </div>
  );
}

function Results({ patientId }: { patientId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("gad7_results")
        .select("created_at,total,severity")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(10);
      setRows(data || []);
    })();
  }, [patientId]);

  if (!rows.length) return <div>Nessun risultato.</div>;
  return (
    <ul style={{padding:0, listStyle:"none"}}>
      {rows.map((r, i) => (
        <li key={i} style={{padding:8, borderBottom:"1px solid #eee"}}>
          {new Date(r.created_at).toLocaleString()} — <b>{r.total}</b> ({r.severity})
        </li>
      ))}
    </ul>
  );
}
