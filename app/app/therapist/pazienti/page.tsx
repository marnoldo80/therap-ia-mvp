'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = { 
  id: string; 
  display_name: string | null; 
  email: string | null; 
  phone: string | null; 
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('patients')
        .select('id, display_name, email, phone')
        .eq('therapist_user_id', user.id)
        .order('display_name', { ascending: true }); // Ordine alfabetico

      setPatients(data || []);
      setLoading(false);
    })();
  }, []);

  // Filtra pazienti in base alla ricerca
  const filteredPatients = patients.filter(patient => 
    patient.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Back to Dashboard Button */}
      <div className="mb-6">
        <Link 
          href="/app/therapist"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          ← Dashboard
        </Link>
      </div>

      {/* Header con titolo e pulsante nuovo paziente */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: 'white' }}>
          I tuoi pazienti
        </h1>
        <Link 
          href="/app/therapist/pazienti/nuovo"
          className="px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          style={{ backgroundColor: '#7aa2ff', color: '#0b1022', textDecoration: 'none' }}
        >
          + Nuovo Paziente
        </Link>
      </div>

      {/* Barra di ricerca */}
      <div className="max-w-md">
        <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
          🔍 Cerca paziente
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Nome, email o telefono..."
          className="w-full px-4 py-3 rounded-lg outline-none transition-colors duration-300"
          style={{
            backgroundColor: '#0b0f1c',
            border: '2px solid #26304b',
            color: 'white'
          }}
          onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
          onBlur={(e) => e.target.style.borderColor = '#26304b'}
        />
        {searchTerm && (
          <div className="mt-2 text-sm" style={{ color: '#a8b2d6' }}>
            {filteredPatients.length} paziente{filteredPatients.length !== 1 ? 'i' : ''} trovato{filteredPatients.length !== 1 ? 'i' : ''}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8" style={{ color: 'white' }}>
          Caricamento...
        </div>
      )}

      {/* Griglia pazienti */}
      {!loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((p) => (
            <Link
              key={p.id}
              href={`/app/therapist/pazienti/${p.id}`}
              className="block rounded-lg p-4 transition-transform duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                color: 'white',
                textDecoration: 'none'
              }}
            >
              <h3 className="font-semibold text-lg mb-2">
                {p.display_name || 'Senza nome'}
              </h3>
              <p className="text-sm text-blue-100 mb-1">
                📧 {p.email || 'Nessuna email'}
              </p>
              {p.phone && (
                <p className="text-sm text-blue-100">
                  📱 {p.phone}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Messaggio quando non ci sono pazienti */}
      {filteredPatients.length === 0 && !loading && !searchTerm && (
        <div className="text-center py-12" style={{ color: 'white' }}>
          <p className="text-lg mb-4">Nessun paziente ancora</p>
          <Link 
            href="/app/therapist/pazienti/nuovo"
            className="px-6 py-3 rounded-lg font-medium transition-colors duration-200 inline-block"
            style={{ backgroundColor: '#7aa2ff', color: '#0b1022', textDecoration: 'none' }}
          >
            Crea il primo paziente
          </Link>
        </div>
      )}

      {/* Messaggio quando la ricerca non produce risultati */}
      {filteredPatients.length === 0 && !loading && searchTerm && (
        <div className="text-center py-12" style={{ color: 'white' }}>
          <p className="text-lg mb-4">Nessun paziente trovato per "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
          >
            Cancella ricerca
          </button>
        </div>
      )}
    </div>
  );
}
