"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  goals: string | null;
};

export default function PatientHome() {
  const [me, setMe] = useState<Patient | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) {
        window.location.href = "/login";
        return;
      }
      // prova per patient_user_id, fallback per email
      let { data, error } = await supabase
        .from("patients")
        .select("id,display_name,email,phone,goals")
        .eq("patient_user_id", u.user.id)
        .single();

      if (error) {
        // fallback: collega via email se corrisponde
        const byEmail = await supabase
          .from("patients")
          .select("id,display_name,email,phone,goals")
          .eq("email", u.user.email)
          .maybeSingle();

        if (byEmail.data) {
          // prova a scrivere patient_user_id se mancante
          await supabase
            .from("patients")
            .update({ patient_user_id: u.user.id })
            .eq("id", byEmail.data.id);
          setMe(byEmail.data as Patient);
          return;
        }

        setErr("Nessuna scheda paziente collegata al tuo account.");
        return;
      }

      setMe(data as Patient);
    })();
  }, []);

  if (err) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded border border-red-200 bg-red-50 text-red-700 px-4 py-3">{err}</div>
        <div className="mt-4">
          <Link href="/" className="underline">Torna alla home</Link>
        </div>
      </div>
    );
  }

  if (!me) return <div className="max-w-3xl mx-auto p-6">Caricamento…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Benvenuto/a {me.display_name || ""}</h1>

      <section className="rounded border p-4">
        <h2 className="font-medium mb-3">I tuoi dati</h2>
        <div className="text-sm text-gray-700 space-y-1">
          <div><b>Email:</b> {me.email || "—"}</div>
          <div><b>Telefono:</b> {me.phone || "—"}</div>
        </div>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-medium mb-3">Obiettivi</h2>
        <div className="whitespace-pre-wrap text-gray-800 text-sm">
          {me.goals || "Nessun obiettivo impostato."}
        </div>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-medium mb-3">Prossimi appuntamenti</h2>
        <div className="text-sm text-gray-500">Nessun appuntamento al momento.</div>
      </section>
    </div>
  );
}
