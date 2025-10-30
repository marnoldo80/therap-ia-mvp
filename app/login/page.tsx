"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export default function Page() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    
    try {
      // Prova prima il login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (loginError) {
        // Se login fallisce, prova a registrare
        if (loginError.message.includes("Invalid login credentials")) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                user_type: 'therapist'
              }
            }
          });

          if (signUpError) throw signUpError;

          if (signUpData.user) {
            // Crea record therapist
            const { error: insertError } = await supabase
              .from('therapists')
              .insert({
                user_id: signUpData.user.id,
                onboarding_completed: false
              });

            if (insertError) throw insertError;

            // Login dopo registrazione
            const { error: loginAfterSignup } = await supabase.auth.signInWithPassword({
              email,
              password
            });

            if (loginAfterSignup) throw loginAfterSignup;

            router.push("/app/therapist/onboarding");
            return;
          }
        } else {
          throw loginError;
        }
      }

      // Se login OK, controlla onboarding
      const { data: therapist } = await supabase
        .from('therapists')
        .select('onboarding_completed')
        .eq('user_id', loginData.user.id)
        .single();

      if (therapist && !therapist.onboarding_completed) {
        router.push("/app/therapist/onboarding");
      } else {
        router.push("/app/therapist");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Errore di login");
    } finally { 
      setLoading(false); 
    }
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
