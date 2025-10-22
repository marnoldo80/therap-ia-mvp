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

  useEffect(()=>{(async()=>{
    const { data:u } = await supabase.auth.getUser();
    if(!u?.user){ router.replace("/login"); return; }
    const { data, error } = await supabase
      .from("patients")
      .select("display_name,email,phone,issues,goals,created_at")
      .eq("id", id)
      .single();
    if(error){ setErr(error.message); setLoading(false); return; }
    setDisplayName(data?.display_name||"");
    setEmail(data?.email||"");
    setPhone(data?.phone||"");
    setIssues(data?.issues||"");
    setGoals(data?.goals||"");
    setLoading(false);
  })()},[id,router]);

  async function handleSave(e:React.FormEvent){
    e.preventDefault(); setErr(null); setLoading(true);
    try{
      const { error } = await supabase
        .from("patients")
        .update({ display_name:displayName, email, phone, issues, goals })
        .eq("id", id);
      if(error) throw error;
    }catch(e:any){ setErr(e?.message ?? "Errore salvataggio"); }
    finally{ setLoading(false); }
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
        <div style={{display:"flex",gap:12}}>
          <button type="submit" style={{padding:"10px 14px",borderRadius:8,border:"1px solid #333"}}>Salva</button>
          <a href={`/app/therapist/pazienti/${id}/gad7`} style={{padding:"10px 14px",border:"1px solid #222",borderRadius:8,textDecoration:"none"}}>
            🧪 Somministra GAD-7
          </a>
        </div>
      </form>

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
