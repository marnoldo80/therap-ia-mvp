"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Therapist = { customer_code: string | null; email: string | null; full_name?: string | null; };

export default function Page() {
  const router = useRouter();
  const [me, setMe] = useState<{ email: string | null } | null>(null);
  const [t, setT] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) { router.replace("/login"); return; }
      setMe({ email: user.email ?? null });

      const { data: rows } = await supabase
        .from("therapists")
        .select("customer_code,email,full_name")
        .eq("user_id", user.id)
        .limit(1);

      setT(rows?.[0] ?? null);
      setLoading(false);
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) return <main style={{maxWidth:720,margin:"40px auto",padding:20}}>Caricamento…</main>;

  return (
    <main style={{maxWidth:720,margin:"40px auto",padding:20}}>
      <h1>Dashboard Terapeuta</h1>
      <p style={{marginTop:8}}>Email: <b>{me?.email ?? "—"}</b></p>
      {t?.customer_code
        ? <p style={{marginTop:8}}>Codice cliente: <b>{t.customer_code}</b></p>
        : <p style={{marginTop:8,color:"#b45309"}}>Completa l’<a href="/app/therapist/onboarding">onboarding</a> per ottenere il codice cliente.</p>
      }

      <div style={{marginTop:24,display:"flex",gap:16,flexWrap:"wrap"}}>
        <a href="/app/therapist/pazienti" style={{border:"1px solid #222",padding:"10px 14px",borderRadius:8,textDecoration:"none"}}>
          👤 Lista pazienti
        </a>
        <a href="/app/therapist/schemi" style={{border:"1px solid #222",padding:"10px 14px",borderRadius:8,textDecoration:"none"}}>
          📄 Schemi
        </a>
        <a href="/app/therapist/onboarding" style={{border:"1px solid #222",padding:"10px 14px",borderRadius:8,textDecoration:"none"}}>
          ⚙️ Modifica dati / Onboarding
        </a>
        <button onClick={logout} style={{border:"1px solid #222",padding:"10px 14px",borderRadius:8,cursor:"pointer"}}>
          Logout
        </button>
      </div>
    </main>
  );
}
