'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = {
  id: string;
  display_name: string;
  email: string;
  fiscal_code: string;
  address: string;
  rate_individual: number;
  rate_couple: number;
  rate_family: number;
};

type Appointment = {
  id: string;
  title: string;
  starts_at: string;
  session_type?: 'individual' | 'couple' | 'family';
};

type InvoiceItem = {
  date: string;
  description: string;
  session_type: 'individual' | 'couple' | 'family';
  rate: number;
  amount: number;
};

export default function NuovaFattura() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  
  // Form data
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [enpapRate, setEnpapRate] = useState(2); // ENPAP 2% invece di IVA
  const [bolloAmount, setBolloAmount] = useState(2); // Bollo fisso €2
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPatients();
    
    // Set default period (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setPeriodStart(firstDay.toISOString().split('T')[0]);
    setPeriodEnd(lastDay.toISOString().split('T')[0]);
  }, []);

  async function loadPatients() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('patients')
        .select('id, display_name, email, fiscal_code, address, rate_individual, rate_couple, rate_family')
        .eq('therapist_user_id', user.id)
        .order('display_name', { ascending: true });

      if (error) throw error;
      setPatients(data || []);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAppointmentsForPeriod() {
    if (!selectedPatient || !periodStart || !periodEnd) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, title, starts_at')
        .eq('patient_id', selectedPatient.id)
        .gte('starts_at', periodStart + 'T00:00:00.000Z')
        .lte('starts_at', periodEnd + 'T23:59:59.999Z')
        .order('starts_at', { ascending: true });

      if (error) throw error;

      // Process appointments into invoice items
      const items: InvoiceItem[] = (data || []).map(apt => {
        // Determina il tipo di sessione dal titolo (puoi migliorare questa logica)
        let sessionType: 'individual' | 'couple' | 'family' = 'individual';
        const title = apt.title.toLowerCase();
        if (title.includes('coppia')) sessionType = 'couple';
        else if (title.includes('famiglia')) sessionType = 'family';

        const rate = sessionType === 'individual' ? selectedPatient.rate_individual :
                     sessionType === 'couple' ? selectedPatient.rate_couple :
                     selectedPatient.rate_family;

        return {
          date: apt.starts_at.split('T')[0],
          description: apt.title,
          session_type: sessionType,
          rate: rate || 90,
          amount: rate || 90
        };
      });

      setInvoiceItems(items);
      setAppointments(data || []);

    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (selectedPatient && periodStart && periodEnd) {
      loadAppointmentsForPeriod();
    }
  }, [selectedPatient, periodStart, periodEnd]);

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  const enpapAmount = (subtotal * enpapRate) / 100; // ENPAP 2%
  const total = subtotal + enpapAmount + bolloAmount; // Imponibile + ENPAP + Bollo

  function addManualItem() {
    const newItem: InvoiceItem = {
      date: new Date().toISOString().split('T')[0],
      description: 'Seduta individuale',
      session_type: 'individual',
      rate: selectedPatient?.rate_individual || 90,
      amount: selectedPatient?.rate_individual || 90
    };
    setInvoiceItems([...invoiceItems, newItem]);
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: any) {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Se cambia il tipo di sessione, aggiorna automaticamente la tariffa
    if (field === 'session_type' && selectedPatient) {
      const newRate = value === 'individual' ? selectedPatient.rate_individual :
                     value === 'couple' ? selectedPatient.rate_couple :
                     selectedPatient.rate_family;
      updated[index].rate = newRate;
      updated[index].amount = newRate;
    }
    
    // Se cambia la tariffa, aggiorna l'importo
    if (field === 'rate') {
      updated[index].amount = value;
    }
    
    setInvoiceItems(updated);
  }

  function removeItem(index: number) {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  }

  async function createInvoice() {
    if (!selectedPatient || invoiceItems.length === 0) {
      setError('Seleziona un paziente e aggiungi almeno una sessione');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          period_start: periodStart,
          period_end: periodEnd,
          notes: notes,
          enpap_rate: enpapRate,
          bollo_amount: bolloAmount,
          items: invoiceItems
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore creazione fattura');
      }

      const data = await response.json();
      
      alert(`✅ Fattura ${data.invoice_number} creata con successo!`);
      router.push('/app/therapist/fatture');

    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="h-64 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/app/therapist/fatture" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            ← Fatture
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">📄 Nuova Fattura</h1>
            <p style={{ color: '#a8b2d6' }}>Crea una fattura per il tuo paziente</p>
          </div>
        </div>

        {error && (
          <div className="rounded p-4" style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444'
          }}>
            <p><strong>Errore:</strong> {error}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          
          {/* Selezione Paziente */}
          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 className="text-xl font-bold text-white mb-4">👤 Seleziona Paziente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patients.map(patient => (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                    selectedPatient?.id === patient.id
                      ? 'border-orange-500 bg-orange-500/20'
                      : 'border-gray-600 bg-white/5 hover:border-gray-500'
                  }`}
                >
                  <h3 className="font-semibold text-white">{patient.display_name}</h3>
                  <p className="text-sm text-gray-400">{patient.email}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Ind: €{patient.rate_individual} | Cop: €{patient.rate_couple} | Fam: €{patient.rate_family}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Periodo Fatturazione */}
          {selectedPatient && (
            <div className="rounded-lg p-6" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h2 className="text-xl font-bold text-white mb-4">📅 Periodo di Fatturazione</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Data Inizio</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Data Fine</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sessioni/Righe Fattura */}
          {selectedPatient && (
            <div className="rounded-lg p-6" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">📝 Sessioni da Fatturare</h2>
                <button
                  onClick={addManualItem}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
                >
                  + Aggiungi Sessione
                </button>
              </div>

              {invoiceItems.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-3 py-2 text-left text-sm font-medium text-gray-400">Data</th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-gray-400">Descrizione</th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-gray-400">Tipo</th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-gray-400">Tariffa</th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-gray-400">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {invoiceItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2">
                              <input
                                type="date"
                                value={item.date}
                                onChange={(e) => updateItem(index, 'date', e.target.value)}
                                className="w-full px-2 py-1 text-sm rounded border border-gray-600 bg-gray-800 text-white"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                className="w-full px-2 py-1 text-sm rounded border border-gray-600 bg-gray-800 text-white"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={item.session_type}
                                onChange={(e) => updateItem(index, 'session_type', e.target.value)}
                                className="w-full px-2 py-1 text-sm rounded border border-gray-600 bg-gray-800 text-white"
                              >
                                <option value="individual">Individuale</option>
                                <option value="couple">Coppia</option>
                                <option value="family">Famiglia</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm rounded border border-gray-600 bg-gray-800 text-white"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => removeItem(index)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Riepilogo */}
                  <div className="bg-white/5 rounded-lg p-4 max-w-sm ml-auto">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Imponibile:</span>
                        <span className="text-white">€{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">ENPAP ({enpapRate}%):</span>
                        <span className="text-white">€{enpapAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bollo:</span>
                        <span className="text-white">€{bolloAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-2 font-semibold">
                        <span className="text-white">Totale:</span>
                        <span className="text-white">€{total.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Esente IVA art.10 n°18 DPR 633/72
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-4">📝</div>
                  <p>Nessuna sessione trovata per il periodo selezionato</p>
                  <p className="text-sm mt-2">Aggiungi manualmente le sessioni da fatturare</p>
                </div>
              )}
            </div>
          )}

          {/* Note e Impostazioni */}
          {selectedPatient && (
            <div className="rounded-lg p-6" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h2 className="text-xl font-bold text-white mb-4">⚙️ Impostazioni Fattura</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Note aggiuntive</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Note da includere nella fattura..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-orange-500 min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Contributo ENPAP (%)</label>
                  <select
                    value={enpapRate}
                    onChange={(e) => setEnpapRate(parseInt(e.target.value))}
                    className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={0}>Esenzione ENPAP</option>
                    <option value={2}>2% (Standard)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Imposta di Bollo</label>
                  <input
                    type="number"
                    value={bolloAmount}
                    onChange={(e) => setBolloAmount(parseFloat(e.target.value) || 0)}
                    className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-orange-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {selectedPatient && invoiceItems.length > 0 && (
            <div className="flex gap-4 justify-end">
              <Link
                href="/app/therapist/fatture"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700"
                style={{ textDecoration: 'none' }}
              >
                Annulla
              </Link>
              <button
                onClick={createInvoice}
                disabled={saving}
                className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-8 py-3 rounded-lg font-medium hover:from-orange-700 hover:to-orange-800 disabled:opacity-50"
              >
                {saving ? 'Creando...' : '💾 Crea Fattura'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
