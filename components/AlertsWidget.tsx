'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Alert = {
  id: string;
  type: 'exercise' | 'diary' | 'thoughts' | 'questionnaire' | 'appointment';
  severity: 'low' | 'medium' | 'high';
  patientId: string;
  patientName: string;
  message: string;
  daysAgo: number;
  createdAt: string;
};

type AlertsWidgetProps = {
  therapistId: string;
};

export default function AlertsWidget({ therapistId }: AlertsWidgetProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [therapistId]);

  async function loadAlerts() {
    try {
      const res = await fetch(`/api/get-alerts?therapistId=${therapistId}`);
      if (!res.ok) throw new Error('Errore caricamento alert');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) {
      console.error('Errore alert:', e);
    } finally {
      setLoading(false);
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'exercise': return '💪';
      case 'diary': return '📔';
      case 'thoughts': return '💭';
      case 'questionnaire': return '📊';
      case 'appointment': return '📅';
      default: return '⚠️';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-500 text-red-800';
      case 'medium': return 'bg-orange-50 border-orange-500 text-orange-800';
      case 'low': return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      default: return 'bg-gray-50 border-gray-500 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 5);
  const highAlerts = alerts.filter(a => a.severity === 'high').length;

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          🚨 Alert e Notifiche
          {highAlerts > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {highAlerts} urgenti
            </span>
          )}
        </h3>
        {alerts.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showAll ? 'Mostra meno' : `Vedi tutti (${alerts.length})`}
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-medium">Nessun alert attivo</p>
          <p className="text-sm">Tutti i pazienti sono monitorati correttamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedAlerts.map(alert => (
            <Link
              key={alert.id}
              href={`/app/therapist/pazienti/${alert.patientId}`}
              className={`block border-l-4 p-4 rounded hover:shadow-md transition ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                  <div>
                    <div className="font-semibold">{alert.patientName}</div>
                    <div className="text-sm mt-1">{alert.message}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 whitespace-nowrap">
                  {alert.daysAgo} giorni fa
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Urgente ({alerts.filter(a => a.severity === 'high').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Medio ({alerts.filter(a => a.severity === 'medium').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Basso ({alerts.filter(a => a.severity === 'low').length})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
