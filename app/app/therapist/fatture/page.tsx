'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Invoice = {
  id: string;
  invoice_number: string;
  patient_name: string;
  total_amount: number;
  enpap_amount: number;
  bollo_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
  period_start: string;
  period_end: string;
  sessions_count: number;
};

type InvoiceStats = {
  totalInvoices: number;
  totalAmount: number;
  thisMonthAmount: number;
  pendingAmount: number;
  paidAmount: number;
  overdueCount: number;
};

export default function FattureDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    totalInvoices: 0,
    totalAmount: 0,
    thisMonthAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueCount: 0
  });
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Per ora dati mock - da implementare tabelle fatture
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          invoice_number: 'FAT-2025-001',
          patient_name: 'Mario Rossi',
          total_amount: 955.70,
          enpap_amount: 18.70,
          bollo_amount: 2.00,
          status: 'sent',
          due_date: '2025-01-15',
          created_at: '2024-12-15T10:00:00Z',
          period_start: '2024-11-01',
          period_end: '2024-11-30',
          sessions_count: 11
        },
        {
          id: '2', 
          invoice_number: 'FAT-2025-002',
          patient_name: 'Laura Bianchi',
          total_amount: 696.40,
          enpap_amount: 13.60,
          bollo_amount: 2.00,
          status: 'paid',
          due_date: '2025-01-20',
          created_at: '2024-12-20T14:30:00Z',
          period_start: '2024-11-01',
          period_end: '2024-11-30', 
          sessions_count: 8
        },
        {
          id: '3',
          invoice_number: 'FAT-2025-003', 
          patient_name: 'Giuseppe Verdi',
          total_amount: 346.40,
          enpap_amount: 6.80,
          bollo_amount: 2.00,
          status: 'overdue',
          due_date: '2024-12-30',
          created_at: '2024-12-01T09:15:00Z',
          period_start: '2024-10-01',
          period_end: '2024-10-31',
          sessions_count: 4
        }
      ];

      setInvoices(mockInvoices);

      // Calcola statistiche
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const calculatedStats = mockInvoices.reduce((acc, inv) => {
        acc.totalInvoices++;
        acc.totalAmount += inv.total_amount;

        const invDate = new Date(inv.created_at);
        if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
          acc.thisMonthAmount += inv.total_amount;
        }

        if (inv.status === 'sent') {
          acc.pendingAmount += inv.total_amount;
        } else if (inv.status === 'paid') {
          acc.paidAmount += inv.total_amount;
        } else if (inv.status === 'overdue') {
          acc.overdueCount++;
          acc.pendingAmount += inv.total_amount;
        }

        return acc;
      }, {
        totalInvoices: 0,
        totalAmount: 0,
        thisMonthAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueCount: 0
      });

      setStats(calculatedStats);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredInvoices = selectedFilter === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === selectedFilter);

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

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-white/10 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/app/therapist" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            ← Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">💰 Gestione Fatture</h1>
            <p style={{ color: '#a8b2d6' }}>Monitora e gestisci le tue fatture</p>
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl">📊</div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalInvoices}</div>
                <div className="text-sm text-gray-400">Fatture totali</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl">💶</div>
              <div>
                <div className="text-2xl font-bold text-white">€{stats.totalAmount.toFixed(0)}</div>
                <div className="text-sm text-gray-400">Fatturato totale</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl">📅</div>
              <div>
                <div className="text-2xl font-bold text-white">€{stats.thisMonthAmount.toFixed(0)}</div>
                <div className="text-sm text-gray-400">Questo mese</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl">⏳</div>
              <div>
                <div className="text-2xl font-bold text-white">€{stats.pendingAmount.toFixed(0)}</div>
                <div className="text-sm text-gray-400">In sospeso</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Tutte ({invoices.length})
            </button>
            <button
              onClick={() => setSelectedFilter('sent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'sent'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              📤 Inviate ({invoices.filter(i => i.status === 'sent').length})
            </button>
            <button
              onClick={() => setSelectedFilter('paid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'paid'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ✅ Pagate ({invoices.filter(i => i.status === 'paid').length})
            </button>
            {stats.overdueCount > 0 && (
              <button
                onClick={() => setSelectedFilter('overdue')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === 'overdue'
                    ? 'bg-orange-600 text-white'
                    : 'bg-red-700 text-white hover:bg-red-600'
                }`}
              >
                ⚠️ Scadute ({stats.overdueCount})
              </button>
            )}
          </div>

          <Link
            href="/app/therapist/fatture/nuova"
            className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-700 hover:to-orange-800 transition-all"
            style={{ textDecoration: 'none' }}
          >
            + Nuova Fattura
          </Link>
        </div>

        {/* Fatture Table */}
        <div className="rounded-lg overflow-hidden" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Numero</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Paziente</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Periodo</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Sessioni</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Importo</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Stato</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Scadenza</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-white">{invoice.invoice_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{invoice.patient_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {new Date(invoice.period_start).toLocaleDateString('it-IT')} - {new Date(invoice.period_end).toLocaleDateString('it-IT')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{invoice.sessions_count}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">€{invoice.total_amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">ENPAP: €{invoice.enpap_amount.toFixed(2)} | Bollo: €{invoice.bollo_amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">{new Date(invoice.due_date).toLocaleDateString('it-IT')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/app/therapist/fatture/${invoice.id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          👁️ Vedi
                        </Link>
                        <button className="text-green-400 hover:text-green-300 text-sm">
                          📥 PDF
                        </button>
                        {invoice.status === 'sent' && (
                          <button className="text-purple-400 hover:text-purple-300 text-sm">
                            📧 Invia
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredInvoices.length === 0 && (
          <div className="text-center py-12 rounded-lg" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-2xl font-bold text-white mb-4">Nessuna fattura trovata</h3>
            <p className="text-gray-300 mb-6">
              {selectedFilter === 'all' 
                ? 'Inizia creando la tua prima fattura' 
                : `Nessuna fattura con stato "${selectedFilter}"`}
            </p>
            {selectedFilter === 'all' ? (
              <Link
                href="/app/therapist/fatture/nuova"
                className="bg-orange-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-orange-700 inline-block"
                style={{ textDecoration: 'none' }}
              >
                📄 Crea Prima Fattura
              </Link>
            ) : (
              <button
                onClick={() => setSelectedFilter('all')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700"
              >
                Vedi Tutte le Fatture
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
