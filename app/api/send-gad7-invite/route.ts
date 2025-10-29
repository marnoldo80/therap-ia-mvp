import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY!);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { patientId, email } = await req.json();

    if (!patientId || !email) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    const token = crypto.randomUUID();
    
    const { error: tokenError } = await supabaseAdmin
      .from('gad7_invites')
      .insert({
        patient_id: patientId,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (tokenError) {
      console.error('Errore salvataggio token:', tokenError);
    }

    const link = `${process.env.NEXT_PUBLIC_SITE_URL}/q/gad7/${token}`;

    const html = `
      <div style="font-family:system-ui,Arial,sans-serif">
        <h2>Questionario GAD-7</h2>
        <p>Il tuo terapeuta ti ha assegnato il questionario GAD-7 da compilare.</p>
        <p>
          <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none">
            Compila il Questionario
          </a>
        </p>
        <p style="color:#666;font-size:14px">Link: <a href="${link}">${link}</a></p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: email,
      subject: 'Questionario GAD-7 - Therap-IA',
      html
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Errore invio email:', e);
    return NextResponse.json({ error: e?.message || 'Errore' }, { status: 500 });
  }
}
