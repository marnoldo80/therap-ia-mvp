export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { to, url, name } = await req.json();
    if (!to || !url) return NextResponse.json({ error: "Missing to/url" }, { status: 400 });

    const subject = "Compilazione questionario GAD-7";
    const text = `Ciao ${name || ""},

per favore compila il questionario GAD-7 al seguente link:
${url}

Grazie!`;

    const res = await resend.emails.send({
      from: "Therap-IA <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
    });

    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Send failed" }, { status: 500 });
  }
}
