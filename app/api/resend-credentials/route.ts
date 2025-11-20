import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  { auth: { persistSession: false } }
);

// Stessa funzione di generazione password
function generatePassword(): string {
  const words = ['Casa', 'Mare', 'Sole', 'Luna', 'Fiore', 'Verde', 'Pace', 'Gioia', 'Luce', 'Vita'];
  const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const word = words[Math.floor(Math.random() * words.length)];
  return `${word}${numbers}!`;
}

export async function POST(req: Request) {
  try {
    const { patientId } = await req.json();
    
    if (!patientId) {
      return NextResponse.json({ error: "PatientId richiesto" }, { status: 400 });
    }

    // Verifica che il paziente esista e appartenga al terapeuta
    const { data: patient, error: patientErr } = await supabaseAdmin
      .from("patients")
      .select("id, display_name, email, patient_user_id, therapist_user_id")
      .eq("id", patientId)
      .single();

    if (patientErr || !patient || !patient.email) {
      return NextResponse.json({ error: "Paziente non trovato o email mancante" }, { status: 404 });
    }

    if (!patient.patient_user_id) {
      return NextResponse.json({ error: "Paziente non ha un account collegato. Invia un nuovo invito." }, { status: 400 });
    }

    // Genera nuova password
    const newPassword = generatePassword();
    console.log('🔄 Nuova password generata per:', patient.email);

    // Aggiorna password utente
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      patient.patient_user_id, 
      { password: newPassword }
    );
    
    if (updateErr) {
      throw new Error(`Errore aggiornamento password: ${updateErr.message}`);
    }

    // Email di rimando credenziali
    const subject = "cIAo-doc - Le tue nuove credenziali di accesso";
    
    const htmlContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0b1022 0%, #1e293b 50%, #334155 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🩺 cIAo-doc</h1>
          <p style="color: rgba(168, 178, 214, 0.9); margin: 10px 0 0 0; font-size: 16px;">Nuove credenziali di accesso</p>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 20px 0;">Ciao ${patient.display_name || 'Paziente'}! 👋</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
            Il tuo terapeuta ha generato <strong>nuove credenziali</strong> per il tuo account cIAo-doc:
          </p>
          
          <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #166534; font-weight: 600; margin: 0 0 15px 0; font-size: 18px;">🔐 Le tue NUOVE credenziali</h3>
            <div style="background: white; border-radius: 8px; padding: 20px;">
              <p style="color: #166534; margin: 8px 0; font-size: 16px;">
                <strong>📧 Email:</strong> <code style="background: #dcfce7; padding: 4px 8px; border-radius: 6px; font-family: 'Courier New', monospace;">${patient.email}</code>
              </p>
              <p style="color: #166534; margin: 8px 0; font-size: 16px;">
                <strong>🔑 Nuova Password:</strong> <code style="background: #dcfce7; padding: 4px 8px; border-radius: 6px; font-family: 'Courier New', monospace; font-weight: bold; font-size: 18px;">${newPassword}</code>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://therap-ia-mvp.vercel.app/login/paziente" 
               style="display: inline-block; background: linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%); 
                      color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; 
                      font-weight: 600; font-size: 18px; box-shadow: 0 10px 25px rgba(122, 162, 255, 0.3);
                      transition: all 0.3s ease;">
               🚀 Accedi con le nuove credenziali
            </a>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span style="font-size: 20px;">⚠️</span>
              <div>
                <h4 style="color: #92400e; font-weight: 600; margin: 0 0 8px 0; font-size: 16px;">Password Aggiornata</h4>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">
                  Le tue credenziali precedenti non sono più valide. Usa solo quelle indicate sopra per accedere.
                </p>
              </div>
            </div>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span style="font-size: 20px;">💡</span>
              <div>
                <h4 style="color: #1e40af; font-weight: 600; margin: 0 0 8px 0; font-size: 16px;">Suggerimento</h4>
                <p style="color: #1e40af; margin: 0; line-height: 1.5;">
                  Dopo l'accesso, puoi cambiare la password con una di tua scelta direttamente dal tuo profilo.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; line-height: 1.6;">
          <p style="margin: 0;">Hai ricevuto questa email perché il tuo terapeuta ha aggiornato le tue credenziali</p>
          <p style="margin: 5px 0 0 0;">Se non hai richiesto questo aggiornamento, contatta il tuo terapeuta</p>
        </div>
      </div>
    `;

    // Invia email
    const emailResult = await resend.emails.send({ 
      from: process.env.RESEND_FROM!,
      to: patient.email, 
      subject, 
      html: htmlContent 
    });
    
    if (emailResult.error) {
      throw new Error(`Errore invio email: ${emailResult.error.message}`);
    }

    console.log('✅ Nuove credenziali inviate! Email ID:', emailResult.data?.id);

    return NextResponse.json({ 
      ok: true, 
      message: "✅ Nuove credenziali generate e inviate al paziente!",
      emailId: emailResult.data?.id
    });
    
  } catch (error: any) {
    console.error('❌ Errore rimanda credenziali:', error);
    return NextResponse.json({ 
      error: error?.message || "Errore durante l'invio delle nuove credenziali" 
    }, { status: 500 });
  }
}
