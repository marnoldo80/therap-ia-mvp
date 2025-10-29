'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = { id: string; display_name: string | null; email: string | null; phone: string | null; };

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('patients')
        .select('id, display_name, email, phone')
        .eq('therapist_user_id', user.id)
        .order('display_name');

      setPatients(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="mb-4">
        <Link href="/app/therapist" className="text-blue-600 hover:underline">← Dashboard</Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">I tuoi pazienti</h1>
        <Link href="/app/therapist/pazienti/nuovo" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Nuovo Paziente
        </Link>
      </div>

      {loading && <div className="text-center py-8">Caricamento...</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((p) => (
          <Link
            key={p.id}
            href={`/app/therapist/pazienti/${p.id}`}
            className="block border rounded-lg p-4 bg-white hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-lg">{p.display_name || 'Senza nome'}</h3>
            <p className="text-sm text-gray-600 mt-1">{p.email || 'Nessuna email'}</p>
            {p.phone && <p className="text-sm text-gray-600">{p.phone}</p>}
          </Link>
        ))}
      </div>

      {patients.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Nessun paziente ancora</p>
          <Link href="/app/therapist/pazienti/nuovo" className="text-blue-600 hover:underline mt-2 inline-block">
            Crea il primo paziente
          </Link>
        </div>
      )}
    </div>
  );
}
