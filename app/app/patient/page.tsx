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
  address: string | null;
  fiscal_code: string | null;
  birth_date: string | null;
  birth_place: string | null;
  goals: string | null;
};

export default function PatientHome() {
  const [me, setMe] = useState<Patient | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campi editabili
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) {
      window.location.href = "/login";
      return;
    }

    // prova per patient_user_id, fallback per email
    let { data, error } = await supabase
      .from("patients")
      .select("id, display_name, email, phone, address, fiscal_code, birth_date, birth_place, goals")
      .eq("patient_user_id", u.user.id)
      .single();

    if (error) {
      // fallback: collega via email se corrisponde
      const byEmail = await supabase
        .from("patients")
        .select("id, display_name, email, phone, address, fiscal_code, birth_date, birth_place, goals")
        .eq("email", u.user.email)
        .maybeSingle();

      if (byEmail.data) {
        // prova a scrivere patient_user_id se mancante
        await supabase
          .from("patients")
          .update({ patient_user_id: u.user.id })
          .eq("id", byEmail.data.id);
        setMe(byEmail.data as Patient);
        loadEditableFields(byEmail.data as Patient);
        return;
      }

      setErr("Nessuna scheda paziente collegata al tuo account.");
      return;
    }

    setMe(data as Patient);
    loadEditableFields(data as Patient);
  }

  function loadEditableFields(patient: Patient) {
    setDisplayName(patient.display_name || "");
    setPhone(patient.phone || "");
    setAddress(patient.address || "");
    setFiscalCode(patient.fiscal_code || "");
    setBirthDate(patient.birth_date || "");
    setBirthPlace(patient.birth_place || "");
  }

  async function handleSave() {
    if (!me) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("patients")
        .update({
          display_name: displayName,
          phone: phone,
          address: address,
          fiscal_code: fiscalCode,
          birth_date: birthDate || null,
          birth_place: birthPlace
        })
        .eq("id", me.id);

      if (error) throw error;

      alert("✅ Dati salvati!");
      setIsEditing(false);
      loadData();
    } catch (e: any) {
      alert("Errore: " + e.message);
    } finally {
      setSaving(false);
    }
  }

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

      <section className="rounded border p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">I tuoi dati</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ✏️ Modifica
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="space-y-3 text-sm text-gray-700">
            <div><b>Nome:</b> {me.display_name || "—"}</div>
            <div><b>Email:</b> {me.email || "—"}</div>
            <div><b>Telefono:</b> {me.phone || "—"}</div>
            <div><b>Indirizzo:</b> {me.address || "—"}</div>
            <div><b>Codice Fiscale:</b> {me.fiscal_code || "—"}</div>
            <div><b>Data di nascita:</b> {me.birth_date ? new Date(me.birth_date).toLocaleDateString('it-IT') : "—"}</div>
            <div><b>Luogo di nascita:</b> {me.birth_place || "—"}</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome completo</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Mario Rossi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telefono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="+39 333 1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Indirizzo</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Via Roma 123, Milano"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Codice Fiscale</label>
              <input
                type="text"
                value={fiscalCode}
                onChange={(e) => setFiscalCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="RSSMRA80A01H501Z"
                maxLength={16}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data di nascita</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Luogo di nascita</label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Roma"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadEditableFields(me);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? "Salvataggio..." : "💾 Salva"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded border p-6 bg-white shadow-sm">
        <h2 className="font-bold text-lg mb-3">Obiettivi</h2>
        <div className="whitespace-pre-wrap text-gray-800 text-sm">
          {me.goals || "Nessun obiettivo impostato."}
        </div>
      </section>

      <section className="rounded border p-6 bg-white shadow-sm">
        <h2 className="font-bold text-lg mb-3">Prossimi appuntamenti</h2>
        <div className="text-sm text-gray-500">Nessun appuntamento al momento.</div>
      </section>
    </div>
  );
}
