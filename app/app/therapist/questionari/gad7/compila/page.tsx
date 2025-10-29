'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

function CompilaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');

  const [risposte, setRisposte] = useState<number[]>(Array(7).fill(-1));
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    if (!patientId) {
      alert('Paziente non specificato');
      router.push('/app/therapist/questionari/gad7');
      return;
    }
    loadPatient();
  }, [patientId]);

  async function loadPatient() {
    const { data } = await supabase
      .from('patients')
      .select('display_name')
      .eq('id', patientId)
      .single();
    
    setPatientName(data?.display_name || 'Paziente');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (risposte.some(r => r === -1)) {
      alert('Rispondi a tutte le domande');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const total = risposte.reduce((a, b) => a + b, 0);
      let severity = 'minima';
      if (total >= 15) severity = 'grave';
      else if (total >= 10) severity = 'moderata';
      else if (total >= 5) severity = 'lieve';

      const { error } = await supabase.from('gad7_results').insert({
        patient_id: patientId,
        therapist_user_id: user.id,
        total,
        severity,
        answers: risposte
      });

      if (error) throw error;

      alert('Questionario salvato!');
      router.push(`/app/therapist/pazienti/${patientId}`);
    } catch (e: any) {
      alert('Errore: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="mb-4">
        <Link href="/app/therapist/questionari/gad7" className="text-blue-600 hover:underline">
          ← Indietro
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">GAD-7</h1>
        <p className="text-gray-600 mt-1">Paziente: {patientName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-gray-600">
          Nelle ultime 2 settimane, con quale frequenza sei stato infastidito dai seguenti problemi?
        </p>

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
          disabled={loading || risposte.some(r => r === -1)}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Salvataggio...' : 'Salva Questionario'}
        </button>
      </form>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Caricamento...</div>}>
      <CompilaForm />
    </Suspense>
  );
}
