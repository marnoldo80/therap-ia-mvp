'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SessionRatesFormProps = {
  patientId: string;
  initialData: {
    session_duration_individual: number;
    session_duration_couple: number;
    session_duration_family: number;
    rate_individual: number;
    rate_couple: number;
    rate_family: number;
  };
  onSave: () => void;
};

export default function SessionRatesForm({ patientId, initialData, onSave }: SessionRatesFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [durationIndividual, setDurationIndividual] = useState(initialData.session_duration_individual || 45);
  const [durationCouple, setDurationCouple] = useState(initialData.session_duration_couple || 60);
  const [durationFamily, setDurationFamily] = useState(initialData.session_duration_family || 75);
  
  const [rateIndividual, setRateIndividual] = useState(initialData.rate_individual || 90);
  const [rateCouple, setRateCouple] = useState(initialData.rate_couple || 130);
  const [rateFamily, setRateFamily] = useState(initialData.rate_family || 150);

  async function handleSave() {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          session_duration_individual: durationIndividual,
          session_duration_couple: durationCouple,
          session_duration_family: durationFamily,
          rate_individual: rateIndividual,
          rate_couple: rateCouple,
          rate_family: rateFamily
        })
        .eq('id', patientId);

      if (error) throw error;
      
      alert('✅ Tariffe salvate!');
      setIsEditing(false);
      onSave();
    } catch (e: any) {
      alert('Errore: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span>💰</span> Tariffe e Durate Sedute
        </h3>
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
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2">👤 Individuale</div>
            <div className="font-semibold text-lg">€{rateIndividual}</div>
            <div className="text-sm text-gray-600">{durationIndividual} minuti</div>
          </div>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2">👥 Coppia</div>
            <div className="font-semibold text-lg">€{rateCouple}</div>
            <div className="text-sm text-gray-600">{durationCouple} minuti</div>
          </div>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2">👨‍👩‍👧‍👦 Famiglia</div>
            <div className="font-semibold text-lg">€{rateFamily}</div>
            <div className="text-sm text-gray-600">{durationFamily} minuti</div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Individuale */}
            <div className="border rounded-lg p-4">
              <label className="block text-sm font-medium mb-3">👤 Seduta Individuale</label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Durata (minuti)</label>
                  <input
                    type="number"
                    value={durationIndividual}
                    onChange={(e) => setDurationIndividual(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                    min="15"
                    step="15"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tariffa (€)</label>
                  <input
                    type="number"
                    value={rateIndividual}
                    onChange={(e) => setRateIndividual(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                    step="5"
                  />
                </div>
              </div>
            </div>

            {/* Coppia */}
            <div className="border rounded-lg p-4">
              <label className="block text-sm font-medium mb-3">👥 Seduta Coppia</label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Durata (minuti)</label>
                  <input
                    type="number"
                    value={durationCouple}
                    onChange={(e) => setDurationCouple(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                    min="15"
                    step="15"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tariffa (€)</label>
                  <input
                    type="number"
                    value={rateCouple}
                    onChange={(e) => setRateCouple(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                    step="5"
                  />
                </div>
              </div>
            </div>

            {/* Famiglia */}
            <div className="border rounded-lg p-4">
              <label className="block text-sm font-medium mb-3">👨‍👩‍👧‍👦 Seduta Famiglia</label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Durata (minuti)</label>
                  <input
                    type="number"
                    value={durationFamily}
                    onChange={(e) => setDurationFamily(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                    min="15"
                    step="15"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tariffa (€)</label>
                  <input
                    type="number"
                    value={rateFamily}
                    onChange={(e) => setRateFamily(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                    step="5"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {isSaving ? 'Salvataggio...' : '💾 Salva Tariffe'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
