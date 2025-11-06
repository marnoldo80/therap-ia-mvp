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
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [therapeuticOrientation, setTherapeuticOrientation] = useState("Costruttivista");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [hasCode, setHasCode] = useState(false);

  useEffect(() => {
    (async () => {
      await new Promise(r => setTimeout(r, 500));
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return router.replace("/login");
      }

      const { data: rows, error } = await supabase
        .from("therapists")
        .select("full_name, address, vat_number, customer_code, registration_number, therapeutic_orientation, insurance_policy")
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
        setRegistrationNumber(rows.registration_number || "");
        setTherapeuticOrientation(rows.therapeutic_orientation || "Costruttivista");
        setInsurancePolicy(rows.insurance_policy || "");
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
          registration_number: registrationNumber,
          therapeutic_orientation: therapeuticOrientation,
          insurance_policy: insurancePolicy,
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
      <div className="max-w-2xl mx-auto p-6">
        <p>Caricamento...</p>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Completa il tuo profilo</h1>
      
      {hasCode && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
          ✓ Codice cliente assegnato
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nome completo *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Es: Dott.ssa Alessandra Berto"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Indirizzo studio *
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Es: Via Angeli 33/c, Rovigo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Partita IVA *
          </label>
          <input
            type="text"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Es: 12345678901"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Numero iscrizione Ordine Psicologi *
          </label>
          <input
            type="text"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Es: 5363"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Orientamento terapeutico *
          </label>
          <input
            type="text"
            value={therapeuticOrientation}
            onChange={(e) => setTherapeuticOrientation(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Es: Costruttivista, Cognitivo-Comportamentale, ecc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Polizza assicurativa *
          </label>
          <input
            type="text"
            value={insurancePolicy}
            onChange={(e) => setInsurancePolicy(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Es: CAMPI, n. polizza 425840"
          />
        </div>

        {err && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {loading ? "Salvataggio..." : "Salva e continua"}
        </button>
      </form>
    </main>
  );
}
