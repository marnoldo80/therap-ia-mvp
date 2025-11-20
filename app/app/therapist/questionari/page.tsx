'use client';
import Link from 'next/link';

const questionari = [
  {
    id: 'gad7',
    name: 'GAD-7',
    description: 'Questionario per ansia generalizzata',
    icon: '📊',
    color: '#7aa2ff',
    available: true
  },
  {
    id: 'phq9',
    name: 'PHQ-9',
    description: 'Questionario per depressione',
    icon: '🧠',
    color: '#9333ea',
    available: false
  },
  {
    id: 'beck',
    name: 'Beck Depression',
    description: 'Inventario di Beck per depressione',
    icon: '📋',
    color: '#f59e0b',
    available: false
  },
];

export default function QuestionariPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
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
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'white' }}>📋 Gestione Questionari</h1>
        <p style={{ color: '#a8b2d6' }}>Seleziona un questionario da somministrare ai tuoi pazienti</p>
      </div>

      {/* Info Card */}
      <div className="rounded-lg p-4" style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <div className="flex items-start gap-3">
          <div className="text-xl">💡</div>
          <div>
            <h3 className="font-medium mb-1" style={{ color: 'white' }}>Come funziona</h3>
            <p className="text-sm" style={{ color: '#a8b2d6' }}>
              Per inviare questionari ai pazienti, vai nella scheda del paziente → Tab "Questionari". 
              Qui puoi visualizzare tutti i questionari disponibili e la panoramica generale.
            </p>
          </div>
        </div>
      </div>

      {/* Questionari Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questionari.map((q) => (
          <div
            key={q.id}
            className={`rounded-lg p-6 transition-all duration-200 ${q.available ? 'cursor-pointer hover:scale-105' : 'opacity-60'}`}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              ...(q.available && {
                ':hover': {
                  borderColor: q.color,
                  backgroundColor: 'rgba(255,255,255,0.08)'
                }
              })
            }}
            onClick={() => q.available && window.open(`/app/therapist/questionari/${q.id}`, '_blank')}
          >
            <div className="text-4xl mb-4">{q.icon}</div>
            
            <h3 className="font-semibold text-xl mb-2 flex items-center gap-2" style={{ color: 'white' }}>
              {q.name}
              {q.available ? (
                <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#22c55e', color: 'white' }}>
                  Disponibile
                </span>
              ) : (
                <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#6b7280', color: 'white' }}>
                  In sviluppo
                </span>
              )}
            </h3>
            
            <p className="text-sm mb-4" style={{ color: '#a8b2d6' }}>{q.description}</p>
            
            {q.available ? (
              <div className="flex gap-2">
                <Link
                  href={`/app/therapist/questionari/${q.id}`}
                  className="px-4 py-2 rounded font-medium transition-colors duration-200 text-center"
                  style={{ 
                    backgroundColor: q.color, 
                    color: 'white',
                    textDecoration: 'none'
                  }}
                >
                  Gestisci
                </Link>
              </div>
            ) : (
              <button
                disabled
                className="px-4 py-2 rounded font-medium opacity-50"
                style={{ backgroundColor: '#6b7280', color: 'white' }}
              >
                Non disponibile
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Statistics Section */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="rounded-lg p-6 text-center" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="text-2xl mb-2">📊</div>
          <h4 className="font-semibold" style={{ color: 'white' }}>Questionari Attivi</h4>
          <p className="text-2xl font-bold mt-1" style={{ color: '#7aa2ff' }}>1</p>
          <p className="text-sm" style={{ color: '#a8b2d6' }}>GAD-7 disponibile</p>
        </div>

        <div className="rounded-lg p-6 text-center" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="text-2xl mb-2">🔄</div>
          <h4 className="font-semibold" style={{ color: 'white' }}>In Sviluppo</h4>
          <p className="text-2xl font-bold mt-1" style={{ color: '#f59e0b' }}>2</p>
          <p className="text-sm" style={{ color: '#a8b2d6' }}>PHQ-9, Beck Depression</p>
        </div>

        <div className="rounded-lg p-6 text-center" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="text-2xl mb-2">🎯</div>
          <h4 className="font-semibold" style={{ color: 'white' }}>Completezza</h4>
          <p className="text-2xl font-bold mt-1" style={{ color: '#22c55e' }}>33%</p>
          <p className="text-sm" style={{ color: '#a8b2d6' }}>1 di 3 questionari</p>
        </div>
      </div>
    </div>
  );
}
