'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ViewConsentPage() {
  const params = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [consent, setConsent] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [therapist, setTherapist] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Firma paziente states
  const [isPatientUser, setIsPatientUser] = useState(false);
  const [canPatientSign, setCanPatientSign] = useState(false);
  const [signingMode, setSigningMode] = useState<'none' | 'type' | 'draw'>('none');
  const [typedSignature, setTypedSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePath, setSignaturePath] = useState<Array<{x: number, y: number}>>([]);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!params?.id) return;
      
      let consentId: string;
      if (Array.isArray(params.id)) {
        consentId = params.id[0];
      } else {
        consentId = params.id;
      }
      
      if (!consentId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Verifica utente attuale
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Query consenso
        const { data: consentData, error: consentError } = await supabase
          .from('consent_documents')
          .select('*')
          .eq('id', consentId)
          .single();

        if (consentError || !consentData) {
          setError('Consenso non trovato');
          return;
        }
        setConsent(consentData);

        // Query paziente
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', consentData.patient_id)
          .single();

        if (patientError || !patientData) {
          setError('Dati paziente non trovati');
          return;
        }
        setPatient(patientData);

        // Query terapeuta
        const { data: therapistData, error: therapistError } = await supabase
          .from('therapists')
          .select('*')
          .eq('user_id', patientData.therapist_user_id)
          .single();

        if (therapistError || !therapistData) {
          setError('Dati terapeuta non trovati');
          return;
        }
        setTherapist(therapistData);

        // 🔍 DEBUG - Aggiungi questi log
        console.log('🔍 DEBUG - Current user:', user?.id, user?.email);
        console.log('🔍 DEBUG - Patient data:', patientData);
        console.log('🔍 DEBUG - Patient user ID:', patientData?.patient_user_id);
        console.log('🔍 DEBUG - Consent status:', consentData?.status);
        console.log('🔍 DEBUG - Patient signature exists:', !!consentData?.patient_signature);

        // Verifica se l'utente corrente è il paziente
        if (user && patientData.patient_user_id === user.id) {
          console.log('🔍 DEBUG - IsPatientUser: TRUE');
          setIsPatientUser(true);
          const canSign = consentData.status === 'therapist_signed' && !consentData.patient_signature;
          console.log('🔍 DEBUG - CanPatientSign:', canSign);
          setCanPatientSign(canSign);
        } else {
          console.log('🔍 DEBUG - IsPatientUser: FALSE');
          console.log('🔍 DEBUG - User comparison:', {
            currentUserId: user?.id,
            patientUserId: patientData?.patient_user_id,
            match: user?.id === patientData?.patient_user_id
          });
        }

      } catch (e: any) {
        console.error('🔍 DEBUG - Error loading data:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [params]);

  // Funzioni per il disegno della firma
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSignaturePath([{x, y}]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSignaturePath(prev => [...prev, {x, y}]);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    if (signaturePath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(signaturePath[signaturePath.length - 1].x, signaturePath[signaturePath.length - 1].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignaturePath([]);
    setTypedSignature('');
  };

  const savePatientSignature = async () => {
    if (!consent?.id) return;
    
    console.log('🔍 DEBUG - Saving signature, mode:', signingMode);
    
    setSigning(true);
    try {
      let signatureData = '';
      let signatureType = '';

      if (signingMode === 'type') {
        if (!typedSignature.trim()) {
          alert('Inserisci la tua firma digitata');
          setSigning(false);
          return;
        }
        signatureData = typedSignature.trim();
        signatureType = 'type';
      } else if (signingMode === 'draw') {
        const canvas = canvasRef.current;
        if (!canvas || signaturePath.length === 0) {
          alert('Disegna la tua firma');
          setSigning(false);
          return;
        }
        signatureData = canvas.toDataURL();
        signatureType = 'draw';
      } else {
        alert('Seleziona un metodo di firma');
        setSigning(false);
        return;
      }

      console.log('🔍 DEBUG - Updating consent with signature:', {
        consentId: consent.id,
        signatureType,
        signatureDataLength: signatureData.length
      });

      // Aggiorna il consenso con la firma del paziente
      const { error } = await supabase
        .from('consent_documents')
        .update({
          patient_signature: signatureData,
          patient_signature_type: signatureType,
          patient_signed_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', consent.id);

      if (error) {
        console.error('🔍 DEBUG - Error saving signature:', error);
        throw error;
      }

      console.log('🔍 DEBUG - Signature saved successfully');
      alert('✅ Consenso firmato con successo!');
      
      // Ricarica i dati per mostrare il consenso firmato
      window.location.reload();
      
    } catch (e: any) {
      console.error('🔍 DEBUG - Full error saving signature:', e);
      alert('Errore durante la firma: ' + e.message);
    } finally {
      setSigning(false);
    }
  };

  console.log('🔍 DEBUG - Render states:', {
    loading,
    error,
    isPatientUser,
    canPatientSign,
    signingMode,
    consentStatus: consent?.status,
    hasPatientSignature: !!consent?.patient_signature
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Caricamento consenso...</p>
      </div>
    );
  }

  if (error || !consent || !patient || !therapist) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          <p><strong>Errore:</strong> {error || 'Dati non trovati'}</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('it-IT');
  const therapistFullAddress = therapist?.address || '_____';
  const patientFullAddress = `${patient?.address || '_____'} ${patient?.postal_code || '_____'} ${patient?.city || '_____'} (${patient?.province || '__'})`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center py-4 bg-blue-50 rounded-lg mb-6">
        <h1 className="text-2xl font-bold text-blue-800">Consenso Informato - Visualizzazione</h1>
        <p className="text-blue-600 mt-2">
          Documento {consent.status === 'completed' ? 'firmato completo' : consent.status === 'therapist_signed' ? 'in attesa della tua firma' : 'in preparazione'}
        </p>
        {isPatientUser && canPatientSign && (
          <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded">
            <p className="text-orange-800 font-medium">
              🔔 Il tuo terapeuta ha firmato il consenso. Ora è il momento di firmarlo anche tu per completare il processo.
            </p>
          </div>
        )}
      </div>

      {/* SEZIONE 1: CONSENSO INFORMATO - IDENTICA ALLE PAGINE FIRMA */}
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

      {/* SEZIONE 2: INFORMATIVA TRATTAMENTO DATI - IDENTICA ALLE PAGINE FIRMA */}
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

          <div className="mt-6 p-4 border rounded bg-yellow-50">
            <h4 className="font-semibold mb-3">In caso di prestazione sanitaria, per l'invio all'Agenzia delle Entrate dei dati necessari ai fini dell'elaborazione della dichiarazione dei redditi precompilata:</h4>
            <div className="text-center text-lg">
              {consent?.tessera_sanitaria_consent ? (
                <span className="text-green-600 font-semibold">✅ Autorizzo la trasmissione dei dati</span>
              ) : (
                <span className="text-red-600 font-semibold">❌ Non Autorizzo la trasmissione dei dati</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE FIRME CON FIRMA PAZIENTE INTERATTIVA */}
      <div className="bg-white border rounded-lg p-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="font-medium mb-2">Luogo e Data: <strong>{therapist?.city}, {today}</strong></p>
            
            <div className="mt-6">
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
          </div>

          <div>
            <h4 className="font-semibold mb-3">Firma del Paziente:</h4>
            
            {/* DEBUG INFO VISIBILE */}
            <div className="mb-4 p-2 bg-yellow-100 border rounded text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>IsPatientUser: {isPatientUser.toString()}</p>
              <p>CanPatientSign: {canPatientSign.toString()}</p>
              <p>Consent Status: {consent?.status}</p>
              <p>Has Patient Signature: {(!!consent?.patient_signature).toString()}</p>
            </div>
            
            {/* Paziente già ha firmato */}
            {consent.patient_signature ? (
              <div className="p-4 border rounded bg-green-50">
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
              </div>
            ) : (
              /* Paziente deve ancora firmare */
              <div className="space-y-4">
                {!isPatientUser ? (
                  <div className="text-center text-gray-500 py-6 border rounded bg-gray-50">
                    <p>In attesa della firma del paziente</p>
                    <p className="text-xs mt-2">User not recognized as patient</p>
                  </div>
                ) : !canPatientSign ? (
                  <div className="text-center text-gray-500 py-6 border rounded bg-gray-50">
                    <p>Il terapeuta deve firmare prima che tu possa firmare</p>
                    <p className="text-xs mt-2">Status: {consent?.status}</p>
                  </div>
                ) : (
                  /* Interface di firma per il paziente */
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 mb-3">Scegli come firmare:</p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => setSigningMode('type')}
                          className={`px-4 py-2 rounded border ${
                            signingMode === 'type' 
                              ? 'bg-emerald-600 text-white border-emerald-600' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          ✏️ Digita Nome
                        </button>
                        <button
                          onClick={() => setSigningMode('draw')}
                          className={`px-4 py-2 rounded border ${
                            signingMode === 'draw' 
                              ? 'bg-emerald-600 text-white border-emerald-600' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          ✍️ Disegna Firma
                        </button>
                      </div>
                    </div>

                    {signingMode === 'type' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Digita il tuo nome completo:
                        </label>
                        <input
                          type="text"
                          value={typedSignature}
                          onChange={(e) => setTypedSignature(e.target.value)}
                          placeholder="Il tuo nome completo"
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                        />
                        {typedSignature && (
                          <div className="mt-3 p-3 border rounded bg-gray-50 text-center">
                            <p className="text-sm text-gray-600 mb-2">Anteprima firma:</p>
                            <div className="text-2xl font-serif italic">{typedSignature}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {signingMode === 'draw' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Disegna la tua firma nel riquadro:
                        </label>
                        <div className="border rounded bg-white">
                          <canvas
                            ref={canvasRef}
                            width={400}
                            height={120}
                            className="w-full cursor-crosshair"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                          />
                        </div>
                        <button
                          onClick={clearSignature}
                          className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                          🗑️ Cancella firma
                        </button>
                      </div>
                    )}

                    {signingMode !== 'none' && (
                      <div className="pt-4 border-t">
                        <button
                          onClick={savePatientSignature}
                          disabled={signing}
                          className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
                        >
                          {signing ? 'Salvataggio in corso...' : '✅ Firma e Completa Consenso'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
