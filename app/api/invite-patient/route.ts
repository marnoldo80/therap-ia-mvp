import { NextResponse } from "next/server";
import sgMail from '@sendgrid/mail';
import { createClient } from "@supabase/supabase-js";

sgMail.setApiKey(process.env.RESEND_API_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  { auth: { persistSession: false } }
);

// Genera password sicura ma memorabile
function generatePassword(): string {
  const words = ['Casa', 'Mare', 'Sole', 'Luna', 'Fiore', 'Verde', 'Pace', 'Gioia', 'Luce', 'Vita'];
  const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const word = words[Math.floor(Math.random() * words.length)];
  return `${word}${numbers}!`;
}

export async function POST(req: Request) {
  try {
    const { email, patientId } = await req.json();
    
    if (!email || !patientId) {
      return NextResponse.json({ error: "Email e patientId richiesti" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verifica che il paziente esista
    const { data: patient, error: patientErr } = await supabaseAdmin
      .from("patients")
      .select("id, display_name, therapist_user_id")
      .eq("id", patientId)
      .single();

    if (patientErr || !patient) {
      return NextResponse.json({ error: "Paziente non trovato" }, { status: 404 });
    }

    // Genera password automatica
    const autoPassword = generatePassword();
    console.log('🔑 Password generata per:', cleanEmail);

    // Controlla se utente auth esiste già
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === cleanEmail);

    let userId: string;

    if (existingUser) {
      // Aggiorna password utente esistente
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id, 
        { password: autoPassword }
      );
      
      if (updateErr) {
        throw new Error(`Errore aggiornamento password: ${updateErr.message}`);
      }

      userId = existingUser.id;
      console.log('✅ Password aggiornata per utente esistente:', userId);
    } else {
      // Crea nuovo utente auth
      const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: autoPassword,
        email_confirm: true,
        user_metadata: { 
          patient_id: patientId,
          role: 'patient' 
        }
      });

      if (createErr) {
        throw new Error(`Errore creazione utente: ${createErr.message}`);
      }

      userId = userData.user.id;
      console.log('✅ Nuovo utente creato:', userId);
    }

    // Aggiorna record paziente
    const { error: updatePatientErr } = await supabaseAdmin
      .from("patients")
      .update({ 
        email: cleanEmail,
        patient_user_id: userId,
        user_id: userId,
        must_change_password: false // Password già impostata
      })
      .eq("id", patientId);

    if (updatePatientErr) {
      throw new Error(`Errore aggiornamento paziente: ${updatePatientErr.message}`);
    }

    // Email moderna con credenziali
    const subject = "cIAo-doc - Le tue credenziali di accesso";
    
    const htmlContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0b1022 0%, #1e293b 50%, #334155 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🩺 cIAo-doc</h1>
          <p style="color: rgba(168, 178, 214, 0.9); margin: 10px 0 0 0; font-size: 16px;">La tua area paziente ti aspetta</p>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 20px 0;">Ciao ${patient.display_name || 'Paziente'}! 👋</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
            Il tuo terapeuta ti ha creato un account su <strong>cIAo-doc</strong>. Ecco le tue credenziali di accesso:
          </p>
          
          <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #166534; font-weight: 600; margin: 0 0 15px 0; font-size: 18px;">🔐 Le tue credenziali</h3>
            <div style="background: white; border-radius: 8px; padding: 20px;">
              <p style="color: #166534; margin: 8px 0; font-size: 16px;">
                <strong>📧 Email:</strong> <code style="background: #dcfce7; padding: 4px 8px; border-radius: 6px; font-family: 'Courier New', monospace;">${cleanEmail}</code>
              </p>
              <p style="color: #166534; margin: 8px 0; font-size: 16px;">
                <strong>🔑 Password:</strong> <code style="background: #dcfce7; padding: 4px 8px; border-radius: 6px; font-family: 'Courier New', monospace; font-weight: bold; font-size: 18px;">${autoPassword}</code>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://therap-ia-mvp.vercel.app/login/paziente" 
               style="display: inline-block; background: linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%); 
                      color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; 
                      font-weight: 600; font-size: 18px; box-shadow: 0 10px 25px rgba(122, 162, 255, 0.3);
                      transition: all 0.3s ease;">
               🚀 Accedi alla mia area
            </a>
          </div>

          <div style="background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #0369a1; font-weight: 600; margin: 0 0 12px 0; font-size: 16px;">📋 Cosa puoi fare nella tua area:</h4>
            <ul style="color: #0369a1; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>📅 Consultare i tuoi appuntamenti</li>
              <li>📊 Compilare questionari di valutazione</li>
              <li>📝 Tenere un diario personale</li>
              <li>🎯 Monitorare i tuoi obiettivi terapeutici</li>
              <li>💬 Comunicare con il tuo terapeuta</li>
            </ul>
          </div>

          <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span style="font-size: 20px;">🔒</span>
              <div>
                <h4 style="color: #92400e; font-weight: 600; margin: 0 0 8px 0; font-size: 16px;">Privacy e Sicurezza</h4>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">
                  I tuoi dati sono protetti da crittografia avanzata. Puoi cambiare la password in qualsiasi momento dal tuo profilo.
                </p>
              </div>
            </div>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span style="font-size: 20px;">💡</span>
              <div>
                <h4 style="color: #1e40af; font-weight: 600; margin: 0 0 8px 0; font-size: 16px;">Supporto</h4>
                <p style="color: #1e40af; margin: 0; line-height: 1.5;">
                  Se hai problemi di accesso, contatta il tuo terapeuta che potrà inviarti nuove credenziali.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; line-height: 1.6;">
          <p style="margin: 0;">Hai ricevuto questa email perché il tuo terapeuta ti ha invitato su cIAo-doc</p>
          <p style="margin: 5px 0 0 0;">Se non hai richiesto questo account, puoi ignorare questa email in sicurezza</p>
        </div>
      </div>
    `;

    // Invia email con SendGrid
    const emailResult = await sgMail.send({
      from: process.env.RESEND_FROM!,
      to: cleanEmail,
      subject,
      html: htmlContent
    });

    console.log('✅ Email inviata con successo! Response:', emailResult[0]);

    return NextResponse.json({ 
      ok: true, 
      message: "✅ Invito inviato! Il paziente ha ricevuto le credenziali via email.",
      emailId: 'sent'
    });
    
  } catch (error: any) {
    console.error('❌ Errore invite-patient:', error);
    return NextResponse.json({ 
      error: error?.message || "Errore durante l'invio dell'invito" 
    }, { status: 500 });
  }
}
