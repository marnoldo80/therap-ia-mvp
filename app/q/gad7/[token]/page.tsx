'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const domande = [
  'Sentirsi nervoso, ansioso o molto teso',
  'Non essere in grado di fermare o controllare le preoccupazioni',
  'Preoccuparsi troppo di cose diverse',
  'Difficoltà a rilassarsi',
  'Essere così irrequieto da non riuscire a stare fermo',
  'Diventare facilmente infastidito o irritabile',
  'Sentirsi spaventato come se stesse per accadere qualcosa di terribile'
];

export default function GAD7PublicPage() {
  const params = useParams();
  const token = params?.token as string;

  const [risposte, setRisposte] = useState<number[]>(Array(7).fill(-1));
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    loadPatientInfo();
  }, [token]);

  async function loadPatientInfo() {
    try {
      const { data } = await supabase
        .from('gad7_invites')
        .select('patients(display_name)')
        .eq('token', token)
        .single();
      
     if (data && typeof data.patients === 'object' && data.patients && 'display_name' in data.patients) {
        const name = data.patients.display_name;
        setPatientName(typeof name === 'string' ? name : '');
      }
    } catch (e) {
      console.error('Errore caricamento paziente:', e);
    }
  }

  const total = risposte.reduce((acc, val) => (val >= 0 ? acc + val : acc), 0);
  const allAnswered = risposte.every(r => r >= 0);

  let severity = 'minima';
  if (total >= 15) severity = 'grave';
  else if (total >= 10) severity = 'moderata';
  else if (total >= 5) severity = 'lieve';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!allAnswered) {
      alert('Rispondi a tutte le domande');
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const { error } = await supabase.rpc('gad7_submit_token', {
        p_token: token,
        p_answers: risposte
      });

      if (error) throw error;

      setDone(true);
    } catch (e: any) {
      setErr(e?.message || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <div className="bg-white border rounded-lg p-8 mt-12">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-4">Grazie!</h1>
          <p className="text-lg text-gray-600">Il questionario è stato inviato al tuo terapeuta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold">GAD-7</h1>
        {patientName && <p className="text-gray-600 mt-1">Paziente: {patientName}</p>}
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600">Punteggio attuale</div>
          <div className="text-3xl font-bold">{total}</div>
          <div className={`inline-block mt-2 px-3 py-1 rounded text-sm ${
            severity === 'minima' ? 'bg-green-100 text-green-700' :
            severity === 'lieve' ? 'bg-blue-100 text-blue-700' :
            severity === 'moderata' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-gray-600">
          Nelle ultime 2 settimane, con quale frequenza sei stato infastidito dai seguenti problemi?
        </p>

        {err && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{err}</div>}

        {domande.map((domanda, i) => (
          <div key={i} className="bg-white border rounded-lg p-4">
            <p className="font-medium mb-3">{i + 1}. {domanda}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Mai', 'Diversi giorni', 'Più della metà dei giorni', 'Quasi ogni giorno'].map((opzione, val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    const newRisposte = [...risposte];
                    newRisposte[i] = val;
                    setRisposte(newRisposte);
                  }}
                  className={`px-3 py-2 rounded border text-sm ${
                    risposte[i] === val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:border-blue-600'
                  }`}
                >
                  {opzione}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={loading || !allAnswered}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Invio in corso...' : 'Invia Questionario'}
        </button>
      </form>
    </div>
  );
}
