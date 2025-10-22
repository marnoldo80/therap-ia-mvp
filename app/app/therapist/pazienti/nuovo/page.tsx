"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page(){
  const router = useRouter();
  const [displayName,setDisplayName]=useState("");
  const [issues,setIssues]=useState("");
  const [goals,setGoals]=useState("");
  const [err,setErr]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{(async()=>{
    const { data: u } = await supabase.auth.getUser();
    if(!u?.user){ router.replace("/login"); return; }
  })()},[router]);

  async function handleSubmit(e:React.FormEvent){
    e.preventDefault();
    setErr(null); setLoading(true);
    try{
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user; if(!user) throw new Error("Sessione scaduta");
      const { error } = await supabase.from("patients").insert({
        therapist_user_id: user.id,
        display_name: displayName,
        issues, goals
      });
      if(error) throw error;
      router.replace("/app/therapist/pazienti");
    }catch(e:any){
      setErr(e?.message ?? "Errore");
    }finally{ setLoading(false); }
  }

  return (
    <main style={{maxWidth:680,margin:"40px auto",padding:20}}>
      <h1>Nuovo paziente</h1>
      {err && <p style={{color:"crimson"}}>{err}</p>}
      <form onSubmit={handleSubmit} style={{display:"grid",gap:12,marginTop:16}}>
        <label>Nome / Pseudonimo
          <input value={displayName} onChange={e=>setDisplayName(e.target.value)} required
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
          <button type="submit" disabled={loading}
                  style={{padding:"10px 14px",borderRadius:8,border:"1px solid #333"}}>
            {loading? "Salvataggio…" : "Salva"}
          </button>
          <a href="/app/therapist/pazienti" style={{padding:"10px 14px",border:"1px solid #999",borderRadius:8,textDecoration:"none"}}>
            Annulla
          </a>
        </div>
      </form>
    </main>
  );
}
