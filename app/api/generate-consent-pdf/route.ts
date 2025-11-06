import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

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

    // Contenuto
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    let y = 50;
    const lineHeight = 7;
    const margin = 20;
    const maxWidth = 170;

    const addText = (text: string, isBold = false) => {
      if (isBold) doc.setFont('helvetica', 'bold');
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight;
      if (isBold) doc.setFont('helvetica', 'normal');
      
      // Nuova pagina se necessario
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    };

    addText(`La sottoscritta dott.ssa ${therapist.display_name || '[NOME TERAPEUTA]'}, iscritta all'Ordine degli Psicologi con il n. ${therapist.registration_number || '[N. ISCRIZIONE]'} nell'elenco degli psicoterapeuti, prima di svolgere la propria opera professionale a favore del sig./della sig.ra ${patient.display_name || '[NOME PAZIENTE]'}, lo/la informa di quanto segue:`);
    
    y += 3;
    addText('• la prestazione che ci si appresta ad eseguire consiste in una psicoterapia finalizzata a miglioramento delle capacità relazionali, aumento della consapevolezza e gestione del significato dei sintomi presentati, gestione dei conflitti, ecc;');
    
    addText(`• la psicoterapia che sarà praticata è ad orientamento ${therapist.therapeutic_orientation || 'Costruttivista'};`);
    
    addText('• esistono altri orientamenti psicoterapeutici oltre a quello sopra indicato;');
    
    addText('• la psicoterapia potrebbe in alcuni casi non produrre gli effetti desiderati dal cliente/paziente. In tal caso sarà cura del professionista informare adeguatamente il paziente e valutare se proporre un nuovo percorso di terapia oppure l\'interruzione della stessa;');
    
    addText(`• le prestazioni verranno rese presso lo studio sito in ${therapist.address || '[INDIRIZZO STUDIO]'}, o in modalità online;`);
    
    addText('• in qualsiasi momento il paziente potrà interrompere la psicoterapia. In tal caso, egli si impegna a comunicare al professionista la volontà di interruzione del rapporto professionale;');
    
    addText('• lo psicologo è tenuto al rispetto del Codice Deontologico degli Psicologi Italiani che impone l\'obbligo di segreto professionale;');
    
    addText(`• la durata dell'intervento è di ${patient.session_duration_individual || 45} minuti per la terapia individuale, ${patient.session_duration_couple || 60} minuti per la terapia di coppia, ${patient.session_duration_family || 75} minuti per le consulenze familiari;`);
    
    addText(`• il compenso da corrispondere per ciascuna seduta è pari ad Euro ${patient.rate_individual || 90} per le sedute individuali, Euro ${patient.rate_couple || 130} per le sedute di coppia, Euro ${patient.rate_family || 150} per consulenze familiari, oltre ad un ulteriore 2% sul totale da destinarsi obbligatoriamente alla Cassa di previdenza ENPAP;`);
    
    addText('• Le sedute vanno saldate contestualmente alla conclusione della stessa. Gli appuntamenti possono essere disdettati 24 ore prima senza alcun addebito. Per gli appuntamenti del lunedì la disdetta senza addebito può essere fatta fino al venerdì, in caso contrario verrà addebitato il costo intero della seduta fissata.');

    y += 10;
    
    addText(`Il sig./la sig.ra ${patient.display_name || '[NOME PAZIENTE]'} nato/a a ${patient.birth_place || '[LUOGO NASCITA]'} il ${patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('it-IT') : '[DATA NASCITA]'} e residente a ${patient.address || '[INDIRIZZO]'}, avendo ricevuto l'informativa di cui sopra ed essendo stato posto a conoscenza degli estremi della polizza assicurativa stipulata dal professionista (${therapist.insurance_policy || '[POLIZZA]'}), dichiara:`);
    
    y += 3;
    addText(`• di avere adeguatamente compreso i termini dell'intervento come sopra sintetizzati e di accettare l'intervento concordato con la dott.ssa ${therapist.display_name || '[NOME TERAPEUTA]'};`);
    
    addText('• di aver pattuito il compenso come sopra indicato;');
    
    addText('• di impegnarsi al rispetto degli orari concordati e delle modalità di disdetta previste.');

    y += 15;
    
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
