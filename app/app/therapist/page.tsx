'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import AlertsWidget from '@/components/AlertsWidget';
import CalendarPicker from '@/components/CalendarPicker';
import QuickAppointmentModal from '@/components/QuickAppointmentModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function AlertsWidgetWrapper() {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  if (!userId) return null;
  return <AlertsWidget therapistId={userId} />;
}

export default function Page() {
  const [err, setErr] = useState<string|null>(null);
  const [therapist, setTherapist] = useState<{ display_name: string|null; address: string|null; vat_number: string|null; }|null>(null);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [nextAppts, setNextAppts] = useState<any[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [weekAppts, setWeekAppts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null); 
      setLoading(true);
      
      await new Promise(r => setTimeout(r, 500));
      
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { setErr('Non autenticato'); setLoading(false); return; }

      {
        const { data, error } = await supabase
          .from('therapists')
          .select('display_name,address,vat_number')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) setErr(error.message);
        setTherapist(data || null);
      }

      {
        const { count } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('therapist_user_id', user.id);
        setTotalPatients(count || 0);

        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const { count: apptCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('therapist_user_id', user.id)
          .gte('starts_at', weekStart.toISOString())
          .lte('starts_at', weekEnd.toISOString());
        setWeekAppts(apptCount || 0);
      }

      {
        const { data, error } = await supabase
          .from('patients')
          .select('id,display_name,email,created_at')
          .eq('therapist_user_id', user.id)
          .order('display_name', { ascending: true });
        if (error) setErr(error.message);
        setAllPatients(data || []);
      }

      {
        const { data, error } = await supabase
          .from('appointments')
          .select('id,title,starts_at,ends_at,status,patients!appointments_patient_fkey(display_name)')
          .eq('therapist_user_id', user.id)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(5);
        if (error) setErr(error.message);
        setNextAppts(data || []);
      }

      setLoading(false);
    })();
  }, []);

  // Function to determine welcome message based on name
  function getWelcomeMessage(name: string | null | undefined): string {
    if (!name) return 'Benvenuto/a';
    
    // Simple logic for Italian names - can be improved
    const femaleEndings = ['a', 'na', 'la', 'ra', 'sa', 'ta'];
    const lowerName = name.toLowerCase();
    
    const isFemale = femaleEndings.some(ending => lowerName.endsWith(ending));
    return isFemale ? 'Benvenuta' : 'Benvenuto';
  }

  function getPatientName(rel: any): string {
    if (!rel) return '';
    if (Array.isArray(rel)) return rel[0]?.display_name || '';
    return rel.display_name || '';
  }

  function handleDateTimeSelected(dateTime: string) {
    setSelectedDateTime(dateTime);
    setShowCalendarPicker(false);
    setShowQuickModal(true);
  }

  function reloadAppointments() {
    window.location.reload();
  }

  return (
    <div style={{ padding: '24px' }}>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">
            {getWelcomeMessage(therapist?.display_name)} {therapist?.display_name || ''}
          </h1>
          <div className="flex gap-4">
            <Link 
              href="/app/therapist/onboarding"
              className="px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: '#9333ea' }}
            >
              Modifica Profilo
            </Link>
            <Link 
              href="/app/therapist/personal-branding"
              className="px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: '#dc2626' }}
            >
              Personal Branding
            </Link>
          </div>
        </div>

        {err && (
          <div className="mb-6 p-4 rounded-lg text-red-100" style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {err}
          </div>
        )}

        {/* Main Cards Grid 2x2 + Fatture */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Nuovo Paziente */}
          <Link 
            href="/app/therapist/pazienti/nuovo"
            className="block p-8 rounded-2xl text-white text-center font-semibold text-xl transition-transform duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
          >
            <div className="text-4xl mb-4">👤</div>
            <div>Nuovo Paziente</div>
          </Link>

          {/* Nuovo Appuntamento */}
          <button
            onClick={() => setShowCalendarPicker(true)}
            className="p-8 rounded-2xl text-white text-center font-semibold text-xl transition-transform duration-200 hover:scale-105 w-full"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              border: 'none'
            }}
          >
            <div className="text-4xl mb-4">📅</div>
            <div>Nuovo Appuntamento</div>
          </button>

          {/* CARD FATTURE */}
          <Link
            href="/app/therapist/fatture"
            className="block p-8 rounded-2xl text-white text-center font-semibold text-xl transition-transform duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
          >
            <div className="text-4xl mb-4">💰</div>
            <div>Gestione Fatture</div>
          </Link>

          {/* Prossimi Appuntamenti */}
          <div 
            className="p-8 rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              minHeight: '200px'
            }}
          >
            <h2 className="text-xl font-semibold mb-4">📋 Prossimi Appuntamenti</h2>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4 text-purple-100">Caricamento...</div>
              ) : nextAppts.length > 0 ? (
                nextAppts.slice(0, 3).map(a => (
                  <div key={a.id} className="bg-white/10 rounded-lg p-3">
                    <div className="font-medium text-sm">
                      {a.title}
                      {(() => { const n = getPatientName(a.patients || null); return n ? ` · ${n}` : ''; })()}
                    </div>
                    <div className="text-xs text-purple-100 mt-1">
                      {new Date(a.starts_at).toLocaleDateString('it-IT')} alle {new Date(a.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-purple-100">Nessun appuntamento</div>
              )}
            </div>
            {nextAppts.length > 3 && (
              <Link href="/app/therapist/appuntamenti" className="text-sm text-purple-100 hover:text-white block text-center mt-3">
                Vedi tutti ({nextAppts.length})
              </Link>
            )}
          </div>

          {/* I Tuoi Pazienti */}
          <Link
            href="/app/therapist/pazienti"
            className="block p-8 rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              minHeight: '200px',
              textDecoration: 'none'
            }}
          >
            <h2 className="text-xl font-semibold mb-4">👥 I Tuoi Pazienti</h2>
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-4 text-cyan-100">Caricamento...</div>
              ) : allPatients.length > 0 ? (
                allPatients.slice(0, 4).map(p => (
                  <div key={p.id} className="bg-white/10 rounded-lg p-2">
                    <div className="font-medium text-sm">{p.display_name || 'Senza nome'}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-cyan-100">Nessun paziente</div>
              )}
            </div>
            {allPatients.length > 4 && (
              <div className="text-sm text-cyan-100 text-center mt-3">
                Vedi tutti ({allPatients.length}) →
              </div>
            )}
          </Link>

          {/* Alert e Notifiche */}
          <div 
            className="p-8 rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              minHeight: '200px'
            }}
          >
            <h2 className="text-xl font-semibold mb-4">🔔 Alert e Notifiche</h2>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4 text-red-100">Caricamento...</div>
              ) : (
                <AlertsWidgetWrapper />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CalendarPicker
        isOpen={showCalendarPicker}
        onClose={() => setShowCalendarPicker(false)}
        onSelectDateTime={handleDateTimeSelected}
      />

      <QuickAppointmentModal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        prefilledDateTime={selectedDateTime}
        onSuccess={reloadAppointments}
      />
    </div>
  );
}
