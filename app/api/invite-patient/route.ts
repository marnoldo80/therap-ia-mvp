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

    const cleanEmail = email.toLowerCase().trim();

    // Verifica che il paziente esista
    const { data: patient, error: patientErr } = await supabaseAdmin
      .from("patients")
      .select("id, display_name")
      .eq("id", patientId)
      .single();

    if (patientErr || !patient) {
      return NextResponse.json({ error: "Paziente non trovato" }, { status: 404 });
    }

    // Password temporanea come nel sistema originale
    const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!`;

    // Crea utente Supabase con password temporanea (come originale)
    const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { 
        patient_id: patientId,
        role: 'patient' 
      }
    });

    if (createErr) {
      // Se l'utente esiste già, gestisci l'errore
      if (createErr.message?.includes('already registered')) {
        return NextResponse.json({ 
          ok: true, 
          message: "Utente già registrato. Contatta l'amministratore per il reset password." 
        });
      }
      throw createErr;
    }

    // Aggiorna paziente con user_id (come originale + patient_user_id)
    await supabaseAdmin.from("patients").update({ 
      email: cleanEmail,
      patient_user_id: userData.user.id,
      user_id: userData.user.id
    }).eq("id", patientId);

    // Email moderna ma con credenziali temporanee
    const from = process.env.RESEND_FROM!;
    const subject = "cIAo-doc - Le tue credenziali di accesso";
    
    const htmlContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0b1022 0%, #1e293b 50%, #334155 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🩺 cIAo-doc</h1>
          <p style="color: rgba(168, 178, 214, 0.9); margin: 10px 0 0 0;">La tua area paziente ti aspetta</p>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 20px 0;">Ciao ${patient.display_name || 'Paziente'}! 👋</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
            Il tuo terapeuta ti ha creato un account su <strong>cIAo-doc</strong>. Ecco le tue credenziali di accesso:
          </p>
          
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #166534; font-weight: 600; margin: 0 0 10px 0;">🔐 Le tue credenziali:</p>
            <p style="color: #166534; margin: 5px 0;"><strong>Email:</strong> ${cleanEmail}</p>
            <p style="color: #166534; margin: 5px 0;"><strong>Password temporanea:</strong> <code style="background: #dcfce7; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login/paziente" 
               style="display: inline-block; background: linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%); 
                      color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; 
                      font-weight: 600; font-size: 16px; box-shadow: 0 10px 25px rgba(122, 162, 255, 0.3);">
             🚀 Accedi alla mia area
            </a>
          </div>

          <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span style="font-size: 20px;">⚠️</span>
              <div>
                <p style="color: #92400e; font-weight: 600; margin: 0 0 8px 0;">Importante</p>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">
                  Dopo il primo accesso, ti verrà chiesto di impostare una password personale per sicurezza.
                </p>
              </div>
            </div>
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

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span style="font-size: 20px;">💡</span>
              <div>
                <p style="color: #1e40af; font-weight: 600; margin: 0 0 8px 0;">Accesso futuro</p>
                <p style="color: #1e40af; margin: 0; line-height: 1.5;">
                  Dopo aver impostato la password personale, potrai sempre accedere su:<br>
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
      to: cleanEmail, 
      subject, 
      html: htmlContent 
    });
    
    if (emailResult.error) {
      throw new Error('Errore invio email: ' + emailResult.error.message);
    }

    return NextResponse.json({ 
      ok: true, 
      message: "✅ Credenziali inviate via email!" 
    });
    
  } catch (e: any) {
    console.error('❌ Errore invite-patient:', e);
    return NextResponse.json({ 
      error: e?.message || "Errore durante l'invio dell'invito" 
    }, { status: 500 });
  }
}
