'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = { id: string; display_name: string | null };

export default function NuovaNotaSedutaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromUrl = searchParams?.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState(patientIdFromUrl || '');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [themes, setThemes] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('patients')
        .select('id, display_name')
        .eq('therapist_user_id', user.id)
        .order('display_name');

      setPatients(data || []);
    } catch (e) {
      console.error('Errore caricamento pazienti:', e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const themesArray = themes
        .split('\n')
        .map(t => t.trim())
        .filter(t => t);

      const { error } = await supabase.from('session_notes').insert({
        patient_id: patientId,
        therapist_user_id: user.id,
        session_date: sessionDate,
        notes,
        themes: themesArray
      });

      if (error) throw error;

      alert('✅ Nota seduta salvata!');
      router.push(`/app/therapist/pazienti/${patientId}`);
    } catch (e: any) {
      setErr(e?.message || 'Errore salvataggio');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-4">
        <Link href="/app/therapist" className="text-blue-600 hover:underline">
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold">Nuova Nota Seduta</h1>

      {err && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{err}</div>}

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Paziente *</label>
          <select
            required
            className="w-full border rounded px-3 py-2"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          >
            <option value="">-- Seleziona paziente --</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.display_name || 'Senza nome'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Data seduta *</label>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Note seduta *</label>
          <textarea
            required
            className="w-full border rounded px-3 py-2 min-h-[200px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Descrivi cosa è emerso durante la seduta, tecniche utilizzate, progressi..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Temi principali (uno per riga)</label>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[100px]"
            value={themes}
            onChange={(e) => setThemes(e.target.value)}
            placeholder="Es:&#10;Ansia sociale&#10;Tecniche di rilassamento&#10;Obiettivi settimanali"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Salvataggio...' : '💾 Salva Nota'}
          </button>
          <Link
            href="/app/therapist"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium"
          >
            Annulla
          </Link>
        </div>
      </form>
    </div>
  );
}
