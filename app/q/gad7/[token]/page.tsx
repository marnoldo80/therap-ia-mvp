"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function Page(){
  const { token } = useParams() as { token: string };
  const [ans, setAns] = useState<number[]>(Array(7).fill(0));
  const [err, setErr] = useState<string|null>(null);
  const [done, setDone] = useState(false);

  useEffect(()=>{ setErr(null); },[token]);

  async function submit(e:React.FormEvent){
    e.preventDefault(); setErr(null);
    try{
      const { error } = await supabase.rpc("gad7_submit_token", { p_token: token, p_answers: ans });
      if(error) throw error;
      setDone(true);
    }catch(e:any){ setErr(e?.message ?? "Errore"); }
  }

  if(done) return (
    <main style={{maxWidth:720,margin:"40px auto",padding:20,textAlign:"center"}}>
      <h1>Grazie!</h1>
      <p>Il questionario è stato inviato al tuo terapeuta.</p>
    </main>
  );

  return (
    <main style={{maxWidth:720,margin:"40px auto",padding:20}}>
      <h1>Questionario GAD-7</h1>
      {err && <p style={{color:"crimson"}}>{err}</p>}
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
        <button type="submit" style={{padding:"10px 14px",borderRadius:8,border:"1px solid #333"}}>Invia</button>
      </form>
    </main>
  );
}
