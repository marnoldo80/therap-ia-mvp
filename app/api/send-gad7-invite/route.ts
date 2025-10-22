import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { to, name, url } = await req.json();
    if (!to || !url) return NextResponse.json({ error: "Missing to/url" }, { status: 400 });

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "noreply@yourdomain.com",
      to,
      subject: "Compila il test GAD-7",
      text: `Ciao ${name || ""},\n\nper favore compila il test GAD-7 a questo link:\n${url}\n\nGrazie.`,
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
