"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [vat, setVat] = useState("");
  const [hasCode, setHasCode] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) return router.replace("/login");

      // carica eventuali dati già presenti
      const { data: rows, error } = await supabase
        .from("therapists")
        .select("full_name,address,vat_number,customer_code")
        .eq("user_id", user.id)
        .limit(1);

      if (error) setErr(error.message);
      const t = rows?.[0];
      if (t) {
        setFullName(t.full_name ?? "");
        setAddress(t.address ?? "");
        setVat(t.vat_number ?? "");
        setHasCode(!!t.customer_code);
      }
      setLoading(false);
    })();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) throw new Error("Sessione scaduta");

      // aggiorna dati + genera customer_code se mancante
      const { error } = await supabase.rpc("exec_onboarding_update", {
        p_user_id: user.id,
        p_full_name: fullName,
        p_address: address,
        p_vat: vat,
      });
      if (error) throw error;

      router.replace("/app/therapist");
    } catch (e:any) {
      setErr(e?.message ?? "Errore salvataggio");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <main style={{maxWidth:680,margin:"40px auto",padding:20}}>Caricamento…</main>;

  return (
    <main style={{maxWidth:680,margin:"40px auto",padding:20}}>
      <h1>Onboarding Terapeuta</h1>
      {!hasCode && <p style={{color:"#b45309",marginTop:8}}>Completa i dati: genereremo il tuo Codice Cliente.</p>}
      {err && <p style={{color:"crimson"}}>{err}</p>}

      <form onSubmit={handleSave} style={{display:"grid",gap:12,marginTop:16}}>
        <label>Nome e Cognome
          <input value={fullName} onChange={e=>setFullName(e.target.value)} required
                 style={{width:"100%",padding:8,border:"1px solid #ccc",borderRadius:6}} />
        </label>
        <label>Indirizzo
          <input value={address} onChange={e=>setAddress(e.target.value)}
                 style={{width:"100%",padding:8,border:"1px solid #ccc",borderRadius:6}} />
        </label>
        <label>Partita IVA
          <input value={vat} onChange={e=>setVat(e.target.value)}
                 style={{width:"100%",padding:8,border:"1px solid #ccc",borderRadius:6}} />
        </label>

        <button type="submit" style={{padding:"10px 14px",borderRadius:8,border:"1px solid #333"}}>
          Salva e vai in Dashboard
        </button>
      </form>
    </main>
  );
}
