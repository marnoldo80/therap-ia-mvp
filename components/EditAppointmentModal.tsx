'use client';
import { useState, useEffect } from 'react';

type Appointment = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  notes: string | null;
};

type EditAppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: () => void;
};

export default function EditAppointmentModal({ 
  isOpen, 
  onClose, 
  appointment,
  onSuccess 
}: EditAppointmentModalProps) {
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Inizializza campi quando cambia appointment
  useEffect(() => {
    if (appointment) {
      setTitle(appointment.title || '');
      setStartsAt(new Date(appointment.starts_at).toISOString().slice(0, 16));
      setLocation(appointment.location || '');
      setNotes(appointment.notes || '');
      
      // Calcola durata
      const start = new Date(appointment.starts_at);
      const end = new Date(appointment.ends_at);
      const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
      setDuration(durationMin);
    }
  }, [appointment]);

  if (!isOpen || !appointment) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const startsAtDate = new Date(startsAt);
      const endsAtDate = new Date(startsAtDate.getTime() + duration * 60000);

      const res = await fetch('/api/appointment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          title,
          startsAt: startsAtDate.toISOString(),
          endsAt: endsAtDate.toISOString(),
          location,
          notes
        })
      });

      if (!res.ok) throw new Error('Errore modifica');

      alert('✅ Appuntamento modificato!');
      onSuccess();
      onClose();

    } catch (error: any) {
      alert('Errore: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/appointment?id=${appointment.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Errore cancellazione');

      alert('✅ Appuntamento cancellato!');
      onSuccess();
      onClose();

    } catch (error: any) {
      alert('Errore: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">✏️ Modifica Appuntamento</h2>
            <button 
              onClick={onClose} 
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {!showDeleteConfirm ? (
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

            <div>
              <label className="block font-medium mb-2">Note</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded px-3 py-2 min-h-[100px]"
                placeholder="Eventuali note per la seduta..."
              />
            </div>

            <div className="flex gap-3 justify-between pt-4 border-t">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                🗑️ Elimina
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Annulla
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {isLoading ? 'Salvataggio...' : '💾 Salva Modifiche'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-red-900 mb-2">Conferma Cancellazione</h3>
              <p className="text-red-700 mb-6">
                Sei sicuro di voler cancellare questo appuntamento?<br/>
                Questa azione non può essere annullata.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {isLoading ? 'Cancellazione...' : 'Sì, Elimina'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
