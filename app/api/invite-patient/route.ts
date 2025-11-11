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

    // Genera password temporanea
    const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!`;
    
    // Crea l'utente direttamente con password
    const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { 
        patient_id: patientId,
        role: 'patient' 
      }
    });

    if (createErr) {
      // Se utente esiste già, aggiorna solo la password
      if (createErr.message.includes('already been registered')) {
        const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
          userData?.user?.id || '',
          { password: tempPassword }
        );
        if (updateErr) throw updateErr;
      } else {
        throw createErr;
      }
    }

    // Aggiorna record paziente
    await supabaseAdmin.from("patients").update({ 
      email,
      patient_user_id: userData?.user?.id 
    }).eq("id", patientId);

    // Invia email con credenziali
    const from = process.env.RESEND_FROM!;
    const subject = "Therap-IA - Le tue credenziali di accesso";
    
    const htmlContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">THERAP-IA</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Benvenuto nella tua area paziente</p>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 20px 0;">Ciao! 👋</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
            Il tuo terapeuta ti ha creato un account su <strong>Therap-IA</strong>. Ecco le tue credenziali di accesso:
          </p>
          
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #166534; font-weight: 600; margin: 0 0 10px 0;">🔐 Le tue credenziali:</p>
            <p style="color: #166534; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="color: #166534; margin: 5px 0;"><strong>Password temporanea:</strong> ${tempPassword}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login" 
               style="display: inline-block; background: #111827; color: white; padding: 16px 32px; 
                      text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
             🚀 Accedi alla mia area
            </a>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              ⚠️ <strong>Importante:</strong> Cambia la password dopo il primo accesso per sicurezza.
            </p>
          </div>
          
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #166534; font-weight: 600; margin: 0 0 10px 0;">📋 Cosa puoi fare nella tua area:</p>
            <ul style="color: #166534; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Consultare il tuo piano terapeutico</li>
              <li>Vedere i tuoi appuntamenti</li>
              <li>Compilare questionari</li>
              <li>Comunicare con il terapeuta</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Hai ricevuto questa email perché il tuo terapeuta ti ha invitato su Therap-IA</p>
        </div>
      </div>
    `;
    
    const r = await resend.emails.send({ 
      from, 
      to: email, 
      subject, 
      html: htmlContent 
    });
    
    if (r.error) throw new Error(r.error.message);

    return NextResponse.json({ ok: true, message: "Credenziali inviate via email" });
    
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore" }, { status: 500 });
  }
}
