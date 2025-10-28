import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { patientId } = await req.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID mancante' }, { status: 400 });
    }

    console.log('🗑️ Cancellazione paziente:', patientId);

    // 1. Recupera user_id del paziente
    const { data: patient, error: fetchError } = await supabaseAdmin
      .from('patients')
      .select('user_id, email')
      .eq('id', patientId)
      .single();

    if (fetchError) {
      console.error('❌ Errore recupero paziente:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    console.log('📋 Paziente trovato:', patient);

    // 2. Cancella il record dalla tabella patients
    const { error: deleteError } = await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', patientId);

    if (deleteError) {
      console.error('❌ Errore cancellazione database:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log('✅ Record patients cancellato');

    // 3. Cancella l'utente da Auth (se esiste)
    if (patient?.user_id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
        patient.user_id
      );

      if (authDeleteError) {
        console.error('⚠️ Errore cancellazione Auth:', authDeleteError);
        // Non blocchiamo se Auth fallisce, paziente già cancellato da DB
      } else {
        console.log('✅ Utente Auth cancellato');
      }
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Paziente cancellato completamente',
      deletedUserId: patient?.user_id 
    });

  } catch (e: any) {
    console.error('❌ Errore generale:', e);
    return NextResponse.json({ error: e?.message || 'Errore sconosciuto' }, { status: 500 });
  }
}
