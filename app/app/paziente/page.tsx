import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PatientDashboard() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!patient) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded bg-yellow-50 border border-yellow-200 p-4">
          <p className="font-semibold">Profilo non trovato</p>
          <p className="text-sm mt-2">Il tuo profilo paziente non è ancora stato configurato. Contatta il terapeuta.</p>
          <p className="text-xs mt-2 text-gray-600">User ID: {user.id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Benvenuto nella tua Area Paziente</h1>

      <div className="border rounded p-4 bg-white shadow-sm">
        <div className="font-semibold mb-3 text-lg">Dati personali</div>
        <div className="text-sm space-y-2">
          <div>
            <span className="text-gray-500">Nome: </span>
            <span className="font-medium">{patient.display_name || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Email: </span>
            <span className="font-medium">{patient.email || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Telefono: </span>
            <span className="font-medium">{patient.phone || '—'}</span>
          </div>
        </div>
      </div>

      {patient.issues && (
        <div className="border rounded p-4 bg-white shadow-sm">
          <div className="font-semibold mb-2">Problemi</div>
          <div className="text-sm whitespace-pre-wrap">{patient.issues}</div>
        </div>
      )}

      {patient.goals && (
        <div className="border rounded p-4 bg-white shadow-sm">
          <div className="font-semibold mb-2">Obiettivi</div>
          <div className="text-sm whitespace-pre-wrap">{patient.goals}</div>
        </div>
      )}
    </div>
  );
}
