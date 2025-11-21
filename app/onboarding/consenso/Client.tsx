'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Client() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<'verifying'|'verified'|'error'>('verifying');
  const [msg, setMsg] = useState('Verifica in corso…');
  const [tesseraConsent, setTesseraConsent] = useState<'autorizzo'|'non_autorizzo'|null>(null);
  const [downloading, setDownloading] = useState(false);

  const patientId = searchParams.get('patientId') ?? '';

  useEffect(() => {
    (async () => {
      try {
        // 1) Caso token in fragment (#access_token / #refresh_token)
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const h = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        const access_token = h.get('access_token');
        const refresh_token = h.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          setStatus('verified');
          setMsg('Accesso verificato.');
          return;
        }

        // 2) verifyOtp con ?token_hash (o ?token) & type
        const token_hash = searchParams.get('token_hash') || searchParams.get('token');
        const type = (searchParams.get('type') || 'magiclink') as
          | 'magiclink' | 'recovery' | 'invite' | 'signup' | 'email_change';

        if (token_hash) {
          const supaType = type === 'invite' ? 'invite' : 'email'; // supabase usa 'email' per magiclink/recovery
          const { error } = await supabase.auth.verifyOtp({ type: supaType as any, token_hash });
          if (error) throw error;
          setStatus('verified');
          setMsg('Accesso verificato.');
          return;
        }

        setStatus('error');
        setMsg('Link non valido. Riapri il link dalla mail.');
      } catch (e: any) {
        console.error(e);
        setStatus('error');
        setMsg('Errore durante la verifica. Riapri il link dalla mail.');
      }
    })();
  }, [searchParams]);

  async function handleDownloadPDF() {
    if (!patientId) {
      setMsg('Manca il patientId nell’URL (?patientId=...).');
      return;
    }
    if (!tesseraConsent) {
      setMsg('Seleziona una delle due opzioni: Autorizzo / Non autorizzo.');
      return;
    }
    try {
      setDownloading(true);
      const res = await fetch('/api/generate-consent-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          tesseraSanitariaConsent: tesseraConsent === 'autorizzo'
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Errore generazione PDF');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'consenso_informato.pdf';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
      setMsg('PDF generato.');
    } catch (e: any) {
      setMsg(e.message || 'Errore durante il download del PDF.');
    } finally {
      setDownloading(false);
    }
  }

  function handleContinue() {
    router.replace('/onboarding/cambia-password');
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-3">Onboarding paziente</h1>

      {status !== 'verified' ? (
        <>
          <p className="mb-4">{msg}</p>
        </>
      ) : (
        <>
          <p className="mb-4">Accesso verificato. Completa la scelta per la trasmissione dati fiscali.</p>

          {!patientId && (
            <div className="mb-4 text-sm text-red-600">
              Attenzione: manca <code>?patientId=...</code> nell’URL. Il PDF non potrà essere generato.
            </div>
          )}

          <div className="mb-5 space-y-3">
            <div className="font-medium">Scelta trasmissione dati (Sistema Tessera Sanitaria)</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ts-consent"
                value="autorizzo"
                checked={tesseraConsent === 'autorizzo'}
                onChange={() => setTesseraConsent('autorizzo')}
              />
              <span>Autorizzo la trasmissione dei dati</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ts-consent"
                value="non_autorizzo"
                checked={tesseraConsent === 'non_autorizzo'}
                onChange={() => setTesseraConsent('non_autorizzo')}
              />
              <span>Non autorizzo la trasmissione dei dati</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              onClick={handleDownloadPDF}
              disabled={downloading || !patientId}
            >
              {downloading ? 'Generazione…' : 'Scarica consenso PDF'}
            </button>

            <button
              className="px-4 py-2 rounded border"
              onClick={handleContinue}
            >
              Continua (imposta password)
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-600">{msg}</p>
        </>
      )}
    </div>
  );
}

