import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: consentId } = await params;

    // Query con JOIN espliciti invece di relations
    const { data: consentData, error: consentError } = await supabase
      .from('consent_documents')
      .select('*')
      .eq('id', consentId)
      .single();

    if (consentError || !consentData) {
      return NextResponse.json({ error: 'Consenso non trovato' }, { status: 404 });
    }

    // Recupera dati paziente separatamente
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', consentData.patient_id)
      .single();

    if (patientError || !patientData) {
      return NextResponse.json({ error: 'Dati paziente non trovati' }, { status: 404 });
    }

    // Recupera dati terapeuta separatamente
    const { data: therapistData, error: therapistError } = await supabase
      .from('therapists')
      .select('*')
      .eq('user_id', patientData.therapist_user_id)
      .single();

    if (therapistError || !therapistData) {
      return NextResponse.json({ error: 'Dati terapeuta non trovati' }, { status: 404 });
    }

    // Crea PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let y = 20;

    // Helper function per aggiungere testo con wrap automatico
    function addText(text: string, fontSize = 11, fontStyle: 'normal' | 'bold' = 'normal', align: 'left' | 'center' = 'left') {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach((line: string) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        
        if (align === 'center') {
          doc.text(line, pageWidth / 2, y, { align: 'center' });
        } else {
          doc.text(line, margin, y);
        }
        
        y += fontSize * 0.5;
      });
      
      y += 5; // Spazio extra dopo il testo
    }

    // Titolo
    addText('CONSENSO INFORMATO E PATTUIZIONE DEL COMPENSO', 16, 'bold', 'center');
    addText('ALL\'ATTO DEL CONFERIMENTO DELL\'INCARICO PROFESSIONALE', 14, 'bold', 'center');
    addText('PER PRESTAZIONI PSICOTERAPEUTICHE', 14, 'bold', 'center');
    y += 10;

    // Dati paziente
    addText('Dati Paziente', 12, 'bold');

    addText(`Nome: ${patientData.display_name || '_____'}`);
    addText(`Nato a: ${patientData.birth_place || '_____'} il ${patientData.birth_date ? new Date(patientData.birth_date).toLocaleDateString('it-IT') : '_____'}`);
    addText(`Residente in: ${patientData.address || '_____'}, ${patientData.city || '_____'} (${patientData.province || '__'}) ${patientData.postal_code || '_____'}`);
    addText(`Telefono: ${patientData.phone || '_____'} | Email: ${patientData.email || '_____'}`);
    addText(`Codice Fiscale: ${patientData.fiscal_code || '_____'}`);
    y += 10;

    // Testo consenso
    addText(`La sottoscritta dott.ssa ${therapistData.full_name}, iscritta all'Ordine degli Psicologi del Veneto con il n. ${therapistData.registration_number || '5363'} nell'elenco degli psicoterapeuti, prima di svolgere la propria opera professionale a favore del sig./della sig.ra ${patientData.display_name}, lo/la informa di quanto segue:`);
    
    y += 5;
    const puntiConsenso = [
      'la prestazione che ci si appresta ad eseguire consiste in una psicoterapia finalizzata a miglioramento delle capacità relazionali, aumento della consapevolezza e gestione del significato dei sintomi presentati, gestione dei conflitti;',
      `la psicoterapia che sarà praticata è ad orientamento ${therapistData.therapeutic_orientation || 'Costruttivista'};`,
      'esistono altri orientamenti psicoterapeutici oltre a quello sopra indicato;',
      'la psicoterapia potrebbe in alcuni casi non produrre gli effetti desiderati dal cliente/paziente;',
      `le prestazioni verranno rese presso lo studio ${therapistData.address || '_____'}, o in modalità online;`,
      'in qualsiasi momento il paziente potrà interrompere la psicoterapia;',
      'lo psicologo è tenuto al rispetto del Codice Deontologico degli Psicologi Italiani;',
      `la durata dell\'intervento è di ${patientData.session_duration_individual || '____'} minuti per la terapia individuale, ${patientData.session_duration_couple || '____'} minuti per la terapia di coppia, ${patientData.session_duration_family || '____'} minuti per le consulenze famigliari;`,
      `il compenso da corrispondere per ciascuna seduta è pari ad euro ${patientData.rate_individual || '____'} per le sedute individuali, euro ${patientData.rate_couple || '____'} per le sedute di coppia, euro ${patientData.rate_family || '____'} consulenza famigliare oltre ad un ulteriore 2% ENPAP;`,
      'Le sedute vanno saldate contestualmente alla conclusione della stessa. Gli appuntamenti possono essere disdettati 24 ore prima senza alcun addebito;'
    ];

    puntiConsenso.forEach(punto => {
      addText(`• ${punto}`);
    });

    y += 10;
    addText(`Il sig./la sig.ra ${patientData.display_name} nato/a a ${patientData.birth_place || '_____'} il ${patientData.birth_date ? new Date(patientData.birth_date).toLocaleDateString('it-IT') : '_____'} e residente a ${patientData.address || '_____'}, ${patientData.city || '_____'} avendo ricevuto l'informativa di cui sopra ed essendo stato posto a conoscenza degli estremi della polizza assicurativa stipulata dal professionista (CAMPI, n. polizza ${therapistData.insurance_policy || '_____'}), dichiara:`);

    addText('• di avere adeguatamente compreso i termini dell\'intervento e di accettare l\'intervento concordato;');
    addText('• di aver pattuito il compenso come da preventivo sopra indicato;');

    y += 15;

    // Informativa GDPR
    addText('INFORMATIVA TRATTAMENTO DEI DATI PERSONALI', 14, 'bold', 'center');
    addText('(ART. 13 e14 REG. UE 2016/679)', 12, 'bold', 'center');
    y += 10;

    addText(`La dott.ssa ${therapistData.full_name}, in qualità di titolare del trattamento dei Suoi dati personali, informa che i dati personali saranno trattati nel pieno rispetto dei diritti, delle libertà fondamentali e della dignità del paziente.`);
    
    y += 10;
    addText('Scelta trasmissione dati fiscali (Sistema Tessera Sanitaria):', 12, 'bold');
    addText(consentData.tessera_sanitaria_consent ? '✓ Autorizzata la trasmissione dei dati' : '✗ NON autorizzata la trasmissione dei dati', 11, 'bold');

    y += 20;

    // Firme
    addText(`Luogo e Data: ${therapistData.city}, ${new Date(consentData.created_at).toLocaleDateString('it-IT')}`, 11, 'bold');
    y += 10;

    // Firma Terapeuta
    addText('Firma del Terapeuta:', 11, 'bold');
    if (consentData.therapist_signature_type === 'type') {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(16);
      doc.text(consentData.therapist_signature, margin, y);
      y += 15;
    } else {
      addText('[Firma digitalizzata presente]');
    }
    addText(`Firmato il ${new Date(consentData.therapist_signed_at).toLocaleDateString('it-IT')}`, 9);

    y += 15;

    // Firma Paziente  
    addText('Firma del Paziente:', 11, 'bold');
    if (consentData.patient_signature) {
      if (consentData.patient_signature_type === 'type') {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(16);
        doc.text(consentData.patient_signature, margin, y);
        y += 15;
      } else {
        addText('[Firma digitalizzata presente]');
      }
      addText(`Firmato il ${consentData.patient_signed_at ? new Date(consentData.patient_signed_at).toLocaleDateString('it-IT') : ''}`, 9);
    } else {
      addText('[In attesa della firma del paziente]');
    }

    // Genera il PDF come buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="consenso_${patientData.display_name?.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('it-IT').replace(/\//g, '-')}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('Errore generazione PDF:', error);
    return NextResponse.json({ error: 'Errore interno: ' + error.message }, { status: 500 });
  }
}
