'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Stats = {
  totalPosts: number;
  draftPosts: number;
  readyPosts: number;
  thisWeekPosts: number;
  platformBreakdown: { instagram: number; facebook: number; linkedin: number };
};

export default function PersonalBrandingHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    draftPosts: 0,
    readyPosts: 0,
    thisWeekPosts: 0,
    platformBreakdown: { instagram: 0, facebook: 0, linkedin: 0 }
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: posts, error: postsError } = await supabase
        .from('social_posts')
        .select('platform, status, created_at')
        .eq('therapist_user_id', user.id);

      if (postsError) throw postsError;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const statsData: Stats = {
        totalPosts: posts?.length || 0,
        draftPosts: posts?.filter(p => p.status === 'draft').length || 0,
        readyPosts: posts?.filter(p => p.status === 'ready').length || 0,
        thisWeekPosts: posts?.filter(p => p.created_at && new Date(p.created_at) >= oneWeekAgo).length || 0,
        platformBreakdown: {
          instagram: posts?.filter(p => p.platform === 'instagram').length || 0,
          facebook: posts?.filter(p => p.platform === 'facebook').length || 0,
          linkedin: posts?.filter(p => p.platform === 'linkedin').length || 0
        }
      };

      setStats(statsData);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-white/10 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
      {/* Navigation Header */}
      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/logo-transparent-png.png" 
                alt="cIAo-doc" 
                style={{ height: '40px', width: 'auto' }}
              />
              <Link 
                href="/app/therapist" 
                className="text-white hover:text-blue-400 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="rounded-xl p-8 text-white shadow-lg" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div className="mb-4">
            <h1 className="text-3xl font-bold">Personal Branding Hub</h1>
            <p className="text-lg opacity-80">Costruisci la tua presenza digitale professionale</p>
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

        {/* 4 Sezioni Principali */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SOCIAL - Funzionante */}
          <div className="rounded-lg p-8 transition-all duration-200 hover:scale-105 cursor-pointer" style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
          onClick={() => router.push('/app/therapist/personal-branding/social')}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl" style={{
                background: 'rgba(255,255,255,0.2)'
              }}>
                📱
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Social Media</h2>
                <p className="text-blue-100">Instagram, Facebook, LinkedIn</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalPosts}</div>
                <div className="text-sm text-blue-100">Post creati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.readyPosts}</div>
                <div className="text-sm text-blue-100">Pronti</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.thisWeekPosts}</div>
                <div className="text-sm text-blue-100">Questa settimana</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-blue-100">
                <span className="text-lg">📸</span>
                <span>Instagram: {stats.platformBreakdown.instagram} post</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <span className="text-lg">👥</span>
                <span>Facebook: {stats.platformBreakdown.facebook} post</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <span className="text-lg">💼</span>
                <span>LinkedIn: {stats.platformBreakdown.linkedin} post</span>
              </div>
            </div>

            <div className="rounded-lg p-4 mt-6 text-center" style={{
              background: 'rgba(255,255,255,0.1)'
            }}>
              <div className="text-white font-medium">✅ Attivo</div>
              <div className="text-sm text-blue-100">Crea i tuoi post social</div>
            </div>
          </div>

          {/* WEBSITE - Ora attivo */}
          <div className="rounded-lg p-8 transition-all duration-200 hover:scale-105 cursor-pointer" style={{
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
          onClick={() => router.push('/app/therapist/personal-branding/website')}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl" style={{
                background: 'rgba(255,255,255,0.2)'
              }}>
                🌐
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Sito Web</h2>
                <p className="text-emerald-100">Landing page professionale</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-emerald-100">
                <span className="text-lg">🏠</span>
                <span>Template professionali</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-100">
                <span className="text-lg">✏️</span>
                <span>Editor drag & drop</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-100">
                <span className="text-lg">📱</span>
                <span>Design responsive</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-100">
                <span className="text-lg">📥</span>
                <span>Download HTML/CSS</span>
              </div>
            </div>

            <div className="rounded-lg p-4 text-center" style={{
              background: 'rgba(255,255,255,0.1)'
            }}>
              <div className="text-white font-medium">✅ Attivo</div>
              <div className="text-sm text-emerald-100">Crea il tuo sito web</div>
            </div>
          </div>

          {/* BLOG - Ora attivo */}
          <div className="rounded-lg p-8 transition-all duration-200 hover:scale-105 cursor-pointer" style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl" style={{
                background: 'rgba(255,255,255,0.2)'
              }}>
                📝
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Blog & Articoli</h2>
                <p className="text-purple-100">Content marketing SEO</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-purple-100">
                <span className="text-lg">📰</span>
                <span>Articoli professionali</span>
              </div>
              <div className="flex items-center gap-3 text-purple-100">
                <span className="text-lg">🔍</span>
                <span>Ottimizzazione SEO</span>
              </div>
              <div className="flex items-center gap-3 text-purple-100">
                <span className="text-lg">📊</span>
                <span>Analytics traffico</span>
              </div>
              <div className="flex items-center gap-3 text-purple-100">
                <span className="text-lg">📤</span>
                <span>Newsletter integrata</span>
              </div>
            </div>

            <div className="rounded-lg p-4 text-center" style={{
              background: 'rgba(255,255,255,0.1)'
            }}>
              <div className="text-white font-medium">✅ Attivo</div>
              <div className="text-sm text-red-100">Crea il tuo blog</div>
            </div>
          </div>

          {/* LOGO CREATOR */}
          <div className="rounded-lg p-8 transition-all duration-200 hover:scale-105 cursor-pointer" style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
          onClick={() => router.push('/app/therapist/personal-branding/logo')}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl" style={{
                background: 'rgba(255,255,255,0.2)'
              }}>
                🎨
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Logo & Brand</h2>
                <p className="text-red-100">Identità visiva professionale</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-red-100">
                <span className="text-lg">🧠</span>
                <span>Logo personalizzato</span>
              </div>
              <div className="flex items-center gap-3 text-red-100">
                <span className="text-lg">🎨</span>
                <span>Palette colori</span>
              </div>
              <div className="flex items-center gap-3 text-red-100">
                <span className="text-lg">📄</span>
                <span>Biglietti da visita</span>
              </div>
              <div className="flex items-center gap-3 text-red-100">
                <span className="text-lg">📥</span>
                <span>Export multi-formato</span>
              </div>
            </div>

            <div className="rounded-lg p-4 text-center" style={{
              background: 'rgba(255,255,255,0.1)'
            }}>
              <div className="text-white font-medium">✅ Attivo</div>
              <div className="text-sm text-red-100">Crea il tuo logo</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
