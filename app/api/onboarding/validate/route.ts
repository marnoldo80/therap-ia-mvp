import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string' || token.length < 12) {
      return new NextResponse('Token non valido', { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Verifica token nella tabella onboarding_tokens
    const { data: tok, error } = await supabase
      .from('onboarding_tokens')
      .select('id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      console.error('Errore Supabase:', error.message);
      return new NextResponse('Errore interno Supabase', { status: 500 });
    }

    if (!tok) return new NextResponse('Token inesistente', { status: 404 });
    if (tok.used_at) return new NextResponse('Token già usato', { status: 410 });
    if (new Date(tok.expires_at) < new Date()) {
      return new NextResponse('Token scaduto', { status: 410 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Errore generico:', e);
    return new NextResponse('Errore inatteso', { status: 500 });
  }
}
