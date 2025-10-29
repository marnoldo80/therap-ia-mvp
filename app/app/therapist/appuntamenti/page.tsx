'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Appointment = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: string;
  patient_id: string | null;
  patients?: { display_name: string | null } | { display_name: string | null }[] | null;
};

function getPatientName(patients: Appointment['patients']): string {
  if (!patients) return '';
  if (Array.isArray(patients)) return patients[0]?.display_name || '';
  return patients.display_name || '';
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  async function loadAppointments() {
    setLoading(true);
    setErr(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      let query = supabase
        .from('appointments')
        .select('id, title, starts_at, ends_at, status, patient_id, patients(display_name)')
        .eq('therapist_user_id', user.id)
        .order('starts_at', { ascending: filter !== 'past' });

      if (filter === 'upcoming') {
        query = query.gte('starts_at', new Date().toISOString());
      } else if (filter === 'past') {
        query = query.lt('starts_at', new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (e: any) {
      setErr(e?.message || 'Errore caricamento appuntamenti');
    } finally {
      setLoading(false);
    }
  }

  async function deleteAppointment(id: string) {
    if (!confirm('Eliminare questo appuntamento?')) return;

    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      loadAppointments();
    } catch (e: any) {
      alert('Errore: ' + e?.message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Appuntamenti</h1>
        <Link
          href="/app/therapist/appuntamenti/nuovo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nuovo Appuntamento
        </Link>
      </div>

      {err && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{err}</div>}

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded ${
            filter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Prossimi
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Tutti
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded ${
            filter === 'past' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Passati
        </button>
      </div>

      {loading && <div className="text-center py-8">Caricamento...</div>}

      <div className="space-y-3">
        {appointments.map((apt) => (
          <div key={apt.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{apt.title}</h3>
                {getPatientName(apt.patients) && (
                  <p className="text-sm text-gray-600">Paziente: {getPatientName(apt.patients)}</p>
                )}
                <div className="text-sm text-gray-600 mt-2">
                  📅 {new Date(apt.starts_at).toLocaleString('it-IT')}
                  {' → '}
                  {new Date(apt.ends_at).toLocaleTimeString('it-IT')}
                </div>
                <div className="mt-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      apt.status === 'confermato'
                        ? 'bg-green-100 text-green-700'
                        : apt.status === 'da_confermare'
                        ? 'bg-yellow-100 text-yellow-700'
                        : apt.status === 'cancellato'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteAppointment(apt.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Elimina
              </button>
            </div>
          </div>
        ))}

        {appointments.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Nessun appuntamento trovato</p>
            <Link href="/app/therapist/appuntamenti/nuovo" className="text-blue-600 hover:underline mt-2 inline-block">
              Crea il primo appuntamento
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
