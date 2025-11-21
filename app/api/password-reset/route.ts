import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  { auth: { persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { action, email, token, newPassword } = await request.json();

    if (action === 'request') {
      // FASE 1: Richiesta reset password
      
      if (!email) {
        return NextResponse.json({ error: 'Email richiesta' }, { status: 400 });
      }

      // Verifica che il paziente esista
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('id, display_name, patient_user_id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (!patient) {
        // Non rivelare se l'email esiste o meno per sicurezza
        return NextResponse.json({ success: true, message: 'Se l\'email è registrata, riceverai le istruzioni' });
      }

      // Genera token sicuro
      const resetToken = crypto.randomUUID() + '-' + Date.now();
      
      // Salva token nel database con scadenza 1 ora
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      
      const { error } = await supabaseAdmin
        .from('password_reset_tokens')
        .insert({
          user_id: patient.patient_user_id,
          email: email.toLowerCase().trim(),
          token: resetToken,
          expires_at: expiresAt,
          used: false
        });

      if (error) {
        console.error('Errore salvataggio token:', error);
        return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
      }

      // Invia email con link sicuro
      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`;
      
      await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to: email,
        subject: 'Reset Password - cIAo-doc',
        html: `
          <div style="font-family: system-ui, Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #1e293b;">Reset Password</h2>
            <p>Ciao ${patient.display_name || 'Paziente'},</p>
            <p>Hai richiesto di reimpostare la password per il tuo account cIAo-doc.</p>
            <div style="margin: 24px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%); 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block;">
                Imposta Nuova Password
              </a>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              Questo link è valido per 1 ora. Se non hai richiesto questo reset, ignora questa email.
            </p>
            <p style="color: #64748b; font-size: 12px;">
              Link: ${resetUrl}
            </p>
          </div>
        `
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Email inviata! Controlla la tua casella di posta.' 
      });
    }

    if (action === 'reset') {
      // FASE 2: Effettivo cambio password
      
      if (!token || !newPassword) {
        return NextResponse.json({ error: 'Token e nuova password richiesti' }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password deve essere di almeno 8 caratteri' }, { status: 400 });
      }

      // Verifica token
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        return NextResponse.json({ error: 'Token non valido o scaduto' }, { status: 400 });
      }

      // Aggiorna password utente
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        tokenData.user_id, 
        { password: newPassword }
      );

      if (updateError) {
        console.error('Errore aggiornamento password:', updateError);
        return NextResponse.json({ error: 'Errore aggiornamento password' }, { status: 500 });
      }

      // Marca token come usato
      await supabaseAdmin
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('token', token);

      return NextResponse.json({ 
        success: true, 
        message: 'Password aggiornata con successo!' 
      });
    }

    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });

  } catch (error: any) {
    console.error('Errore reset password:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
