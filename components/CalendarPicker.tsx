'use client';
import { useState, useEffect } from 'react';
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
  patients?: { display_name: string | null } | { display_name: string | null }[] | null;
};

type CalendarPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectDateTime: (dateTime: string) => void;
};

function getPatientName(patients: Appointment['patients']): string {
  if (!patients) return '';
  if (Array.isArray(patients)) return patients[0]?.display_name || '';
  return patients.display_name || '';
}

function getWeekDays(weekOffset: number = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + (weekOffset * 7));
  monday.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
}

export default function CalendarPicker({ isOpen, onClose, onSelectDateTime }: CalendarPickerProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // Carica appuntamenti quando si apre il calendario
  useEffect(() => {
    if (isOpen) {
      loadAppointments();
    }
  }, [isOpen, weekOffset]);

  async function loadAppointments() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekDays = getWeekDays(weekOffset);
      const weekStart = weekDays[0];
      const weekEnd = new Date(weekDays[6]);
      weekEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('appointments')
        .select('id, title, starts_at, ends_at, status, patients!appointments_patient_id_fkey(display_name)')
        .eq('therapist_user_id', user.id)
        .gte('starts_at', weekStart.toISOString())
        .lte('starts_at', weekEnd.toISOString())
        .order('starts_at', { ascending: true });

      if (error) throw error;
      setAppointments((data || []) as Appointment[]);
    } catch (error) {
      console.error('Errore caricamento appuntamenti:', error);
    } finally {
      setLoading(false);
    }
  }

  function getAppointmentsForTimeSlot(date: Date, hour: number) {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour, 59, 59, 999);

    return appointments.filter(apt => {
      const aptStart = new Date(apt.starts_at);
      const aptEnd = new Date(apt.ends_at);
      
      // Controlla se c'è sovrapposizione
      return (aptStart < slotEnd && aptEnd > slotStart);
    });
  }

  function handleCellClick(day: Date, hour: number) {
    const conflictingAppts = getAppointmentsForTimeSlot(day, hour);
    
    if (conflictingAppts.length > 0) {
      alert(`⚠️ Conflitto di orario!\n\nEsiste già un appuntamento in questo slot:\n"${conflictingAppts[0].title}" alle ${new Date(conflictingAppts[0].starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`);
      return;
    }

    const selectedDateTime = new Date(day);
    selectedDateTime.setHours(hour, 0, 0, 0);
    onSelectDateTime(selectedDateTime.toISOString());
  }

  if (!isOpen) return null;

  const weekDays = getWeekDays(weekOffset);
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 - 22:00

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">📅 Seleziona Data e Ora</h2>
              <p className="text-sm opacity-90 mt-1">
                Clicca su uno slot libero per creare l'appuntamento
                {loading && ' • Caricamento...'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between bg-gray-50 border rounded-lg p-4">
            <button 
              onClick={() => setWeekOffset(weekOffset - 1)} 
              className="px-4 py-2 bg-white border hover:bg-gray-100 rounded-lg font-medium transition"
            >
              ← Settimana Precedente
            </button>
            <div className="font-semibold text-lg">
              {weekDays[0].toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} - {weekDays[6].toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <button 
              onClick={() => setWeekOffset(weekOffset + 1)} 
              className="px-4 py-2 bg-white border hover:bg-gray-100 rounded-lg font-medium transition"
            >
              Settimana Successiva →
            </button>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left w-24 sticky left-0 bg-gray-50 font-semibold">Ora</th>
                  {weekDays.map((day, i) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <th key={i} className="p-3 text-center min-w-32">
                        <div className={`font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                          {day.toLocaleDateString('it-IT', { weekday: 'short' })}
                        </div>
                        <div className={`text-sm ${isToday ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                          {day.getDate()}
                        </div>
                        {isToday && <div className="text-xs text-blue-600">Oggi</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {hours.map(hour => (
                  <tr key={hour} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm font-medium text-gray-700 sticky left-0 bg-white">
                      {hour}:00
                    </td>
                    {weekDays.map((day, dayIndex) => {
                      const cellDateTime = new Date(day);
                      cellDateTime.setHours(hour, 0, 0, 0);
                      const isPast = cellDateTime < new Date();
                      const slotAppointments = getAppointmentsForTimeSlot(day, hour);
                      const hasConflict = slotAppointments.length > 0;
                      
                      return (
                        <td 
                          key={dayIndex} 
                          onClick={() => !isPast && !hasConflict && handleCellClick(day, hour)}
                          className={`p-1 border-l align-top ${
                            isPast 
                              ? 'bg-gray-100 cursor-not-allowed' 
                              : hasConflict
                                ? 'bg-red-50 cursor-not-allowed'
                                : 'cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition'
                          }`}
                        >
                          {hasConflict ? (
                            <div className="p-2">
                              {slotAppointments.map(apt => (
                                <div 
                                  key={apt.id} 
                                  className="bg-blue-100 border-l-4 border-blue-600 p-2 mb-1 text-xs rounded"
                                >
                                  <div className="font-medium">
                                    {new Date(apt.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="truncate">{apt.title}</div>
                                  {getPatientName(apt.patients) && (
                                    <div className="text-gray-600 truncate">{getPatientName(apt.patients)}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={`
                              h-16 flex items-center justify-center rounded
                              ${isPast ? 'text-gray-400' : 'text-gray-600 hover:text-blue-600 hover:font-medium'}
                            `}>
                              {isPast ? '—' : '+ Crea'}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center pt-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
