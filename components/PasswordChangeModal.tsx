'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PasswordChangeModal({ isOpen, onClose, onSuccess }: PasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validazioni
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Compila tutti i campi');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('La nuova password deve essere di almeno 8 caratteri');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Le password non corrispondono');
      setLoading(false);
      return;
    }

    try {
      // Ottieni token utente corrente
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Sessione non valida. Riaccedi.');
      }

      // Chiama API cambio password
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante il cambio password');
      }

      setSuccess(true);
      setTimeout(() => {
        resetForm();
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="max-w-md w-full rounded-2xl shadow-2xl" style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">🔐 Cambia Password</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">Aggiorna la tua password per maggiore sicurezza</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Password Attuale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Attuale
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Inserisci la password attuale"
              required
            />
          </div>

          {/* Nuova Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuova Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Minimo 8 caratteri"
              minLength={8}
              required
            />
          </div>

          {/* Conferma Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conferma Nuova Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ripeti la nuova password"
              required
            />
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">⚠️ {error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-700">✅ Password aggiornata con successo!</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors"
              style={{
                background: loading ? '#6b7280' : success ? '#22c55e' : 'linear-gradient(135deg, #7aa2ff 0%, #9333ea 100%)',
                opacity: loading || success ? 0.8 : 1
              }}
            >
              {loading ? 'Aggiornamento...' : success ? 'Completato!' : '🔐 Aggiorna Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
