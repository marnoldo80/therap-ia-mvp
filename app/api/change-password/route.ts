import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { currentPassword, newPassword } = await req.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Password attuale e nuova password richieste" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "La nuova password deve essere di almeno 8 caratteri" }, { status: 400 });
    }

    // Verifica che l'utente sia autenticato
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Token di autorizzazione richiesto" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verifica il token JWT e ottieni l'utente
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: "Token non valido" }, { status: 401 });
    }

    // Verifica che sia un paziente
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id, email')
      .eq('patient_user_id', user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: "Paziente non trovato" }, { status: 403 });
    }

    // Verifica la password attuale tentando il login
    const { error: loginError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    });

    if (loginError) {
      return NextResponse.json({ error: "Password attuale non corretta" }, { status: 400 });
    }

    // Aggiorna la password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id, 
      { password: newPassword }
    );

    if (updateError) {
      throw new Error(`Errore aggiornamento password: ${updateError.message}`);
    }

    console.log('✅ Password cambiata per paziente:', user.email);

    return NextResponse.json({ 
      ok: true, 
      message: "✅ Password aggiornata con successo!" 
    });
    
  } catch (error: any) {
    console.error('❌ Errore cambio password:', error);
    return NextResponse.json({ 
      error: error?.message || "Errore durante il cambio password" 
    }, { status: 500 });
  }
}
