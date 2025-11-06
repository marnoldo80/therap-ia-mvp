'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import EditAppointmentModal from '@/components/EditAppointmentModal';
import QuickAppointmentModal from '@/components/QuickAppointmentModal';

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
  location: string | null;
  notes: string | null;
  patient_id: string | null;
  patients?: { display_name: string | null } | { display_name: string | null }[] | null;
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

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalDateTime, setQuickModalDateTime] = useState<string | null>(null);

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
        .select('id, title, starts_at, ends_at, status, location, notes, patient_id, patients!appointments_patient_id_fkey(display_name)')
        .eq('therapist_user_id', user.id)
        .order('starts_at', { ascending: filter !== 'past' });

      if (filter === 'upcoming') {
        query = query.gte('starts_at', new Date().toISOString());
      } else if (filter === 'past') {
        query = query.lt('starts_at', new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments((data || []) as Appointment[]);
    } catch (e: any) {
      setErr(e?.message || 'Errore caricamento appuntamenti');
    } finally {
      setLoading(false);
    }
  }

  function handleEditClick(apt: Appointment) {
    setEditingAppointment(apt);
    setShowEditModal(true);
  }

  function handleCellClick(day: Date, hour: number) {
    const clickedDateTime = new Date(day);
    clickedDateTime.setHours(hour, 0, 0, 0);
    setQuickModalDateTime(clickedDateTime.toISOString());
    setShowQuickModal(true);
  }

  function getAppointmentsForDay(date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return appointments.filter(apt => {
      const aptDate = new Date(apt.starts_at);
      return aptDate >= dayStart && aptDate <= dayEnd;
    });
  }

  const weekDays = getWeekDays(weekOffset);
  const hours = Array.from({ length: 15 }, (_, i) => i + 8);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Appuntamenti</h1>
        <Link href="/app/therapist/appuntamenti/nuovo" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Nuovo Appuntamento
        </Link>
      </div>

      {err && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{err}</div>}

      <div className="flex gap-2 border-b">
        <button onClick={() => setView('list')} className={`px-4 py-2 ${view === 'list' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}>Lista</button>
        <button onClick={() => setView('calendar')} className={`px-4 py-2 ${view === 'calendar' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}>Calendario</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter('upcoming')} className={`px-4 py-2 rounded ${filter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Prossimi</button>
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Tutti</button>
        <button onClick={() => setFilter('past')} className={`px-4 py-2 rounded ${filter === 'past' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Passati</button>
      </div>

      {loading && <div className="text-center py-8">Caricamento...</div>}

      {view === 'list' && (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{apt.title}</h3>
                  {getPatientName(apt.patients) && <p className="text-sm text-gray-600">Paziente: {getPatientName(apt.patients)}</p>}
                  <div className="text-sm text-gray-600 mt-2">
                    📅 {new Date(apt.starts_at).toLocaleString('it-IT')} → {new Date(apt.ends_at).toLocaleTimeString('it-IT')}
                  </div>
                  {apt.location && (
                    <div className="text-sm text-gray-600 mt-1">📍 {apt.location}</div>
                  )}
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      apt.status === 'scheduled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick(apt)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ✏️ Modifica
                  </button>
                </div>
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
      )}

      {view === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border rounded-lg p-4">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
              ← Settimana Precedente
            </button>
            <div className="font-semibold text-lg">
              {weekDays[0].toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} - {weekDays[6].toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
              Settimana Successiva →
            </button>
          </div>

          <div className="bg-white border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2 text-left w-20 sticky left-0 bg-gray-50">Ora</th>
                  {weekDays.map((day, i) => (
                    <th key={i} className="p-2 text-center min-w-32">
                      <div className="font-semibold">{day.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                      <div className="text-sm text-gray-600">{day.getDate()}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map(hour => (
                  <tr key={hour} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-sm text-gray-600 sticky left-0 bg-white">{hour}:00</td>
                    {weekDays.map((day, dayIndex) => {
                      const dayAppts = getAppointmentsForDay(day).filter(apt => {
                        const aptHour = new Date(apt.starts_at).getHours();
                        return aptHour === hour;
                      });

                      return (
                        <td 
                          key={dayIndex} 
                          className="p-1 align-top cursor-pointer hover:bg-blue-50 transition"
                          onClick={() => handleCellClick(day, hour)}
                        >
                          {dayAppts.map(apt => (
                            <div 
                              key={apt.id} 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(apt);
                              }}
                              className="bg-blue-100 border-l-4 border-blue-600 p-2 mb-1 text-xs rounded cursor-pointer hover:bg-blue-200 transition"
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
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EditAppointmentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        appointment={editingAppointment}
        onSuccess={loadAppointments}
      />

      <QuickAppointmentModal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        prefilledDateTime={quickModalDateTime}
        onSuccess={loadAppointments}
      />
    </div>
  );
}
