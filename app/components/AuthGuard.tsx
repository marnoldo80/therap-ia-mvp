"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setOk(true);
    })();
  }, [router, pathname]);

  if (!ok) return <div className="max-w-3xl mx-auto p-6">Controllo accesso…</div>;
  return <>{children}</>;
}
