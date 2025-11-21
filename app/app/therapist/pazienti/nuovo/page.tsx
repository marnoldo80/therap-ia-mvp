"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewPatientPage() {
  const router = useRouter();
  
  // Campi esistenti
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [issues, setIssues] = useState("");
  const [goals, setGoals] = useState("");
  
  // Nuovi campi necessari per consenso
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [province, setProvince] = useState("");
  
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [medico, setMedico] = useState("");

  useEffect(() => {
    (async () => {
      await new Promise(r => setTimeout(r, 500));
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) router.replace("/login");
    })();
  }, [router]);

  async function createPatient() {
    setMsg(null); setErr(null); setLoading(true);
    
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) throw new Error("Sessione non valida.");

      const { data, error } = await supabase
        .from("patients")
        .insert({
          display_name: displayName || null,
          email: email || null,
          phone: phone || null,
          issues: issues || null,
          goals: goals || null,
          birth_date: birthDate || null,
          birth_place: birthPlace || null,
          fiscal_code: fiscalCode || null,
          address: address || null,
          city: city || null,
          postal_code: postalCode || null,
          province: province || null,
          therapist_user_id: u.user.id,
          medico_mmg: medico || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      setMsg("Paziente creato con successo!");
      setTimeout(() => {
        router.push(`/app/therapist/pazienti/${data.id}`);
      }, 1000);
    } catch (e:any) {
      setErr(e?.message || "Errore creazione paziente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Solo Dashboard Button */}
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
      
      <h1 className="text-2xl font-semibold mb-4" style={{ color: 'white' }}>
        Nuovo paziente
      </h1>
      
      {msg && (
        <div className="mb-4 rounded px-4 py-3" style={{
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#86efac'
        }}>
          {msg}
        </div>
      )}
      
      {err && (
        <div className="mb-4 rounded px-4 py-3" style={{
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5'
        }}>
          {err}
        </div>
      )}
      
      <div className="rounded p-4 space-y-4" style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
              Nome e Cognome *
            </label>
            <input 
              className="w-full rounded px-3 py-2 outline-none transition-colors duration-300" 
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
              value={displayName} 
              onChange={e=>setDisplayName(e.target.value)}
              placeholder="Mario Rossi" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
              Data di nascita
            </label>
            <input 
              type="date"
              className="w-full rounded px-3 py-2 outline-none transition-colors duration-300" 
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
              value={birthDate} 
              onChange={e=>setBirthDate(e.target.value)} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Luogo di nascita
          </label>
          <input 
            className="w-full rounded px-3 py-2 outline-none transition-colors duration-300" 
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            value={birthPlace} 
            onChange={e=>setBirthPlace(e.target.value)}
            placeholder="Roma" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
              Email *
            </label>
            <input 
              type="email"
              className="w-full rounded px-3 py-2 outline-none transition-colors duration-300" 
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
              value={email} 
              onChange={e=>setEmail(e.target.value)}
              placeholder="mario.rossi@email.com" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
              Telefono
            </label>
            <input 
              className="w-full rounded px-3 py-2 outline-none transition-colors duration-300" 
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
              value={phone} 
              onChange={e=>setPhone(e.target.value)}
              placeholder="+39 123 456 7890" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Codice Fiscale
          </label>
          <input 
            className="w-full rounded px-3 py-2 outline-none transition-colors duration-300" 
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            value={fiscalCode} 
            onChange={e=>setFiscalCode(e.target.value.toUpperCase())}
            placeholder="RSSMRA80A01H501Z"
            maxLength={16} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Medico Mmg
          </label>
          <input 
            className="w-full rounded px-3 py-2 outline-none transition-colors duration-300" 
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            value={medico} 
            onChange={e=>setMedico(e.target.value)}
            placeholder="Dr. Mario Rossi" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Indirizzo
          </label>
          <input 
            className="w-full rounded px-3 py-2 outline-none transition-colors duration-300" 
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            value={address} 
            onChange={e=>setAddress(e.target.value)}
            placeholder="Via Roma 123" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
              Città
            </label>
            <input 
              className="w-full rounded px-3 py-2 outline-none transition-colors duration-300" 
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
              value={city} 
              onChange={e=>setCity(e.target.value)}
              placeholder="Roma" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
              CAP
            </label>
            <input 
              className="w-full rounded px-3 py-2 outline-none transition-colors duration-300" 
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
              value={postalCode} 
              onChange={e=>setPostalCode(e.target.value)}
              placeholder="00100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
              Provincia
            </label>
            <input 
              className="w-full rounded px-3 py-2 outline-none transition-colors duration-300" 
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
              onBlur={(e) => e.target.style.borderColor = '#26304b'}
              value={province} 
              onChange={e=>setProvince(e.target.value.toUpperCase())}
              placeholder="RM"
              maxLength={2} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Problemi/Sintomi
          </label>
          <textarea 
            className="w-full min-h-[110px] rounded px-3 py-2 outline-none transition-colors duration-300" 
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            value={issues} 
            onChange={e=>setIssues(e.target.value)}
            placeholder="Descrivi i problemi o sintomi del paziente..." 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
            Obiettivi terapeutici
          </label>
          <textarea 
            className="w-full min-h-[110px] rounded px-3 py-2 outline-none transition-colors duration-300" 
            style={{
              backgroundColor: '#0b0f1c',
              border: '2px solid #26304b',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7aa2ff'}
            onBlur={(e) => e.target.style.borderColor = '#26304b'}
            value={goals} 
            onChange={e=>setGoals(e.target.value)}
            placeholder="Obiettivi del percorso terapeutico..." 
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            onClick={createPatient} 
            disabled={loading || !displayName} 
            className="px-6 py-3 rounded font-medium transition-all duration-300"
            style={{
              backgroundColor: loading ? '#4b5563' : '#7aa2ff',
              color: '#0b1022',
              border: 'none',
              cursor: loading || !displayName ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px rgba(122, 162, 255, 0.25)',
              opacity: (loading || !displayName) ? 0.7 : 1
            }}
          >
            {loading ? "Creazione in corso..." : "Crea paziente"}
          </button>
        </div>
      </div>
    </div>
  );
}
