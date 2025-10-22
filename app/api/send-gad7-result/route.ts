export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { to, name, total, severity } = await req.json();
    if (!to || total === undefined || !severity)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const subject = "Risultato GAD-7";
    const text = `Ciao ${name || ""},

abbiamo appena completato insieme il GAD-7.

Punteggio totale: ${total}
Gravità: ${severity}

Grazie.`;

    await resend.emails.send({
      from: "Therap-IA <no-reply@resend.dev>",
      to: [to],
      subject,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Send failed" }, { status: 500 });
  }
}
