"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function interpret(total:number){
  if (total <= 4) return "Minimal";
  if (total <= 9) return "Mild";
  if (total <= 14) return "Moderate";
  return "Severe";
}

export default function Page(){
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [p,setP]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState<string|null>(null);

  useEffect(()=>{(async()=>{
    const { data:u } = await supabase.auth.getUser(); 
    if(!u?.user){ router.replace("/login"); return; }
    const { data, error } = await supabase
      .from("patients")
      .select("id,display_name,issues,goals,created_at")
      .eq("id", id)
      .single();
    if(error) setErr(error.message); else setP(data);
    setLoading(false);
  })()},[id,router]);

  if(loading) return <main style={{maxWidth:720,margin:"40px auto",padding:20}}>Caricamento…</main>;
  if(err) return <main style={{maxWidth:720,margin:"40px auto",padding:20,color:"crimson"}}>{err}</main>;
  if(!p) return <main style={{maxWidth:720,margin:"40px auto",padding:20}}>Paziente non trovato.</main>;

  return (
    <main style={{maxWidth:720,margin:"40px auto",padding:20}}>
      <a href="/app/therapist/pazienti" style={{textDecoration:"none"}}>← Torna ai pazienti</a>
      <h1 style={{marginTop:8}}>{p.display_name}</h1>
      <p style={{color:"#666"}}>Creato: {new Date(p.created_at||"").toLocaleString()}</p>

      <div style={{marginTop:12}}>
        <a href={`./gad7`} style={{textDecoration:"none",border:"1px solid #222",padding:"8px 12px",borderRadius:8}}>
          🧪 Somministra GAD-7
        </a>
      </div>

      <section style={{marginTop:16}}>
        <h2>Problemi principali</h2>
        <p style={{whiteSpace:"pre-wrap"}}>{p.issues || "—"}</p>
      </section>

      <section style={{marginTop:16}}>
        <h2>Obiettivi</h2>
        <p style={{whiteSpace:"pre-wrap"}}>{p.goals || "—"}</p>
      </section>

      <section style={{marginTop:16}}>
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
      .select("created_at,total,severity,answers")
      .eq("patient_id", id)
      .order("created_at",{ascending:false})
      .limit(10);
    setRows(data||[]);
    setLoading(false);
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
