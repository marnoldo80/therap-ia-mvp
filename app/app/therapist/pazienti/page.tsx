"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = { id:string; display_name:string; created_at:string|null };

export default function Page(){
  const [rows,setRows]=useState<Patient[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const { data: u } = await supabase.auth.getUser();
    const user = u?.user; if(!user){ location.href="/login"; return; }
    const { data, error } = await supabase
      .from("patients")
      .select("id,display_name,created_at")
      .order("created_at",{ascending:false});
    if(!error && data) setRows(data as any);
    setLoading(false);
  })()},[]);

  return (
    <main style={{maxWidth:720,margin:"40px auto",padding:20}}>
      <h1>Pazienti</h1>
      <div style={{marginTop:16}}>
        <a href="/app/therapist/pazienti/nuovo"
           style={{padding:"10px 14px",border:"1px solid #222",borderRadius:8,textDecoration:"none"}}>
          ➕ Aggiungi paziente
        </a>
      </div>
      {loading? <p style={{marginTop:16}}>Caricamento…</p> :
      rows.length===0? <p style={{marginTop:16}}>Nessun paziente ancora.</p> :
      <ul style={{marginTop:16,display:"grid",gap:8}}>
        {rows.map(p=>(
          <li key={p.id} style={{border:"1px solid #ddd",borderRadius:8,padding:12}}>
            <a href="/app/therapist/pazienti/{p.id}" style="text-decoration:none"><b>{p.display_name}</b></a>
            <div style={{fontSize:12,color:"#666"}}>{new Date(p.created_at||"").toLocaleString()}</div>
          </li>
        ))}
      </ul>}
    </main>
  );
}
