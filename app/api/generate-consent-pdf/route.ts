import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import { CONSENT_TEXT } from '@/lib/consent-text';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID mancante' }, { status: 400 });
    }

    // Recupera dati paziente
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select(`
        display_name,
        birth_date,
        birth_place,
        address,
        fiscal_code,
        session_duration_individual,
        session_duration_couple,
        session_duration_family,
        rate_individual,
        rate_couple,
        rate_family
      `)
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Paziente non trovato' }, { status: 404 });
    }

    // Recupera dati terapeuta
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { data: therapist, error: therapistError } = await supabase
      .from('therapists')
      .select(`
        display_name,
        registration_number,
        therapeutic_orientation,
        address,
        insurance_policy
      `)
      .eq('user_id', user.id)
      .single();

    if (therapistError || !therapist) {
      return NextResponse.json({ error: 'Dati terapeuta non trovati' }, { status: 404 });
    }

    // Genera PDF
    const doc = new jsPDF();
    
    // Titolo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSENSO INFORMATO E PATTUIZIONE DEL COMPENSO', 105, 20, { align: 'center' });
    doc.text('ALL\'ATTO DEL CONFERIMENTO DELL\'INCARICO PROFESSIONALE', 105, 28, { align: 'center' });
    doc.text('PER PRESTAZIONI PSICOTERAPEUTICHE', 105, 36, { align: 'center' });

    // Contenuto (nuovo)
    
doc.setFontSize(11);
doc.setFont('helvetica', 'normal');

let y = 50;
const lineHeight = 7;
const margin = 20;
const maxWidth = 170;

const addText = (text: string) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, margin, y);
  y += lines.length * lineHeight;
  if (y > 270) { doc.addPage(); y = 20; }
};

const consentFullText = CONSENT_TEXT(therapist, patient);
addText(consentFullText);

    
    // Firme
    addText('Data: ____________________', true);
    y += 10;
    addText('Firma del Paziente: ____________________________', true);
    y += 10;
    addText('Firma del Terapeuta: ____________________________', true);

    // Genera PDF come buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="consenso_informato_${patient.display_name?.replace(/\s+/g, '_')}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('Errore generazione PDF:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
