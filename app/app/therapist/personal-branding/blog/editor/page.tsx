'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type BlogCategory = 'educational' | 'case-studies' | 'professional' | 'news-trends';
type ContentStep = 'topic' | 'outline' | 'writing' | 'seo' | 'preview';

type BlogOutline = {
  title: string;
  sections: {
    heading: string;
    points: string[];
  }[];
  targetWordCount: number;
  keywords: string[];
};

type SEOData = {
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  slug: string;
};

function BlogEditorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ContentStep>('topic');
  const [error, setError] = useState<string | null>(null);

  // Input data
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory>('educational');
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [contentStyle, setContentStyle] = useState<'formal' | 'divulgativo' | 'personale' | 'scientifico'>('divulgativo');

  // Generated content
  const [outline, setOutline] = useState<BlogOutline | null>(null);
  const [articleContent, setArticleContent] = useState('');
  const [seoData, setSeoData] = useState<SEOData>({
    seoTitle: '',
    metaDescription: '',
    keywords: [],
    slug: ''
  });

  const contentRef = useRef<HTMLTextAreaElement>(null);

  const categories = {
    'educational': { name: 'Educativo', icon: '🧠', color: 'blue' },
    'case-studies': { name: 'Case Study', icon: '📋', color: 'green' },
    'professional': { name: 'Professionale', icon: '💭', color: 'purple' },
    'news-trends': { name: 'News & Trends', icon: '📈', color: 'orange' }
  };

  const styles = [
    { id: 'formal', name: 'Formale', desc: 'Linguaggio accademico e professionale' },
    { id: 'divulgativo', name: 'Divulgativo', desc: 'Accessibile al grande pubblico' },
    { id: 'personale', name: 'Personale', desc: 'Con tocchi di esperienza personale' },
    { id: 'scientifico', name: 'Scientifico', desc: 'Focus su ricerche e dati' }
  ];

  useEffect(() => {
    const category = searchParams?.get('category');
    if (category && ['educational', 'case-studies', 'professional', 'news-trends'].includes(category)) {
      setSelectedCategory(category as BlogCategory);
    }
  }, [searchParams]);

  async function generateOutline() {
    if (!topic.trim()) {
      setError('Inserisci un argomento per l\'articolo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/blog/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          category: selectedCategory,
          targetAudience,
          style: contentStyle
        })
      });

      if (!response.ok) throw new Error('Errore generazione outline');

      const data = await response.json();
      setOutline(data.outline);
      setCurrentStep('outline');

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateContent() {
    if (!outline) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/blog/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outline,
          category: selectedCategory,
          style: contentStyle
        })
      });

      if (!response.ok) throw new Error('Errore generazione contenuto');

      const data = await response.json();
      setArticleContent(data.content);
      setSeoData(data.seoData);
      setCurrentStep('writing');

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadMarkdown() {
    const markdown = `# ${outline?.title}

${articleContent}

## SEO Meta Data
- **Title:** ${seoData.seoTitle}
- **Description:** ${seoData.metaDescription}
- **Keywords:** ${seoData.keywords.join(', ')}
- **Slug:** ${seoData.slug}
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${seoData.slug || 'articolo'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadHTML() {
    const html = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seoData.seoTitle}</title>
    <meta name="description" content="${seoData.metaDescription}">
    <meta name="keywords" content="${seoData.keywords.join(', ')}">
    <style>
        body { font-family: Georgia, serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        p { margin-bottom: 15px; }
        .meta { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 30px; }
    </style>
</head>
<body>
    <div class="meta">
        <strong>Categoria:</strong> ${categories[selectedCategory].name}<br>
        <strong>Stile:</strong> ${styles.find(s => s.id === contentStyle)?.name}<br>
        <strong>Parole:</strong> ${articleContent.split(' ').length}
    </div>
    
    <h1>${outline?.title}</h1>
    
    ${articleContent.split('\n\n').map(paragraph => 
      paragraph.startsWith('##') 
        ? `<h2>${paragraph.replace('##', '').trim()}</h2>`
        : `<p>${paragraph}</p>`
    ).join('\n    ')}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${seoData.slug || 'articolo'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/app/therapist/personal-branding/blog" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            ← Blog Hub
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">✍️ Editor Articoli</h1>
            <p style={{ color: '#a8b2d6' }}>Crea contenuti professionali con l'AI</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="rounded-lg p-4" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="flex items-center justify-between mb-2">
            {['topic', 'outline', 'writing', 'seo', 'preview'].map((step, index) => (
              <div key={step} className={`flex items-center ${index < 4 ? 'flex-1' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step
                    ? 'bg-purple-600 text-white'
                    : ['topic', 'outline', 'writing'].indexOf(currentStep) > ['topic', 'outline', 'writing'].indexOf(step)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-300'
                }`}>
                  {index + 1}
                </div>
                {index < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    ['topic', 'outline', 'writing'].indexOf(currentStep) > ['topic', 'outline', 'writing'].indexOf(step)
                      ? 'bg-green-600'
                      : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Argomento</span>
            <span>Struttura</span>
            <span>Scrittura</span>
            <span>SEO</span>
            <span>Preview</span>
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

        {/* STEP 1: Topic Input */}
        {currentStep === 'topic' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">📝 Di cosa vuoi scrivere?</h2>
              <p style={{ color: '#a8b2d6' }}>Definisci l'argomento e lo stile del tuo articolo</p>
            </div>

            <div className="rounded-lg p-8" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div className="space-y-6">
                <div>
                  <label className="block font-medium text-white mb-2">Categoria</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(categories).map(([key, cat]) => (
                      <div
                        key={key}
                        onClick={() => setSelectedCategory(key as BlogCategory)}
                        className={`p-4 rounded-lg cursor-pointer transition-all border-2 text-center ${
                          selectedCategory === key
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-gray-600 bg-white/5 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-2xl mb-2">{cat.icon}</div>
                        <div className="font-medium text-white text-sm">{cat.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-white mb-2">Argomento Articolo *</label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Es: Tecniche di gestione dell'ansia per adolescenti, L'importanza del sonno per la salute mentale, Come riconoscere i sintomi del burnout..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-white mb-2">Target Audience</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Es: Genitori, Professionisti HR, Studenti universitari..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-white mb-4">Stile di Scrittura</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {styles.map(style => (
                      <div
                        key={style.id}
                        onClick={() => setContentStyle(style.id as any)}
                        className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                          contentStyle === style.id
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-gray-600 bg-white/5 hover:border-gray-500'
                        }`}
                      >
                        <h3 className="font-medium text-white mb-1">{style.name}</h3>
                        <p className="text-sm text-gray-400">{style.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateOutline}
                  disabled={loading || !topic.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 disabled:opacity-50"
                >
                  {loading ? 'Generando struttura...' : '🧠 Genera Struttura Articolo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Outline Review */}
        {currentStep === 'outline' && outline && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">📋 Struttura dell'articolo</h2>
              <p style={{ color: '#a8b2d6' }}>Rivedi e modifica la struttura prima di generare il contenuto</p>
            </div>

            <div className="rounded-lg p-8" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div className="space-y-6">
                <div>
                  <label className="block font-medium text-white mb-2">Titolo</label>
                  <input
                    type="text"
                    value={outline.title}
                    onChange={(e) => setOutline({...outline, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <h3 className="font-medium text-white mb-4">Sezioni Articolo</h3>
                  <div className="space-y-4">
                    {outline.sections.map((section, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <input
                          type="text"
                          value={section.heading}
                          onChange={(e) => {
                            const newSections = [...outline.sections];
                            newSections[index].heading = e.target.value;
                            setOutline({...outline, sections: newSections});
                          }}
                          className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-800 text-white font-medium mb-3"
                        />
                        <ul className="space-y-1">
                          {section.points.map((point, pointIndex) => (
                            <li key={pointIndex} className="text-gray-300 text-sm flex items-start gap-2">
                              <span className="text-purple-400 mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Parole Target</label>
                    <div className="text-lg font-bold text-white">{outline.targetWordCount}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Keywords</label>
                    <div className="flex flex-wrap gap-1">
                      {outline.keywords.map((keyword, index) => (
                        <span key={index} className="text-xs px-2 py-1 bg-purple-600 text-white rounded-full">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep('topic')}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700"
                  >
                    ← Modifica Argomento
                  </button>
                  <button
                    onClick={generateContent}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Scrivendo...' : '✍️ Genera Contenuto'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Content Writing */}
        {currentStep === 'writing' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">✍️ Il tuo articolo</h2>
              <p style={{ color: '#a8b2d6' }}>Modifica e perfeziona il contenuto generato</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-white">Contenuto Articolo</label>
                    <div className="text-sm text-gray-400">
                      {articleContent.split(' ').length} parole
                    </div>
                  </div>
                  <textarea
                    ref={contentRef}
                    value={articleContent}
                    onChange={(e) => setArticleContent(e.target.value)}
                    className="w-full px-4 py-4 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                    style={{ minHeight: '500px' }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="font-medium text-white mb-3">📊 Statistiche</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Parole:</span>
                      <span className="text-white">{articleContent.split(' ').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Caratteri:</span>
                      <span className="text-white">{articleContent.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tempo lettura:</span>
                      <span className="text-white">{Math.ceil(articleContent.split(' ').length / 200)} min</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="font-medium text-white mb-3">🎯 SEO Quick Edit</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Titolo SEO</label>
                      <input
                        type="text"
                        value={seoData.seoTitle}
                        onChange={(e) => setSeoData({...seoData, seoTitle: e.target.value})}
                        className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-800 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Meta Description</label>
                      <textarea
                        value={seoData.metaDescription}
                        onChange={(e) => setSeoData({...seoData, metaDescription: e.target.value})}
                        className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-800 text-white text-sm"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep('outline')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700"
              >
                ← Modifica Struttura
              </button>
              <button
                onClick={() => setCurrentStep('preview')}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                👁️ Anteprima & Export
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Preview & Export */}
        {currentStep === 'preview' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">👁️ Anteprima & Export</h2>
              <p style={{ color: '#a8b2d6' }}>Visualizza l'articolo finale e scarica i file</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg p-8 min-h-[600px]">
                  <div className="prose max-w-none">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">{outline?.title}</h1>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {articleContent}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="font-medium text-white mb-3">📊 SEO Preview</h3>
                  <div className="bg-gray-800 rounded p-3 text-sm">
                    <div className="text-blue-400 hover:underline cursor-pointer mb-1">
                      {seoData.seoTitle}
                    </div>
                    <div className="text-green-600 mb-1">
                      example.com/{seoData.slug}
                    </div>
                    <div className="text-gray-300 text-xs">
                      {seoData.metaDescription}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="font-medium text-white mb-3">📥 Download Files</h3>
                  <div className="space-y-3">
                    <button
                      onClick={downloadHTML}
                      className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700"
                    >
                      📄 Scarica HTML
                    </button>
                    <button
                      onClick={downloadMarkdown}
                      className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700"
                    >
                      📝 Scarica Markdown
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="font-medium text-white mb-3">📈 Statistiche Finali</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Categoria:</span>
                      <span className="text-white">{categories[selectedCategory].name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stile:</span>
                      <span className="text-white">{styles.find(s => s.id === contentStyle)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Parole:</span>
                      <span className="text-white">{articleContent.split(' ').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tempo lettura:</span>
                      <span className="text-white">{Math.ceil(articleContent.split(' ').length / 200)} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep('writing')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700"
              >
                ← Modifica Contenuto
              </button>
              <button
                onClick={() => {
                  setCurrentStep('topic');
                  setTopic('');
                  setArticleContent('');
                  setOutline(null);
                  setSeoData({ seoTitle: '', metaDescription: '', keywords: [], slug: '' });
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700"
              >
                🔄 Nuovo Articolo
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function BlogEditor() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1f3a' }}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/20 rounded w-64"></div>
          <div className="h-64 bg-white/10 rounded w-96"></div>
        </div>
      </div>
    }>
      <BlogEditorInner />
    </Suspense>
  );
}
