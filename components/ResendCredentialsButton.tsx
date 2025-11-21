'use client';
import { useState } from 'react';

interface ResendCredentialsButtonProps {
  patientId: string;
  patientName: string;
  patientEmail?: string;
}

export default function ResendCredentialsButton({ patientId, patientName, patientEmail }: ResendCredentialsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  const handleResendCredentials = async () => {
    if (!patientEmail) {
      setMessage('Email paziente mancante');
      setMessageType('error');
      return;
    }

    if (!confirm(`Vuoi generare nuove credenziali per ${patientName}?`)) {
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType(null);

    try {
      const response = await fetch('/api/resend-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante l\'invio');
      }

      setMessage(result.message || 'Nuove credenziali inviate!');
      setMessageType('success');
      
      // Reset messaggio dopo 5 secondi
      setTimeout(() => {
        setMessage('');
        setMessageType(null);
      }, 5000);

    } catch (err: any) {
      setMessage(err.message || 'Errore imprevisto');
      setMessageType('error');
      
      // Reset messaggio dopo 5 secondi
      setTimeout(() => {
        setMessage('');
        setMessageType(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleResendCredentials}
        disabled={loading || !patientEmail}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        style={{
          backgroundColor: loading ? '#6b7280' : !patientEmail ? '#9ca3af' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: !patientEmail ? '#6b7280' : 'white',
          opacity: !patientEmail ? 0.6 : 1
        }}
      >
        <span>{loading ? '⏳' : '🔑'}</span>
        <span>
          {loading ? 'Invio in corso...' : 'Rimanda Credenziali'}
        </span>
      </button>

      {!patientEmail && (
        <p className="text-xs text-red-400">
          ⚠️ Email paziente richiesta per inviare credenziali
        </p>
      )}

      {message && (
        <div 
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: messageType === 'success' 
              ? 'rgba(34, 197, 94, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            border: messageType === 'success' 
              ? '1px solid rgba(34, 197, 94, 0.3)' 
              : '1px solid rgba(239, 68, 68, 0.3)',
            color: messageType === 'success' ? '#22c55e' : '#ef4444'
          }}
        >
          {messageType === 'success' ? '✅' : '⚠️'} {message}
        </div>
      )}
    </div>
  );
}
