'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type CreationStep = 'prompt' | 'text-selection' | 'visual-selection' | 'assembly';

interface TextVariant {
  id: string;
  title: string;
  content: string;
  hashtags: string[];
  style: 'motivational' | 'educational' | 'personal' | 'professional';
}

interface VisualConcept {
  id: string;
  name: string;
  description: string;
  style: string;
  colors: string[];
  elements: string[];
  preview: string; // base64 or URL
}

export default function InstagramCreator() {
  const router = useRouter();
  
  // State management
  const [currentStep, setCurrentStep] = useState<CreationStep>('prompt');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Generated content
  const [textVariants, setTextVariants] = useState<TextVariant[]>([]);
  const [visualConcepts, setVisualConcepts] = useState<VisualConcept[]>([]);
  
  // Selected choices
  const [selectedText, setSelectedText] = useState<TextVariant | null>(null);
  const [selectedVisual, setSelectedVisual] = useState<VisualConcept | null>(null);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Step 1: Generate text variants from prompt
  async function generateTextVariants() {
    if (!prompt.trim()) {
      setError('Inserisci una descrizione per il tuo post');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/instagram/generate-texts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setTextVariants(data.variants || []);
      setCurrentStep('text-selection');

    } catch (e: any) {
      setError(e.message || 'Errore nella generazione dei testi');
    } finally {
      setIsGenerating(false);
    }
  }

  // Step 2: Generate visual concepts
  async function generateVisualConcepts() {
    if (!selectedText) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/instagram/generate-visuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          textContent: selectedText,
          originalPrompt: prompt 
        })
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setVisualConcepts(data.concepts || []);
      setCurrentStep('visual-selection');

    } catch (e: any) {
      setError(e.message || 'Errore nella generazione dei visual');
    } finally {
      setIsGenerating(false);
    }
  }

  // Reset and start over
  function resetCreator() {
    setCurrentStep('prompt');
    setPrompt('');
    setTextVariants([]);
    setVisualConcepts([]);
    setSelectedText(null);
    setSelectedVisual(null);
    setError(null);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/app/therapist/personal-branding" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            ← Personal Branding
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-2xl">
                📸
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Instagram Creator</h1>
                <p style={{ color: '#a8b2d6' }}>Crea post Instagram professionali e stilizzati</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[
              { id: 'prompt', name: 'Descrivi', icon: '✏️' },
              { id: 'text-selection', name: 'Scegli Testo', icon: '📝' },
              { id: 'visual-selection', name: 'Scegli Visual', icon: '🎨' },
              { id: 'assembly', name: 'Assembla', icon: '🔧' }
            ].map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.id ? 'bg-pink-600 text-white' : 
                  index < ['prompt', 'text-selection', 'visual-selection', 'assembly'].indexOf(currentStep) 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {step.icon}
                </div>
                <span className={`text-sm font-medium ${
                  currentStep === step.id ? 'text-pink-400' : 'text-gray-400'
                }`}>
                  {step.name}
                </span>
                {index < 3 && (
                  <div className={`w-8 h-1 ${
                    index < ['prompt', 'text-selection', 'visual-selection'].indexOf(currentStep) 
                      ? 'bg-green-600' 
                      : 'bg-gray-600'
                  }`}></div>
                )}
              </div>
            ))}
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

        {/* Step 1: Prompt Input */}
        {currentStep === 'prompt' && (
          <div className="space-y-6">
            <div className="rounded-lg p-8" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  🎨 Descrivi il tuo post Instagram
                </h2>
                <p className="text-lg" style={{ color: '#a8b2d6' }}>
                  Spiega l'idea, il messaggio o il contenuto che vuoi comunicare
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="block text-lg font-medium text-white mb-3">
                    💭 La tua idea
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Es: Post motivazionale sullo stress da lavoro, con consigli pratici per rilassarsi. Vuol trasmettere calma e professionalità."
                    rows={6}
                    className="w-full border rounded-xl p-4 text-lg focus:ring-2 focus:ring-pink-500 bg-white/10 text-white placeholder-gray-400 border-gray-600"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  />
                  <p className="text-sm mt-2" style={{ color: '#64748b' }}>
                    Più dettagli dai, migliori saranno i risultati. Includi: messaggio, tono, stile desiderato.
                  </p>
                </div>

                {/* Quick Examples */}
                <div>
                  <p className="text-sm font-medium text-white mb-3">💡 Esempi di prompt:</p>
                  <div className="space-y-2">
                    {[
                      "Post educativo sull'ansia: sintomi fisici e come riconoscerli. Stile rassicurante e professionale.",
                      "Condivisione personale sul burnout dei terapeuti. Tono autentico e vulnerabile ma ispirante.",
                      "Tips pratici per la gestione dello stress quotidiano. Visivamente pulito e moderno.",
                      "Annuncio nuovi slot per terapia online. Elegante e accogliente, senza essere commerciale."
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(example)}
                        className="w-full text-left p-3 rounded-lg text-sm hover:bg-white/10 transition-colors"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#a8b2d6',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={generateTextVariants}
                    disabled={!prompt.trim() || isGenerating}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-all duration-200 shadow-lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generando varianti testo...
                      </>
                    ) : (
                      <>
                        🚀 Genera Varianti Testo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Text Selection */}
        {currentStep === 'text-selection' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                📝 Scegli la variante di testo
              </h2>
              <p style={{ color: '#a8b2d6' }}>
                Seleziona il testo che preferisci per il tuo post
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {textVariants.map((variant) => (
                <div
                  key={variant.id}
                  onClick={() => setSelectedText(variant)}
                  className={`cursor-pointer p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedText?.id === variant.id
                      ? 'border-pink-500 bg-pink-500/20'
                      : 'border-gray-600 bg-white/5 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${
                      variant.style === 'motivational' ? 'bg-orange-500' :
                      variant.style === 'educational' ? 'bg-blue-500' :
                      variant.style === 'personal' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`}></div>
                    <h3 className="font-semibold text-white">{variant.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-600 text-gray-300">
                      {variant.style}
                    </span>
                  </div>
                  
                  <p className="text-sm leading-relaxed mb-4 text-gray-300">
                    {variant.content}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {variant.hashtags.slice(0, 5).map((tag, index) => (
                      <span key={index} className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep('prompt')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700"
              >
                ← Modifica Prompt
              </button>
              
              <button
                onClick={generateVisualConcepts}
                disabled={!selectedText || isGenerating}
                className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generando visual...
                  </>
                ) : (
                  <>🎨 Genera Concept Visual</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Visual Selection */}
        {currentStep === 'visual-selection' && selectedText && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                🎨 Scegli lo stile visivo
              </h2>
              <p style={{ color: '#a8b2d6' }}>
                Seleziona il concept che meglio rappresenta il tuo messaggio
              </p>
            </div>

            {/* Selected Text Preview */}
            <div className="rounded-lg p-4" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h4 className="font-medium text-white mb-2">📝 Testo selezionato:</h4>
              <p className="text-sm text-gray-300">"{selectedText.content.substring(0, 100)}..."</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visualConcepts.map((concept) => (
                <div
                  key={concept.id}
                  onClick={() => setSelectedVisual(concept)}
                  className={`cursor-pointer rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedVisual?.id === concept.id
                      ? 'border-pink-500 bg-pink-500/20'
                      : 'border-gray-600 bg-white/5 hover:border-gray-500'
                  }`}
                >
                  {/* Visual Preview */}
                  <div className="aspect-square rounded-t-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-4xl">
                    🎨
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2">{concept.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{concept.description}</p>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Colori:</span>
                        <div className="flex gap-1 mt-1">
                          {concept.colors.map((color, index) => (
                            <div
                              key={index}
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: color }}
                            ></div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-xs font-medium text-gray-500">Elementi:</span>
                        <p className="text-xs text-gray-400 mt-1">{concept.elements.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep('text-selection')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700"
              >
                ← Cambia Testo
              </button>
              
              <button
                onClick={() => setCurrentStep('assembly')}
                disabled={!selectedVisual}
                className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-700 hover:to-rose-700 disabled:opacity-50"
              >
                🔧 Assembla Post →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Assembly */}
        {currentStep === 'assembly' && selectedText && selectedVisual && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                🔧 Assembla il tuo post
              </h2>
              <p style={{ color: '#a8b2d6' }}>
                Combina testo e visual, aggiungi elementi stilizzati
              </p>
            </div>

            {/* Assembly workspace will go here */}
            <div className="bg-white/5 rounded-lg p-8 text-center">
              <p className="text-white text-lg mb-4">🚧 Assembly Workspace</p>
              <p className="text-gray-400">Qui implementeremo l'editor per combinare testo + visual</p>
              
              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={() => setCurrentStep('visual-selection')}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700"
                >
                  ← Modifica Visual
                </button>
                
                <button
                  onClick={resetCreator}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
                >
                  🔄 Ricomincia
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
