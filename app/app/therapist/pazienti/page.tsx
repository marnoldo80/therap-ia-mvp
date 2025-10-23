"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Row = { id: string; display_name: string | null; created_at: string | null };

export default function PatientsList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) {
        window.location.href = "/login";
        return;
      }
      const { data } = await supabase
        .from("patients")
        .select("id,display_name,created_at")
        .order("created_at", { ascending: false });
      setRows(data || []);
    })();
  }, []);

  const filtered = rows.filter(r =>
    (r.display_name || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Pazienti</h1>
        <Link href="/app/therapist/pazienti/nuovo" className="rounded bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700">
          ➕ Nuovo paziente
        </Link>
      </div>

      <input
        className="w-full rounded border px-3 py-2 mb-4"
        placeholder="Cerca per nome…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <ul className="space-y-2">
        {filtered.map(p => (
          <li key={p.id} className="rounded border p-3 hover:bg-gray-50">
            <Link href={`/app/therapist/pazienti/${p.id}`} className="font-medium">
              {p.display_name || "(senza nome)"}
            </Link>
            <div className="text-sm text-gray-500">
              {p.created_at ? new Date(p.created_at).toLocaleString() : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
