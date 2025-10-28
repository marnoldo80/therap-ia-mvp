import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { email, user_id } = await req.json();
    
    if (!email || !user_id) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Parametri mancanti: email o user_id' 
      }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    console.log('🔍 Cerco paziente con email:', emailLower, 'user_id:', user_id);

    // 1. Cerca il paziente con quella email che non ha ancora user_id
    const { data: patients, error: searchError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .ilike('email', emailLower)
      .is('user_id', null);

    if (searchError) {
      console.error('❌ Errore ricerca paziente:', searchError);
      return NextResponse.json({ 
        ok: false, 
        error: 'Errore nella ricerca del paziente',
        details: searchError.message 
      }, { status: 500 });
    }

    console.log('📋 Pazienti trovati senza user_id:', patients);

    if (!patients || patients.length === 0) {
      // Verifica se esiste già un paziente con quel user_id
      const { data: existing } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (existing) {
        console.log('✅ Paziente già collegato:', existing);
        return NextResponse.json({ ok: true, linked: existing, already_linked: true });
      }

      // Cerca pazienti con quella email (anche se hanno già user_id)
      const { data: allWithEmail } = await supabaseAdmin
        .from('patients')
        .select('*')
        .ilike('email', emailLower);

      console.log('🔍 Tutti i pazienti con questa email:', allWithEmail);

      return NextResponse.json({ 
        ok: false, 
        error: 'patient_not_found',
        message: 'Nessun paziente trovato con questa email senza user_id già impostato',
        email: emailLower,
        all_with_email: allWithEmail
      }, { status: 404 });
    }

    // 2. Collega il primo paziente trovato
    const patient = patients[0];
    
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('patients')
      .update({ user_id })
      .eq('id', patient.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Errore aggiornamento paziente:', updateError);
      return NextResponse.json({ 
        ok: false, 
        error: 'Errore nel collegamento del paziente',
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('✅ Paziente collegato con successo:', updated);

    return NextResponse.json({ 
      ok: true, 
      linked: updated,
      message: 'Paziente collegato con successo' 
    });

  } catch (e: any) {
    console.error('❌ Errore generale:', e);
    return NextResponse.json({ 
      ok: false, 
      error: e?.message || 'Errore sconosciuto' 
    }, { status: 500 });
  }
}
