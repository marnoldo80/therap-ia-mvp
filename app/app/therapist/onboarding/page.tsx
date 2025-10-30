"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export default function Page() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [vat, setVat] = useState("");
  const [hasCode, setHasCode] = useState(false);

  useEffect(() => {
    (async () => {
      // Attendi un momento per dare tempo alla sessione di essere salvata
      await new Promise(r => setTimeout(r, 500));
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('Nessun utente trovato, redirect a login');
        return router.replace("/login");
      }

      // carica eventuali dati già presenti
      const { data: rows, error } = await supabase
        .from("therapists")
        .select("full_name,address,vat_number,customer_code")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error(error);
        setErr("Errore nel caricamento dei dati");
        setLoading(false);
        return;
      }

      if (rows) {
        setFullName(rows.full_name || "");
        setAddress(rows.address || "");
        setVat(rows.vat_number || "");
        setHasCode(!!rows.customer_code);
      }
      setLoading(false);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessione scaduta");

      const { error } = await supabase
        .from("therapists")
        .update({
          full_name: fullName,
          address: address,
          vat_number: vat,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      router.push("/app/therapist");
    } catch (e: any) {
      setErr(e?.message ?? "Errore nel salvataggio");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", padding: 20 }}>
        <p>Caricamento...</p>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 20 }}>
      <h1>Completa il tuo profilo</h1>
      {hasCode && <p style={{ color: "green", fontSize: 14 }}>✓ Codice assegnato</p>}
      <form onSubmit={handleSave} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          Nome completo
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
        </label>
        <label>
          Indirizzo
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
        </label>
        <label>
          Partita IVA
          <input
            type="text"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            required
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
        </label>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #333" }}
        >
          {loading ? "Salvataggio..." : "Salva e continua"}
        </button>
      </form>
    </main>
  );
}
