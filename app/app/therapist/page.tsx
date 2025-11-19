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

  function handleLogout() {
    supabase.auth.signOut().then(() => {
      window.location.href = '/login';
    });
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(0,0,0,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 24px'
      }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/logo-transparent-png.png" 
              alt="cIAo-doc" 
              style={{ height: '40px', width: 'auto' }}
            />
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex items-center gap-6">
            <Link 
              href="/app/therapist/pazienti"
              className="px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: '#9333ea' }}
            >
              Pazienti
            </Link>
            <Link 
              href="/app/therapist/appuntamenti"
              className="px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: '#9333ea' }}
            >
              Appuntamenti
            </Link>
            <Link 
              href="/app/therapist/personal-branding"
              className="px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: '#9333ea' }}
            >
              Personal Branding
            </Link>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: '#9333ea' }}
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">
            {getWelcomeMessage(therapist?.display_name)} {therapist?.display_name || ''}
          </h1>
          <Link 
            href="/app/therapist/onboarding"
            className="px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200"
            style={{ backgroundColor: '#9333ea' }}
          >
            Modifica Profilo
          </Link>
        </div>

        {err && (
          <div className="mb-6 p-4 rounded-lg text-red-100" style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {err}
          </div>
        )}

        {/* Main Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nuovo Paziente */}
          <Link 
            href="/app/therapist/pazienti/nuovo"
            className="block p-8 rounded-2xl text-white text-center font-semibold text-xl transition-transform duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
          >
            Nuovo Paziente
          </Link>

          {/* Nuovo Appuntamento */}
          <button
            onClick={() => setShowCalendarPicker(true)}
            className="p-8 rounded-2xl text-white text-center font-semibold text-xl transition-transform duration-200 hover:scale-105 w-full"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              border: 'none'
            }}
          >
            Nuovo Appuntamento
          </button>

          {/* Prossimi Appuntamenti */}
          <div 
            className="p-8 rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              minHeight: '200px'
            }}
          >
            <h2 className="text-xl font-semibold mb-4">Prossimi Appuntamenti</h2>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4 text-blue-100">Caricamento...</div>
              ) : nextAppts.length > 0 ? (
                nextAppts.slice(0, 3).map(a => (
                  <div key={a.id} className="bg-white/10 rounded-lg p-3">
                    <div className="font-medium text-sm">
                      {a.title}
                      {(() => { const n = getPatientName(a.patients || null); return n ? ` · ${n}` : ''; })()}
                    </div>
                    <div className="text-xs text-blue-100 mt-1">
                      {new Date(a.starts_at).toLocaleDateString('it-IT')} alle {new Date(a.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-blue-100">Nessun appuntamento</div>
              )}
            </div>
            {nextAppts.length > 3 && (
              <Link href="/app/therapist/appuntamenti" className="text-sm text-blue-100 hover:text-white block text-center mt-3">
                Vedi tutti ({nextAppts.length})
              </Link>
            )}
          </div>

          {/* Alert e Notifiche */}
          <div 
            className="p-8 rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              minHeight: '200px'
            }}
          >
            <h2 className="text-xl font-semibold mb-4">Alert e Notifiche</h2>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4 text-blue-100">Caricamento...</div>
              ) : (
                <>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="font-medium text-sm">Pazienti totali</div>
                    <div className="text-2xl font-bold">{totalPatients}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="font-medium text-sm">Appuntamenti questa settimana</div>
                    <div className="text-2xl font-bold">{weekAppts}</div>
                  </div>
                  {!loading && <AlertsWidgetWrapper />}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

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
