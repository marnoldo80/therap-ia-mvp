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
  const therapistFullAddress = `${therapist?.address}, ${therapist?.city} (${therapist?.province}) ${therapist?.postal_code}`;
  const patientFullAddress = `${patient?.address || '_____'}, ${patient?.city || '_____'} (${patient?.province || '__'}) ${patient?.postal_code || '_____'}`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-4">
        <Link href={`/app/therapist/pazienti/${patientId}`} className="text-blue-600 hover:underline">
          ← Torna alla scheda paziente
        </Link>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">CONSENSO INFORMATO</h1>
        <h2 className="text-lg font-semibold text-center mb-8">
          All'atto del conferimento dell'incarico professionale per prestazioni psicoterapeutiche
        </h2>

        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            La sottoscritta dott.ssa <strong>{therapist?.full_name}</strong>, iscritta all'Ordine degli Psicologi del Veneto con il n. <strong>{therapist?.registration_number}</strong>, 
            orientamento <strong>{therapist?.therapeutic_orientation}</strong>, codice fiscale <strong>{therapist?.tax_code}</strong>, 
            partita IVA <strong>{therapist?.vat_number}</strong>, prima di svolgere la propria opera professionale a favore del sig./della sig.ra <strong>{patient?.display_name}</strong>, 
            lo/la informa di quanto segue:
          </p>

          <ul className="space-y-2 pl-4">
            <li>• la prestazione consiste in una psicoterapia finalizzata al miglioramento delle capacità relazionali, dell'autoconsapevolezza e della gestione del significato dei sintomi presentati;</li>
            <li>• la psicoterapia sarà praticata ad orientamento <strong>{therapist?.therapeutic_orientation}</strong>;</li>
            <li>• esistono altri orientamenti psicoterapeutici oltre a quello sopra indicato;</li>
            <li>• la psicoterapia potrebbe in alcuni casi non produrre gli effetti desiderati dal paziente; in tal caso sarà cura del professionista informare adeguatamente il paziente e valutare l'opportunità di proseguire o interrompere il percorso;</li>
            <li>• le prestazioni verranno rese presso lo studio sito in <strong>{therapistFullAddress}</strong>, o in modalità online;</li>
            <li>• in qualsiasi momento il paziente potrà interrompere la psicoterapia, previa comunicazione al professionista e previo incontro di chiusura;</li>
            <li>• lo psicologo è tenuto al rispetto del Codice Deontologico degli Psicologi Italiani, che impone l'obbligo di segreto professionale;</li>
            <li>• la durata dell'intervento è di <strong>{patient?.session_duration_individual || 45}</strong> minuti per la terapia individuale, <strong>{patient?.session_duration_couple || 60}</strong> minuti per la terapia di coppia, <strong>{patient?.session_duration_family || 75}</strong> minuti per la consulenza familiare;</li>
            <li>• il compenso per ciascuna seduta è di Euro <strong>{patient?.rate_individual || 90}</strong> per sedute individuali, Euro <strong>{patient?.rate_couple || 130}</strong> per sedute di coppia, Euro <strong>{patient?.rate_family || 150}</strong> per sedute familiari, oltre al 2% ENPAP e agli eventuali oneri di legge;</li>
            <li>• le sedute vanno saldate al termine della stessa; eventuali disdette vanno comunicate con almeno 24 ore di anticipo (48 ore per appuntamenti fissati di lunedì), in caso contrario verrà addebitato l'intero importo;</li>
            <li>• il presente incarico è basato su un numero presuntivo di incontri, suscettibile di variazioni in base all'andamento del percorso, previo accordo tra le parti.</li>
          </ul>

          <p>
            Il/la sig./sig.ra <strong>{patient?.display_name}</strong>, nato/a a <strong>{patient?.birth_place || '_____'}</strong> il <strong>{patient?.birth_date ? new Date(patient.birth_date).toLocaleDateString('it-IT') : '_____'}</strong>, 
            codice fiscale <strong>{patient?.fiscal_code || '_____'}</strong>, residente a <strong>{patientFullAddress}</strong>, 
            avendo ricevuto le informazioni di cui sopra e preso visione della polizza assicurativa n. <strong>{therapist?.insurance_policy}</strong>, dichiara:
          </p>

          <ul className="space-y-2 pl-4">
            <li>• di aver compreso i termini dell'intervento e di accettare quanto concordato con la dott.ssa <strong>{therapist?.full_name}</strong>;</li>
            <li>• di aver pattuito il compenso come sopra indicato;</li>
            <li>• di impegnarsi al rispetto delle modalità di disdetta previste.</li>
          </ul>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-4">INFORMATIVA TRATTAMENTO DATI PERSONALI (Art. 13 e 14 Reg. UE 2016/679)</h3>
          <div className="text-sm space-y-2">
            <p>La dott.ssa <strong>{therapist?.full_name}</strong>, in qualità di titolare del trattamento, informa che i dati personali, anche particolari o sensibili, saranno trattati nel pieno rispetto dei diritti, delle libertà fondamentali e della dignità del paziente, nel rispetto della riservatezza e delle normative vigenti.</p>
            <p>I dati raccolti saranno trattati esclusivamente per lo svolgimento dell'attività professionale psicoterapeutica, anche mediante strumenti informatici.</p>
            <p>I dati potranno essere comunicati ad autorità competenti solo nei casi previsti dalla legge o, previo consenso, trasmessi all'Agenzia delle Entrate tramite Sistema Tessera Sanitaria ai fini fiscali.</p>
          </div>
        </div>

        <div className="mt-6 p-4 border rounded">
          <h4 className="font-semibold mb-3">Scelta trasmissione dati fiscali (Sistema Tessera Sanitaria):</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                checked={tesseraSanitariaConsent === true} 
                onChange={() => setTesseraSanitariaConsent(true)} 
              />
              <span>☑ Autorizzo la trasmissione dei dati al Sistema Tessera Sanitaria</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                checked={tesseraSanitariaConsent === false} 
                onChange={() => setTesseraSanitariaConsent(false)} 
              />
              <span>☑ Non autorizzo la trasmissione dei dati al Sistema Tessera Sanitaria</span>
            </label>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <p className="font-medium mb-2">Luogo: <strong>{therapist?.city}</strong></p>
            <p className="font-medium mb-4">Data: <strong>{today}</strong></p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Firma del paziente: (in attesa)</p>
            <div className="h-16 border border-gray-300 rounded bg-gray-50 flex items-center justify-center text-gray-500">
              Il paziente firmerà dopo di te
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 border rounded">
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
                  width={400}
                  height={150}
                  className="border border-gray-300 rounded cursor-crosshair bg-white"
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
