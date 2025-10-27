import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return new NextResponse('Non autenticato', { status: 401 });
    }

    const { token } = await req.json();
    if (!token || typeof token !== 'string' || token.length < 12) {
      return new NextResponse('Token non valido', { status: 400 });
    }

    // 1) Recupera token valido
    const { data: tok, error: tErr } = await supabase
      .from('onboarding_tokens')
      .select('id, patient_id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle();

    if (tErr) return new NextResponse('Errore interno', { status: 500 });
    if (!tok) return new NextResponse('Token inesistente', { status: 404 });
    if (tok.used_at) return new NextResponse('Token già usato', { status: 410 });
    if (new Date(tok.expires_at) < new Date()) {
      return new NextResponse('Token scaduto', { status: 410 });
    }

    // 2) Lega il paziente all'utente autenticato
    const { data: patient, error: pErr } = await supabase
      .from('patients')
      .select('id, user_id, must_change_password, consent_required, consent_accepted_at')
      .eq('id', tok.patient_id)
      .single();

    if (pErr || !patient) return new NextResponse('Paziente non trovato', { status: 404 });

    if (!patient.user_id) {
      const { error: upd } = await supabase
        .from('patients')
        .update({ user_id: session.user.id })
        .eq('id', patient.id);
      if (upd) return new NextResponse('Collegamento utente fallito', { status: 500 });
    } else if (patient.user_id !== session.user.id) {
      return new NextResponse('Questo link è associato ad un altro account.', { status: 409 });
    }

    // 3) Marca il token come usato
    const { error: usedErr } = await supabase
      .from('onboarding_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tok.id);

    if (usedErr) return new NextResponse('Errore marcando il token', { status: 500 });

    // 4) Restituisce lo stato per i passi successivi
    const mustChange = !!patient.must_change_password;
    const needsConsent = !!(patient.consent_required || !patient.consent_accepted_at);

    return NextResponse.json({ ok: true, mustChange, needsConsent });
  } catch (e) {
    console.error('Errore generico:', e);
    return new NextResponse('Errore inatteso', { status: 500 });
  }
}
