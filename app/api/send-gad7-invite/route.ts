import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const to: string | undefined = body.to || body.toEmail;
    const toName: string = body.toName || "Paziente";
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

    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) return NextResponse.json({ error: error.message || "Send failed" }, { status: 500 });

    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
