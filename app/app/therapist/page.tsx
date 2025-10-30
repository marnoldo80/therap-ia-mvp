'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

type Therapist = { display_name: string|null; address: string|null; vat_number: string|null; };
type PatientRel = { display_name: string|null } | { display_name: string|null }[] | null;
type ApptRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: string;
  patients?: PatientRel;
};
type PatRow = { id: string; display_name: string|null; created_at: string; email: string|null; };

function getPatientName(rel: PatientRel): string {
  if (!rel) return '';
  if (Array.isArray(rel)) return rel[0]?.display_name || '';
  return rel.display_name || '';
}

export default function Page() {
  const supabase = getSupabaseBrowserClient();
  const [err, setErr] = useState<string|null>(null);
  const [therapist, setTherapist] = useState<Therapist|null>(null);
  const [allPatients, setAllPatients] = useState<PatRow[]>([]);
  const [nextAppts, setNextAppts] = useState<ApptRow[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [weekAppts, setWeekAppts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setErr(null); 
      setLoading(true);
      
      // Attendi che la sessione sia pronta
      await new Promise(r => setTimeout(r, 500));
      
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { 
        setErr('Non autenticato'); 
        setLoading(false); 
        return; 
      }

      // Profilo
      {
        const { data, error } = await supabase
          .from('therapists')
          .select('display_name,address,vat_number')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) setErr(error.message);
        setTherapist((data || null) as Therapist|null);
      }

      // Statistiche
      {
        const { count } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('therapist_user_id', user.id);
        setTotalPatients(count || 0);

        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const { count: apptCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('therapist_user_id', user.id)
          .gte('starts_at', weekStart.toISOString())
          .lte('starts_at', weekEnd.toISOString());
        setWeekAppts(apptCount || 0);
      }

      // Tutti i pazienti
      {
        const { data } = await supabase
          .from('patients')
          .select('id,display_name,created_at,email')
          .eq('therapist_user_id', user.id)
          .order('created_at', { ascending: false });
        setAllPatients(data || []);
      }

      // Prossimi appuntamenti
      {
        const now = new Date().toISOString();
        const { data } = await supabase
          .from('appointments')
          .select('id,title,starts_at,ends_at,status,patients(display_name)')
          .eq('therapist_user_id', user.id)
          .gte('starts_at', now)
          .order('starts_at', { ascending: true })
          .limit(5);
        setNextAppts(data || []);
      }

      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Caricamento...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ margin: 0 }}>Area Terapeuta</h1>
          {therapist?.display_name && <p style={{ margin: '8px 0 0', color: '#666' }}>Benvenuto, {therapist.display_name}</p>}
        </div>
        <Link href="/app/therapist/onboarding" style={{ color: '#0066cc' }}>Modifica profilo</Link>
      </div>

      {err && <div style={{ padding: 16, background: '#fee', border: '1px solid #c00', borderRadius: 8, marginBottom: 20, color: '#c00' }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 30 }}>
        <div style={{ padding: 20, background: '#f9f9f9', borderRadius: 12 }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Pazienti totali</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{totalPatients}</div>
        </div>
        <div style={{ padding: 20, background: '#f9f9f9', borderRadius: 12 }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Appuntamenti questa settimana</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{weekAppts}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Prossimi appuntamenti</h2>
          {nextAppts.length === 0 && <p style={{ color: '#999' }}>Nessun appuntamento in programma</p>}
          {nextAppts.map(a => (
            <div key={a.id} style={{ padding: 12, background: '#f9f9f9', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ fontWeight: 'bold' }}>{a.title}</div>
              <div style={{ fontSize: 14, color: '#666' }}>
                {new Date(a.starts_at).toLocaleString('it-IT')} • {getPatientName(a.patients)}
              </div>
            </div>
          ))}
          <Link href="/app/therapist/appuntamenti" style={{ color: '#0066cc', fontSize: 14 }}>
            Vedi tutti gli appuntamenti →
          </Link>
        </div>

        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Pazienti recenti</h2>
          {allPatients.length === 0 && <p style={{ color: '#999' }}>Nessun paziente registrato</p>}
          {allPatients.slice(0, 5).map(p => (
            <div key={p.id} style={{ padding: 12, background: '#f9f9f9', borderRadius: 8, marginBottom: 8 }}>
              <Link href={`/app/therapist/pazienti/${p.id}`} style={{ fontWeight: 'bold', color: '#000', textDecoration: 'none' }}>
                {p.display_name || 'Senza nome'}
              </Link>
              <div style={{ fontSize: 14, color: '#666' }}>{p.email}</div>
            </div>
          ))}
          <Link href="/app/therapist/pazienti" style={{ color: '#0066cc', fontSize: 14 }}>
            Vedi tutti i pazienti →
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 30, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/app/therapist/pazienti/nuovo" style={{ padding: '12px 20px', background: '#0066cc', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold' }}>
          + Nuovo paziente
        </Link>
        <Link href="/app/therapist/appuntamenti/nuovo" style={{ padding: '12px 20px', background: '#fff', color: '#0066cc', border: '2px solid #0066cc', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold' }}>
          + Nuovo appuntamento
        </Link>
        <Link href="/app/therapist/questionari" style={{ padding: '12px 20px', background: '#fff', color: '#0066cc', border: '2px solid #0066cc', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold' }}>
          📋 Questionari
        </Link>
      </div>
    </div>
  );
}
