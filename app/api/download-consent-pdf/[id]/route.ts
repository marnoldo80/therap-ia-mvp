'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ConsentData = {
  id: string;
  therapist_signature: string;
  therapist_signature_type: string;
  patient_signature: string | null;
  patient_signature_type: string | null;
  tessera_sanitaria_consent: boolean;
  status: string;
  created_at: string;
  therapist_signed_at: string;
  patient_signed_at: string | null;
  patients: {
    display_name: string;
    birth_date: string;
    birth_place: string;
    address: string;
    city: string;
    postal_code: string;
    province: string;
    fiscal_code: string;
    email: string;
    phone: string;
    session_duration_individual: number;
    session_duration_couple: number;
    session_duration_family: number;
    rate_individual: number;
    rate_couple: number;
    rate_family: number;
  };
  therapists: {
    full_name: string;
    address: string;
    city: string;
    registration_number: string;
    therapeutic_orientation: string;
    insurance_policy: string;
  };
};

export default function ViewConsentPage() {
  const params = useParams();
  const consentId = params?.id as string;
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!consentId) return;
    loadData();
  }, [consentId]);

  async function loadData() {
    try {
      const { data, error } = await supabase
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

      if (error || !data) {
        setError('Consenso non trovato');
        return;
      }

      setConsent(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Caricamento consenso...</p>
      </div>
    );
  }

  if (error || !consent) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          <p><strong>Errore:</strong> {error || 'Consenso non trovato'}</p>
        </div>
      </div>
    );
  }

  const patient = consent.patients;
  const therapist = consent.therapists;
  const therapistFullAddress = therapist?.address || '_____';
  const patientFullAddress = `${patient?.address || '_____'} ${patient?.postal_code || '_____'} ${patient?.city || '_____'} (${patient?.province || '__'})`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center py-4 bg-blue-50 rounded-lg mb-6">
        <h1 className="text-2xl font-bold text-blue-800">Consenso Informato - Visualizzazione</h1>
        <p className="text-blue-600 mt-2">
          Documento firmato {consent.status === 'completed' ? 'completo' : 'in attesa paziente'}
        </p>
      </div>

      {/* SEZIONE 1: CONSENSO INFORMATO */}
      <div className="bg-white border rounded-lg p-8">
        <h1 className="text-xl font-bold text-center mb-2">CONSENSO INFORMATO E PATTUIZIONE DEL COMPENSO</h1>
        <h2 className="text-lg font-bold text-center mb-2">ALL'ATTO DEL CONFERIMENTO DELL'INCARICO PROFESSIONALE</h2>
        <h3 className="text-lg font-bold text-center mb-8">PER PRESTAZIONI PSICOTERAPEUTICHE</h3>

        <div className="space-y-4 text-sm leading-relaxed">
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Dati Paziente</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Nome: <strong>{patient?.display_name || '_____'}</strong></div>
              <div>Nato a: <strong>{patient?.birth_place || '_____'}</strong></div>
              <div>Il: <strong>{patient?.birth_date ? new Date(patient.birth_date).toLocaleDateString('it-IT') : '_____'}</strong></div>
              <div>Residente in: <strong>{patient?.city || '_____'}</strong></div>
              <div>Via: <strong>{patient?.address || '_____'}</strong></div>
              <div>Cap: <strong>{patient?.postal_code || '_____'}</strong></div>
              <div>Telefono: <strong>{patient?.phone || '_____'}</strong></div>
              <div>Mail: <strong>{patient?.email || '_____'}</strong></div>
              <div>Codice Fiscale: <strong>{patient?.fiscal_code || '_____'}</strong></div>
              <div>Medico Mmg: <strong>_____</strong></div>
            </div>
          </div>

          <p>
            La sottoscritta dott.ssa <strong>{therapist?.full_name}</strong>, iscritta all'Ordine degli Psicologi del Veneto con il n. <strong>{therapist?.registration_number || '5363'}</strong> nell'elenco degli psicoterapeuti, 
            prima di svolgere la propria opera professionale a favore del sig./della sig.ra <strong>{patient?.display_name}</strong>, lo/la informa di quanto segue:
          </p>

          <ul className="space-y-3 pl-4">
            <li>• la prestazione che ci si appresta ad eseguire consiste in una psicoterapia finalizzata a miglioramento delle capacità relazionali, aumento della consapevolezza e gestione del significato dei sintomi presentati, gestione dei conflitti, ecc;</li>
            <li>• la psicoterapia che sarà praticata è ad orientamento <strong>{therapist?.therapeutic_orientation || 'Costruttivista'}</strong>;</li>
            <li>• esistono altri orientamenti psicoterapeutici oltre a quello sopra indicato;</li>
            <li>• la psicoterapia potrebbe in alcuni casi non produrre gli effetti desiderati dal cliente/paziente. In tal caso sarà cura del professionista informare adeguatamente il paziente e valutare se proporre un nuovo percorso di terapia oppure l'interruzione della stessa;</li>
            <li>• le prestazioni verranno rese presso lo studio <strong>{therapistFullAddress}</strong>, o in modalità online;</li>
            <li>• in qualsiasi momento il paziente potrà interrompere la psicoterapia. In tal caso, egli si impegna a comunicare al professionista la volontà di interruzione del rapporto professionale e si rende disponibile sin d'ora ad effettuare un ultimo incontro finalizzato alla sintesi del lavoro svolto;</li>
            <li>• lo psicologo è tenuto al rispetto del Codice Deontologico degli Psicologi Italiani che, tra l'altro, impone l'obbligo di segreto professionale, derogabile solo previo valido e dimostrabile consenso del paziente o nei casi assolutamente eccezionali previsti dalla Legge;</li>
            <li>• la durata dell'intervento è di <strong>{patient?.session_duration_individual || '____'}</strong> minuti per la terapia individuale; <strong>{patient?.session_duration_couple || '____'}</strong> minuti per la terapia di coppia, <strong>{patient?.session_duration_family || '____'}</strong> minuti per le consulenze famigliari, a priori non è possibile definire la durata del percorso terapeutico, ma sarà cura del terapeuta concordare monitoraggi opportuni con il cliente al fine di monitorare il raggiungimento degli obiettivi concordati;</li>
            <li>• il compenso da corrispondere per ciascuna seduta è pari ad euro <strong>{patient?.rate_individual || '____'}</strong> per le sedute individuali, euro <strong>{patient?.rate_couple || '____'}</strong> per le sedute di coppia, euro <strong>{patient?.rate_family || '____'}</strong> consulenza famigliare oltre ad un ulteriore 2% sul totale da destinarsi obbligatoriamente alla Cassa di previdenza ENPAP;</li>
            <li>• Le sedute vanno saldate contestualmente alla conclusione della stessa, salvo accordi diversi con la terapeuta. Gli appuntamenti possono essere disdettati 24 ore prima senza alcun addebito. Per gli appuntamenti del lunedì la disdetta senza addebito può essere fatta fino al venerdì, in caso contrario verrà addebitato il costo intero della seduta fissata;</li>
            <li>• Resta inteso, altresì, che il presente atto di conferimento di incarico professionale – anche in ragione della natura e della peculiarità delle prestazioni che ne costituiscono oggetto – viene stipulato sulla base di un numero presuntivo di incontri che, tuttavia, è suscettibile di talune variazioni in relazione all'andamento del percorso da intraprendere. In tal caso, il professionista ne darà tempestiva informazione al paziente e si potrà procedere ad un'integrazione della presente scrittura privata o al conferimento di nuovo incarico.</li>
          </ul>

          <div className="my-6 p-4 bg-gray-50 rounded">
            <p>
              Il sig./la sig.ra <strong>{patient?.display_name}</strong> nato/a a <strong>{patient?.birth_place || '_____'}</strong> il <strong>{patient?.birth_date ? new Date(patient.birth_date).toLocaleDateString('it-IT') : '_____'}</strong> e residente a <strong>{patientFullAddress}</strong> 
              avendo ricevuto l'informativa di cui sopra ed essendo stato posto a conoscenza degli estremi della polizza assicurativa stipulata dal professionista (CAMPI, n. polizza <strong>{therapist?.insurance_policy || '_____'}</strong>), dichiara:
            </p>

            <ul className="space-y-2 pl-4 mt-4">
              <li>• di avere adeguatamente compreso i termini dell'intervento come sopra sintetizzati e di accettare l'intervento concordato con la dott.ssa <strong>{therapist?.full_name}</strong>;</li>
              <li>• di aver pattuito il compenso come da preventivo sopra indicato, da intendersi comprensivo di tutti gli oneri ipotizzabili dal momento del conferimento fino alla conclusione dell'incarico ai sensi della Legge 4 Agosto 2017 n. 124, fatte salve le previsioni sopra indicate circa l'effettiva durata dello stesso.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SEZIONE 2: INFORMATIVA TRATTAMENTO DATI */}
      <div className="bg-white border rounded-lg p-8">
        <h2 className="text-xl font-bold text-center mb-8">INFORMATIVA TRATTAMENTO DEI DATI PERSONALI<br />(ART. 13 e14 REG. UE 2016/679)</h2>

        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            La dott.ssa <strong>{therapist?.full_name}</strong>, in qualità di titolare del trattamento dei Suoi dati personali, presterà particolare attenzione alla tutela della Sua riservatezza. 
            In particolare, ai sensi dell'articolo art. 13 e14 REG. UE 2016/679, desidera fornirle le seguenti informazioni:
          </p>

          <p>
            I dati personali, anche particolari, sanitari o giudiziari, da Lei forniti o raccolti nel corso dell'incarico, nonché ogni altra informazione di cui verrò a conoscenza anche da terzi, 
            comunque ricollegabili alla prestazione professionale, saranno trattati nel pieno rispetto dei Suoi diritti, delle libertà fondamentali, nonché della dignità, 
            con particolare riferimento alla Sua riservatezza, all'identità personale e al diritto alla protezione dei dati stessi.
          </p>

          <p>
            Il titolare del trattamento, vista la propria struttura organizzativa, non ho ritenuto di nominare un Responsabile per la protezione dei dati personali 
            ai sensi dell'art. 37 del Reg. UE 2016/679.
          </p>

          <div className="mt-8 p-4 border rounded bg-gray-50">
            <p className="font-semibold mb-4">
              Preso atto dell'informativa, presto il mio consenso per il trattamento dei dati, anche sensibili e giudiziari necessari per lo svolgimento delle operazioni indicate.
            </p>
          </div>

          <div className="mt-6 p-4 border rounded bg-yellow-50">
            <h4 className="font-semibold mb-3">Scelta trasmissione dati fiscali (Sistema Tessera Sanitaria):</h4>
            <div className="text-center text-lg">
              {consent?.tessera_sanitaria_consent ? (
                <span className="text-green-600 font-semibold">✅ Autorizzata la trasmissione dei dati al Sistema Tessera Sanitaria</span>
              ) : (
                <span className="text-red-600 font-semibold">❌ NON autorizzata la trasmissione dei dati</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE FIRME */}
      <div className="bg-white border rounded-lg p-8">
        <h3 className="text-xl font-semibold mb-6 text-center">Firme</h3>
        
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold mb-3">Firma del Terapeuta:</h4>
            <div className="p-4 border rounded bg-green-50">
              {consent.therapist_signature_type === 'type' ? (
                <div className="text-xl font-serif italic text-center">
                  {consent.therapist_signature}
                </div>
              ) : (
                <img 
                  src={consent.therapist_signature} 
                  alt="Firma terapeuta" 
                  className="max-h-20 mx-auto"
                />
              )}
              <p className="text-xs text-center text-gray-500 mt-2">
                Firmato il {new Date(consent.therapist_signed_at).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Firma del Paziente:</h4>
            <div className={`p-4 border rounded ${consent.patient_signature ? 'bg-green-50' : 'bg-gray-50'}`}>
              {consent.patient_signature ? (
                <>
                  {consent.patient_signature_type === 'type' ? (
                    <div className="text-xl font-serif italic text-center">
                      {consent.patient_signature}
                    </div>
                  ) : (
                    <img 
                      src={consent.patient_signature} 
                      alt="Firma paziente" 
                      className="max-h-20 mx-auto"
                    />
                  )}
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Firmato il {consent.patient_signed_at && new Date(consent.patient_signed_at).toLocaleDateString('it-IT')}
                  </p>
                </>
              ) : (
                <div className="text-center text-gray-500 py-6">
                  <p>In attesa della firma del paziente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Luogo e Data: <strong>{therapist?.city}, {new Date(consent.created_at).toLocaleDateString('it-IT')}</strong></p>
        </div>
      </div>
    </div>
  );
}
