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

    // Password temporanea semplice
    const tempPassword = `Pass${Math.floor(Math.random() * 10000)}!`;
    
    // Crea utente auth Supabase
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true
    });

    if (authError) throw authError;

    // Aggiorna record paziente con user_id (campo che esiste già)
    const { error: updateError } = await supabaseAdmin
      .from('patients')
      .update({ 
        email: email,
        user_id: authUser.user.id 
      })
      .eq('id', patientId);

    if (updateError) throw updateError;

    // Email semplice
    const htmlContent = `
      <h2>Benvenuto su Therap-IA</h2>
      <p>Le tue credenziali:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${tempPassword}</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/login/paziente">Accedi qui</a></p>
    `;
    
    await resend.emails.send({ 
      from: process.env.RESEND_FROM!, 
      to: email, 
      subject: "Credenziali Therap-IA", 
      html: htmlContent 
    });

    return NextResponse.json({ ok: true });
    
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
