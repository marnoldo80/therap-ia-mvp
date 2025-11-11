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

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/cambia-password`;
    let link: string | null = null;

    // Genera link di reset password
    const { data: resetData, error: resetErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo }
    });

    if (resetErr) throw resetErr;
    link = resetData?.properties?.action_link ?? null;
    if (!link) throw new Error("Nessun link generato.");

    // Aggiorna email nel record paziente
    await supabaseAdmin.from("patients").update({ email }).eq("id", patientId);

    // Invia email
    const from = process.env.RESEND_FROM!;
    const subject = "Therap-IA - Imposta la tua password";
    
    const htmlContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">THERAP-IA</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Benvenuto nella tua area paziente</p>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 20px 0;">Ciao! 👋</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
            Il tuo terapeuta ti ha creato un account su <strong>Therap-IA</strong>, la piattaforma per seguire il tuo percorso terapeutico.
          </p>
          
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #166534; font-weight: 600; margin: 0 0 10px 0;">📋 Cosa puoi fare nella tua area:</p>
            <ul style="color: #166534; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Consultare il tuo piano terapeutico</li>
              <li>Vedere i tuoi appuntamenti</li>
              <li>Compilare questionari</li>
              <li>Comunicare con il terapeuta</li>
            </ul>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
            <strong>Per iniziare, segui questi semplici passi:</strong>
          </p>
          
          <ol style="color: #4b5563; line-height: 1.8; margin: 0 0 30px 20px;">
            <li>Clicca sul pulsante qui sotto</li>
            <li>Crea la tua password sicura (minimo 8 caratteri)</li>
            <li>Accedi alla tua area personale</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" 
               style="display: inline-block; background: #111827; color: white; padding: 16px 32px; 
                      text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
             🔐 Imposta la mia password
            </a>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              💡 <strong>Dopo aver impostato la password, potrai sempre rientrare su:</strong><br>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login" style="color: #2563eb; text-decoration: none;">
                ${process.env.NEXT_PUBLIC_SITE_URL}/login
              </a>
            </p>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              Se il pulsante non funziona, copia e incolla questo link nel browser:
            </p>
            <p style="color: #3b82f6; font-size: 12px; word-break: break-all; margin: 0;">
              ${link}
            </p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              ⚠️ <strong>Importante:</strong> Questo link funziona una sola volta e scade dopo 24 ore.
            </p>
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

    return NextResponse.json({ ok: true });
    
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore" }, { status: 500 });
  }
}
