'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SocialPost = {
  id: string;
  platform: string;
  content: string;
  status: string;
  created_at: string;
};

type Stats = {
  totalPosts: number;
  draftPosts: number;
  readyPosts: number;
  thisWeekPosts: number;
  platformBreakdown: { instagram: number; facebook: number; linkedin: number };
};

const PROFESSIONAL_TEMPLATES = [
  {
    id: 'anxiety-tips',
    name: 'Gestione Ansia',
    category: 'Educativo',
    platforms: ['instagram', 'facebook'],
    preview: 'Tecniche pratiche per gestire l\'ansia quotidiana',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'therapy-myths',
    name: 'Miti sulla Terapia',
    category: 'Sensibilizzazione',
    platforms: ['linkedin', 'facebook'],
    preview: 'Sfatiamo i pregiudizi sulla psicoterapia',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'self-care',
    name: 'Autocura',
    category: 'Benessere',
    platforms: ['instagram', 'facebook'],
    preview: 'Consigli per prendersi cura di sé',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'workplace-stress',
    name: 'Stress Lavoro',
    category: 'Professionale',
    platforms: ['linkedin'],
    preview: 'Come gestire lo stress sul posto di lavoro',
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'relationships',
    name: 'Relazioni Sane',
    category: 'Educativo',
    platforms: ['instagram', 'facebook'],
    preview: 'Costruire relazioni interpersonali positive',
    color: 'from-pink-500 to-pink-600'
  },
  {
    id: 'depression-awareness',
    name: 'Awareness Depressione',
    category: 'Sensibilizzazione',
    platforms: ['facebook', 'linkedin'],
    preview: 'Riconoscere i segni della depressione',
    color: 'from-indigo-500 to-indigo-600'
  }
];

