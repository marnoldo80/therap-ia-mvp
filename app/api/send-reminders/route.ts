import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    
    // Salta se oggi è domenica
    if (now.getDay() === 0) {
      return NextResponse.json({ 
        message: 'Nessun reminder inviato (oggi è domenica)',
        sent: 0 
      });
    }

    const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const in2DaysPlus1Hour = new Date(now.getTime() + (2 * 24 + 1) * 60 * 60 * 1000);

    // Trova appuntamenti tra 2 giorni (con finestra di 1h)
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        title,
        starts_at,
        location,
        notes,
        patients!appointments_patient_fkey(display_name, email),
        therapists!appointments_therapist_user_id_fkey(display_name)
      `)
      .eq('status', 'scheduled')
      .gte('starts_at', in2Days.toISOString())
      .lte('starts_at', in2DaysPlus1Hour.toISOString());

    if (error) throw error;

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ 
        message: 'Nessun appuntamento da notificare',
        sent: 0 
      });
    }

    let sentCount = 0;

    for (const appt of appointments) {
      const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
      const therapist = Array.isArray(appt.therapists) ? appt.therapists[0] : appt.therapists;

      if (!patient?.email) continue;

      const appointmentDate = new Date(appt.starts_at);
      const formattedDate = appointmentDate.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = appointmentDate.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
      });

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM || 'onboarding@resend.dev',
          to: patient.email,
          subject: `Promemoria: Seduta tra 2 giorni - ${formattedTime}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .appointment-card { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
                .appointment-card h3 { margin-top: 0; color: #667eea; }
                .info-row { margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔔 Promemoria Seduta</h1>
                  <p>La tua seduta è tra 2 giorni!</p>
                </div>
                <div class="content">
                  <p>Ciao <strong>${patient.display_name || 'Paziente'}</strong>,</p>
                  
                  <p>Ti ricordiamo che hai un appuntamento programmato:</p>
                  
                  <div class="appointment-card">
                    <h3>${appt.title || 'Seduta terapeutica'}</h3>
                    <div class="info-row">
                      📅 <strong>Data:</strong> ${formattedDate}
                    </div>
                    <div class="info-row">
                      🕐 <strong>Ora:</strong> ${formattedTime}
                    </div>
                    ${appt.location ? `
                    <div class="info-row">
                      📍 <strong>Luogo:</strong> ${appt.location}
                    </div>
                    ` : ''}
                    ${therapist?.display_name ? `
                    <div class="info-row">
                      👨‍⚕️ <strong>Terapeuta:</strong> ${therapist.display_name}
                    </div>
                    ` : ''}
                  </div>

                  ${appt.notes ? `
                  <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <strong>📝 Note:</strong><br>
                    ${appt.notes}
                  </div>
                  ` : ''}

                  <p style="margin-top: 25px;">
                    <strong>💡 Suggerimenti per prepararti:</strong>
                  </p>
                  <ul>
                    <li>Rivedi gli esercizi completati durante la settimana</li>
                    <li>Annota eventuali domande o temi da affrontare</li>
                    <li>Consulta il diario delle emozioni se lo stai compilando</li>
                  </ul>

                  <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/app/paziente" class="button">
                      Vai alla tua Area Paziente
                    </a>
                  </div>

                  <p style="margin-top: 25px; color: #666; font-size: 14px;">
                    Se hai bisogno di spostare l'appuntamento, contatta il tuo terapeuta il prima possibile.
                  </p>
                </div>
                <div class="footer">
                  <p>Therap-IA - Il tuo supporto terapeutico digitale</p>
                  <p style="font-size: 12px; color: #999;">Questa è una email automatica, non rispondere direttamente.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });

        sentCount++;

      } catch (emailError) {
        console.error(`Errore invio email a ${patient.email}:`, emailError);
      }
    }

    return NextResponse.json({ 
      message: `Reminder inviati con successo`,
      sent: sentCount,
      total: appointments.length
    });

  } catch (error: any) {
    console.error('Errore invio reminder:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
