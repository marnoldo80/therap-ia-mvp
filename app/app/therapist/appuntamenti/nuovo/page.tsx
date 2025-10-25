'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page(){
  const router = useRouter();
  const sp = useSearchParams();
  const [title, setTitle] = useState('Seduta');
  const [notes, setNotes] = useState('');
  const [date, setDate]   = useState<string>('');
  const [time, setTime]   = useState<string>('');
  const [dur, setDur]     = useState<number>(50);
  const [patientId, setPatientId] = useState<string>('');
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(()=>{
    const pid = sp.get('patient_id');
    if (pid) setPatientId(pid);
  },[sp]);

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    setMsg(null); setErr(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Non autenticato'); return; }

    if (!date || !time) { setErr('Inserisci data e ora'); return; }
    const starts_at = new Date(`${date}T${time}:00`);
    const ends_at   = new Date(starts_at.getTime() + dur*60000);

    const payload: any = {
      therapist_user_id: user.id,
      title,
      notes: notes || null,
      starts_at: starts_at.toISOString(),
      ends_at: ends_at.toISOString(),
      status: 'scheduled'
    };
    if (patientId) payload.patient_id = patientId;

    const { error } = await supabase.from('appointments').insert(payload);
    if (error){ setErr(error.message); return; }

    setMsg('Appuntamento creato.');
    setTimeout(()=>router.push('/app/therapist'), 500);
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Nuovo appuntamento</h1>
      {err && <div className="p-3 border border-red-300 bg-red-50 rounded">{err}</div>}
      {msg && <div className="p-3 border border-green-300 bg-green-50 rounded">{msg}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Titolo</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Note</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Data</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Ora</label>
            <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Durata (min)</label>
            <input type="number" min={10} max={240} value={dur} onChange={e=>setDur(parseInt(e.target.value||'0',10))} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Patient ID (opzionale)</label>
            <input value={patientId} onChange={e=>setPatientId(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="uuid paziente" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 border rounded">Crea</button>
          <button type="button" onClick={()=>history.back()} className="px-4 py-2 border rounded">Annulla</button>
        </div>
      </form>
    </div>
  );
}
