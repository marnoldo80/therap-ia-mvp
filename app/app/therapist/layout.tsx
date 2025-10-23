import AuthGuard from "@/app/components/AuthGuard";
import LogoutButton from "@/app/components/LogoutButton";
import Link from "next/link";

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <nav className="flex items-center gap-3">
            <Link href="/app/therapist" className="rounded border px-3 py-2 hover:bg-gray-50">
              Dashboard
            </Link>
            <Link href="/app/therapist/pazienti" className="rounded border px-3 py-2 hover:bg-gray-50">
              Pazienti
            </Link>
          </nav>
          <LogoutButton />
        </header>
        {children}
      </div>
    </AuthGuard>
  );
}
