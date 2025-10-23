import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!, // Service Role (server only)
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { email, patientId } = await req.json();
    if (!email || !patientId) {
      return NextResponse.json({ error: "Missing email/patientId" }, { status: 400 });
    }

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/app/paziente/onboarding`;

    let link: string | null = null;
    let subject = "Il tuo accesso a Therap-IA (invito)";
    let htmlPrefix = "<p>Il tuo terapeuta ti invita ad attivare la tua area paziente.</p>";

    // 1) Prova INVITE (nuovo utente)
    const { data: invData, error: invErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo }
    });

    if (invErr) {
      // 2) Se l'utente esiste già → MAGIC LINK (login)
      const { data: magData, error: magErr } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo }
      });
      if (magErr) throw magErr;

      link = magData?.properties?.action_link ?? null;
      subject = "Accedi a Therap-IA";
      htmlPrefix = "<p>Accedi alla tua area paziente con il link qui sotto.</p>";
    } else {
      link = invData?.properties?.action_link ?? null;
    }

    if (!link) throw new Error("Nessun link generato.");

    // aggiorna email sul record paziente (utile se non c’era)
    await supabaseAdmin.from("patients").update({ email }).eq("id", patientId);

    const from = process.env.RESEND_FROM!;
    const html = `
      <div style="font-family:system-ui,Arial,sans-serif">
        ${htmlPrefix}
        <p>
          <a href="${link}" style="display:inline-block;padding:10px 14px;background:#111827;color:#fff;border-radius:8px;text-decoration:none">
            Apri il link
          </a>
        </p>
        <p>Se il pulsante non funziona, copia e incolla questo link:</p>
        <p><a href="${link}">${link}</a></p>
      </div>
    `;

    const r = await resend.emails.send({ from, to: email, subject, html });
    if (r.error) throw new Error(r.error.message);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore" }, { status: 500 });
  }
}
