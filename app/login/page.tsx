"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/app/therapist");
    } catch (e:any) {
      setErr(e?.message ?? "Errore di login");
    } finally { setLoading(false); }
  }

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 20 }}>
      <h1>Login Terapeuta</h1>
      <form onSubmit={handleLogin} style={{ display:"grid", gap:12, marginTop:16 }}>
        <label>Email
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                 style={{ width:"100%", padding:8, border:"1px solid #ccc", borderRadius:6 }} />
        </label>
        <label>Password
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                 style={{ width:"100%", padding:8, border:"1px solid #ccc", borderRadius:6 }} />
        </label>
        {err && <p style={{ color:"crimson" }}>{err}</p>}
        <button type="submit" disabled={loading}
                style={{ padding:"10px 14px", borderRadius:8, border:"1px solid #333" }}>
          {loading ? "Accesso in corso..." : "Entra"}
        </button>
      </form>
    </main>
  );
}
