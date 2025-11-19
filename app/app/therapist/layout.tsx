'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TherapistAssistant from "@/components/TherapistAssistant";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Therapist = {
  full_name: string;
  display_name: string;
};

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [therapist, setTherapist] = useState<Therapist | null>(null);

  useEffect(() => {
    loadTherapistData();
  }, []);

  async function loadTherapistData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: therapistData } = await supabase
        .from('therapists')
        .select('full_name, display_name')
        .eq('user_id', user.id)
        .single();

      if (therapistData) {
        setTherapist(therapistData);
      }
    } catch (error) {
      console.error('Errore caricamento dati terapeuta:', error);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    }}>
      {/* NUOVO HEADER con logo cIAo-doc + menu orizzontale viola */}
      <header style={{
        background: 'rgba(0,0,0,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 24px'
      }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo cIAo-doc */}
          <div className="flex items-center">
            <img 
              src="/logo-transparent-png.png" 
              alt="cIAo-doc" 
              style={{ height: '60px', width: 'auto' }}
            />
          </div>
          
          {/* Menu Orizzontale SOLO: Pazienti, Appuntamenti, Personal Branding, Logout */}
          <nav className="flex items-center gap-6">
            <Link 
              href="/app/therapist/pazienti"
              className="px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: '#9333ea' }}
            >
              Pazienti
            </Link>
            <Link 
              href="/app/therapist/appuntamenti"
              className="px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: '#9333ea' }}
            >
              Appuntamenti
            </Link>
            <Link 
              href="/app/therapist/personal-branding"
              className="px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: '#9333ea' }}
            >
              Personal Branding
            </Link>
            <button 
              onClick={logout}
              className="px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: '#9333ea' }}
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content - SENZA padding wrapper, ogni pagina gestisce il suo layout */}
      <main>
        {children}
      </main>

      {/* Chatbot Assistente */}
      <TherapistAssistant 
        therapistName={therapist?.full_name || therapist?.display_name}
      />
    </div>
  );
}