export default function SocialMediaSection() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    draftPosts: 0,
    readyPosts: 0,
    thisWeekPosts: 0,
    platformBreakdown: { instagram: 0, facebook: 0, linkedin: 0 }
  });
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSocialData();
  }, []);

  async function loadSocialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Carica statistiche posts
      const { data: posts, error: postsError } = await supabase
        .from('social_posts')
        .select('id, platform, content, status, created_at')
        .eq('therapist_user_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Calcola statistiche
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const statsData: Stats = {
        totalPosts: posts?.length || 0,
        draftPosts: posts?.filter(p => p.status === 'draft').length || 0,
        readyPosts: posts?.filter(p => p.status === 'ready').length || 0,
        thisWeekPosts: posts?.filter(p => new Date(p.created_at) >= oneWeekAgo).length || 0,
        platformBreakdown: {
          instagram: posts?.filter(p => p.platform === 'instagram').length || 0,
          facebook: posts?.filter(p => p.platform === 'facebook').length || 0,
          linkedin: posts?.filter(p => p.platform === 'linkedin').length || 0
        }
      };

      setStats(statsData);
      setRecentPosts(posts?.slice(0, 5) || []);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return '📸';
      case 'facebook': return '👥';
      case 'linkedin': return '💼';
      default: return '📱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6" style={{ color: 'white' }}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white/10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-white">📱 Social Media</h1>
          <p style={{ color: '#a8b2d6' }}>Contenuti professionali per i tuoi canali social</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-lg p-6" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-full">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalPosts}</p>
              <p className="text-sm" style={{ color: '#a8b2d6' }}>Post Totali</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-full">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.readyPosts}</p>
              <p className="text-sm" style={{ color: '#a8b2d6' }}>Pronti</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-full">
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.draftPosts}</p>
              <p className="text-sm" style={{ color: '#a8b2d6' }}>Bozze</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-full">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.thisWeekPosts}</p>
              <p className="text-sm" style={{ color: '#a8b2d6' }}>Questa Settimana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Post Creator */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Create New Post */}
          <div className="rounded-lg p-6" style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 className="text-2xl font-bold text-white mb-4">🚀 Crea Nuovo Post</h2>
            <p className="text-blue-100 mb-6">Scegli una piattaforma e inizia a creare contenuti professionali con l'aiuto dell'IA</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                href="/app/therapist/personal-branding/create?platform=instagram"
                className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors text-center"
                style={{ textDecoration: 'none' }}
              >
                <div className="text-3xl mb-2">📸</div>
                <h3 className="text-lg font-semibold text-white mb-1">Instagram</h3>
                <p className="text-sm text-blue-100">Post visuali e Stories</p>
                <div className="mt-2 text-xs bg-white/20 rounded px-2 py-1 inline-block text-white">
                  {stats.platformBreakdown.instagram} post
                </div>
              </Link>

              <Link 
                href="/app/therapist/personal-branding/create?platform=facebook"
                className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors text-center"
                style={{ textDecoration: 'none' }}
              >
                <div className="text-3xl mb-2">👥</div>
                <h3 className="text-lg font-semibold text-white mb-1">Facebook</h3>
                <p className="text-sm text-blue-100">Community e articoli</p>
                <div className="mt-2 text-xs bg-white/20 rounded px-2 py-1 inline-block text-white">
                  {stats.platformBreakdown.facebook} post
                </div>
              </Link>

              <Link 
                href="/app/therapist/personal-branding/create?platform=linkedin"
                className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors text-center"
                style={{ textDecoration: 'none' }}
              >
                <div className="text-3xl mb-2">💼</div>
                <h3 className="text-lg font-semibold text-white mb-1">LinkedIn</h3>
                <p className="text-sm text-blue-100">Contenuti professionali</p>
                <div className="mt-2 text-xs bg-white/20 rounded px-2 py-1 inline-block text-white">
                  {stats.platformBreakdown.linkedin} post
                </div>
              </Link>
            </div>
          </div>

          {/* Professional Templates */}
          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">🎨 Template Professionali</h3>
                <p style={{ color: '#a8b2d6' }}>Template ottimizzati per psicologi e terapeuti</p>
              </div>
              <Link 
                href="/app/therapist/personal-branding/templates"
                style={{ color: '#60a5fa', textDecoration: 'none' }}
                className="text-sm hover:underline"
              >
                Vedi tutti →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROFESSIONAL_TEMPLATES.slice(0, 4).map(template => (
                <div key={template.id} className="rounded-lg p-4 transition-all duration-200 hover:scale-105" style={{
                  background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                  '--tw-gradient-from': template.color.split(' ')[1],
                  '--tw-gradient-to': template.color.split(' ')[3]
                } as any}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white">{template.name}</h4>
                    <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 mb-3">{template.preview}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {template.platforms.map(platform => (
                        <span key={platform} className="text-lg">
                          {getPlatformIcon(platform)}
                        </span>
                      ))}
                    </div>
                    <button 
                      onClick={() => router.push(`/app/therapist/personal-branding/create?template=${template.id}`)}
                      className="text-xs bg-white text-gray-900 px-3 py-1 rounded font-medium hover:bg-gray-100 transition-colors"
                    >
                      Usa Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Recent Posts */}
          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="text-lg font-bold text-white mb-4">📝 Post Recenti</h3>
            
            {recentPosts.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">📝</div>
                <p style={{ color: '#a8b2d6' }} className="text-sm">Nessun post ancora</p>
                <Link 
                  href="/app/therapist/personal-branding/create"
                  className="text-blue-400 text-sm hover:underline"
                  style={{ textDecoration: 'none' }}
                >
                  Crea il primo post
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPosts.map(post => (
                  <div key={post.id} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPlatformIcon(post.platform)}</span>
                        <span className="text-sm font-medium text-white capitalize">{post.platform}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        post.status === 'draft' ? 'bg-yellow-500/20 text-yellow-300' : 
                        post.status === 'ready' ? 'bg-green-500/20 text-green-300' : 
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {post.status === 'draft' ? 'Bozza' : post.status === 'ready' ? 'Pronto' : 'Pubblicato'}
                      </span>
                    </div>
                    <p className="text-xs line-clamp-2" style={{ color: '#a8b2d6' }}>
                      {post.content.substring(0, 80)}...
                    </p>
                    <p className="text-xs mt-2" style={{ color: '#64748b' }}>
                      {new Date(post.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content Calendar Preview */}
          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="text-lg font-bold text-white mb-4">📅 Calendario Editoriale</h3>
            <div className="text-center py-6">
              <div className="text-3xl mb-2">📅</div>
              <p style={{ color: '#a8b2d6' }} className="text-sm mb-3">Pianifica i tuoi contenuti</p>
              <button 
                className="text-xs px-4 py-2 rounded font-medium opacity-50"
                style={{ backgroundColor: '#374151', color: 'white' }}
                disabled
              >
                Prossimamente
              </button>
            </div>
          </div>

          {/* Analytics Preview */}
          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="text-lg font-bold text-white mb-4">📊 Analytics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: '#a8b2d6' }} className="text-sm">Engagement Rate</span>
                <span className="text-white text-sm font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#a8b2d6' }} className="text-sm">Reach Mensile</span>
                <span className="text-white text-sm font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#a8b2d6' }} className="text-sm">Post Popolari</span>
                <span className="text-white text-sm font-medium">--</span>
              </div>
              <div className="text-center pt-3">
                <button 
                  className="text-xs px-4 py-2 rounded font-medium opacity-50"
                  style={{ backgroundColor: '#374151', color: 'white' }}
                  disabled
                >
                  Prossimamente
                </button>
              </div>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="text-lg font-bold text-white mb-4">⚡ Strumenti</h3>
            <div className="space-y-3">
              <Link 
                href="/app/therapist/personal-branding/templates"
                className="flex items-center gap-3 p-3 rounded transition-colors duration-200"
                style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
                  textDecoration: 'none'
                }}
              >
                <span className="text-lg">🎨</span>
                <div>
                  <div className="font-medium text-sm">Template Manager</div>
                  <div className="text-xs opacity-80">Gestisci layout</div>
                </div>
              </Link>

              <button 
                className="flex items-center gap-3 p-3 rounded transition-colors duration-200 opacity-50 w-full"
                style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399'
                }}
                disabled
              >
                <span className="text-lg">📷</span>
                <div>
                  <div className="font-medium text-sm">Image Library</div>
                  <div className="text-xs opacity-80">Prossimamente</div>
                </div>
              </button>

              <button 
                className="flex items-center gap-3 p-3 rounded transition-colors duration-200 opacity-50 w-full"
                style={{ 
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#a855f7'
                }}
                disabled
              >
                <span className="text-lg">📊</span>
                <div>
                  <div className="font-medium text-sm">Hashtag Generator</div>
                  <div className="text-xs opacity-80">Prossimamente</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
