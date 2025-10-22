"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Page(){
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [p,setP]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState<string|null>(null);

  useEffect(()=>{(async()=>{
    const { data:u } = await supabase.auth.getUser(); if(!u?.user){ router.replace("/login"); return; }
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
      <div style="margin-top:12px"><a href="../{id}/gad7" style="text-decoration:none;border:1px solid #222;padding:8px 12px;border-radius:8">🧪 Somministra GAD-7</a></div>
      <p style={{color:"#666"}}>Creato: {new Date(p.created_at||"").toLocaleString()}</p>
      <section style={{marginTop:16}}>
        <h2>Problemi principali</h2>
        <p style={{whiteSpace:"pre-wrap"}}>{p.issues || "—"}</p>
      </section>
      <section style={{marginTop:16}}>
        <h2>Obiettivi</h2>
        <p style={{whiteSpace:"pre-wrap"}}>{p.goals || "—"}</p>
      </section>
      <section style="margin-top:16px">
        <h2>GAD-7 (ultimi esiti)</h2>
        <div id="gad7-list"></div>
      </section>
    </main>
  );
}
