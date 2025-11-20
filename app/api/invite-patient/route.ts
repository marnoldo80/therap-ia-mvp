import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { email, patientId } = await req.json();
    
    if (!email || !patientId) {
      return NextResponse.json({ error: "Missing email/patientId" }, { status: 400 });
    }

    // Verifica che il paziente esista
    const { data: patient, error: patientErr } = await supabaseAdmin
      .from("patients")
      .select("id, display_name")
      .eq("id", patientId)
      .single();

    if (patientErr || !patient) {
      return NextResponse.json({ error: "Paziente non trovato" }, { status: 404 });
    }

    // Crea utente Supabase SENZA password (sarà impostata tramite reset)
    const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      email_confirm: true,
      user_metadata: { 
        patient_id: patientId,
        role: 'patient' 
      }
    });

    if (createErr) {
      // Se l'utente esiste già, prova a recuperarlo
      if (createErr.message?.includes('already registered')) {
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const user = existingUser?.users?.find(u => u.email === email.toLowerCase().trim());
        
        if (user) {
          // Usa l'utente esistente
          await supabaseAdmin.from("patients").update({ 
            email: email.toLowerCase().trim(),
            patient_user_id: user.id,
            user_id: user.id
          }).eq("id", patientId);
        } else {
          throw createErr;
        }
      } else {
        throw createErr;
      }
    } else {
      // Aggiorna paziente con il nuovo user_id
      await supabaseAdmin.from("patients").update({ 
        email: email.toLowerCase().trim(),
        patient_user_id: userData.user.id,
        user_id: userData.user.id
      }).eq("id", patientId);
    }

    // Genera token di reset sicuro
    const resetToken = crypto.randomUUID() + '-' + Date.now();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 ore

    // Salva token di reset
    const { error: tokenErr } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: userData?.user?.id || patient.id,
        email: email.toLowerCase().trim(),
        token: resetToken,
        expires_at: expiresAt,
        used: false
      });

    if (tokenErr) {
      console.error('Errore salvataggio token:', tokenErr);
      throw new Error('Errore generazione link sicuro');
    }

    // URL sicuro per impostazione password
    const setupUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`;

    // Email moderna con nuovo sistema
    const from = process.env.RESEND_FROM!;
    const subject = "cIAo-doc - Benvenuto! Imposta la tua password";
    
    const htmlContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0b1022 0%, #1e293b 50%, #334155 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🩺 cIAo-doc</h1>
          <p style="color: rgba(168, 178, 214, 0.9); margin: 10px 0 0 0;">La tua area paziente ti aspetta</p>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 20px 0;">Ciao ${patient.display_name || 'Paziente'}! 👋</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
            Il tuo terapeuta ti ha creato un account su <strong>cIAo-doc</strong>. Per iniziare, imposta la tua password personale cliccando il pulsante qui sotto.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${setupUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%); 
                      color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; 
                      font-weight: 600; font-size: 16px; box-shadow: 0 10px 25px rgba(122, 162, 255, 0.3);">
             🔐 Imposta la mia Password
            </a>
          </div>

          <div style="background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #0369a1; font-weight: 600; margin: 0 0 15px 0;">📋 Cosa puoi fare nella tua area:</p>
            <ul style="color: #0369a1; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>📅 Consultare i tuoi appuntamenti</li>
              <li>📊 Compilare questionari di valutazione</li>
              <li>📝 Tenere un diario personale</li>
              <li>🎯 Monitorare i tuoi obiettivi</li>
              <li>💬 Comunicare con il terapeuta</li>
            </ul>
          </div>

          <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span style="font-size: 20px;">🔒</span>
              <div>
                <p style="color: #92400e; font-weight: 600; margin: 0 0 8px 0;">Privacy e Sicurezza</p>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">
                  I tuoi dati sono protetti da crittografia avanzata. Solo tu e il tuo terapeuta potete accedere alle tue informazioni.
                </p>
              </div>
            </div>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span style="font-size: 20px;">⏰</span>
              <div>
                <p style="color: #166534; font-weight: 600; margin: 0 0 8px 0;">Link di attivazione</p>
                <p style="color: #166534; margin: 0; line-height: 1.5;">
                  Questo link è valido per 24 ore. Se non riesci ad accedere, contatta il tuo terapeuta per un nuovo invito.
                </p>
              </div>
            </div>
          </div>
          
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span style="font-size: 20px;">💡</span>
              <div>
                <p style="color: #1e40af; font-weight: 600; margin: 0 0 8px 0;">Accesso futuro</p>
                <p style="color: #1e40af; margin: 0; line-height: 1.5;">
                  Dopo aver impostato la password, potrai sempre accedere su:<br>
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login/paziente" 
                     style="color: #2563eb; text-decoration: none; font-weight: 600;">
                    ${process.env.NEXT_PUBLIC_SITE_URL}/login/paziente
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; line-height: 1.6;">
          <p style="margin: 0;">Hai ricevuto questa email perché il tuo terapeuta ti ha invitato su cIAo-doc</p>
          <p style="margin: 5px 0 0 0;">Se non hai richiesto questo account, puoi ignorare questa email</p>
        </div>
      </div>
    `;
    
    const emailResult = await resend.emails.send({ 
      from, 
      to: email, 
      subject, 
      html: htmlContent 
    });
    
    if (emailResult.error) {
      throw new Error('Errore invio email: ' + emailResult.error.message);
    }

    return NextResponse.json({ 
      ok: true, 
      message: "✅ Invito inviato! Il paziente riceverà un'email sicura per impostare la password." 
    });
    
  } catch (e: any) {
    console.error('Errore invite-patient:', e);
    return NextResponse.json({ 
      error: e?.message || "Errore durante l'invio dell'invito" 
    }, { status: 500 });
  }
}
