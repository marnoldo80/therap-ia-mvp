import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

type Payload = {
  email: string;
  patientId?: string;
  therapistId?: string;
  locale?: string;
};

export async function POST(req: NextRequest) {
  let payload: Partial<Payload> = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON non valido' }, { status: 400 });
  }

  const email = (payload.email || '').toString().trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Email non valida' }, { status: 400 });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const origin = req.headers.get('origin') || req.nextUrl.origin;
  const inviteUrl = new URL('/invite', origin);
  inviteUrl.searchParams.set('token', token);
  if (payload.patientId) inviteUrl.searchParams.set('p', payload.patientId);
  if (payload.therapistId) inviteUrl.searchParams.set('t', payload.therapistId);

  // TODO: sostituire con invio email reale (SMTP/Resend/SendGrid)
  console.log('[INVITE_STUB]', {
    to: email,
    inviteUrl: inviteUrl.toString(),
    patientId: payload.patientId ?? null,
    therapistId: payload.therapistId ?? null,
  });

  return NextResponse.json({
    ok: true,
    message: 'Invito creato (stub). Email non inviata in questa modalità.',
    inviteUrl: inviteUrl.toString(),
    token,
  });
}
