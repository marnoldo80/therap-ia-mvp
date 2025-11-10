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
  const [fiscalCode, setFiscalCode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [province, setProvince] = useState("");
  
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

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
    therapist_user_id: u.user.id,
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
      <div className="mb-4 flex gap-3">
        <Link href="/app/therapist" className="text-blue-600 hover:underline">← Dashboard</Link>
        <Link href="/app/therapist/pazienti" className="text-blue-600 hover:underline">Lista pazienti</Link>
      </div>
      
      <h1 className="text-2xl font-semibold mb-4">Nuovo paziente</h1>
      
      {msg && <div className="mb-4 rounded bg-green-50 text-green-700 px-4 py-3">{msg}</div>}
      {err && <div className="mb-4 rounded bg-red-50 text-red-700 px-4 py-3">{err}</div>}
      
      <div className="rounded border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome e Cognome *</label>
            <input 
              className="w-full rounded border px-3 py-2" 
              value={displayName} 
              onChange={e=>setDisplayName(e.target.value)}
              placeholder="Mario Rossi" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data di nascita</label>
            <input 
              type="date"
              className="w-full rounded border px-3 py-2" 
              value={birthDate} 
              onChange={e=>setBirthDate(e.target.value)} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input 
              type="email"
              className="w-full rounded border px-3 py-2" 
              value={email} 
              onChange={e=>setEmail(e.target.value)}
              placeholder="mario.rossi@email.com" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefono</label>
            <input 
              className="w-full rounded border px-3 py-2" 
              value={phone} 
              onChange={e=>setPhone(e.target.value)}
              placeholder="+39 123 456 7890" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Codice Fiscale</label>
          <input 
            className="w-full rounded border px-3 py-2" 
            value={fiscalCode} 
            onChange={e=>setFiscalCode(e.target.value.toUpperCase())}
            placeholder="RSSMRA80A01H501Z"
            maxLength={16} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Indirizzo</label>
          <input 
            className="w-full rounded border px-3 py-2" 
            value={address} 
            onChange={e=>setAddress(e.target.value)}
            placeholder="Via Roma 123" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Città</label>
            <input 
              className="w-full rounded border px-3 py-2" 
              value={city} 
              onChange={e=>setCity(e.target.value)}
              placeholder="Roma" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CAP</label>
            <input 
              className="w-full rounded border px-3 py-2" 
              value={postalCode} 
              onChange={e=>setPostalCode(e.target.value)}
              placeholder="00100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Provincia</label>
            <input 
              className="w-full rounded border px-3 py-2" 
              value={province} 
              onChange={e=>setProvince(e.target.value.toUpperCase())}
              placeholder="RM"
              maxLength={2} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Problemi/Sintomi</label>
          <textarea 
            className="w-full min-h-[110px] rounded border px-3 py-2" 
            value={issues} 
            onChange={e=>setIssues(e.target.value)}
            placeholder="Descrivi i problemi o sintomi del paziente..." 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Obiettivi terapeutici</label>
          <textarea 
            className="w-full min-h-[110px] rounded border px-3 py-2" 
            value={goals} 
            onChange={e=>setGoals(e.target.value)}
            placeholder="Obiettivi del percorso terapeutico..." 
          />
        </div>

        <div className="flex gap-3">
          <button 
            onClick={createPatient} 
            disabled={loading || !displayName} 
            className="rounded bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Creazione in corso..." : "Crea paziente"}
          </button>
        </div>
      </div>
    </div>
  );
}
