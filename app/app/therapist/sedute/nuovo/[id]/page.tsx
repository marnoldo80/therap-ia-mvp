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

  if (loading) return <div className="max-w-4xl mx-auto p-6">Caricamento...</div>;
  if (err) return <div className="max-w-4xl mx-auto p-6"><div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{err}</div></div>;
  if (!session) return <div className="max-w-4xl mx-auto p-6">Seduta non trovata</div>;

  const patientName = session.patients && typeof session.patients === 'object' && 'display_name' in session.patients 
    ? session.patients.display_name 
    : 'Paziente';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex gap-4">
        <Link href="/app/therapist" className="text-blue-600 hover:underline">
          ← Dashboard
        </Link>
        <Link href={`/app/therapist/pazienti/${session.patient_id}`} className="text-blue-600 hover:underline">
          ← Scheda Paziente
        </Link>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Seduta del {new Date(session.session_date).toLocaleDateString('it-IT')}</h1>
            <p className="text-gray-600 mt-2">Paziente: {patientName}</p>
          </div>
          <div className="text-sm text-gray-500">
            Creata il {new Date(session.created_at).toLocaleDateString('it-IT')}
          </div>
        </div>

        {session.themes && session.themes.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">🏷️ Temi principali</h3>
            <div className="flex flex-wrap gap-2">
              {session.themes.map((theme, i) => (
                <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2">📝 Note seduta</h3>
          <div className="bg-gray-50 border rounded-lg p-4 whitespace-pre-wrap">
            {session.notes || 'Nessuna nota'}
          </div>
        </div>

        {session.ai_summary && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">🤖 Riassunto IA</h3>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 whitespace-pre-wrap">
              {session.ai_summary}
            </div>
          </div>
        )}

        {!session.ai_summary && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm">
              💡 <strong>Suggerimento:</strong> In futuro potrai generare automaticamente un riassunto di questa seduta usando l'IA.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href={`/app/therapist/pazienti/${session.patient_id}`}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          Torna alla Scheda Paziente
        </Link>
      </div>
    </div>
  );
}
