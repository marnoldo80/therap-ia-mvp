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

  const menuItems = [
  { href: "/app/therapist", label: "Dashboard", icon: "🏠" },
  { href: "/app/therapist/pazienti", label: "Pazienti", icon: "👥" },
  { href: "/app/therapist/appuntamenti", label: "Appuntamenti", icon: "📅" },
  { href: "/app/therapist/consensi", label: "Consensi", icon: "📋" },
  { href: "/app/therapist/personal-branding", label: "Personal Branding", icon: "📱" },
  { href: "/app/therapist/sedute", label: "Sedute", icon: "📝" },
  { href: "/app/therapist/questionari", label: "Questionari", icon: "📊" }
];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/app/therapist" className="text-xl font-bold text-emerald-600">
                Therap-IA
              </Link>
              <span className="ml-3 text-sm text-gray-500">
                {therapist?.full_name || therapist?.display_name || 'Terapeuta'}
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-2">
            <nav className="flex gap-2 overflow-x-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    pathname === item.href
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Chatbot Assistente */}
      <TherapistAssistant 
        therapistName={therapist?.full_name || therapist?.display_name}
      />
    </div>
  );
}
