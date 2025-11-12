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

    // Recupera il consenso con dati paziente e terapeuta
    const { data: consent, error } = await supabase
      .from('consent_documents')
      .select(`
        *,
        patients!inner (
          display_name,
          birth_date,
          birth_place,
          address,
          city,
          postal_code,
          province,
          fiscal_code,
          email,
          phone,
          session_duration_individual,
          session_duration_couple,
          session_duration_family,
          rate_individual,
          rate_couple,
          rate_family
        ),
        therapists!inner (
          full_name,
          address,
          city,
          registration_number,
          therapeutic_orientation,
          insurance_policy
        )
      `)
      .eq('id', consentId)
      .single();

    if (error || !consent) {
      return NextResponse.json({ error: 'Consenso non trovato' }, { status: 404 });
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
    const patient = (consent as any).patients;
    const therapist = (consent as any).therapists;

    addText(`Nome: ${patient.display_name || '_____'}`);
    addText(`Nato a: ${patient.birth_place || '_____'} il ${patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('it-IT') : '_____'}`);
    addText(`Residente in: ${patient.address || '_____'}, ${patient.city || '_____'} (${patient.province || '__'}) ${patient.postal_code || '_____'}`);
    addText(`Telefono: ${patient.phone || '_____'} | Email: ${patient.email || '_____'}`);
    addText(`Codice Fiscale: ${patient.fiscal_code || '_____'}`);
    y += 10;

    // Testo consenso
    addText(`La sottoscritta dott.ssa ${therapist.full_name}, iscritta all'Ordine degli Psicologi del Veneto con il n. ${therapist.registration_number || '5363'} nell'elenco degli psicoterapeuti, prima di svolgere la propria opera professionale a favore del sig./della sig.ra ${patient.display_name}, lo/la informa di quanto segue:`);
    
    y += 5;
    const puntiConsenso = [
      'la prestazione che ci si appresta ad eseguire consiste in una psicoterapia finalizzata a miglioramento delle capacità relazionali, aumento della consapevolezza e gestione del significato dei sintomi presentati, gestione dei conflitti;',
      `la psicoterapia che sarà praticata è ad orientamento ${therapist.therapeutic_orientation || 'Costruttivista'};`,
      'esistono altri orientamenti psicoterapeutici oltre a quello sopra indicato;',
      'la psicoterapia potrebbe in alcuni casi non produrre gli effetti desiderati dal cliente/paziente;',
      `le prestazioni verranno rese presso lo studio ${therapist.address || '_____'}, o in modalità online;`,
      'in qualsiasi momento il paziente potrà interrompere la psicoterapia;',
      'lo psicologo è tenuto al rispetto del Codice Deontologico degli Psicologi Italiani;',
      `la durata dell\'intervento è di ${patient.session_duration_individual || '____'} minuti per la terapia individuale, ${patient.session_duration_couple || '____'} minuti per la terapia di coppia, ${patient.session_duration_family || '____'} minuti per le consulenze famigliari;`,
      `il compenso da corrispondere per ciascuna seduta è pari ad euro ${patient.rate_individual || '____'} per le sedute individuali, euro ${patient.rate_couple || '____'} per le sedute di coppia, euro ${patient.rate_family || '____'} consulenza famigliare oltre ad un ulteriore 2% ENPAP;`,
      'Le sedute vanno saldate contestualmente alla conclusione della stessa. Gli appuntamenti possono essere disdettati 24 ore prima senza alcun addebito;'
    ];

    puntiConsenso.forEach(punto => {
      addText(`• ${punto}`);
    });

    y += 10;
    addText(`Il sig./la sig.ra ${patient.display_name} nato/a a ${patient.birth_place || '_____'} il ${patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('it-IT') : '_____'} e residente a ${patient.address || '_____'}, ${patient.city || '_____'} avendo ricevuto l'informativa di cui sopra ed essendo stato posto a conoscenza degli estremi della polizza assicurativa stipulata dal professionista (CAMPI, n. polizza ${therapist.insurance_policy || '_____'}), dichiara:`);

    addText('• di avere adeguatamente compreso i termini dell\'intervento e di accettare l\'intervento concordato;');
    addText('• di aver pattuito il compenso come da preventivo sopra indicato;');

    y += 15;

    // Informativa GDPR
    addText('INFORMATIVA TRATTAMENTO DEI DATI PERSONALI', 14, 'bold', 'center');
    addText('(ART. 13 e14 REG. UE 2016/679)', 12, 'bold', 'center');
    y += 10;

    addText(`La dott.ssa ${therapist.full_name}, in qualità di titolare del trattamento dei Suoi dati personali, informa che i dati personali saranno trattati nel pieno rispetto dei diritti, delle libertà fondamentali e della dignità del paziente.`);
    
    y += 10;
    addText('Scelta trasmissione dati fiscali (Sistema Tessera Sanitaria):', 12, 'bold');
    addText(consent.tessera_sanitaria_consent ? '✓ Autorizzata la trasmissione dei dati' : '✗ NON autorizzata la trasmissione dei dati', 11, 'bold');

    y += 20;

    // Firme
    addText(`Luogo e Data: ${therapist.city}, ${new Date(consent.created_at).toLocaleDateString('it-IT')}`, 11, 'bold');
    y += 10;

    // Firma Terapeuta
    addText('Firma del Terapeuta:', 11, 'bold');
    if (consent.therapist_signature_type === 'type') {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(16);
      doc.text(consent.therapist_signature, margin, y);
      y += 15;
    } else {
      addText('[Firma digitalizzata presente]');
    }
    addText(`Firmato il ${new Date(consent.therapist_signed_at).toLocaleDateString('it-IT')}`, 9);

    y += 15;

    // Firma Paziente  
    addText('Firma del Paziente:', 11, 'bold');
    if (consent.patient_signature) {
      if (consent.patient_signature_type === 'type') {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(16);
        doc.text(consent.patient_signature, margin, y);
        y += 15;
      } else {
        addText('[Firma digitalizzata presente]');
      }
      addText(`Firmato il ${consent.patient_signed_at ? new Date(consent.patient_signed_at).toLocaleDateString('it-IT') : ''}`, 9);
    } else {
      addText('[In attesa della firma del paziente]');
    }

    // Genera il PDF come buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="consenso_${patient.display_name?.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('it-IT').replace(/\//g, '-')}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('Errore generazione PDF:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
