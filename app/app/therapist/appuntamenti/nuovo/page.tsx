'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = { id: string; display_name: string | null };

export default function NewAppointmentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [duration, setDuration] = useState('60');
  const [patients, setPatients] = useState<Patient[]>([]);
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

      const start = new Date(`${date}T${hour}:${minute}`);
      const end = new Date(start.getTime() + parseInt(duration) * 60000);

      const { data: newAppointment, error } = await supabase.from('appointments').insert({
        therapist_user_id: user.id,
        patient_id: patientId || null,
        title,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status: 'scheduled'
      }).select().single();

      if (error) throw error;

      // Invia email conferma al paziente se presente
      if (patientId && newAppointment) {
        try {
          await fetch('/api/send-appointment-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId: newAppointment.id })
          });
        } catch (emailError) {
          console.error('Errore invio email:', emailError);
          // Non bloccare il flusso se email fallisce
        }
      }

      alert('✅ Appuntamento creato' + (patientId ? ' e email inviata al paziente!' : '!'));
      router.push('/app/therapist/appuntamenti');
    } catch (e: any) {
      setErr(e?.message || 'Errore');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-4 flex gap-3">
        <Link href="/app/therapist" className="text-blue-600 hover:underline">← Dashboard</Link>
        <Link href="/app/therapist/appuntamenti" className="text-blue-600 hover:underline">Lista appuntamenti</Link>
      </div>

      <h1 className="text-2xl font-bold mb-4">Nuovo Appuntamento</h1>

      {err && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{err}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Titolo</label>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es: Seduta terapeutica"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Paziente (opzionale)</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          >
            <option value="">Nessun paziente</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || 'Senza nome'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data</label>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ora di inizio</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              className="border rounded px-3 py-2"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
            >
              {Array.from({ length: 15 }, (_, i) => i + 8).map(h => (
                <option key={h} value={h.toString().padStart(2, '0')}>
                  {h.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            <select
              className="border rounded px-3 py-2"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
            >
              {['00', '15', '30', '45'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Durata</label>
          <div className="grid grid-cols-4 gap-2">
            {['15', '30', '45', '60'].map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setDuration(min)}
                className={`px-4 py-3 rounded border font-medium transition ${
                  duration === min
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white hover:border-blue-600'
                }`}
              >
                {min} min
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Creazione...' : 'Crea Appuntamento'}
        </button>
      </form>
    </div>
  );
}
