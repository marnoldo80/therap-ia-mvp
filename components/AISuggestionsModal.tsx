'use client';

type Suggestions = {
  obiettivi_generali: string[];
  obiettivi_specifici: string[];
  esercizi: string[];
  note: string;
};

type AISuggestionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  suggestions: Suggestions | null;
  onApply: (suggestions: Suggestions) => void;
  isLoading: boolean;
};

export default function AISuggestionsModal({ 
  isOpen, 
  onClose, 
  suggestions, 
  onApply,
  isLoading 
}: AISuggestionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              ✨ Suggerimenti IA per Piano Terapeutico
            </h2>
            <button 
              onClick={onClose} 
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Analisi del caso in corso...</p>
                <p className="text-sm text-gray-500 mt-2">L'IA sta elaborando i dati clinici</p>
              </div>
            </div>
          )}

          {!isLoading && suggestions && (
            <div className="space-y-6">
              {/* Nota clinica */}
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  💡 Razionale Clinico
                </h3>
                <p className="text-gray-700 text-sm">{suggestions.note}</p>
              </div>

              {/* Obiettivi Generali */}
              <div className="bg-white border rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  🎯 Obiettivi Generali
                </h3>
                <ul className="space-y-2">
                  {suggestions.obiettivi_generali.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                      <span className="text-purple-600 font-bold">{i + 1}.</span>
                      <span className="text-gray-800">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Obiettivi Specifici */}
              <div className="bg-white border rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  🎯 Obiettivi Specifici
                </h3>
                <ul className="space-y-2">
                  {suggestions.obiettivi_specifici.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                      <span className="text-blue-600 font-bold">{i + 1}.</span>
                      <span className="text-gray-800">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Esercizi */}
              <div className="bg-white border rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  💪 Esercizi Consigliati
                </h3>
                <ul className="space-y-2">
                  {suggestions.esercizi.map((ex, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                      <span className="text-emerald-600 font-bold">{i + 1}.</span>
                      <span className="text-gray-800">{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Avviso */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <p className="text-yellow-800">
                  ⚠️ <strong>Importante:</strong> Questi sono suggerimenti basati sull'IA. 
                  Rivedi sempre le proposte e adattale al tuo giudizio clinico professionale prima di applicarle.
                </p>
              </div>

              {/* Azioni */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button 
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Annulla
                </button>
                <button 
                  onClick={() => onApply(suggestions)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium"
                >
                  ✓ Applica Suggerimenti
                </button>
              </div>
            </div>
          )}

          {!isLoading && !suggestions && (
            <div className="text-center py-8 text-gray-500">
              Errore nel caricamento dei suggerimenti. Riprova.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
