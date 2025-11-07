export const CONSENT_TEXT = (therapist: any, patient: any) => {
  const today = new Date().toLocaleDateString('it-IT');

  return `
CONSENSO INFORMATO E PATTUIZIONE DEL COMPENSO
All’atto del conferimento dell’incarico professionale per prestazioni psicoterapeutiche

La sottoscritta dott.ssa ${therapist.display_name}, iscritta all’Ordine degli Psicologi del Veneto con il n. ${therapist.registration_number}, orientamento ${therapist.therapeutic_orientation}, prima di svolgere la propria opera professionale a favore del sig./della sig.ra ${patient.display_name}, lo/la informa di quanto segue:

- la prestazione consiste in una psicoterapia finalizzata al miglioramento delle capacità relazionali, dell’autoconsapevolezza e della gestione del significato dei sintomi presentati;
- la psicoterapia sarà praticata ad orientamento ${therapist.therapeutic_orientation};
- esistono altri orientamenti psicoterapeutici oltre a quello sopra indicato;
- la psicoterapia potrebbe in alcuni casi non produrre gli effetti desiderati dal paziente; in tal caso sarà cura del professionista informare adeguatamente il paziente e valutare l’opportunità di proseguire o interrompere il percorso;
- le prestazioni verranno rese presso lo studio sito in ${therapist.address}, o in modalità online;
- in qualsiasi momento il paziente potrà interrompere la psicoterapia, previa comunicazione al professionista e previo incontro di chiusura;
- lo psicologo è tenuto al rispetto del Codice Deontologico degli Psicologi Italiani, che impone l’obbligo di segreto professionale;
- la durata dell’intervento è di ${patient.session_duration_individual} minuti per la terapia individuale, ${patient.session_duration_couple} minuti per la terapia di coppia, ${patient.session_duration_family} minuti per la consulenza familiare;
- il compenso per ciascuna seduta è di Euro ${patient.rate_individual} per sedute individuali, Euro ${patient.rate_couple} per sedute di coppia, Euro ${patient.rate_family} per sedute familiari, oltre al 2% ENPAP e agli eventuali oneri di legge;
- le sedute vanno saldate al termine della stessa; eventuali disdette vanno comunicate con almeno 24 ore di anticipo (48 ore per appuntamenti fissati di lunedì), in caso contrario verrà addebitato l’intero importo;
- il presente incarico è basato su un numero presuntivo di incontri, suscettibile di variazioni in base all’andamento del percorso, previo accordo tra le parti.

Il/la sig./sig.ra ${patient.display_name}, nato/a a ${patient.birth_place} il ${patient.birth_date}, residente a ${patient.address}, avendo ricevuto le informazioni di cui sopra e preso visione della polizza assicurativa n. ${therapist.insurance_policy}, dichiara:
- di aver compreso i termini dell’intervento e di accettare quanto concordato con la dott.ssa ${therapist.display_name};
- di aver pattuito il compenso come sopra indicato;
- di impegnarsi al rispetto delle modalità di disdetta previste.

INFORMATIVA TRATTAMENTO DATI PERSONALI
(Art. 13 e 14 Reg. UE 2016/679)

La dott.ssa ${therapist.display_name}, in qualità di titolare del trattamento, informa che i dati personali, anche particolari o sensibili, saranno trattati nel pieno rispetto dei diritti, delle libertà fondamentali e della dignità del paziente, nel rispetto della riservatezza e delle normative vigenti.

I dati raccolti saranno trattati esclusivamente per lo svolgimento dell’attività professionale psicoterapeutica, anche mediante strumenti informatici.
Eventuali registrazioni audio o video potranno essere effettuate solo previo consenso esplicito e saranno conservate esclusivamente per finalità professionali e documentali.

I dati potranno essere comunicati ad autorità competenti solo nei casi previsti dalla legge o, previo consenso, trasmessi all’Agenzia delle Entrate tramite Sistema Tessera Sanitaria ai fini fiscali.
Il paziente potrà in ogni momento esercitare i diritti previsti dagli artt. 15–22 del GDPR (accesso, rettifica, cancellazione, limitazione, opposizione, portabilità).

Preso atto dell’informativa, il/la sottoscritto/a presta il proprio consenso al trattamento dei dati personali e sensibili ai fini dell’esecuzione dell’incarico professionale.

Scelta trasmissione dati fiscali (solo per prestazioni sanitarie):
☐ Autorizzo la trasmissione dei dati al Sistema Tessera Sanitaria
☐ Non autorizzo la trasmissione dei dati

Luogo: ${therapist.address}
Data: ${today}

Firma del paziente ___________________________
Firma della terapeuta ___________________________
`;
};
