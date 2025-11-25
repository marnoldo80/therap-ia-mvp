'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import ImagePicker from '@/components/ImagePicker';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ContentCategory = 'educational' | 'awareness' | 'personal' | 'promotional';
type Platform = 'instagram' | 'facebook' | 'linkedin';
type CreationFlow = 'standard' | 'instagram-visual';

// Standard flow interfaces (per Facebook/LinkedIn)
interface GeneratedContent {
  title: string;
  content: string;
  hashtags: string[];
  imagePrompt?: string;
}

// Instagram flow interfaces
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
  preview?: string;
}

interface SelectedImage {
  type: 'stock' | 'upload' | 'gradient' | 'plain';
  data: any;
  prompt?: string;
}

const CATEGORIES = {
  educational: {
    icon: '🧠',
    title: 'Educativo',
    description: 'Psico-educazione, tips, spiegazioni scientifiche',
    examples: ['Tecniche per gestire l\'ansia', 'Come funziona la CBT', '5 miti sulla depressione']
  },
  awareness: {
    icon: '💡', 
    title: 'Sensibilizzazione',
    description: 'Awareness su disturbi, riduzione stigma',
    examples: ['Riconoscere i segni della depressione', 'Quando chiedere aiuto', 'Salute mentale sul lavoro']
  },
  personal: {
    icon: '🌱',
    title: 'Personale',
    description: 'Storytelling, behind-the-scenes, riflessioni',
    examples: ['Una giornata da psicologo', 'Perché ho scelto questa professione', 'Lezioni dai miei pazienti']
  },
  promotional: {
    icon: '📢',
    title: 'Promozionale', 
    description: 'Servizi, consultazioni, expertise',
    examples: ['I miei servizi di terapia', 'Nuove disponibilità', 'Specializzazioni']
  }
};

function ContentCreatorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  // Determina il flusso in base alla piattaforma
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
  const [currentFlow, setCurrentFlow] = useState<CreationFlow>('standard');
  
  // Standard flow state
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory>('educational');
  const [topic, setTopic] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedHashtags, setEditedHashtags] = useState<string[]>([]);
  
  // Instagram flow state
  const [igStep, setIgStep] = useState<'prompt' | 'text-selection' | 'visual-selection' | 'assembly'>('prompt');
  const [igPrompt, setIgPrompt] = useState('');
  const [textVariants, setTextVariants] = useState<TextVariant[]>([]);
  const [visualConcepts, setVisualConcepts] = useState<VisualConcept[]>([]);
  const [selectedText, setSelectedText] = useState<TextVariant | null>(null);
  const [selectedVisual, setSelectedVisual] = useState<VisualConcept | null>(null);
  
  // Shared state
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pre-seleziona piattaforma da URL e determina flusso
    const platform = searchParams?.get('platform');
    if (platform && ['instagram', 'facebook', 'linkedin'].includes(platform)) {
      setSelectedPlatform(platform as Platform);
      setCurrentFlow(platform === 'instagram' ? 'instagram-visual' : 'standard');
    }
  }, [searchParams]);

  const getPlatformConfig = (platform: Platform) => {
    switch (platform) {
      case 'instagram':
        return {
          icon: '📸',
          name: 'Instagram',
          description: 'Post visuali, Stories, contenuti engaging',
          maxLength: 2200,
          color: 'from-pink-500 to-rose-500'
        };
      case 'facebook':
        return {
          icon: '👥',
          name: 'Facebook', 
          description: 'Community building, articoli lunghi',
          maxLength: 4000,
          color: 'from-blue-500 to-blue-600'
        };
      case 'linkedin':
        return {
          icon: '💼',
          name: 'LinkedIn',
          description: 'Contenuti professionali, networking',
          maxLength: 3000,
          color: 'from-blue-600 to-indigo-600'
        };
      default:
        return {
          icon: '📱',
          name: platform,
          description: '',
          maxLength: 2200,
          color: 'from-gray-500 to-gray-600'
        };
    }
  };

  // ==================== STANDARD FLOW FUNCTIONS (Facebook/LinkedIn) ====================
  
  async function generateContent() {
    if (!topic.trim()) {
      setError('Inserisci un topic per il contenuto');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/social/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          category: selectedCategory,
          topic: topic,
          customPrompt: customPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedContent(data.content);
      setEditedContent(data.content.content);
      setEditedHashtags(data.content.hashtags || []);
      setStep(3);

    } catch (e: any) {
      setError(e.message || 'Errore nella generazione del contenuto');
    } finally {
      setIsGenerating(false);
    }
  }

  // ==================== INSTAGRAM FLOW FUNCTIONS ====================

  // Step 1: Generate text variants from prompt
  async function generateTextVariants() {
    if (!igPrompt.trim()) {
      setError('Inserisci una descrizione per il tuo post');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/instagram/generate-texts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: igPrompt })
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setTextVariants(data.variants || []);
      setIgStep('text-selection');

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
          originalPrompt: igPrompt 
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
      setIgStep('visual-selection');

    } catch (e: any) {
      setError(e.message || 'Errore nella generazione dei visual');
    } finally {
      setIsGenerating(false);
    }
  }

  // ==================== SHARED FUNCTIONS ====================

  function handleImageSelected(imageData: SelectedImage) {
    setSelectedImage(imageData);
    setError(null);
  }

  async function savePost(status: 'draft' | 'ready') {
    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      // Prepara i dati in base al flusso
      let contentData;
      if (currentFlow === 'instagram-visual' && selectedText) {
        contentData = {
          therapist_user_id: user.id,
          platform: selectedPlatform,
          title: selectedText.title,
          content: selectedText.content,
          hashtags: selectedText.hashtags,
          category: selectedText.style,
          image_data: selectedImage,
          status: status
        };
      } else if (generatedContent) {
        contentData = {
          therapist_user_id: user.id,
          platform: selectedPlatform,
          title: generatedContent.title,
          content: editedContent,
          hashtags: editedHashtags,
          category: selectedCategory,
          image_data: selectedImage,
          status: status
        };
      } else {
        throw new Error('Nessun contenuto da salvare');
      }

      const { error } = await supabase.from('social_posts').insert(contentData);

      if (error) throw error;

      // Successo
      router.push('/app/therapist/personal-branding?saved=true');
      
    } catch (e: any) {
      setError(e.message || 'Errore nel salvataggio');
    } finally {
      setIsSaving(false);
    }
  }

  // Reset functions
  function resetInstagramCreator() {
    setIgStep('prompt');
    setIgPrompt('');
    setTextVariants([]);
    setVisualConcepts([]);
    setSelectedText(null);
    setSelectedVisual(null);
    setSelectedImage(null);
    setError(null);
  }

  const platformConfig = getPlatformConfig(selectedPlatform);

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
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${platformConfig.color} flex items-center justify-center text-2xl`}>
                {platformConfig.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {currentFlow === 'instagram-visual' ? '🎨 Instagram Creator' : '🤖 Content Creator'}
                </h1>
                <p style={{ color: '#a8b2d6' }}>
                  {currentFlow === 'instagram-visual' 
                    ? 'Crea post Instagram professionali e stilizzati'
                    : 'Agente specializzato per creazione contenuti social'
                  }
                </p>
              </div>
            </div>
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

        {/* ==================== INSTAGRAM VISUAL FLOW ==================== */}
        {currentFlow === 'instagram-visual' && (
          <>
            {/* Instagram Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-4">
                {[
                  { id: 'prompt', name: 'Descrivi', icon: '✏️' },
                  { id: 'text-selection', name: 'Scegli Testo', icon: '📝' },
                  { id: 'visual-selection', name: 'Scegli Visual', icon: '🎨' },
                  { id: 'assembly', name: 'Assembla', icon: '🔧' }
                ].map((stepItem, index) => (
                  <div key={stepItem.id} className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      igStep === stepItem.id ? 'bg-pink-600 text-white' : 
                      index < ['prompt', 'text-selection', 'visual-selection', 'assembly'].indexOf(igStep) 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {stepItem.icon}
                    </div>
                    <span className={`text-sm font-medium ${
                      igStep === stepItem.id ? 'text-pink-400' : 'text-gray-400'
                    }`}>
                      {stepItem.name}
                    </span>
                    {index < 3 && (
                      <div className={`w-8 h-1 ${
                        index < ['prompt', 'text-selection', 'visual-selection'].indexOf(igStep) 
                          ? 'bg-green-600' 
                          : 'bg-gray-600'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Instagram Prompt Input */}
            {igStep === 'prompt' && (
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
                        value={igPrompt}
                        onChange={(e) => setIgPrompt(e.target.value)}
                        placeholder="Es: Post motivazionale sullo stress da lavoro, con consigli pratici per rilassarsi. Vuole trasmettere calma e professionalità."
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
                            onClick={() => setIgPrompt(example)}
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
                        disabled={!igPrompt.trim() || isGenerating}
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

            {/* Step 2: Instagram Text Selection */}
            {igStep === 'text-selection' && (
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
                    onClick={() => setIgStep('prompt')}
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

            {/* Step 3: Instagram Visual Selection */}
            {igStep === 'visual-selection' && selectedText && (
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
                    onClick={() => setIgStep('text-selection')}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700"
                  >
                    ← Cambia Testo
                  </button>
                  
                  <button
                    onClick={() => setIgStep('assembly')}
                    disabled={!selectedVisual}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-700 hover:to-rose-700 disabled:opacity-50"
                  >
                    🔧 Assembla Post →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Instagram Assembly */}
            {igStep === 'assembly' && selectedText && selectedVisual && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    🔧 Assembla il tuo post
                  </h2>
                  <p style={{ color: '#a8b2d6' }}>
                    Combina testo e visual, aggiungi elementi stilizzati
                  </p>
                </div>

                {/* Assembly workspace - placeholder for now */}
                <div className="bg-white/5 rounded-lg p-8">
                  <h3 className="text-lg font-semibold text-white mb-4">🚧 Assembly Workspace</h3>
                  
                  {/* Selected content preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">📝 Testo selezionato:</h4>
                      <p className="text-sm text-gray-300">{selectedText.content}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedText.hashtags.map((tag, index) => (
                          <span key={index} className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">🎨 Visual selezionato:</h4>
                      <p className="text-sm text-gray-300">{selectedVisual.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{selectedVisual.description}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setIgStep('visual-selection')}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700"
                    >
                      ← Modifica Visual
                    </button>
                    
                    <button
                      onClick={() => savePost('draft')}
                      disabled={isSaving}
                      className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : '💾 Salva Bozza'}
                    </button>
                    
                    <button
                      onClick={() => savePost('ready')}
                      disabled={isSaving}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : '✅ Salva Pronto'}
                    </button>
                    
                    <button
                      onClick={resetInstagramCreator}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
                    >
                      🔄 Ricomincia
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================== STANDARD FLOW (Facebook/LinkedIn) ==================== */}
        {currentFlow === 'standard' && (
          <>
            {/* Standard Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-4">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {stepNum}
                    </div>
                    {stepNum < 3 && (
                      <div className={`w-12 h-1 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Platform & Category */}
            {step === 1 && (
              <div className="space-y-8">
                
                {/* Platform Selection */}
                <div className="rounded-lg p-6" style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <h2 className="text-xl font-semibold mb-4 text-white">📱 Piattaforma: {platformConfig.name}</h2>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{platformConfig.icon}</span>
                      <div>
                        <h3 className="font-semibold text-white">{platformConfig.name}</h3>
                        <p className="text-sm" style={{ color: '#a8b2d6' }}>{platformConfig.description}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="rounded-lg p-6" style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <h2 className="text-xl font-semibold mb-4 text-white">🎯 Tipo di Contenuto</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.entries(CATEGORIES) as [ContentCategory, typeof CATEGORIES[ContentCategory]][]).map(([category, config]) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`p-6 border rounded-lg text-left transition-all ${
                          selectedCategory === category
                            ? 'border-blue-500 bg-blue-500/20 shadow-md'
                            : 'border-gray-500 hover:border-gray-400 hover:bg-white/5'
                        }`}
                        style={{ 
                          borderColor: selectedCategory === category ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                          backgroundColor: selectedCategory === category ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)'
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{config.icon}</span>
                          <h3 className="font-semibold text-white">{config.title}</h3>
                        </div>
                        <p className="text-sm mb-3" style={{ color: '#a8b2d6' }}>{config.description}</p>
                        <div className="text-xs" style={{ color: '#64748b' }}>
                          <p className="font-medium mb-1">Esempi:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {config.examples.map((example, i) => (
                              <li key={i}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
                  >
                    Avanti →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Topic & Generation */}
            {step === 2 && (
              <div className="space-y-6">
                
                {/* Selected Configuration Summary */}
                <div className={`bg-gradient-to-r ${platformConfig.color} rounded-lg p-6 text-white`}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-3xl">{platformConfig.icon}</span>
                    <div>
                      <h2 className="text-xl font-semibold">{platformConfig.name} - {CATEGORIES[selectedCategory].title}</h2>
                      <p className="opacity-90">{CATEGORIES[selectedCategory].description}</p>
                    </div>
                  </div>
                </div>

                {/* Topic Input */}
                <div className="rounded-lg p-6" style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <h3 className="text-lg font-semibold mb-4 text-white">✏️ Inserisci il Topic</h3>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Es: Tecniche di rilassamento per l'ansia, Come riconoscere i sintomi della depressione..."
                    className="w-full border rounded-lg p-4 min-h-[100px] focus:ring-2 focus:ring-blue-500 bg-white/10 text-white placeholder-gray-400"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700"
                  >
                    ← Indietro
                  </button>
                  <button
                    onClick={generateContent}
                    disabled={!topic.trim() || isGenerating}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generando...
                      </>
                    ) : (
                      <>🚀 Genera Contenuto</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Edit */}
            {step === 3 && generatedContent && (
              <div className="space-y-6">
                
                {/* Preview Header */}
                <div className={`bg-gradient-to-r ${platformConfig.color} rounded-lg p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">✨ Contenuto Generato</h2>
                      <p className="opacity-90">Modifica il testo e scegli l'immagine di sfondo</p>
                    </div>
                    <button
                      onClick={() => setShowImagePicker(!showImagePicker)}
                      className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      {showImagePicker ? '📝 Solo Testo' : '🖼️ Scegli Immagine'}
                    </button>
                  </div>
                </div>

                <div className={`grid gap-6 ${showImagePicker ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                  
                  {/* Edit Content */}
                  <div className="rounded-lg p-6" style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <h3 className="font-semibold mb-4 text-white">📝 Modifica Contenuto</h3>
                    
                    {generatedContent.title && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-white">Titolo</label>
                        <input
                          type="text"
                          value={generatedContent.title}
                          readOnly
                          className="w-full border rounded-lg p-3 text-sm bg-white/10 text-white"
                          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        />
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2 text-white">
                        Contenuto ({editedContent.length}/{platformConfig.maxLength})
                      </label>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full border rounded-lg p-3 min-h-[300px] focus:ring-2 focus:ring-blue-500 text-sm bg-white/10 text-white placeholder-gray-400"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Hashtags</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editedHashtags.map((hashtag, index) => (
                          <span key={index} className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-sm">
                            #{hashtag}
                            <button
                              onClick={() => setEditedHashtags(prev => prev.filter((_, i) => i !== index))}
                              className="ml-2 text-blue-300 hover:text-blue-100"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Aggiungi hashtag (senza #)"
                        className="w-full border rounded-lg p-2 text-sm bg-white/10 text-white placeholder-gray-400"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value && !editedHashtags.includes(value)) {
                              setEditedHashtags(prev => [...prev, value]);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Image Picker */}
                  {showImagePicker && (
                    <div className="rounded-lg p-6" style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <h3 className="font-semibold mb-4 text-white">🖼️ Scegli Immagine di Sfondo</h3>
                      <ImagePicker
                        onImageSelected={handleImageSelected}
                        currentImage={selectedImage?.data}
                      />
                      
                      {/* Preview dell'immagine selezionata */}
                      {selectedImage && (
                        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          <h4 className="text-sm font-medium text-white mb-2">Immagine Selezionata:</h4>
                          <div className="text-xs" style={{ color: '#a8b2d6' }}>
                            <span className="inline-block px-2 py-1 rounded" style={{ backgroundColor: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                              {selectedImage.type === 'stock' ? '📸 Stock Photo' :
                               selectedImage.type === 'upload' ? '📁 Upload Personale' :
                               selectedImage.type === 'gradient' ? '🎨 Sfondo Neutro' :
                               '⚪ Colore Unito'}
                            </span>
                            {selectedImage.prompt && (
                              <p className="mt-2">Prompt: {selectedImage.prompt}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Actions */}
                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700"
                  >
                    ← Rigenera
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => savePost('draft')}
                      disabled={isSaving}
                      className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : '💾 Salva Bozza'}
                    </button>
                    
                    <button
                      onClick={() => savePost('ready')}
                      disabled={isSaving}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : '✅ Salva Pronto'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default function ContentCreator() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6" style={{ backgroundColor: '#1a1f3a' }}>
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="h-64 bg-white/10 rounded"></div>
        </div>
      </div>
    }>
      <ContentCreatorInner />
    </Suspense>
  );
}
