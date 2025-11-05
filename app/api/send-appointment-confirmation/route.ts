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
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID mancante' }, { status: 400 });
    }

    // Recupera dati appuntamento
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        title,
        starts_at,
        ends_at,
        location,
        notes,
        therapist_user_id,
        patients!appointments_patient_id_fkey(display_name, email)
      `)
      .eq('id', appointmentId)
      .single();

    if (error) throw error;

    // Recupera info terapeuta separatamente
    const { data: therapist } = await supabase
      .from('therapists')
      .select('display_name')
      .eq('user_id', appointment.therapist_user_id)
      .single();

    const patient = Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients;


    if (!patient?.email) {
      return NextResponse.json({ error: 'Email paziente non trovata' }, { status: 400 });
    }

    const appointmentDate = new Date(appointment.starts_at);
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
    const endTime = new Date(appointment.ends_at).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });

    await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: patient.email,
      subject: `✅ Appuntamento Confermato - ${formattedDate}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .appointment-card { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .appointment-card h3 { margin-top: 0; color: #10b981; }
            .info-row { margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .check-icon { font-size: 48px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="check-icon">✅</div>
              <h1>Appuntamento Confermato</h1>
              <p>Il tuo appuntamento è stato registrato con successo</p>
            </div>
            <div class="content">
              <p>Ciao <strong>${patient.display_name || 'Paziente'}</strong>,</p>
              
              <p>Confermiamo il tuo appuntamento terapeutico:</p>
              
              <div class="appointment-card">
                <h3>${appointment.title || 'Seduta terapeutica'}</h3>
                <div class="info-row">
                  📅 <strong>Data:</strong> ${formattedDate}
                </div>
                <div class="info-row">
                  🕐 <strong>Orario:</strong> ${formattedTime} - ${endTime}
                </div>
                ${appointment.location ? `
                <div class="info-row">
                  📍 <strong>Luogo:</strong> ${appointment.location}
                </div>
                ` : ''}
                ${therapist?.display_name ? `
                <div class="info-row">
                  👨‍⚕️ <strong>Terapeuta:</strong> ${therapist.display_name}
                </div>
                ` : ''}
              </div>

              ${appointment.notes ? `
              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <strong>📝 Note:</strong><br>
                ${appointment.notes}
              </div>
              ` : ''}

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/app/paziente" class="button">
                  Vai alla tua Area Paziente
                </a>
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 25px;">
                <strong>💡 Promemoria:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Riceverai un reminder via email 2 giorni prima della seduta</li>
                  <li>Puoi inviare messaggi al terapeuta dalla tua area paziente</li>
                  <li>Se hai bisogno di spostare l'appuntamento, contattaci il prima possibile</li>
                </ul>
              </div>

              <p style="margin-top: 25px; color: #666; font-size: 14px;">
                Se non hai richiesto questo appuntamento o hai domande, contatta il tuo terapeuta.
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

    return NextResponse.json({ success: true, message: 'Email inviata' });

  } catch (error: any) {
    console.error('Errore invio conferma:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
