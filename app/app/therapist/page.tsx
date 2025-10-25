'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type GadRow = { id:string; total:number; severity:string|null; created_at:string; patient_id:string|null; patients?:{display_name:string|null}|null };
type PatRow = { id:string; display_name:string|null; created_at:string };
type ApptRow = { id:string; title:string; starts_at:string; ends_at:string; status:string; patients?:{display_name:string|null}|null };

export default function Page(){
  const [recentResults,setRecentResults]=useState<GadRow[]>([]);
  const [recentPatients,setRecentPatients]=useState<PatRow[]>([]);
  const [nextAppts,setNextAppts]=useState<ApptRow[]>([]);
  const [err,setErr]=useState<string|null>(null);

  useEffect(()=>{
    (async ()=>{
      setErr(null);
      const { data:{ user } } = await supabase.auth.getUser();
      if(!user){ setErr('Non autenticato'); return; }

      // Ultimi GAD-7
      const { data:g, error:ge } = await supabase
        .from('gad7_results')
        .select('id,total,severity,created_at,patient_id,patients(display_name)')
        .eq('therapist_user_id', user.id)
        .order('created_at', { ascending:false })
        .limit(5);
      if(ge) setErr(ge.message);
      setRecentResults((g||[]) as any);

      // Pazienti recenti
      const { data:p, error:pe } = await supabase
        .from('patients')
        .select('id,display_name,created_at')
        .eq('therapist_user_id', user.id)
        .order('created_at',{ ascending:false })
        .limit(5);
      if(pe) setErr(pe.message);
      setRecentPatients((p||[]) as any);

      // Prossimi appuntamenti
      const { data:a, error:ae } = await supabase
        .from('appointments')
        .select('id,title,starts_at,ends_at,status,patients(display_name)')
        .eq('therapist_user_id', user.id)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at',{ ascending:true })
        .limit(5);
      if(ae) setErr(ae.message);
      setNextAppts((a||[]) as any);
    })();
  },[]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {err && <div className="p-3 border border-red-300 bg-red-50 rounded">{err}</div>}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Card GAD-7 */}
        <div className="border rounded p-4">
          <div className="font-semibold mb-2">Ultimi risultati GAD-7</div>
          <ul className="space-y-2">
            {recentResults.map(r=>(
              <li key={r.id} className="border rounded px-3 py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">Score — {r.total}</div>
                  <div className="text-xs text-gray-600">
                    {(r.severity||'').charAt(0).toUpperCase()+ (r.severity||'').slice(1)} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <Link href={`/app/therapist/pazienti/${r.patient_id}`} className="text-sm underline">Apri paziente</Link>
              </li>
            ))}
            {recentResults.length===0 && <li className="text-sm text-gray-600">Nessun risultato.</li>}
          </ul>
        </div>

        {/* Card Pazienti */}
        <div className="border rounded p-4">
          <div className="font-semibold mb-2">Pazienti recenti</div>
          <ul className="space-y-2">
            {recentPatients.map(p=>(
              <li key={p.id} className="border rounded px-3 py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.display_name || 'Senza nome'}</div>
                  <div className="text-xs text-gray-600">{new Date(p.created_at).toLocaleString()}</div>
                </div>
                <Link href={`/app/therapist/pazienti/${p.id}`} className="text-sm underline">Apri</Link>
              </li>
            ))}
            {recentPatients.length===0 && <li className="text-sm text-gray-600">Nessun paziente.</li>}
          </ul>
        </div>

        {/* Card Appuntamenti */}
        <div className="border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Prossimi appuntamenti</div>
            <div className="text-sm flex gap-3">
              <Link href="/app/therapist/appuntamenti" className="underline">Apri elenco</Link>
              <Link href="/app/therapist/appuntamenti/nuovo" className="underline">Nuovo</Link>
            </div>
          </div>
          <ul className="space-y-2">
            {nextAppts.map(a=>(
              <li key={a.id} className="border rounded px-3 py-2">
                <div className="font-medium">{a.title}{a.patients?.display_name ? ` · ${a.patients.display_name}` : ''}</div>
                <div className="text-xs text-gray-600">
                  {new Date(a.starts_at).toLocaleString()} — {new Date(a.ends_at).toLocaleTimeString()}
                </div>
              </li>
            ))}
            {nextAppts.length===0 && <li className="text-sm text-gray-600">Nessun appuntamento programmato.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
