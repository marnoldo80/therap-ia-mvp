"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const Q = [
  "Nervoso/a, ansioso/a o teso/a",
  "Non riuscire a fermare o controllare la preoccupazione",
  "Preoccuparsi troppo per diverse cose",
  "Difficoltà a rilassarsi",
  "Irrequieto/a, non riesco a stare fermo/a",
  "Irritabile o facile all’irritazione",
  "Paura che possa succedere qualcosa di terribile",
];

function interpret(total:number){
  if (total <= 4) return "Minimal";
  if (total <= 9) return "Mild";
  if (total <= 14) return "Moderate";
  return "Severe";
}

export default function Page(){
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [ans, setAns] = useState<number[]>(Array(7).fill(0));
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{(async()=>{
    const { data:u } = await supabase.auth.getUser();
    if(!u?.user){ router.replace("/login"); return; }
  })()},[router]);

  const total = ans.reduce((a,b)=>a+b,0);
  const severity = interpret(total);

  async function submit(e:React.FormEvent){
    e.preventDefault(); setErr(null); setLoading(true);
    try{
      const { data:u } = await supabase.auth.getUser();
      const user = u?.user; if(!user) throw new Error("Sessione scaduta");
      const { error } = await supabase.from("gad7_results").insert({
        patient_id: id, therapist_user_id: user.id, answers: ans, total, severity
      });
      if(error) throw error;
      router.replace(`/app/therapist/pazienti/${id}`);
    }catch(e:any){ setErr(e?.message ?? "Errore"); }
    finally{ setLoading(false); }
  }

  return (
    <main style={{maxWidth:720,margin:"40px auto",padding:20}}>
      <a href={`/app/therapist/pazienti/${id}`} style={{textDecoration:"none"}}>← Torna alla scheda</a>
      <h1 style={{marginTop:8}}>GAD-7</h1>
      <form onSubmit={submit} style={{display:"grid",gap:16,marginTop:16}}>
        {Q.map((q,i)=>(
          <div key={i} style={{border:"1px solid #ddd",borderRadius:8,padding:12}}>
            <div style={{marginBottom:8}}><b>{i+1}.</b> {q}</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[0,1,2,3].map(v=>(
                <label key={v} style={{display:"flex",alignItems:"center",gap:6}}>
                  <input type="radio" name={`q${i}`} checked={ans[i]===v} onChange={()=>setAns(a=>{const c=[...a]; c[i]=v; return c;})}/>
                  {v} {v===0?"(Per niente)":v===1?"(Diversi giorni)":v===2?"(Più della metà dei giorni)":"(Quasi ogni giorno)"}
                </label>
              ))}
            </div>
          </div>
        ))}
        <div style={{marginTop:8}}>
          Totale: <b>{total}</b> — Gravità: <b>{severity}</b>
        </div>
        {err && <p style={{color:"crimson"}}>{err}</p>}
        <button type="submit" disabled={loading}
          style={{padding:"10px 14px",borderRadius:8,border:"1px solid #333"}}>
          {loading? "Salvataggio…" : "Salva risultato"}
        </button>
      </form>
    </main>
  );
}
