'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type InvoiceDetail = {
  id: string;
  invoice_number: string;
  patient_name: string;
  patient_email: string;
  patient_fiscal_code: string;
  patient_address: string;
  total_amount: number;
  vat_amount: number;
  subtotal: number;
  vat_rate: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
  period_start: string;
  period_end: string;
  notes: string;
  items: InvoiceItem[];
};

type InvoiceItem = {
  id: string;
  date: string;
  description: string;
  session_type: 'individual' | 'couple' | 'family';
  rate: number;
  amount: number;
};

export default function DettaglioFattura() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  async function loadInvoice() {
    try {
      // Per ora dati mock - da sostituire con vera chiamata al database
      const mockInvoice: InvoiceDetail = {
        id: id,
        invoice_number: 'FAT-2025-001',
        patient_name: 'Mario Rossi',
        patient_email: 'mario.rossi@email.com',
        patient_fiscal_code: 'RSSMRA80A01H501Z',
        patient_address: 'Via Roma 123, 00100 Roma (RM)',
        total_amount: 440,
        vat_amount: 40,
        subtotal: 400,
        vat_rate: 22,
        status: 'sent',
        due_date: '2025-01-15',
        created_at: '2024-12-15T10:00:00Z',
        period_start: '2024-11-01',
        period_end: '2024-11-30',
        notes: 'Sedute di psicoterapia individuale per il mese di novembre 2024',
        items: [
          {
            id: '1',
            date: '2024-11-05',
            description: 'Seduta individuale',
            session_type: 'individual',
            rate: 100,
            amount: 100
          },
          {
            id: '2',
            date: '2024-11-12',
            description: 'Seduta individuale',
            session_type: 'individual',
            rate: 100,
            amount: 100
          },
          {
            id: '3',
            date: '2024-11-19',
            description: 'Seduta individuale',
            session_type: 'individual',
            rate: 100,
            amount: 100
          },
          {
            id: '4',
            date: '2024-11-26',
            description: 'Seduta individuale',
            session_type: 'individual',
            rate: 100,
            amount: 100
          }
        ]
      };

      setInvoice(mockInvoice);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateInvoiceStatus(newStatus: 'draft' | 'sent' | 'paid' | 'overdue') {
    if (!invoice) return;

    try {
      // Qui andrà l'API per aggiornare lo status
      setInvoice({ ...invoice, status: newStatus });
      alert(`✅ Stato fattura aggiornato a: ${getStatusText(newStatus)}`);
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
  }

  function downloadPDF() {
    // Implementare generazione PDF
    alert('📄 Funzione PDF in sviluppo');
  }

  function sendInvoice() {
    if (!invoice?.patient_email) {
      alert('⚠️ Email paziente mancante');
      return;
    }
    // Implementare invio email
    alert(`📧 Fattura inviata a ${invoice.patient_email}`);
    updateInvoiceStatus('sent');
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-600 text-white';
      case 'sent': return 'bg-blue-600 text-white';
      case 'paid': return 'bg-green-600 text-white';
      case 'overdue': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '📝 Bozza';
      case 'sent': return '📤 Inviata';
      case 'paid': return '✅ Pagata';
      case 'overdue': return '⚠️ Scaduta';
      default: return status;
    }
  };

  const getSessionTypeText = (type: string) => {
    switch (type) {
      case 'individual': return 'Individuale';
      case 'couple': return 'Coppia';
      case 'family': return 'Famiglia';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="h-96 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Fattura non trovata</h1>
          <Link
            href="/app/therapist/fatture"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700"
            style={{ textDecoration: 'none' }}
          >
            ← Torna alle Fatture
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
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
              <h1 className="text-3xl font-bold text-white">{invoice.invoice_number}</h1>
              <p style={{ color: '#a8b2d6' }}>Dettaglio fattura</p>
            </div>
          </div>

          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
              {getStatusText(invoice.status)}
            </span>
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

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            📄 Scarica PDF
          </button>
          
          {invoice.status === 'draft' && (
            <button
              onClick={sendInvoice}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
            >
              📧 Invia a Paziente
            </button>
          )}
          
          {invoice.status === 'sent' && (
            <>
              <button
                onClick={() => updateInvoiceStatus('paid')}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700"
              >
                ✅ Segna come Pagata
              </button>
              <button
                onClick={sendInvoice}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700"
              >
                📧 Reinvia Email
              </button>
            </>
          )}

          {invoice.status === 'overdue' && (
            <button
              onClick={() => updateInvoiceStatus('paid')}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700"
            >
              ✅ Segna come Pagata
            </button>
          )}
        </div>

        {/* Invoice Preview */}
        <div className="rounded-lg p-8" style={{
          background: 'white',
          color: 'black',
          border: '1px solid rgba(0,0,0,0.1)'
        }}>
          
          {/* Header Fattura */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">FATTURA</h2>
              <p className="text-gray-600">Nr. {invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Data: {new Date(invoice.created_at).toLocaleDateString('it-IT')}</p>
              <p className="text-red-600 font-semibold">Scadenza: {new Date(invoice.due_date).toLocaleDateString('it-IT')}</p>
            </div>
          </div>

          {/* Dati Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Fatturato a:</h3>
              <div className="text-gray-700">
                <p className="font-semibold">{invoice.patient_name}</p>
                <p>CF: {invoice.patient_fiscal_code}</p>
                <p>{invoice.patient_address}</p>
                <p>{invoice.patient_email}</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Periodo:</h3>
              <div className="text-gray-700">
                <p>Dal {new Date(invoice.period_start).toLocaleDateString('it-IT')}</p>
                <p>Al {new Date(invoice.period_end).toLocaleDateString('it-IT')}</p>
              </div>
            </div>
          </div>

          {/* Dettaglio Servizi */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4">Dettaglio Servizi</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Data</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Descrizione</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Tipo</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Importo</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(item.date).toLocaleDateString('it-IT')}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                    <td className="border border-gray-300 px-4 py-2">{getSessionTypeText(item.session_type)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">€{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totali */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span>Subtotale:</span>
                <span>€{invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>IVA {invoice.vat_rate}%:</span>
                <span>€{invoice.vat_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-300 font-bold text-lg">
                <span>TOTALE:</span>
                <span>€{invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Note */}
          {invoice.notes && (
            <div className="mb-4">
              <h3 className="font-bold text-gray-900 mb-2">Note:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-200">
            <p>Grazie per aver scelto i nostri servizi</p>
          </div>
        </div>

        {/* Status History */}
        <div className="rounded-lg p-6" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 className="text-xl font-bold text-white mb-4">📈 Cronologia</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-gray-300">
                {new Date(invoice.created_at).toLocaleDateString('it-IT')} - Fattura creata
              </span>
            </div>
            {invoice.status !== 'draft' && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">Fattura inviata al paziente</span>
              </div>
            )}
            {invoice.status === 'paid' && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">Pagamento ricevuto</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
