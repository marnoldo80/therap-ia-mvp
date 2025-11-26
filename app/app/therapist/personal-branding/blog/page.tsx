'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type BlogCategory = 'educational' | 'case-studies' | 'professional' | 'news-trends';
type BlogArticle = {
  id: string;
  title: string;
  category: BlogCategory;
  content: string;
  excerpt: string;
  seo_title: string;
  meta_description: string;
  keywords: string[];
  status: 'draft' | 'ready';
  created_at: string;
  word_count: number;
};

export default function BlogHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const categories = [
    {
      id: 'educational',
      name: 'Articoli Educativi',
      icon: '🧠',
      description: 'Psico-educazione e divulgazione scientifica',
      color: 'from-blue-500 to-blue-600',
      examples: ['Gestione ansia', 'Tecniche CBT', 'Sviluppo emotivo']
    },
    {
      id: 'case-studies', 
      name: 'Case Studies',
      icon: '📋',
      description: 'Esempi clinici anonimi e metodologie',
      color: 'from-green-500 to-green-600',
      examples: ['Percorsi terapeutici', 'Risultati interventi', 'Metodologie']
    },
    {
      id: 'professional',
      name: 'Riflessioni Professionali',
      icon: '💭',
      description: 'Insights, esperienze e crescita professionale',
      color: 'from-purple-500 to-purple-600',
      examples: ['Etica professionale', 'Formazione continua', 'Burnout']
    },
    {
      id: 'news-trends',
      name: 'News & Trends',
      icon: '📈',
      description: 'Aggiornamenti settore e ricerche recenti',
      color: 'from-orange-500 to-orange-600',
      examples: ['Ricerche recenti', 'Innovazioni', 'Normative']
    }
  ];

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Per ora articoli mock - implementare tabella blog_articles
      setArticles([
        {
          id: '1',
          title: 'Gestire l\'ansia da prestazione nel lavoro',
          category: 'educational',
          content: '',
          excerpt: 'Strategie pratiche per affrontare l\'ansia da prestazione in ambito lavorativo...',
          seo_title: 'Come gestire l\'ansia da prestazione lavorativa - Psicologo',
          meta_description: 'Scopri tecniche efficaci per gestire l\'ansia da prestazione sul lavoro con l\'aiuto di uno psicologo esperto.',
          keywords: ['ansia', 'lavoro', 'prestazione', 'stress'],
          status: 'draft',
          created_at: new Date().toISOString(),
          word_count: 1250
        }
      ]);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6" style={{ color: 'white' }}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-white/10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
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
            <h1 className="text-3xl font-bold text-white">📝 Blog & Articoli</h1>
            <p style={{ color: '#a8b2d6' }}>Crea contenuti professionali per il tuo pubblico</p>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{articles.length}</div>
            <div className="text-sm text-gray-400">Articoli totali</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{articles.filter(a => a.status === 'draft').length}</div>
            <div className="text-sm text-gray-400">Bozze</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{articles.filter(a => a.status === 'ready').length}</div>
            <div className="text-sm text-gray-400">Pronti</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{Math.round(articles.reduce((acc, a) => acc + a.word_count, 0) / articles.length) || 0}</div>
            <div className="text-sm text-gray-400">Parole medie</div>
          </div>
        </div>

        {/* Category Selection */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">✍️ Crea nuovo articolo</h2>
            <p className="text-lg" style={{ color: '#a8b2d6' }}>Scegli la categoria del tuo articolo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => router.push(`/app/therapist/personal-branding/blog/editor?category=${category.id}`)}
                className="cursor-pointer rounded-lg p-6 transition-all hover:scale-105 border border-gray-600 bg-white/5 hover:border-purple-500"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-gradient-to-r ${category.color}`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{category.name}</h3>
                    <p className="text-gray-300 text-sm">{category.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <h4 className="font-medium text-white text-sm">Esempi di argomenti:</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.examples.map((example, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-white/10 rounded-full text-gray-300">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-white font-medium">🚀 Inizia Articolo →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Articles List */}
        {articles.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">📚 I tuoi articoli</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Tutti
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as BlogCategory)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <div key={article.id} className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-purple-500 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      article.status === 'ready' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-yellow-600 text-white'
                    }`}>
                      {article.status === 'ready' ? '✅ Pronto' : '📝 Bozza'}
                    </span>
                    <span className="text-2xl">
                      {categories.find(c => c.id === article.category)?.icon}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-white mb-2 line-clamp-2">{article.title}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{article.word_count} parole</span>
                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => router.push(`/app/therapist/personal-branding/blog/editor?id=${article.id}`)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700"
                    >
                      ✏️ Modifica
                    </button>
                    <button className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700">
                      📤 Export
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {articles.length === 0 && (
          <div className="text-center py-16 rounded-lg" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-white mb-4">Inizia a scrivere!</h3>
            <p className="text-gray-300 mb-6">
              Crea il tuo primo articolo professionale con l'aiuto dell'AI
            </p>
            <button
              onClick={() => router.push('/app/therapist/personal-branding/blog/editor')}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700"
            >
              ✍️ Scrivi Primo Articolo
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
