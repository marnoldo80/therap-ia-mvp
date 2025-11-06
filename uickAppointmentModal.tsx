'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type QuickAppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  prefilledDateTime: string | null;
  onSuccess: () => void;
};

type Patient = { id: string; display_name: string | null };

export default function QuickAppointmentModal({ 
  isOpen, 
  onClose, 
  prefilledDateTime,
  onSuccess 
}: QuickAppointmentModalProps) {
  const [title, setTitle] = useState('Seduta terapeutica');
  const [patientId, setPatientId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPatients();
      if (prefilledDateTime) {
        setStartsAt(new Date(prefilledDateTime).toISOString().slice(0, 16));
      }
    }
  }, [isOpen, prefilledDateTime]);

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

  async function handleCreate() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const start = new Date(startsAt);
      const end = new Date(start.getTime() + duration * 60000);

      const { data: newAppointment, error } = await supabase.from('appointments').insert({
        therapist_user_id: user.id,
        patient_id: patientId || null,
        title,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        location,
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
        }
      }

      alert('✅ Appuntamento creato!');
      onSuccess();
      onClose();
      resetForm();

    } catch (error: any) {
      alert('Errore: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setTitle('Seduta terapeutica');
    setPatientId('');
    setStartsAt('');
    setDuration(60);
    setLocation('');
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">⚡ Nuovo Appuntamento</h2>
            <button 
              onClick={onClose} 
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block font-medium mb-2">Titolo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Paziente</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full border rounded px-3 py-2"
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
            <label className="block font-medium mb-2">Data e ora inizio *</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Durata</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            >
              <option value={15}>15 minuti</option>
              <option value={30}>30 minuti</option>
              <option value={45}>45 minuti</option>
              <option value={60}>60 minuti</option>
              <option value={90}>90 minuti</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-2">Luogo</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Studio, online, ecc."
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Annulla
            </button>
            <button 
              onClick={handleCreate}
              disabled={isLoading || !startsAt || !title}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Creazione...' : '✅ Crea'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
