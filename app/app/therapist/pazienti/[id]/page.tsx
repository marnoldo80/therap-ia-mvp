"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Page(){
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState<string|null>(null);
  const [displayName,setDisplayName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [issues,setIssues]=useState("");
  const [goals,setGoals]=useState("");
  const [inviteUrl,setInviteUrl]=useState<string>("");

  useEffect(()=>{(async()=>{
    const { data:u } = await supabase.auth.getUser();
    if(!u?.user){ router.replace("/login"); return; }
    const { data, error } = await supabase
      .from("patients")
      .select("display_name,email,phone,issues,goals")
      .eq("id", id).single();
    if(error){ setErr(error.message); setLoading(false); return; }
    setDisplayName(data?.display_name||"");
    setEmail(data?.email||"");
    setPhone(data?.phone||"");
    setIssues(data?.issues||"");
    setGoals(data?.goals||"");
    setLoading(false);
  })()},[id,router]);

  async function handleSave(e:React.FormEvent){
    e.preventDefault(); setErr(null);
    const { error } = await supabase.from("patients")
      .update({ display_name:displayName, email, phone, issues, goals }).eq("id", id);
    if(error) setErr(error.message);
  }

  async function generateInvite(){
    setErr(null);
    try{
      const { data, error } = await supabase.rpc("gad7_create_invite", { p_patient_id: id });
      if(error) throw error;
      const base = typeof window !== "undefined" ? window.location.origin : "https://therap-ia-mvp.vercel.app";
      setInviteUrl(`${base}/q/gad7/${data}`);
    }catch(e:any){ setErr(e?.message ?? "Errore creazione link"); }
  }

  function mailtoHref(url:string){
    const subject = encodeURIComponent("Compilazione questionario GAD-7");
    const body = encodeURIComponent(`Ciao ${displayName||""},\n\nper favore compila il GAD-7 qui:\n${url}\n\nGrazie!`);
    return `mailto:${email||""}?subject=${subject}&body=${body}`;
  }
  function whatsappHref(url:string){
    const text = encodeURIComponent(`Ciao ${displayName||""}, compila il GAD-7 qui: ${url}`);
    return `https://wa.me/${(phone||"").replace(/[^0-9]/g,"")}?text=${text}`;
  }

  if(loading) return <main style={{maxWidth:720,margin:"40px auto",padding:20}}>Caricamento…</main>;

  return (
    <main style={{maxWidth:720,margin:"40px auto",padding:20}}>
      <a href="/app/therapist/pazienti" style={{textDecoration:"none"}}>← Torna ai pazienti</a>
      <h1 style={{marginTop:8}}>Scheda paziente</h1>
      {err && <p style={{color:"crimson"}}>{err}</p>}

      <form onSubmit={handleSave} style={{display:"grid",gap:12,marginTop:16}}>
        <label>Nome / Pseudonimo
          <input value={displayName} onChange={e=>setDisplayName(e.target.value)} required
                 style={{width:"100%",padding:8,border:"1px solid #ccc",borderRadius:6}} />
        </label>
        <label>Email
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                 style={{width:"100%",padding:8,border:"1px solid #ccc",borderRadius:6}} />
        </label>
        <label>Telefono
          <input value={phone} onChange={e=>setPhone(e.target.value)}
                 style={{width:"100%",padding:8,border:"1px solid #ccc",borderRadius:6}} />
        </label>
        <label>Problemi principali
          <textarea value={issues} onChange={e=>setIssues(e.target.value)}
                    style={{width:"100%",padding:8,border:"1px solid #ccc",borderRadius:6,minHeight:90}} />
        </label>
        <label>Obiettivi
          <textarea value={goals} onChange={e=>setGoals(e.target.value)}
                    style={{width:"100%",padding:8,border:"1px solid #ccc",borderRadius:6,minHeight:90}} />
        </label>

        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:6}}>
          <button type="submit" style={{padding:"10px 14px",borderRadius:8,border:"1px solid #333"}}>💾 Salva</button>

          {/* 1) Esegui in seduta */}
          <a href={`/app/therapist/pazienti/${id}/gad7`} style={{padding:"10px 14px",border:"1px solid #222",borderRadius:8,textDecoration:"none"}}>
            �� Esegui test GAD-7 con paziente
          </a>

          {/* 2) Invia per casa */}
          <button type="button" onClick={generateInvite}
                  style={{padding:"10px 14px",borderRadius:8,border:"1px solid #222",background:"#fafafa",cursor:"pointer"}}>
            📬 Invia test al paziente per compilazione a casa
          </button>
        </div>
      </form>

      {inviteUrl && (
        <div style={{marginTop:12, border:"1px solid #ddd", borderRadius:8, padding:12}}>
          <div style={{marginBottom:8}}><b>Link paziente:</b> <a href={inviteUrl}>{inviteUrl}</a></div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <a href={mailtoHref(inviteUrl)} style={{textDecoration:"none",border:"1px solid #222",padding:"6px 10px",borderRadius:8}}>✉️ Email</a>
            <a href={whatsappHref(inviteUrl)} target="_blank" style={{textDecoration:"none",border:"1px solid #25D366",padding:"6px 10px",borderRadius:8}}>🟢 WhatsApp</a>
          </div>
        </div>
      )}

      <section style={{marginTop:24}}>
        <h2>GAD-7 (ultimi esiti)</h2>
        <Gad7List id={id}/>
      </section>
    </main>
  );
}

function Gad7List({id}:{id:string}){
  const [rows,setRows]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{
    const { data } = await supabase
      .from("gad7_results")
      .select("created_at,total,severity")
      .eq("patient_id", id)
      .order("created_at",{ascending:false})
      .limit(10);
    setRows(data||[]); setLoading(false);
  })()},[id]);
  if(loading) return <p>Caricamento…</p>;
  if(rows.length===0) return <p>Nessun esito ancora.</p>;
  return (
    <ul style={{marginTop:8,display:"grid",gap:8}}>
      {rows.map((r,i)=>(
        <li key={i} style={{border:"1px solid #ddd",borderRadius:8,padding:12}}>
          <b>{new Date(r.created_at).toLocaleString()}</b> — Totale: <b>{r.total}</b> — {r.severity}
        </li>
      ))}
    </ul>
  );
}
