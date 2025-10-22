import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM!; // es. onboarding@resend.dev o noreply@tuodominio.com

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { toEmail, toName, patientName, total, severity, date } = body;

    if (!toEmail) return NextResponse.json({ error: "Missing toEmail" }, { status: 400 });

    const subject = "Risultati GAD-7";
    const html = `
      <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Helvetica,Arial">
        <h2>Risultati GAD-7</h2>
        <p>Ciao ${toName || "utente"},</p>
        <p>ecco il riepilogo del questionario GAD-7${patientName ? ` di <b>${patientName}</b>` : ""}:</p>
        <ul>
          <li><b>Punteggio totale:</b> ${total}/21</li>
          <li><b>Gravità:</b> ${severity}</li>
          <li><b>Data:</b> ${date}</li>
        </ul>
        <p>Messaggio generato automaticamente.</p>
      </div>
    `;

    await resend.emails.send({ from: FROM, to: toEmail, subject, html });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Send failed" }, { status: 500 });
  }
}
