import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const to = body.to || body.toEmail;             // accetta to o toEmail
    const toName = body.toName || "Paziente";
    const url: string | undefined = body.url;

    if (!to || !url) {
      return NextResponse.json({ error: "Missing to/url" }, { status: 400 });
    }
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const from = process.env.RESEND_FROM || "onboarding@resend.dev";

    const subject = "Questionario GAD-7";
    const html = `
      <p>Ciao ${toName},</p>
      <p>per favore compila il GAD-7 cliccando qui:</p>
      <p><a href="${url}">${url}</a></p>
      <p>Grazie.</p>
    `;

    const r = await resend.emails.send({ from, to, subject, html });
    if (!r?.id) throw new Error("Send failed");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
