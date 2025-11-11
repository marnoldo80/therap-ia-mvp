'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = {
  id: string;
  display_name: string | null;
  email: string | null;
  birth_date: string | null;
  birth_place: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  province: string | null;
  fiscal_code: string | null;
  session_duration_individual: number;
  session_duration_couple: number;
  session_duration_family: number;
  rate_individual: number;
  rate_couple: number;
  rate_family: number;
};

type Therapist = {
  full_name: string | null;
  tax_code: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  province: string | null;
  vat_number: string | null;
  registration_number: string | null;
  therapeutic_orientation: string | null;
  insurance_policy: string | null;
};

export default function ConsentPage() {
  const params = useParams();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const patientId = params?.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [tesseraSanitariaConsent, setTesseraSanitariaConsent] = useState<boolean>(true);
  const [therapistSignature, setTherapistSignature] = useState<string>('');
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('type');
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    loadData();
  }, [patientId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Sessione non valida');
        return;
      }

      // Carica dati paziente
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError || !patientData) {
        setError('Paziente non trovato');
        return;
      }

      setPatient(patientData);

      // Carica dati terapeuta
      const { data: therapistData, error: therapistError } = await supabase
        .from('therapists')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (therapistError || !therapistData) {
        setError('Dati terapeuta non trovati');
        return;
      }

      setTherapist(therapistData);
    } catch (e: any) {
      setError(e.message || 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  }

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d')!;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getCanvasSignature = () => {
    const canvas = canvasRef.current!;
    return canvas.toDataURL();
  };

  async function saveConsent() {
    if (!patient || !therapist) return;
    
    const signature = signatureType === 'type' 
      ? therapistSignature 
      : getCanvasSignature();
    
    if (!signature) {
      alert('Inserisci la tua firma');
      return;
    }

    setSaving(true);
    try {
      // Salva consenso nel database
      const consentData = {
        patient_id: patientId,
        therapist_signature: signature,
        therapist_signature_type: signatureType,
        tessera_sanitaria_consent: tesseraSanitariaConsent,
        status: 'therapist_signed',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('consent_documents')
        .insert(consentData);

      if (error) throw error;

      alert('✅ Consenso firmato! Il paziente riceverà una notifica per firmare.');
      router.push(`/app/therapist/pazienti/${patientId}`);
    } catch (e: any) {
      alert('Errore: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Caricamento consenso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          <p><strong>Errore:</strong> {error}</p>
          <Link href={`/app/therapist/pazienti/${patientId}`} className="text-blue-600 hover:underline">
            ← Torna alla scheda paziente
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('it-IT');
  const therapistFullAddress = therapist?.address || '_____';
  const patientFullAddress = `${patient?.address || '_____'} ${patient?.postal_code || '_____'} ${patient?.city || '_____'} (${patient?.province || '__'})`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="mb-4">
        <Link href={`/app/therapist/pazienti/${patientId}`} className="text-blue-600 hover:underline">
          ← Torna alla scheda paziente
        </Link>
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
            <li>• il compenso da corrispondere per ciascuna seduta è pari ad euro <strong>{patient?.rate_individual || '____'}</strong> per le sedute individuali, euro <strong>{patient?.rate_couple || '____'}</strong> per le sedute di coppia, euro <strong>{patient?.rate_family || '____'}</strong> consulenza famigliare (aggiungere anche altre eventuali spese aggiuntive, es. somministrazione di test, stesura della relazione ecc.) oltre ad un ulteriore 2% sul totale da destinarsi obbligatoriamente alla Cassa di previdenza ENPAP e ai seguenti oneri (es. bolli, IVA...);</li>
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

          <p>
            Il trattamento dei Suoi dati potrà avvenire con strumenti elettronici e cartacei, in particolare lo strumento principale di intervento sarà il colloquio clinico e i test psicodiagnostici. 
            Esclusivamente previo Suo consenso espresso anche oralmente prima della seduta, potrà essere effettuata la registrazione/videoripresa di alcune sedute, 
            esclusivamente per fini inerenti all'incarico professionale.
          </p>

          <p>
            I dati raccolti nei test, negli appunti, nelle eventuali registrazioni saranno conservati per finalità di prova dell'avvenuta prestazione, 
            per valutazione della stessa nonché per essere eventualmente in un futuro comparati con altri dati a Lei riferibili, sempre per scopi professionali.
          </p>

          <p>
            Tutti i dati forniti e raccolti sono trattati esclusivamente per poter effettuare l'attività professionale di terapia psicoterapica, 
            finalizzata al conseguimento di un rafforzamento dell'efficienza funzionale della personalità.
          </p>

          <p>
            Alcuni dati ed informazioni raccolte nel corso della prestazione potrebbero dover essere comunicati alle Autorità Sanitarie e/o Giudiziarie, 
            esclusivamente sulla base di precisi obblighi di legge. Previo suo consenso (da rendere attraverso il punto in calce alla presente) 
            alcuni dati saranno trasmessi all'Agenzia delle Entrate, tramite flusso telematico del Sistema Tessera Sanitaria, ai fini dell'elaborazione del mod.730/UNICO precompilato.
          </p>

          <p>
            I suoi dati personali non saranno trasferiti all'estero, ma potranno essere salvati su server ubicati in paesi dell'unione europea 
            o verso paesi terzi rispetto a quelli dell'unione europea che offrono idonee garanzie di sicurezza in conformità a standard secondo decisioni di adeguatezza della Commissione Europea.
          </p>

          <div className="mt-8 p-4 border rounded bg-gray-50">
            <p className="font-semibold mb-4">
              Preso atto dell'informativa, presto il mio consenso per il trattamento dei dati, anche sensibili e giudiziari necessari per lo svolgimento delle operazioni indicate.
            </p>
          </div>

          <div className="mt-6 p-4 border rounded">
            <h4 className="font-semibold mb-3">In caso di prestazione sanitaria, per l'invio all'Agenzia delle Entrate dei dati necessari ai fini dell'elaborazione della dichiarazione dei redditi precompilata:</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={tesseraSanitariaConsent === true} 
                  onChange={() => setTesseraSanitariaConsent(true)} 
                />
                <span>Autorizzo la trasmissione dei dati</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={tesseraSanitariaConsent === false} 
                  onChange={() => setTesseraSanitariaConsent(false)} 
                />
                <span>Non Autorizzo la trasmissione dei dati</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE FIRME */}
      <div className="bg-white border rounded-lg p-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="font-medium mb-2">Luogo e Data: <strong>{therapist?.city}, {today}</strong></p>
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">Firma del paziente: (in attesa)</p>
              <div className="h-20 border border-gray-300 rounded bg-gray-50 flex items-center justify-center text-gray-500">
                Il paziente firmerà dopo di te
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">La tua firma (Terapeuta):</h4>
            
            <div className="mb-4">
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={signatureType === 'type'} 
                    onChange={() => setSignatureType('type')} 
                  />
                  <span>Digita il nome</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={signatureType === 'draw'} 
                    onChange={() => setSignatureType('draw')} 
                  />
                  <span>Disegna firma</span>
                </label>
              </div>

              {signatureType === 'type' ? (
                <div>
                  <input 
                    type="text" 
                    value={therapistSignature} 
                    onChange={(e) => setTherapistSignature(e.target.value)}
                    placeholder="Scrivi il tuo nome completo"
                    className="w-full border rounded px-3 py-2 font-serif text-lg italic"
                  />
                  <p className="text-sm text-gray-600 mt-1">Il nome apparirà in corsivo come una firma</p>
                </div>
              ) : (
                <div>
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={100}
                    className="border border-gray-300 rounded cursor-crosshair bg-white w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <button 
                    onClick={clearCanvas}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    🗑️ Cancella firma
                  </button>
                  <p className="text-sm text-gray-600 mt-1">Disegna la tua firma nell'area sopra</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Link 
            href={`/app/therapist/pazienti/${patientId}`}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Annulla
          </Link>
          <button 
            onClick={saveConsent}
            disabled={saving || (!therapistSignature && signatureType === 'type')}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : '✅ Firma e Invia al Paziente'}
          </button>
        </div>
      </div>
    </div>
  );
}
