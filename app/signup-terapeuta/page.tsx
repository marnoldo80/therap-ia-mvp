"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!accepted) {
      setErr("Devi accettare l'informativa privacy.");
      return;
    }
    setLoading(true);
    try {
      const { data: sign, error: signErr } = await supabase.auth.signUp({ email, password });
      if (signErr) throw signErr;
      const user = sign.user;
      if (!user) throw new Error("Impossibile ottenere l'utente dopo il signup.");

      const { error: cErr } = await supabase
        .from("consents")
        .insert({ user_id: user.id, kind: "privacy-gdpr", version: "v1" });
      if (cErr) throw cErr;

      router.push("/app/therapist/onboarding");
    } catch (e: any) {
      setErr(e?.message ?? "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 20 }}>
      <h1>Iscrizione Terapeuta</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          Email
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required
            style={{ width:"100%", padding:8, border:"1px solid #ccc", borderRadius:6 }} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required
            style={{ width:"100%", padding:8, border:"1px solid #ccc", borderRadius:6 }} />
        </label>
        <label style={{ display:"flex", gap:8, alignItems:"center" }}>
          <input type="checkbox" checked={accepted} onChange={(e)=>setAccepted(e.target.checked)} />
          Dichiaro di aver letto e accettato l'informativa privacy (GDPR).
        </label>
        {err && <p style={{ color:"crimson" }}>{err}</p>}
        <button type="submit" disabled={loading}
          style={{ padding:"10px 14px", borderRadius:8, border:"1px solid #333", cursor:"pointer" }}>
          {loading ? "Creazione in corso..." : "Crea account"}
        </button>
      </form>
      <p style={{ marginTop:16, fontSize:12, color:"#666" }}>
        Dopo la creazione verrai portato all’onboarding.
      </p>
    </main>
  );
}