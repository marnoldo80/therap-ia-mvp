"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const Q = [
  "1) Sentirsi nervoso/a, ansioso/a o con i nervi a fior di pelle",
  "2) Non riuscire a smettere o a controllare la preoccupazione",
  "3) Preoccuparsi troppo per diverse cose",
  "4) Avere difficoltà a rilassarsi",
  "5) Essere così irrequieto/a da far fatica a stare fermo/a",
  "6) Irritabilità o facile agitazione",
  "7) Paura come se potesse succedere qualcosa di terribile",
];

function toSeverity(total:number){
  if (total<=4) return "Minimo";
  if (total<=9) return "Lieve";
  if (total<=14) return "Moderato";
  return "Grave";
}

export default function Page({ params}:{params:{id:string}}){
  const pid = params.id;
  const router = useRouter();
  const [answers,setAnswers]=useState<number[]>(Array(7).fill(0));
  const [msg,setMsg]=useState<string|null>(null);
  const [err,setErr]=useState<string|null>(null);
  const [saved,setSaved]=useState<boolean>(false);
  const [sending,setSending]=useState(false);

  const total = useMemo(()=>answers.reduce((a,b)=>a+(Number.isFinite(b)?b:0),0),[answers]);
  const severity = useMemo(()=>toSeverity(total),[total]);

  useEffect(()=>{ (async()=>{
    const {data:u}=await supabase.auth.getUser();
    if(!u?.user){ router.replace("/login"); }
  })(); },[router]);

  async function save(){
    setMsg(null); setErr(null);
    try{
      const { error } = await supabase
        .from("gad7_results")
        .insert({ patient_id: pid, total, severity });
      if(error) throw error;
      setSaved(true);
      setMsg("Risultato salvato.");
    }catch(e:any){
      setErr(e?.message || "Errore salvataggio");
    }
  }

  async function sendToPatient(){
    setErr(null); setMsg(null); setSending(true);
    try{
      // recupera email paziente
      const { data, error } = await supabase
        .from("patients").select("display_name,email").eq("id",pid).single();
      if(error) throw error;
      const email = data?.email as string|undefined;
      if(!email){ throw new Error("Email paziente non presente."); }
      const res = await fetch("/api/send-gad7-result",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          toEmail: email,
          toName: data?.display_name || "Paziente",
          patientName: data?.display_name || "",
          total, severity, date: new Date().toLocaleString(),
        })
      });
      if(!res.ok){
        const j = await res.json().catch(()=>({}));
        throw new Error(j?.error || "Invio email fallito");
      }
      setMsg("Email risultati inviata al paziente.");
    }catch(e:any){
      setErr(e?.message || "Errore invio email");
    }finally{ setSending(false); }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <button className="mb-4 text-sm text-blue-600 hover:underline"
        onClick={()=>router.push(`/app/therapist/pazienti/${pid}`)}>← Torna alla scheda paziente</button>

      <h1 className="text-2xl font-semibold mb-1">GAD-7 (terapeuta)</h1>

      {err && <div className="mb-3 rounded border border-red-300 bg-red-50 px-4 py-2 text-red-700">{err}</div>}
      {msg && <div className="mb-3 rounded border border-emerald-300 bg-emerald-50 px-4 py-2 text-emerald-700">{msg}</div>}

      <div className="space-y-5">
        {Q.map((q,i)=>(
          <div key={i} className="rounded-xl border p-4">
            <p className="mb-3 font-medium">{q}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[0,1,2,3].map(v=>(
                <label key={v} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${answers[i]===v?"border-blue-600 bg-blue-50":"border-gray-300 hover:border-gray-400"}`}>
                  <input type="radio" name={`q${i}`} className="mr-2"
                    checked={answers[i]===v} onChange={()=>setAnswers(a=>{const c=[...a]; c[i]=v; return c;})}/>
                  {v===0&&"Per niente"}
                  {v===1&&"Alcuni giorni"}
                  {v===2&&"Più della metà dei giorni"}
                  {v===3&&"Quasi tutti i giorni"}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border p-4">
        <p className="text-sm text-gray-600">Somma punteggi</p>
        <p className="text-3xl font-semibold">{total} <span className="text-base font-normal">/ 21</span></p>
        <p className="mt-1 text-gray-700">Gravità: <b>{severity}</b></p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button onClick={save} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">💾 Salva risultato</button>
        <button onClick={sendToPatient} disabled={!saved || sending}
          title={!saved ? "Salva prima il risultato" : ""}
          className="rounded border border-emerald-600 px-4 py-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">
          ✉️ Invia risultati al paziente
        </button>
      </div>
    </main>
  );
}
