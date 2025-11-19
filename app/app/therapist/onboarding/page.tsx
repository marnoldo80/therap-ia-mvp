"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [taxCode, setTaxCode] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [province, setProvince] = useState("");
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
        .select("full_name, address, vat_number, customer_code, registration_number, therapeutic_orientation, insurance_policy, tax_code, city, postal_code, province")
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
        setTaxCode(rows.tax_code || "");
        setCity(rows.city || "");
        setPostalCode(rows.postal_code || "");
        setProvince(rows.province || "");
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
          tax_code: taxCode,
          city: city,
          postal_code: postalCode,
          province: province,
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
        <p style={{ color: 'white' }}>Caricamento...</p>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      {/* Back to Dashboard Button */}
      <div className="mb-6">
        <Link 
          href="/app/therapist"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6" style={{ color: 'white' }}>
        Completa il tuo profilo
      </h1>
      
      {hasCode && (
        <div className="mb-4 p-3 rounded" style={{
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#86efac'
        }}>
          ✓ Codice cliente assegnato
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Nome completo *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg outline-none transition-colors duration-300"
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            placeholder="Es: Dott.ssa Alessandra Berto"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Codice Fiscale *
          </label>
          <input
            type="text"
            value={taxCode}
            onChange={(e) => setTaxCode(e.target.value.toUpperCase())}
            required
            className="w-full px-3 py-2 rounded-lg outline-none transition-colors duration-300"
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            placeholder="Es: BRTLSS80A01H501Z"
            maxLength={16}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Indirizzo studio *
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg outline-none transition-colors duration-300"
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            placeholder="Es: Via Angeli 33/c"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
              Città *
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg outline-none transition-colors duration-300"
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
              placeholder="Es: Rovigo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
              CAP *
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg outline-none transition-colors duration-300"
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
              placeholder="Es: 45100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
              Provincia *
            </label>
            <input
              type="text"
              value={province}
              onChange={(e) => setProvince(e.target.value.toUpperCase())}
              required
              className="w-full px-3 py-2 rounded-lg outline-none transition-colors duration-300"
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
              placeholder="Es: RO"
              maxLength={2}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Partita IVA *
          </label>
          <input
            type="text"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg outline-none transition-colors duration-300"
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            placeholder="Es: 12345678901"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Numero iscrizione Ordine Psicologi *
          </label>
          <input
            type="text"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg outline-none transition-colors duration-300"
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            placeholder="Es: 5363"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Orientamento terapeutico *
          </label>
          <input
            type="text"
            value={therapeuticOrientation}
            onChange={(e) => setTherapeuticOrientation(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg outline-none transition-colors duration-300"
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            placeholder="Es: Costruttivista, Cognitivo-Comportamentale, ecc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Polizza assicurativa *
          </label>
          <input
            type="text"
            value={insurancePolicy}
            onChange={(e) => setInsurancePolicy(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg outline-none transition-colors duration-300"
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            placeholder="Es: CAMPI, n. polizza 425840"
          />
        </div>

        {err && (
          <div className="p-3 rounded" style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5'
          }}>
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-300"
          style={{
            backgroundColor: loading ? '#4b5563' : '#7aa2ff',
            color: '#0b1022',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 20px rgba(122, 162, 255, 0.25)',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Salvataggio..." : "Salva e continua"}
        </button>
      </form>
    </main>
  );
}
