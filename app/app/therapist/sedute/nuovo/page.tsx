'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import AudioRecorder from '@/components/AudioRecorder';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Patient = { id: string; display_name: string | null };

function NuovaNotaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromUrl = searchParams?.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState(patientIdFromUrl || '');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Contenuti delle sezioni
  const [transcript, setTranscript] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [themes, setThemes] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);

  // Stati di modifica
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingThemes, setEditingThemes] = useState(false);
  const [editingObjectives, setEditingObjectives] = useState(false);
  const [editingExercises, setEditingExercises] = useState(false);

  // Stati di caricamento
  const [loadingGeneration, setLoadingGeneration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Contenuti temporanei per editing
  const [tempTranscript, setTempTranscript] = useState('');
  const [tempSummary, setTempSummary] = useState('');
  const [tempThemes, setTempThemes] = useState('');
  const [tempObjectives, setTempObjectives] = useState('');
  const [tempExercises, setTempExercises] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('patients')
        .select('id, display_name')
        .eq('therapist_user_id', user.id)
        .order('display_name');

      setPatients(data || []);
    } catch (e) {
      console.error('Errore caricamento pazienti:', e);
    }
  }

  const handleTranscriptComplete = (transcriptText: string) => {
    setTranscript(transcriptText);
    generateAllContent(transcriptText);
  };

  async function generateAllContent(transcriptText: string) {
    if (!patientId || !transcriptText.trim()) return;
    
    setLoadingGeneration(true);
    try {
      // Genera riassunto IA
      await generateSummary(transcriptText);
      
      // Genera temi
      await generateThemes(transcriptText);
      
      // Genera obiettivi ed esercizi
      await generateObjectivesAndExercises(transcriptText);
      
    } catch (e) {
      console.error('Errore generazione contenuti:', e);
    } finally {
      setLoadingGeneration(false);
    }
  }

  async function generateSummary(text: string) {
    try {
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary || '');
      }
    } catch (e) {
      console.error('Errore generazione riassunto:', e);
    }
  }

  async function generateThemes(text: string) {
    try {
      const response = await fetch('/api/generate-themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, patientId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setThemes(data.themes || []);
      }
    } catch (e) {
      console.error('Errore generazione temi:', e);
    }
  }

  async function generateObjectivesAndExercises(text: string) {
    try {
      const response = await fetch('/api/generate-objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setObjectives(data.obiettivi_specifici || []);
        setExercises(data.esercizi || []);
      }
    } catch (e) {
      console.error('Errore generazione obiettivi:', e);
    }
  }

  // Funzioni di salvataggio editing
  function saveTranscript() {
    setTranscript(tempTranscript);
    setEditingTranscript(false);
  }

  function saveSummary() {
    setAiSummary(tempSummary);
    setEditingSummary(false);
  }

  function saveThemes() {
    setThemes(tempThemes.split('\n').filter(t => t.trim()));
    setEditingThemes(false);
  }

  function saveObjectives() {
    setObjectives(tempObjectives.split('\n').filter(o => o.trim()));
    setEditingObjectives(false);
  }

  function saveExercises() {
    setExercises(tempExercises.split('\n').filter(e => e.trim()));
    setEditingExercises(false);
  }

  // Funzioni di avvio editing
  function startEditingTranscript() {
    setTempTranscript(transcript);
    setEditingTranscript(true);
  }

  function startEditingSummary() {
    setTempSummary(aiSummary);
    setEditingSummary(true);
  }

  function startEditingThemes() {
    setTempThemes(themes.join('\n'));
    setEditingThemes(true);
  }

  function startEditingObjectives() {
    setTempObjectives(objectives.join('\n'));
    setEditingObjectives(true);
  }

  function startEditingExercises() {
    setTempExercises(exercises.join('\n'));
    setEditingExercises(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      // Combina tutto in note strutturate
      let structuredNotes = '';
      
      if (transcript) {
        structuredNotes += '📝 TRASCRIZIONE SEDUTA:\n' + transcript + '\n\n';
      }
      
      if (aiSummary) {
        structuredNotes += '✨ RIASSUNTO IA:\n' + aiSummary + '\n\n';
      }
      
      if (themes.length > 0) {
        structuredNotes += '🎯 TEMI PRINCIPALI:\n' + themes.map(t => `• ${t}`).join('\n') + '\n\n';
      }
      
      if (objectives.length > 0) {
        structuredNotes += '🎯 OBIETTIVI EMERSI:\n' + objectives.map(o => `• ${o}`).join('\n') + '\n\n';
      }
      
      if (exercises.length > 0) {
        structuredNotes += '💪 ESERCIZI PROPOSTI:\n' + exercises.map(e => `• ${e}`).join('\n');
      }

      const { error } = await supabase.from('session_notes').insert({
        patient_id: patientId,
        therapist_user_id: user.id,
        session_date: sessionDate,
        notes: structuredNotes,
        ai_summary: aiSummary || null,
        themes: themes,
        transcript: transcript || null
      });

      if (error) throw error;

      alert('✅ Seduta salvata con successo!');
      router.push(`/app/therapist/pazienti/${patientId}`);
    } catch (e: any) {
      setErr(e?.message || 'Errore salvataggio');
    } finally {
      setLoading(false);
    }
  }

  const selectedPatient = patients.find(p => p.id === patientId);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
          {patientId && (
            <Link 
              href={`/app/therapist/pazienti/${patientId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              ← Scheda Paziente
            </Link>
          )}
        </div>
        
        <h1 className="text-3xl font-bold" style={{ color: 'white' }}>
          Nuova Seduta {selectedPatient ? `- ${selectedPatient.display_name}` : ''}
        </h1>
      </div>

      {err && (
        <div className="p-4 rounded-lg border" style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          color: '#ef4444'
        }}>
          {err}
        </div>
      )}

      {/* Selezione paziente e data */}
      <div className="rounded-lg p-6 space-y-4" style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Paziente *</label>
            <select
              required
              className="w-full rounded px-3 py-2 outline-none transition-colors duration-300"
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            >
              <option value="">-- Seleziona paziente --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.display_name || 'Senza nome'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Data seduta *</label>
            <input
              type="date"
              required
              className="w-full rounded px-3 py-2 outline-none transition-colors duration-300"
              style={{
                backgroundColor: '#0b0f1c',
                border: '2px solid #26304b',
                color: 'white'
              }}
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Registrazione Audio */}
      <div className="rounded-lg p-6" style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'white' }}>
          🎙️ Registrazione Audio Seduta
        </h3>
        <AudioRecorder onTranscriptComplete={handleTranscriptComplete} />
      </div>

      {loadingGeneration && (
        <div className="rounded-lg p-6 text-center" style={{
          background: 'rgba(147, 51, 234, 0.1)',
          border: '1px solid rgba(147, 51, 234, 0.3)'
        }}>
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
            <span style={{ color: 'white' }}>🤖 Generando contenuti IA...</span>
          </div>
        </div>
      )}

      {/* Sezione Trascrizione */}
      {transcript && (
        <div className="rounded-lg p-6" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'white' }}>
              📝 Trascrizione Seduta
            </h3>
            <button
              onClick={startEditingTranscript}
              className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
              style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}
            >
              ✏️ Modifica
            </button>
          </div>
          
          {editingTranscript ? (
            <div className="space-y-3">
              <textarea
                className="w-full rounded p-3 min-h-[150px] outline-none transition-colors duration-300"
                style={{
                  backgroundColor: '#0b0f1c',
                  border: '2px solid #26304b',
                  color: 'white'
                }}
                value={tempTranscript}
                onChange={(e) => setTempTranscript(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={saveTranscript} className="px-4 py-2 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#22c55e', color: 'white' }}>💾 Salva</button>
                <button onClick={() => setEditingTranscript(false)} className="px-4 py-2 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#6b7280', color: 'white' }}>Annulla</button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap" style={{ color: '#d1d5db' }}>{transcript}</p>
          )}
        </div>
      )}

      {/* Sezione Riassunto IA */}
      {aiSummary && (
        <div className="rounded-lg p-6" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'white' }}>
              ✨ Riassunto IA
            </h3>
            <button
              onClick={startEditingSummary}
              className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
              style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}
            >
              ✏️ Modifica
            </button>
          </div>
          
          {editingSummary ? (
            <div className="space-y-3">
              <textarea
                className="w-full rounded p-3 min-h-[150px] outline-none transition-colors duration-300"
                style={{
                  backgroundColor: '#0b0f1c',
                  border: '2px solid #26304b',
                  color: 'white'
                }}
                value={tempSummary}
                onChange={(e) => setTempSummary(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={saveSummary} className="px-4 py-2 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#22c55e', color: 'white' }}>💾 Salva</button>
                <button onClick={() => setEditingSummary(false)} className="px-4 py-2 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#6b7280', color: 'white' }}>Annulla</button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap" style={{ color: '#d1d5db' }}>{aiSummary}</p>
          )}
        </div>
      )}

      {/* Sezione Temi */}
      {themes.length > 0 && (
        <div className="rounded-lg p-6" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'white' }}>
              🎯 Temi Principali
            </h3>
            <button
              onClick={startEditingThemes}
              className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
              style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}
            >
              ✏️ Modifica
            </button>
          </div>
          
          {editingThemes ? (
            <div className="space-y-3">
              <textarea
                className="w-full rounded p-3 min-h-[100px] outline-none transition-colors duration-300"
                style={{
                  backgroundColor: '#0b0f1c',
                  border: '2px solid #26304b',
                  color: 'white'
                }}
                value={tempThemes}
                onChange={(e) => setTempThemes(e.target.value)}
                placeholder="Un tema per riga"
              />
              <div className="flex gap-2">
                <button onClick={saveThemes} className="px-4 py-2 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#22c55e', color: 'white' }}>💾 Salva</button>
                <button onClick={() => setEditingThemes(false)} className="px-4 py-2 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#6b7280', color: 'white' }}>Annulla</button>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {themes.map((theme, i) => (
                <li key={i} className="flex items-center gap-2" style={{ color: 'white' }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7aa2ff' }}></span>
                  {theme}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sezione Obiettivi */}
      {objectives.length > 0 && (
        <div className="rounded-lg p-6" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'white' }}>
              🎯 Obiettivi Emersi
            </h3>
            <button
              onClick={startEditingObjectives}
              className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
              style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}
            >
              ✏️ Modifica
            </button>
          </div>
          
          {editingObjectives ? (
            <div className="space-y-3">
              <textarea
                className="w-full rounded p-3 min-h-[100px] outline-none transition-colors duration-300"
                style={{
                  backgroundColor: '#0b0f1c',
                  border: '2px solid #26304b',
                  color: 'white'
                }}
                value={tempObjectives}
                onChange={(e) => setTempObjectives(e.target.value)}
                placeholder="Un obiettivo per riga"
              />
              <div className="flex gap-2">
                <button onClick={saveObjectives} className="px-4 py-2 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#22c55e', color: 'white' }}>💾 Salva</button>
                <button onClick={() => setEditingObjectives(false)} className="px-4 py-2 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#6b7280', color: 'white' }}>Annulla</button>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2" style={{ color: 'white' }}>
                  <span className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#22c55e' }}></span>
                  {obj}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sezione Esercizi */}
      {exercises.length > 0 && (
        <div className="rounded-lg p-6" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'white' }}>
              💪 Esercizi Proposti
            </h3>
            <button
              onClick={startEditingExercises}
              className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
              style={{ backgroundColor: '#7aa2ff', color: '#0b1022' }}
            >
              ✏️ Modifica
            </button>
          </div>
          
          {editingExercises ? (
            <div className="space-y-3">
              <textarea
                className="w-full rounded p-3 min-h-[100px] outline-none transition-colors duration-300"
                style={{
                  backgroundColor: '#0b0f1c',
                  border: '2px solid #26304b',
                  color: 'white'
                }}
                value={tempExercises}
                onChange={(e) => setTempExercises(e.target.value)}
                placeholder="Un esercizio per riga"
              />
              <div className="flex gap-2">
                <button onClick={saveExercises} className="px-4 py-2 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#22c55e', color: 'white' }}>💾 Salva</button>
                <button onClick={() => setEditingExercises(false)} className="px-4 py-2 rounded font-medium transition-colors duration-200" style={{ backgroundColor: '#6b7280', color: 'white' }}>Annulla</button>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {exercises.map((ex, i) => (
                <li key={i} className="flex items-start gap-2" style={{ color: 'white' }}>
                  <span className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#f59e0b' }}></span>
                  {ex}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Pulsanti di azione */}
      {(transcript || aiSummary || themes.length > 0) && (
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading || !patientId}
            className="px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            style={{
              backgroundColor: loading ? '#4b5563' : '#22c55e',
              color: 'white',
              opacity: loading || !patientId ? 0.7 : 1
            }}
          >
            {loading ? 'Salvando...' : '💾 Salva Seduta Completa'}
          </button>
          
          <Link
            href={patientId ? `/app/therapist/pazienti/${patientId}` : '/app/therapist'}
            className="px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            style={{ 
              backgroundColor: '#6b7280', 
              color: 'white',
              textDecoration: 'none'
            }}
          >
            Annulla
          </Link>
        </div>
      )}
    </div>
  );
}

export default function NuovaNotaSedutaPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-6" style={{ color: 'white' }}>Caricamento...</div>}>
      <NuovaNotaForm />
    </Suspense>
  );
}
