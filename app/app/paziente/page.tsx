"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PazienteHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user || null;
      if (!user) {
        router.replace("/login"); // se non autenticato
        return;
      }
      setEmail(user.email ?? null);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-600">
        Caricamento…
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2 text-center">Area Paziente</h1>
        <p className="text-center text-sm text-gray-600 mb-6">
          Benvenuto{email ? `, ${email}` : ""}. Qui troverai piano, compiti e questionari.
        </p>

        <div className="grid gap-3">
          <a href="#" className="block rounded-lg border p-4 hover:bg-gray-50">
            <b>Piano terapeutico</b>
            <div className="text-sm text-gray-600">Obiettivi e attività assegnate</div>
          </a>
          <a href="#" className="block rounded-lg border p-4 hover:bg-gray-50">
            <b>Questionari</b>
            <div className="text-sm text-gray-600">Compila i test assegnati (es. GAD-7)</div>
          </a>
          <a href="#" className="block rounded-lg border p-4 hover:bg-gray-50">
            <b>Appuntamenti</b>
            <div className="text-sm text-gray-600">Prossime sedute e promemoria</div>
          </a>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 underline">Torna alla home</a>
        </div>
      </div>
    </div>
  );
}
