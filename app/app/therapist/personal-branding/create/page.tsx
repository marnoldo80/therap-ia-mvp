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

interface GeneratedContent {
  title: string;
  content: string;
  hashtags: string[];
  imagePrompt?: string;
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
  const [step, setStep] = useState(1);
  
  // Form state
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory>('educational');
  const [topic, setTopic] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Generated content
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedHashtags, setEditedHashtags] = useState<string[]>([]);
  
  // Image state - NUOVO
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(true);
  
  // Saving
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pre-seleziona piattaforma da URL se presente
    const platform = searchParams?.get('platform');
    if (platform && ['instagram', 'facebook', 'linkedin'].includes(platform)) {
      setSelectedPlatform(platform as Platform);
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

  // NUOVO - Handler per selezione immagine
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

      const { error } = await supabase.from('social_posts').insert({
        therapist_user_id: user.id,
        platform: selectedPlatform,
        title: generatedContent?.title || '',
        content: editedContent,
        hashtags: editedHashtags,
        agent_type: selectedPlatform,
        category: selectedCategory,
        image_data: selectedImage, // NUOVO - salva anche i dati immagine
        status: status
      });

      if (error) throw error;

      // Successo
      router.push('/app/therapist/personal-branding?saved=true');
      
    } catch (e: any) {
      setError(e.message || 'Errore nel salvataggio');
    } finally {
      setIsSaving(false);
    }
  }

  const platformConfig = getPlatformConfig(selectedPlatform);

  return (
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
          <h1 className="text-2xl font-bold text-white">🤖 Content Creator</h1>
          <p style={{ color: '#a8b2d6' }}>Agente specializzato per creazione contenuti social</p>
        </div>
      </div>

      {/* Progress Steps */}
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

      {error && (
        <div className="rounded p-4" style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444'
        }}>
          <p><strong>Errore:</strong> {error}</p>
        </div>
      )}

      {/* Step 1: Platform & Category */}
      {step === 1 && (
        <div className="space-y-8">
          
          {/* Platform Selection */}
          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 className="text-xl font-semibold mb-4 text-white">📱 Scegli Piattaforma</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['instagram', 'facebook', 'linkedin'] as Platform[]).map((platform) => {
                const config = getPlatformConfig(platform);
                return (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    className={`p-6 border rounded-lg text-center transition-all ${
                      selectedPlatform === platform
                        ? 'border-blue-500 bg-blue-500/20 shadow-md'
                        : 'border-gray-500 hover:border-gray-400 hover:bg-white/5'
                    }`}
                    style={{ 
                      borderColor: selectedPlatform === platform ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                      backgroundColor: selectedPlatform === platform ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <div className="text-3xl mb-2">{config.icon}</div>
                    <h3 className="font-semibold mb-1 text-white">{config.name}</h3>
                    <p className="text-sm" style={{ color: '#a8b2d6' }}>{config.description}</p>
                    <p className="text-xs mt-2" style={{ color: '#64748b' }}>Max {config.maxLength} caratteri</p>
                  </button>
                );
              })}
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

      {/* Step 3: Review & Edit CON NUOVO IMAGE PICKER */}
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

            {/* NUOVO - Image Picker */}
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

    </div>
  );
}

export default function ContentCreator() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="h-64 bg-white/10 rounded"></div>
        </div>
      </div>
    }>
      <ContentCreatorInner />
    </Suspense>
  );
}
