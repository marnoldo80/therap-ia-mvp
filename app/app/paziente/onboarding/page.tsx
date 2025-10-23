"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PazienteOnboarding() {
  const sp = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<"loading"|"ready"|"error">("loading");
  const [message, setMessage] = useState<string>("Verifica del link in corso…");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const errorDesc = sp.get("error_description");
        if (errorDesc) {
          setStatus("error");
          setMessage(errorDesc);
          return;
        }

        // Il link di Supabase porta un ?code=...: scambiamo il codice per una sessione.
        const code = sp.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        }

        // Ora verifichiamo se c'è un utente autenticato
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setEmail(data.user.email || "");
          setStatus("ready");
          setMessage("Accesso confermato. Puoi procedere.");
        } else {
          // Nessuna sessione attiva (es. link scaduto): invitiamo al login
          setStatus("ready");
          setMessage("Link verificato. Se richiesto, effettua l’accesso.");
        }
      } catch (e:any) {
        setStatus("error");
        setMessage(e?.message || "Errore nella verifica del link.");
      }
    })();
  }, [sp]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <div className="text-center space-y-2 mb-4">
          <h1 className="text-2xl font-semibold">Benvenuto in Therap-IA</h1>
          <p className="text-sm text-gray-600">
            {message}
          </p>
          {email ? (
            <p className="text-xs text-gray-500">Email: <b>{email}</b></p>
          ) : null}
        </div>

        {status === "loading" && (
          <div className="text-center text-sm text-gray-500">Attendere…</div>
        )}

        {status !== "loading" && (
          <div className="flex flex-col gap-3">
            {/* Quando avremo la dashboard paziente, sostituiamo "/" con la sua rotta */}
            <button
              onClick={() => router.push("/")}
              className="w-full rounded-md bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
            >
              Continua
            </button>

            <Link
              href="/login"
              className="w-full text-center rounded-md border px-4 py-2 hover:bg-gray-50"
            >
              Accedi con email e password
            </Link>

            <p className="text-[12px] text-gray-500 text-center mt-1">
              Se il link risultasse scaduto, chiedi al terapeuta di inviartene uno nuovo.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
            Problema con il link. Prova ad accedere dalla pagina di login oppure chiedi
            un nuovo invito al terapeuta.
          </div>
        )}
      </div>
    </div>
  );
}
