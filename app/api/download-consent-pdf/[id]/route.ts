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

    // Query con steps separati
    const { data: consentData, error: consentError } = await supabase
      .from('consent_documents')
      .select('*')
      .eq('id', consentId)
      .single();

    if (consentError || !consentData) {
      return NextResponse.json({ error: 'Consenso non trovato' }, { status: 404 });
    }

    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', consentData.patient_id)
      .single();

    if (patientError || !patientData) {
      return NextResponse.json({ error: 'Dati paziente non trovati' }, { status: 404 });
    }

    const { data: therapistData, error: therapistError } = await supabase
      .from('therapists')
      .select('*')
      .eq('user_id', patientData.therapist_user_id)
      .single();

    if (therapistError || !therapistData) {
      return NextResponse.json({ error: 'Dati terapeuta non trovati' }, { status: 404 });
    }

    // Crea PDF con layout identico alle pagine web
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    let y = 15;

    function addText(text: string, fontSize = 10, fontStyle: 'normal' | 'bold' = 'normal', align: 'left' | 'center' = 'left') {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach((line: string) => {
        if (y > pageHeight - margin - 10) {
          doc.addPage();
          y = margin;
        }
        
        if (align === 'center') {
          doc.text(line, pageWidth / 2, y, { align: 'center' });
        } else {
          doc.text(line, margin, y);
        }
        
        y += fontSize * 0.4;
      });
      
      y += 3;
    }

    function addSpacing(space = 5) {
      y += space;
    }

    // === INTESTAZIONE ===
    addText('CONSENSO INFORMATO E PATTUIZIONE DEL COMPENSO', 14, 'bold', 'center');
    addText('ALL\'ATTO DEL CONFERIMENTO DELL\'INCARICO PROFESSIONALE', 12, 'bold', 'center');
    addText('PER PRESTAZIONI PSICOTERAPEUTICHE', 12, 'bold', 'center');
    addSpacing(10);

    // === DATI PAZIENTE ===
    addText('Dati Paziente', 12, 'bold');
    addSpacing(2);
    
    const therapistFullAddress = therapistData?.address || '_____';
    const patientFullAddress = `${patientData?.address || '_____'} ${patientData?.postal_code || '_____'} ${patientData?.city || '_____'} (${patientData?.province || '__'})`;
    
    addText(`Nome: ${patientData?.display_name || '_____'}                    Nato a: ${patientData?.birth_place || '_____'}`);
    addText(`Il: ${patientData?.birth_date ? new Date(patientData.birth_date).toLocaleDateString('it-IT') : '_____'}                    Residente in: ${patientData?.city || '_____'}`);
    addText(`Via: ${patientData?.address || '_____'}                    Cap: ${patientData?.postal_code || '_____'}`);
    addText(`Telefono: ${patientData?.phone || '_____'}                    Mail: ${patientData?.email || '_____'}`);
    addText(`Codice Fiscale: ${patientData?.fiscal_code || '_____'}                    Medico Mmg: _____`);
    addSpacing(8);

    // === TESTO CONSENSO COMPLETO ===
    addText(`La sottoscritta dott.ssa ${therapistData?.full_name}, iscritta all'Ordine degli Psicologi del Veneto con il n. ${therapistData?.registration_number || '5363'} nell'elenco degli psicoterapeuti, prima di svolgere la propria opera professionale a favore del sig./della sig.ra ${patientData?.display_name}, lo/la informa di quanto segue:`);
    addSpacing(3);

    // Lista punti completa come nelle pagine web
    const puntiConsenso = [
      'la prestazione che ci si appresta ad eseguire consiste in una psicoterapia finalizzata a miglioramento delle capacita\' relazionali, aumento della consapevolezza e gestione del significato dei sintomi presentati, gestione dei conflitti, ecc;',
      `la psicoterapia che sara\' praticata e\' ad orientamento ${therapistData?.therapeutic_orientation || 'Costruttivista'};`,
      'esistono altri orientamenti psicoterapeutici oltre a quello sopra indicato;',
      'la psicoterapia potrebbe in alcuni casi non produrre gli effetti desiderati dal cliente/paziente. In tal caso sara\' cura del professionista informare adeguatamente il paziente e valutare se proporre un nuovo percorso di terapia oppure l\'interruzione della stessa;',
      `le prestazioni verranno rese presso lo studio ${therapistFullAddress}, o in modalita\' online;`,
      'in qualsiasi momento il paziente potra\' interrompere la psicoterapia. In tal caso, egli si impegna a comunicare al professionista la volonta\' di interruzione del rapporto professionale e si rende disponibile sin d\'ora ad effettuare un ultimo incontro finalizzato alla sintesi del lavoro svolto;',
      'lo psicologo e\' tenuto al rispetto del Codice Deontologico degli Psicologi Italiani che, tra l\'altro, impone l\'obbligo di segreto professionale, derogabile solo previo valido e dimostrabile consenso del paziente o nei casi assolutamente eccezionali previsti dalla Legge;',
      `la durata dell\'intervento e\' di ${patientData?.session_duration_individual || '____'} minuti per la terapia individuale; ${patientData?.session_duration_couple || '____'} minuti per la terapia di coppia, ${patientData?.session_duration_family || '____'} minuti per le consulenze famigliari, a priori non e\' possibile definire la durata del percorso terapeutico, ma sara\' cura del terapeuta concordare monitoraggi opportuni con il cliente al fine di monitorare il raggiungimento degli obiettivi concordati;`,
      `il compenso da corrispondere per ciascuna seduta e\' pari ad euro ${patientData?.rate_individual || '____'} per le sedute individuali, euro ${patientData?.rate_couple || '____'} per le sedute di coppia, euro ${patientData?.rate_family || '____'} consulenza famigliare (aggiungere anche altre eventuali spese aggiuntive, es. somministrazione di test, stesura della relazione ecc.) oltre ad un ulteriore 2% sul totale da destinarsi obbligatoriamente alla Cassa di previdenza ENPAP e ai seguenti oneri (es. bolli, IVA...);`,
      'Le sedute vanno saldate contestualmente alla conclusione della stessa, salvo accordi diversi con la terapeuta. Gli appuntamenti possono essere disdettati 24 ore prima senza alcun addebito. Per gli appuntamenti del lunedi\' la disdetta senza addebito puo\' essere fatta fino al venerdi\', in caso contrario verra\' addebitato il costo intero della seduta fissata;',
      'Resta inteso, altresi\', che il presente atto di conferimento di incarico professionale - anche in ragione della natura e della peculiarita\' delle prestazioni che ne costituiscono oggetto - viene stipulato sulla base di un numero presuntivo di incontri che, tuttavia, e\' suscettibile di talune variazioni in relazione all\'andamento del percorso da intraprendere. In tal caso, il professionista ne dara\' tempestiva informazione al paziente e si potra\' procedere ad un\'integrazione della presente scrittura privata o al conferimento di nuovo incarico.'
    ];

    puntiConsenso.forEach(punto => {
      addText(`• ${punto}`, 9);
    });

    addSpacing(8);

    // === DICHIARAZIONE PAZIENTE ===
    addText(`Il sig./la sig.ra ${patientData?.display_name} nato/a a ${patientData?.birth_place || '_____'} il ${patientData?.birth_date ? new Date(patientData.birth_date).toLocaleDateString('it-IT') : '_____'} e residente a ${patientFullAddress} avendo ricevuto l'informativa di cui sopra ed essendo stato posto a conoscenza degli estremi della polizza assicurativa stipulata dal professionista (CAMPI, n. polizza ${therapistData?.insurance_policy || '_____'}), dichiara:`, 9);
    
    addSpacing(3);
    addText(`• di avere adeguatamente compreso i termini dell'intervento come sopra sintetizzati e di accettare l'intervento concordato con la dott.ssa ${therapistData?.full_name};`, 9);
    addText(`• di aver pattuito il compenso come da preventivo sopra indicato, da intendersi comprensivo di tutti gli oneri ipotizzabili dal momento del conferimento fino alla conclusione dell'incarico ai sensi della Legge 4 Agosto 2017 n. 124, fatte salve le previsioni sopra indicate circa l'effettiva durata dello stesso.`, 9);

    addSpacing(15);

    // === INFORMATIVA GDPR COMPLETA ===
    addText('INFORMATIVA TRATTAMENTO DEI DATI PERSONALI', 14, 'bold', 'center');
    addText('(ART. 13 e14 REG. UE 2016/679)', 12, 'bold', 'center');
    addSpacing(8);

    const gdprTexts = [
      `La dott.ssa ${therapistData?.full_name}, in qualita\' di titolare del trattamento dei Suoi dati personali, prestara\' particolare attenzione alla tutela della Sua riservatezza. In particolare, ai sensi dell'articolo art. 13 e14 REG. UE 2016/679, desidera fornirle le seguenti informazioni:`,
      'I dati personali, anche particolari, sanitari o giudiziari, da Lei forniti o raccolti nel corso dell\'incarico, nonche\' ogni altra informazione di cui verro\' a conoscenza anche da terzi, comunque ricollegabili alla prestazione professionale, saranno trattati nel pieno rispetto dei Suoi diritti, delle liberta\' fondamentali, nonche\' della dignita\', con particolare riferimento alla Sua riservatezza, all\'identita\' personale e al diritto alla protezione dei dati stessi.',
      'Il titolare del trattamento, vista la propria struttura organizzativa, non ho ritenuto di nominare un Responsabile per la protezione dei dati personali ai sensi dell\'art. 37 del Reg. UE 2016/679.',
      'Il trattamento dei Suoi dati potra\' avvenire con strumenti elettronici e cartacei, in particolare lo strumento principale di intervento sara\' il colloquio clinico e i test psicodiagnostici. Esclusivamente previo Suo consenso espresso anche oralmente prima della seduta, potra\' essere effettuata la registrazione/videoripresa di alcune sedute, esclusivamente per fini inerenti all\'incarico professionale.',
      'I dati raccolti nei test, negli appunti, nelle eventuali registrazioni saranno conservati per finalita\' di prova dell\'avvenuta prestazione, per valutazione della stessa nonche\' per essere eventualmente in un futuro comparati con altri dati a Lei riferibili, sempre per scopi professionali.',
      'Tutti i dati forniti e raccolti sono trattati esclusivamente per poter effettuare l\'attivita\' professionale di terapia psicoterapica, finalizzata al conseguimento di un rafforzamento dell\'efficienza funzionale della personalita\'.',
      'Alcuni dati ed informazioni raccolte nel corso della prestazione potrebbero dover essere comunicati alle Autorita\' Sanitarie e/o Giudiziarie, esclusivamente sulla base di precisi obblighi di legge. Previo suo consenso (da rendere attraverso il punto in calce alla presente) alcuni dati saranno trasmessi all\'Agenzia delle Entrate, tramite flusso telematico del Sistema Tessera Sanitaria, ai fini dell\'elaborazione del mod.730/UNICO precompilato.',
      'I suoi dati personali non saranno trasferiti all\'estero, ma potranno essere salvati su server ubicati in paesi dell\'unione europea o verso paesi terzi rispetto a quelli dell\'unione europea che offrono idonee garanzie di sicurezza in conformita\' a standard secondo decisioni di adeguatezza della Commissione Europea.'
    ];

    gdprTexts.forEach(text => {
      addText(text, 9);
      addSpacing(2);
    });

    addSpacing(5);
    addText('Preso atto dell\'informativa, presto il mio consenso per il trattamento dei dati, anche sensibili e giudiziari necessari per lo svolgimento delle operazioni indicate.', 10, 'bold');
    
    addSpacing(8);
    addText('In caso di prestazione sanitaria, per l\'invio all\'Agenzia delle Entrate dei dati necessari ai fini dell\'elaborazione della dichiarazione dei redditi precompilata:', 10, 'bold');
    addText(consentData.tessera_sanitaria_consent ? '✓ Autorizzo la trasmissione dei dati' : '✗ NON Autorizzo la trasmissione dei dati', 10, 'bold');

    addSpacing(15);

    // === FIRME ===
    addText(`Luogo e Data: ${therapistData?.city}, ${new Date(consentData.created_at).toLocaleDateString('it-IT')}`, 10, 'bold');
    addSpacing(8);

    addText('Firma del Terapeuta:', 10, 'bold');
    if (consentData.therapist_signature_type === 'type') {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(14);
      doc.text(consentData.therapist_signature, margin, y);
      y += 10;
    } else {
      addText('[Firma digitalizzata presente]', 9);
    }
    addText(`Firmato il ${new Date(consentData.therapist_signed_at).toLocaleDateString('it-IT')}`, 8);

    addSpacing(10);

    addText('Firma del Paziente:', 10, 'bold');
    if (consentData.patient_signature) {
      if (consentData.patient_signature_type === 'type') {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(14);
        doc.text(consentData.patient_signature, margin, y);
        y += 10;
      } else {
        addText('[Firma digitalizzata presente]', 9);
      }
      addText(`Firmato il ${consentData.patient_signed_at ? new Date(consentData.patient_signed_at).toLocaleDateString('it-IT') : ''}`, 8);
    } else {
      addText('[In attesa della firma del paziente]', 9);
    }

    // Genera PDF
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
