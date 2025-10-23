import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY!);

// client admin con service role (SOLO server)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!, // service
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { email, patientId } = await req.json();
    if (!email || !patientId) {
      return NextResponse.json({ error: "Missing email/patientId" }, { status: 400 });
    }

    // 1) Crea (o recupera) utente
    // Se esiste già, la create fallisce: gestiamo con generateLink
    let userId: string | null = null;

    // Prova a cercare se esiste
    // (Supabase Admin non ha "get user by email", quindi tentiamo direttamente il link)
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email,
    });

    if (linkErr) throw linkErr;

    const inviteUrl = linkData.properties?.action_link;
    userId = linkData.user?.id || null;

    if (!inviteUrl) throw new Error("Invite link non generato.");

    // 2) Se abbiamo ottenuto un user (nuovo o esistente), proviamo a legarlo al record paziente per email, dopo che avrà fatto login.
    // Per ora salviamo solo l'email nel record (se non c'è), il vero link con patient_user_id
    // lo faremo quando il paziente farà login nella sua area (Step 11D).
    // Tuttavia aggiorniamo l'email se manca.
    await supabaseAdmin
      .from("patients")
      .update({ email })
      .eq("id", patientId);

    // 3) Spedisce email con Resend
    const from = process.env.RESEND_FROM!;
    const subject = "Il tuo accesso a Therap-IA (invito)";
    const html = `
      <div style="font-family:system-ui,Arial,sans-serif">
        <p>Ciao,</p>
        <p>Il tuo terapeuta ti invita a registrarti e accedere alla tua area paziente.</p>
        <p>
          <a href="${inviteUrl}" style="display:inline-block;padding:10px 14px;background:#111827;color:#fff;border-radius:8px;text-decoration:none">
            Completa l'invito / Crea password
          </a>
        </p>
        <p>Se il pulsante non funziona, copia e incolla questo link:</p>
        <p><a href="${inviteUrl}">${inviteUrl}</a></p>
      </div>
    `;

    const r = await resend.emails.send({ from, to: email, subject, html });
    if (r.error) throw new Error(r.error.message);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore" }, { status: 500 });
  }
}
