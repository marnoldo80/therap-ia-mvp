export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);
export async function POST(req: Request) {
  try {
    const { to, name, total, severity } = await req.json();
    if (!to || total === undefined || !severity) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const res = await resend.emails.send({
      from: "Therap-IA <onboarding@resend.dev>",
      to: [to],
      subject: "Risultato GAD-7",
      text: `Ciao ${name || ""},\n\nPunteggio: ${total}\nGravità: ${severity}\n\nGrazie.`,
    });
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e:any) { return NextResponse.json({ error: e?.message || "Send failed" }, { status: 500 }); }
}
