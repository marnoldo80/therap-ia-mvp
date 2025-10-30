"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export default function NewPatientPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [issues, setIssues] = useState("");
  const [goals, setGoals] = useState("");
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
        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input className="w-full rounded border px-3 py-2" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full rounded border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Telefono</label>
            <input className="w-full rounded border px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Problemi</label>
          <textarea className="w-full min-h-[110px] rounded border px-3 py-2" value={issues} onChange={e=>setIssues(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Obiettivi</label>
          <textarea className="w-full min-h-[110px] rounded border px-3 py-2" value={goals} onChange={e=>setGoals(e.target.value)} />
        </div>
        <button onClick={createPatient} disabled={loading} className="rounded bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-60">
          {loading ? "Creazione in corso..." : "Crea paziente"}
        </button>
      </div>
    </div>
  );
}
