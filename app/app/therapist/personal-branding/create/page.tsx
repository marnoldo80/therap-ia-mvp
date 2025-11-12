'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

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
      // Simuliamo la chiamata API per ora (senza l'API vera)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Contenuto mock generato
      const mockContent: GeneratedContent = {
        title: `${selectedCategory === 'educational' ? '🧠 ' : selectedCategory === 'awareness' ? '💡 ' : selectedCategory === 'personal' ? '🌱 ' : '📢 '}Post su ${topic}`,
        content: `Questo è un post ${CATEGORIES[selectedCategory].title.toLowerCase()} su "${topic}".\n\n✅ Contenuto educativo e professionale\n🎯 Mirato per ${getPlatformConfig(selectedPlatform).name}\n💡 Basato su evidenze scientifiche\n\n${selectedCategory === 'educational' ? 'Cosa ne pensi? Condividi la tua esperienza nei commenti!' : selectedCategory === 'awareness' ? 'Ricorda: chiedere aiuto è un segno di forza, non di debolezza.' : selectedCategory === 'personal' ? 'Questa è la mia esperienza personale. Qual è la tua?' : 'Per maggiori informazioni, non esitare a contattarmi.'}`,
        hashtags: ['psicologia', 'benessere', 'salutementale', selectedCategory, selectedPlatform]
      };

      setGeneratedContent(mockContent);
      setEditedContent(mockContent.content);
      setEditedHashtags(mockContent.hashtags);
      setStep(3);

    } catch (e: any) {
      setError('Errore nella generazione del contenuto. Per ora stiamo usando contenuti mock.');
    } finally {
      setIsGenerating(false);
    }
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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/app/therapist/personal-branding" className="text-blue-600 hover:underline">
          ← Personal Branding
        </Link>
        <div>
          <h1 className="text-2xl font-bold">🤖 Content Creator</h1>
          <p className="text-gray-600">Agente specializzato per creazione contenuti social</p>
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          <p><strong>Errore:</strong> {error}</p>
        </div>
      )}

      {/* Step 1: Platform & Category */}
      {step === 1 && (
        <div className="space-y-8">
          
          {/* Platform Selection */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📱 Scegli Piattaforma</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['instagram', 'facebook', 'linkedin'] as Platform[]).map((platform) => {
                const config = getPlatformConfig(platform);
                return (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    className={`p-6 border rounded-lg text-center transition-all ${
                      selectedPlatform === platform
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{config.icon}</div>
                    <h3 className="font-semibold mb-1">{config.name}</h3>
                    <p className="text-sm text-gray-600">{config.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Max {config.maxLength} caratteri</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selection */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🎯 Tipo di Contenuto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(CATEGORIES) as [ContentCategory, typeof CATEGORIES[ContentCategory]][]).map(([category, config]) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-6 border rounded-lg text-left transition-all ${
                    selectedCategory === category
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{config.icon}</span>
                    <h3 className="font-semibold">{config.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                  <div className="text-xs text-gray-500">
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
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">✏️ Inserisci il Topic</h3>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Es: Tecniche di rilassamento per l'ansia, Come riconoscere i sintomi della depressione..."
              className="w-full border rounded-lg p-4 min-h-[100px] focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300"
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
          
          {/* Preview */}
          <div className={`bg-gradient-to-r ${platformConfig.color} rounded-lg p-6 text-white`}>
            <h2 className="text-xl font-semibold mb-2">✨ Contenuto Generato</h2>
            <p className="opacity-90">Puoi modificare il testo e gli hashtag prima di salvare</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Edit Content */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold mb-4">📝 Modifica Contenuto</h3>
              
              {generatedContent.title && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titolo</label>
                  <input
                    type="text"
                    value={generatedContent.title}
                    readOnly
                    className="w-full border rounded-lg p-3 bg-gray-50 text-sm"
                  />
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenuto ({editedContent.length}/{platformConfig.maxLength})
                </label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full border rounded-lg p-3 min-h-[300px] focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editedHashtags.map((hashtag, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      #{hashtag}
                      <button
                        onClick={() => setEditedHashtags(prev => prev.filter((_, i) => i !== index))}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Aggiungi hashtag (senza #)"
                  className="w-full border rounded-lg p-2 text-sm"
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

            {/* Preview */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold mb-4">👁️ Anteprima {platformConfig.name}</h3>
              <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px]">
                
                {/* Instagram Preview */}
                {selectedPlatform === 'instagram' && (
                  <div className="max-w-sm mx-auto bg-white rounded-lg border shadow-sm">
                    <div className="p-3 border-b flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-sm">dr.cognome</p>
                        <p className="text-xs text-gray-600">Psicoterapeuta</p>
                      </div>
                    </div>
                    
                    <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-gray-500">
                      <span className="text-4xl">🧠</span>
                    </div>
                    
                    <div className="p-3">
                      <p className="text-sm whitespace-pre-wrap">{editedContent}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {editedHashtags.slice(0, 5).map((tag, i) => (
                          <span key={i} className="text-xs text-blue-600">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Other platforms preview */}
                {selectedPlatform !== 'instagram' && (
                  <div className="bg-white rounded-lg border shadow-sm p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{platformConfig.icon}</span>
                      <div>
                        <p className="font-semibold">Dr. Cognome - Psicoterapeuta</p>
                        <p className="text-xs text-gray-600">{platformConfig.name}</p>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap mb-3">{editedContent}</p>
                    <div className="flex flex-wrap gap-1">
                      {editedHashtags.map((tag, i) => (
                        <span key={i} className="text-xs text-blue-600">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300"
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
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <ContentCreatorInner />
    </Suspense>
  );
}
