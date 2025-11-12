'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ConsentDocument = {
  id: string;
  patient_id: string;
  therapist_signature: string;
  therapist_signature_type: string;
  tessera_sanitaria_consent: boolean;
  status: string;
  created_at: string;
  patient_data_snapshot: any;
  therapist_data_snapshot: any;
};

export default function PatientConsentPage() {
  const params = useParams();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const token = params?.token as string;

  const [consent, setConsent] = useState<ConsentDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [patientSignature, setPatientSignature] = useState<string>('');
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('type');
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadConsentData();
  }, [token]);

  async function loadConsentData() {
    setLoading(true);
    setError(null);
    
    try {
      // Per ora usiamo il token come ID del consenso (dopo creiamo sistema token sicuro)
      const { data: consentData, error: consentError } = await supabase
        .from('consent_documents')
        .select(`
          *,
          patients!inner (
            display_name,
            email,
            birth_date,
            birth_place,
            address,
            city,
            postal_code,
            province,
            fiscal_code
          )
        `)
        .eq('id', token)
        .eq('status', 'therapist_signed')
        .single();

      if (consentError || !consentData) {
        setError('Consenso non trovato o già completato');
        return;
      }

      setConsent(consentData);
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

  async function savePatientSignature() {
    if (!consent) return;
    
    const signature = signatureType === 'type' 
      ? patientSignature 
      : getCanvasSignature();
    
    if (!signature) {
      alert('Inserisci la tua firma per completare il consenso');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('consent_documents')
        .update({
          patient_signature: signature,
          patient_signature_type: signatureType,
          patient_signed_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', consent.id);

      if (error) throw error;

      setCompleted(true);
    } catch (e: any) {
      alert('Errore: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <p className="text-lg">Caricamento consenso informato...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Errore</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-600 mt-4">
            Controlla che il link sia corretto o contatta il tuo terapeuta.
          </p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-semibold text-green-700 mb-4">Consenso Completato!</h2>
          <p className="text-green-600 mb-6">
            Hai firmato con successo il consenso informato.<br />
            Il documento è ora completo e archiviato.
          </p>
          <p className="text-sm text-gray-600">
            Riceverai una copia via email a breve.<br />
            Puoi chiudere questa pagina.
          </p>
        </div>
      </div>
    );
  }

  const patient = (consent as any)?.patients;
  const therapistData = consent?.therapist_data_snapshot;
  const patientData = consent?.patient_data_snapshot || patient;
  
  const today = new Date().toLocaleDateString('it-IT');
  const therapistFullAddress = therapistData?.address || '_____';
  const patientFullAddress = `${patientData?.address || '_____'} ${patientData?.postal_code || '_____'} ${patientData?.city || '_____'} (${patientData?.province || '__'})`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center py-6 bg-blue-50 rounded-lg">
        <h1 className="text-2xl font-bold text-blue-800">Consenso Informato</h1>
        <p className="text-blue-600 mt-2">
          Ciao <strong>{patientData?.display_name}</strong>, per favore rivedi il consenso e firma alla fine della pagina.
        </p>
      </div>

      {/* SEZIONE 1: CONSENSO INFORMATO */}
      <div className="bg-white border rounded-lg p-8">
        <h2 className="text-xl font-bold text-center mb-2">CONSENSO INFORMATO E PATTUIZIONE DEL COMPENSO</h2>
        <h3 className="text-lg font-bold text-center mb-2">ALL'ATTO DEL CONFERIMENTO DELL'INCARICO PROFESSIONALE</h3>
        <h4 className="text-lg font-bold text-center mb-8">PER PRESTAZIONI PSICOTERAPEUTICHE</h4>

        <div className="space-y-4 text-sm leading-relaxed">
          <div className="mb-6">
            <h5 className="font-semibold mb-3">Dati Paziente</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Nome: <strong>{patientData?.display_name || '_____'}</strong></div>
              <div>Nato a: <strong>{patientData?.birth_place || '_____'}</strong></div>
              <div>Il: <strong>{patientData?.birth_date ? new Date(patientData.birth_date).toLocaleDateString('it-IT') : '_____'}</strong></div>
              <div>Residente in: <strong>{patientData?.city || '_____'}</strong></div>
              <div>Via: <strong>{patientData?.address || '_____'}</strong></div>
              <div>Cap: <strong>{patientData?.postal_code || '_____'}</strong></div>
              <div>Mail: <strong>{patientData?.email || '_____'}</strong></div>
              <div>Codice Fiscale: <strong>{patientData?.fiscal_code || '_____'}</strong></div>
            </div>
          </div>

          <p>
            La sottoscritta dott.ssa <strong>{therapistData?.full_name}</strong>, iscritta all'Ordine degli Psicologi del Veneto con il n. <strong>{therapistData?.registration_number || '5363'}</strong> nell'elenco degli psicoterapeuti, 
            prima di svolgere la propria opera professionale a favore del sig./della sig.ra <strong>{patientData?.display_name}</strong>, lo/la informa di quanto segue:
          </p>

          <ul className="space-y-3 pl-4">
            <li>• la prestazione che ci si appresta ad eseguire consiste in una psicoterapia finalizzata a miglioramento delle capacità relazionali, aumento della consapevolezza e gestione del significato dei sintomi presentati, gestione dei conflitti, ecc;</li>
            <li>• la psicoterapia che sarà praticata è ad orientamento <strong>{therapistData?.therapeutic_orientation || 'Costruttivista'}</strong>;</li>
            <li>• esistono altri orientamenti psicoterapeutici oltre a quello sopra indicato;</li>
            <li>• la psicoterapia potrebbe in alcuni casi non produrre gli effetti desiderati dal cliente/paziente. In tal caso sarà cura del professionista informare adeguatamente il paziente e valutare se proporre un nuovo percorso di terapia oppure l'interruzione della stessa;</li>
            <li>• le prestazioni verranno rese presso lo studio <strong>{therapistFullAddress}</strong>, o in modalità online;</li>
            <li>• in qualsiasi momento il paziente potrà interrompere la psicoterapia. In tal caso, egli si impegna a comunicare al professionista la volontà di interruzione del rapporto professionale e si rende disponibile sin d'ora ad effettuare un ultimo incontro finalizzato alla sintesi del lavoro svolto;</li>
            <li>• lo psicologo è tenuto al rispetto del Codice Deontologico degli Psicologi Italiani che, tra l'altro, impone l'obbligo di segreto professionale, derogabile solo previo valido e dimostrabile consenso del paziente o nei casi assolutamente eccezionali previsti dalla Legge;</li>
            <li>• la durata dell'intervento è di <strong>{patientData?.session_duration_individual || '____'}</strong> minuti per la terapia individuale; <strong>{patientData?.session_duration_couple || '____'}</strong> minuti per la terapia di coppia, <strong>{patientData?.session_duration_family || '____'}</strong> minuti per le consulenze famigliari;</li>
            <li>• il compenso da corrispondere per ciascuna seduta è pari ad euro <strong>{patientData?.rate_individual || '____'}</strong> per le sedute individuali, euro <strong>{patientData?.rate_couple || '____'}</strong> per le sedute di coppia, euro <strong>{patientData?.rate_family || '____'}</strong> consulenza famigliare oltre ad un ulteriore 2% sul totale da destinarsi obbligatoriamente alla Cassa di previdenza ENPAP;</li>
            <li>• Le sedute vanno saldate contestualmente alla conclusione della stessa, salvo accordi diversi con la terapeuta. Gli appuntamenti possono essere disdettati 24 ore prima senza alcun addebito. Per gli appuntamenti del lunedì la disdetta senza addebito può essere fatta fino al venerdì, in caso contrario verrà addebitato il costo intero della seduta fissata;</li>
          </ul>

          <div className="my-6 p-4 bg-blue-50 rounded">
            <p>
              Il sig./la sig.ra <strong>{patientData?.display_name}</strong> nato/a a <strong>{patientData?.birth_place || '_____'}</strong> il <strong>{patientData?.birth_date ? new Date(patientData.birth_date).toLocaleDateString('it-IT') : '_____'}</strong> e residente a <strong>{patientFullAddress}</strong> 
              avendo ricevuto l'informativa di cui sopra ed essendo stato posto a conoscenza degli estremi della polizza assicurativa stipulata dal professionista (CAMPI, n. polizza <strong>{therapistData?.insurance_policy || '_____'}</strong>), dichiara:
            </p>

            <ul className="space-y-2 pl-4 mt-4">
              <li>• di avere adeguatamente compreso i termini dell'intervento come sopra sintetizzati e di accettare l'intervento concordato con la dott.ssa <strong>{therapistData?.full_name}</strong>;</li>
              <li>• di aver pattuito il compenso come da preventivo sopra indicato, da intendersi comprensivo di tutti gli oneri ipotizzabili dal momento del conferimento fino alla conclusione dell'incarico ai sensi della Legge 4 Agosto 2017 n. 124.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SEZIONE 2: INFORMATIVA TRATTAMENTO DATI */}
      <div className="bg-white border rounded-lg p-8">
        <h3 className="text-xl font-bold text-center mb-8">INFORMATIVA TRATTAMENTO DEI DATI PERSONALI<br />(ART. 13 e14 REG. UE 2016/679)</h3>

        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            La dott.ssa <strong>{therapistData?.full_name}</strong>, in qualità di titolare del trattamento dei Suoi dati personali, presterà particolare attenzione alla tutela della Sua riservatezza. 
            In particolare, ai sensi dell'articolo art. 13 e14 REG. UE 2016/679, desidera fornirle le seguenti informazioni:
          </p>

          <p>
            I dati personali, anche particolari, sanitari o giudiziari, da Lei forniti o raccolti nel corso dell'incarico, saranno trattati nel pieno rispetto dei Suoi diritti, 
            delle libertà fondamentali, nonché della dignità, con particolare riferimento alla Sua riservatezza, all'identità personale e al diritto alla protezione dei dati stessi.
          </p>

          <p>Tutti i dati forniti e raccolti sono trattati esclusivamente per poter effettuare l'attività professionale di terapia psicoterapica.</p>

          <p>
            Alcuni dati ed informazioni potrebbero dover essere comunicati alle Autorità Sanitarie e/o Giudiziarie, esclusivamente sulla base di precisi obblighi di legge. 
            Previo suo consenso alcuni dati saranno trasmessi all'Agenzia delle Entrate, tramite Sistema Tessera Sanitaria, ai fini dell'elaborazione del mod.730/UNICO precompilato.
          </p>

          <div className="mt-6 p-4 border rounded bg-yellow-50">
            <h5 className="font-semibold mb-3">Scelta già effettuata dal terapeuta per la trasmissione dati fiscali:</h5>
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
        <h4 className="text-xl font-semibold mb-6 text-center">Firme</h4>
        
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h5 className="font-semibold mb-3">Firma del Terapeuta (già firmato):</h5>
            <div className="p-4 border rounded bg-green-50">
              {consent?.therapist_signature_type === 'type' ? (
                <div className="text-xl font-serif italic text-center">
                  {consent?.therapist_signature}
                </div>
              ) : (
                <img 
                  src={consent?.therapist_signature} 
                  alt="Firma terapeuta" 
                  className="max-h-20 mx-auto"
                />
              )}
              <p className="text-xs text-center text-gray-500 mt-2">
                Firmato il {new Date(consent?.created_at || '').toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>

          <div>
            <h5 className="font-semibold mb-3">La tua firma:</h5>
            
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
                    value={patientSignature} 
                    onChange={(e) => setPatientSignature(e.target.value)}
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

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Data e Luogo: <strong>{therapistData?.city}, {today}</strong>
          </p>
          
          <button 
            onClick={savePatientSignature}
            disabled={saving || (!patientSignature && signatureType === 'type')}
            className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Salvando la tua firma...' : '✅ Firma e Completa il Consenso'}
          </button>
          
          <p className="text-xs text-gray-500 mt-3">
            Firmando accetti tutte le condizioni sopra indicate
          </p>
        </div>
      </div>
    </div>
  );
}
