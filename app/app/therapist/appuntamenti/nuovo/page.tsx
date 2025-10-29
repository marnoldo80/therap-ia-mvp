'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewAppointmentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const { error } = await supabase.from('appointments').insert({
        therapist_user_id: user.id,
        title,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        status: 'da_confermare'
      });

      if (error) throw error;

      router.push('/app/therapist/appuntamenti');
    } catch (e: any) {
      setErr(e?.message || 'Errore');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
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
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data e ora inizio</label>
          <input
            type="datetime-local"
            required
            className="w-full border rounded px-3 py-2"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data e ora fine</label>
          <input
            type="datetime-local"
            required
            className="w-full border rounded px-3 py-2"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creazione...' : 'Crea Appuntamento'}
        </button>
      </form>
    </div>
  );
}
