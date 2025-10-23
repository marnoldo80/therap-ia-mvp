"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LogoutButton() {
  const router = useRouter();
  async function doLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }
  return (
    <button
      onClick={doLogout}
      className="rounded border px-3 py-2 hover:bg-gray-50"
      aria-label="Logout"
      title="Logout"
    >
      Esci
    </button>
  );
}
