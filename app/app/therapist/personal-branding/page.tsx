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

type LayoutTemplate = {
  id: string;
  name: string;
  platform: string[];
  usage_count: number;
};

type Stats = {
  totalPosts: number;
  draftPosts: number;
  readyPosts: number;
  thisWeekPosts: number;
  templatesCount: number;
  platformBreakdown: { instagram: number; facebook: number; linkedin: number };
};

export default function PersonalBrandingDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    draftPosts: 0,
    readyPosts: 0,
    thisWeekPosts: 0,
    templatesCount: 0,
    platformBreakdown: { instagram: 0, facebook: 0, linkedin: 0 }
  });
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([]);
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
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
        templatesCount: 0,
        platformBreakdown: {
          instagram: posts?.filter(p => p.platform === 'instagram').length || 0,
          facebook: posts?.filter(p => p.platform === 'facebook').length || 0,
          linkedin: posts?.filter(p => p.platform === 'linkedin').length || 0
        }
      };

      setStats(statsData);
      setRecentPosts(posts?.slice(0, 5) || []);

      // Carica template dell'utente
      const { data: userTemplates, error: templatesError } = await supabase
        .from('layout_templates')
        .select('id, name, platform, usage_count')
        .eq('therapist_user_id', user.id)
        .order('usage_count', { ascending: false })
        .limit(3);

      if (!templatesError && userTemplates) {
        setTemplates(userTemplates);
        setStats(prev => ({ ...prev, templatesCount: userTemplates.length }));
      }

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
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          <p><strong>Errore:</strong> {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📱 Personal Branding</h1>
          <p className="text-gray-600 mt-1">Crea contenuti professionali per i social media</p>
        </div>
        
        <div className="flex gap-3">
          <Link 
            href="/app/therapist/personal-branding/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            🚀 Crea Post
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
              <p className="text-sm text-gray-600">Post Totali</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-full">
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.draftPosts}</p>
              <p className="text-sm text-gray-600">Bozze</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-full">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.readyPosts}</p>
              <p className="text-sm text-gray-600">Pronti</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-full">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeekPosts}</p>
              <p className="text-sm text-gray-600">Questa Settimana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">🤖 Agenti Creator</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <Link href="/app/therapist/personal-branding/create?platform=instagram" 
                className="bg-white/20 rounded-lg p-6 hover:bg-white/30 transition-colors text-center">
            <div className="text-4xl mb-3">📸</div>
            <h3 className="text-lg font-semibold mb-2">Agente Instagram</h3>
            <p className="text-sm opacity-90">Post visuali, Stories, contenuti engaging</p>
            <div className="mt-3 text-xs bg-white/20 rounded px-3 py-1 inline-block">
              {stats.platformBreakdown.instagram} post creati
            </div>
          </Link>

          <Link href="/app/therapist/personal-branding/create?platform=facebook" 
                className="bg-white/20 rounded-lg p-6 hover:bg-white/30 transition-colors text-center">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-lg font-semibold mb-2">Agente Facebook</h3>
            <p className="text-sm opacity-90">Community building, articoli lunghi</p>
            <div className="mt-3 text-xs bg-white/20 rounded px-3 py-1 inline-block">
              {stats.platformBreakdown.facebook} post creati
            </div>
          </Link>

          <Link href="/app/therapist/personal-branding/create?platform=linkedin" 
                className="bg-white/20 rounded-lg p-6 hover:bg-white/30 transition-colors text-center">
            <div className="text-4xl mb-3">💼</div>
            <h3 className="text-lg font-semibold mb-2">Agente LinkedIn</h3>
            <p className="text-sm opacity-90">Contenuti professionali, networking</p>
            <div className="mt-3 text-xs bg-white/20 rounded px-3 py-1 inline-block">
              {stats.platformBreakdown.linkedin} post creati
            </div>
          </Link>

        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Posts */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">📝 Post Recenti</h3>
            <Link href="/app/therapist/personal-branding/posts" className="text-blue-600 text-sm hover:underline">
              Vedi tutti
            </Link>
          </div>
          
          {recentPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-3">📝</div>
              <p>Nessun post ancora</p>
              <p className="text-sm">Inizia creando il tuo primo contenuto!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map(post => (
                <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPlatformIcon(post.platform)}</span>
                      <span className="text-sm font-medium capitalize">{post.platform}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                      {post.status === 'draft' ? 'Bozza' : post.status === 'ready' ? 'Pronto' : 'Pubblicato'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(post.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Templates & Tools */}
        <div className="space-y-6">
          
          {/* Templates */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🎨 I Tuoi Template</h3>
              <Link href="/app/therapist/personal-branding/templates" className="text-blue-600 text-sm hover:underline">
                Gestisci
              </Link>
            </div>
            
            {templates.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <div className="text-3xl mb-2">🎨</div>
                <p className="text-sm">Nessun template personalizzato</p>
                <Link href="/app/therapist/personal-branding/templates/create" 
                      className="text-blue-600 text-sm hover:underline">
                  Crea il primo template
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-gray-600">
                        {template.platform.join(', ')} • {template.usage_count} utilizzi
                      </p>
                    </div>
                    <button className="text-blue-600 text-sm hover:underline">Usa</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Tools */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">⚡ Strumenti Rapidi</h3>
            <div className="space-y-3">
              
              <Link href="/app/therapist/personal-branding/templates" 
                    className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 transition-colors">
                <span className="text-2xl">🎨</span>
                <div>
                  <p className="font-medium text-sm">Template Designer</p>
                  <p className="text-xs text-gray-600">Crea layout personalizzati</p>
                </div>
              </Link>

              <Link href="/app/therapist/personal-branding/calendar" 
                    className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 transition-colors">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-medium text-sm">Calendario Editoriale</p>
                  <p className="text-xs text-gray-600">Pianifica contenuti</p>
                </div>
              </Link>

              <Link href="/app/therapist/personal-branding/settings" 
                    className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 transition-colors">
                <span className="text-2xl">⚙️</span>
                <div>
                  <p className="font-medium text-sm">Impostazioni</p>
                  <p className="text-xs text-gray-600">Profilo e preferenze</p>
                </div>
              </Link>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
