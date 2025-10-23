'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Patient = {
  id: string
  display_name: string | null
  email: string | null
  phone: string | null
  issues: string | null
  goals: string | null
}

type GadRow = {
  created_at: string | null
  total: number | null
  severity: string | null
}

export default function PatientPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const pid = params?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const [patient, setPatient] = useState<Patient | null>(null)
  const [history, setHistory] = useState<GadRow[]>([])

  async function load() {
    if (!pid) return
    setLoading(true)
    setErr(null)
    try {
      // patient
      const { data: p, error: e1 } = await supabase
        .from('patients')
        .select('id,display_name,email,phone,issues,goals')
        .eq('id', pid)
        .single()
      if (e1) throw e1
      setPatient(p as Patient)

      // GAD-7 history
      const { data: h, error: e2 } = await supabase
        .from('gad7_results')
        .select('created_at,total,severity')
        .eq('patient_id', pid)
        .order('created_at', { ascending: false })
        .limit(50)
      if (e2) throw e2
      setHistory((h || []) as GadRow[])
    } catch (e: any) {
      setErr(e?.message || 'Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid])

  async function save() {
    if (!patient) return
    setSaving(true)
    setErr(null)
    setMsg(null)
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          display_name: patient.display_name,
          email: patient.email,
          phone: patient.phone,
          issues: patient.issues,
          goals: patient.goals,
        })
        .eq('id', patient.id)
      if (error) throw error
      setMsg('Dati salvati.')
    } catch (e: any) {
      setErr(e?.message || 'Salvataggio fallito')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-600">Caricamento…</div>
    )
  }

  if (err) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push('/app/therapist/pazienti')}
          className="mb-4 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          ← Lista pazienti
        </button>
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-6 text-sm text-gray-600">Paziente non trovato.</div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => router.push('/app/therapist/pazienti')}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          ← Lista pazienti
        </button>

        <button
          onClick={() => router.push(`/app/therapist/pazienti/${patient.id}/gad7`)}
          className="ml-auto inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          ➕ Esegui GAD-7 in seduta
        </button>
      </div>

      <h1 className="mb-4 text-xl font-semibold">Scheda paziente</h1>

      {msg && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          {msg}
        </div>
      )}

      <div className="mb-6 space-y-4 rounded-lg border bg-white p-4">
        <div>
          <label className="block text-sm text-gray-600">Nome</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={patient.display_name ?? ''}
            onChange={(e) =>
              setPatient({ ...patient, display_name: e.target.value })
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-600">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={patient.email ?? ''}
              onChange={(e) =>
                setPatient({ ...patient, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Telefono</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={patient.phone ?? ''}
              onChange={(e) =>
                setPatient({ ...patient, phone: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600">Problemi</label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            rows={3}
            value={patient.issues ?? ''}
            onChange={(e) =>
              setPatient({ ...patient, issues: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Obiettivi</label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            rows={3}
            value={patient.goals ?? ''}
            onChange={(e) =>
              setPatient({ ...patient, goals: e.target.value })
            }
          />
        </div>

        <div className="pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            💾 Salva
          </button>
        </div>
      </div>

      <h2 className="mb-2 text-lg font-semibold">Storico GAD-7</h2>
      <div className="divide-y rounded-lg border bg-white">
        {history.length === 0 && (
          <div className="p-4 text-sm text-gray-600">Nessun risultato.</div>
        )}
        {history.map((r, i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="text-sm">
              <span className="font-medium">Score: {r.total ?? '-'}</span>
              {r.severity ? (
                <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs">
                  {r.severity}
                </span>
              ) : null}
            </div>
            <div className="text-xs text-gray-500">
              {r.created_at
                ? new Date(r.created_at).toLocaleString()
                : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
