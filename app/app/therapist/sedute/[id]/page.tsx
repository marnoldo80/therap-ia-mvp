'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SessionNote = {
  id: string;
  patient_id: string;
  session_date: string;
  notes: string | null;
  ai_summary: string | null;
  themes: string[];
  created_at: string;
  patients?: {
    display_name: string | null;
  } | null;
};

export default function DettaglioSedutaPage() {
  const params = useParams();
  const id = params?.id as string;

  const [session, setSession] = useState<SessionNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadSession();
  }, [id]);

  async function loadSession() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const { data, error } = await supabase
        .from('session_notes')
        .select('*, patients(display_name)')
        .eq('id', id)
        .eq('therapist_user_id', user.id)
        .single();

      if (error) throw error;
      setSession(data as SessionNote);
    } catch (e: any) {
      setErr(e?.message || 'Errore caricamento');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6" style={{ color: 'white' }}>
        Caricamento...
      </div>
    );
  }
  
  if (err) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 rounded" style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#dc2626'
        }}>
          {err}
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6" style={{ color: 'white' }}>
        Seduta non trovata
      </div>
    );
  }

  const patientName = session.patients && typeof session.patients === 'object' && 'display_name' in session.patients 
    ? session.patients.display_name 
    : 'Paziente';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex gap-4">
        <Link 
          href="/app/therapist" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          ← Dashboard
        </Link>
        <Link 
          href={`/app/therapist/pazienti/${session.patient_id}`} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          ← Scheda Paziente
        </Link>
      </div>

      <div className="rounded-lg p-6" style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'white' }}>
              Seduta del {new Date(session.session_date).toLocaleDateString('it-IT')}
            </h1>
            <p className="mt-2" style={{ color: '#a8b2d6' }}>
              Paziente: {patientName}
            </p>
          </div>
          <div className="text-sm" style={{ color: '#a8b2d6' }}>
            Creata il {new Date(session.created_at).toLocaleDateString('it-IT')}
          </div>
        </div>

        {session.themes && session.themes.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2" style={{ color: 'white' }}>
              🏷️ Temi principali
            </h3>
            <div className="flex flex-wrap gap-2">
              {session.themes.map((theme, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ 
                    backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2" style={{ color: 'white' }}>
            📝 Note seduta
          </h3>
          <div 
            className="border rounded-lg p-4 whitespace-pre-wrap overflow-y-auto"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              maxHeight: '400px', // Altezza massima fissa
              minHeight: '120px'   // Altezza minima
            }}
          >
            {session.notes || 'Nessuna nota'}
          </div>
        </div>

        {session.ai_summary && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2" style={{ color: 'white' }}>
              🤖 Riassunto IA
            </h3>
            <div 
              className="rounded-lg p-4 whitespace-pre-wrap overflow-y-auto"
              style={{
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                color: 'white',
                maxHeight: '400px', // Altezza massima fissa
                minHeight: '120px'   // Altezza minima
              }}
            >
              {session.ai_summary}
            </div>
          </div>
        )}

        {!session.ai_summary && (
          <div 
            className="rounded-lg p-4"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            <p className="text-sm" style={{ color: '#60a5fa' }}>
              💡 <strong>Suggerimento:</strong> In futuro potrai generare automaticamente un riassunto di questa seduta usando l'IA.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href={`/app/therapist/pazienti/${session.patient_id}`}
          className="px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          style={{ 
            backgroundColor: '#7aa2ff', 
            color: '#0b1022',
            textDecoration: 'none'
          }}
        >
          Torna alla Scheda Paziente
        </Link>
      </div>
    </div>
  );
}
