"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true, // gestisce il ritorno dal magic link
    flowType: "pkce",
  },
});

function Inner(): JSX.Element {
  const router = useRouter();
  const _searchParams = useSearchParams(); // richiesto da Next 15 → va wrappato in <Suspense>

  const [email, setEmail] = useState<string>("");
  const [pwd1, setPwd1] = useState<string>("");
  const [pwd2, setPwd2] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [done, setDone] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        if (!session) {
          setError(
            "Sessione non valida o scaduta. Apri il link ricevuto via email e riprova."
          );
          return;
        }
        const { data: userData } = await supabase.auth.getUser();
        if (alive && userData?.user?.email) setEmail(userData.user.email);
      } catch {
        setError("Errore nel recupero della sessione.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");

    if (!pwd1 || !pwd2) {
      setError("Inserisci e conferma la password.");
      return;
    }
    if (pwd1 !== pwd2) {
      setError("Le password non coincidono.");
      return;
    }
    if (pwd1.length < 8) {
      setError("La password deve avere almeno 8 caratteri.");
      return;
    }

    setLoading(true);
    try {
      const { error: updError } = await supabase.auth.updateUser({
        password: pwd1,
      });
      if (updError) {
        setError(updError.message || "Impossibile impostare la password.");
        setLoading(false);
        return;
      }
      setDone(true);
      router.replace("/app/paziente");
    } catch {
      setError("Errore imprevisto durante il salvataggio della password.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Imposta password</h1>
        <p>Caricamento…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Imposta password</h1>
        <p style={{ color: "crimson" }}>{error}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Password impostata</h1>
        <p>Reindirizzamento alla tua scheda…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1 style={{ marginBottom: 8 }}>Imposta password</h1>
      <p style={{ marginBottom: 16 }}>
        Utente: <b>{email || "—"}</b>
      </p>

      <form onSubmit={onSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label>
            Nuova password
            <input
              type="password"
              value={pwd1}
              onChange={(e) => setPwd1(e.target.value)}
              autoComplete="new-password"
              required
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            Conferma password
            <input
              type="password"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              autoComplete="new-password"
              required
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>

          {error ? <div style={{ color: "crimson" }}>{error}</div> : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 14px",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            Salva password
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Page(): JSX.Element {
  // Boundary richiesto da Next 15 quando si usa useSearchParams
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Caricamento…</div>}>
      <Inner />
    </Suspense>
  );
}
