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
  templatesCount: number;
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
    templatesCount: 0,
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

      // Carica statistiche posts
      const { data: posts, error: postsError } = await supabase
        .from('social_posts')
        .select('platform, status, created_at')
        .eq('therapist_user_id', user.id);

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

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6" style={{ color: 'white' }}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
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
        
        {/* 1. SOCIAL MEDIA */}
        <div className="rounded-lg p-8 transition-all duration-200 hover:scale-105 cursor-pointer" style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
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
              <p className="text-blue-100">Post professionali per Instagram, Facebook, LinkedIn</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.totalPosts}</div>
              <div className="text-sm text-blue-100">Post Creati</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.thisWeekPosts}</div>
              <div className="text-sm text-blue-100">Questa Settimana</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-blue-100">
              <span>📸 Instagram</span>
              <span>{stats.platformBreakdown.instagram}</span>
            </div>
            <div className="flex justify-between text-sm text-blue-100">
              <span>👥 Facebook</span>
              <span>{stats.platformBreakdown.facebook}</span>
            </div>
            <div className="flex justify-between text-sm text-blue-100">
              <span>💼 LinkedIn</span>
              <span>{stats.platformBreakdown.linkedin}</span>
            </div>
          </div>

          <div className="mt-6 text-right">
            <span className="text-white font-medium">Accedi →</span>
          </div>
        </div>

        {/* 2. WEBSITE BUILDER */}
        <div className="rounded-lg p-8 transition-all duration-200 hover:scale-105 cursor-pointer" style={{
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
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
              <h2 className="text-2xl font-bold text-white">Website</h2>
              <p className="text-emerald-100">Crea il tuo sito web professionale</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-emerald-100">
              <span className="text-lg">✅</span>
              <span>Template per psicologi</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-100">
              <span className="text-lg">✅</span>
              <span>Form contatti integrato</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-100">
              <span className="text-lg">✅</span>
              <span>SEO ottimizzato</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-100">
              <span className="text-lg">✅</span>
              <span>Responsive design</span>
            </div>
          </div>

          <div className="rounded-lg p-4 text-center" style={{
            background: 'rgba(255,255,255,0.1)'
          }}>
            <div className="text-white font-medium">Prossimamente</div>
            <div className="text-sm text-emerald-100">Disponibile a breve</div>
          </div>
        </div>

        {/* 3. BLOG MANAGER */}
        <div className="rounded-lg p-8 transition-all duration-200 hover:scale-105 cursor-pointer" style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        onClick={() => router.push('/app/therapist/personal-branding/blog')}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl" style={{
              background: 'rgba(255,255,255,0.2)'
            }}>
              📝
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Blog</h2>
              <p className="text-purple-100">Articoli e contenuti educativi</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-purple-100">
              <span className="text-lg">🧠</span>
              <span>Psicologia Generale</span>
            </div>
            <div className="flex items-center gap-3 text-purple-100">
              <span className="text-lg">😰</span>
              <span>Ansia e Stress</span>
            </div>
            <div className="flex items-center gap-3 text-purple-100">
              <span className="text-lg">👨‍👩‍👧‍👦</span>
              <span>Terapia Familiare</span>
            </div>
            <div className="flex items-center gap-3 text-purple-100">
              <span className="text-lg">💼</span>
              <span>Psicologia del Lavoro</span>
            </div>
          </div>

          <div className="rounded-lg p-4 text-center" style={{
            background: 'rgba(255,255,255,0.1)'
          }}>
            <div className="text-white font-medium">Prossimamente</div>
            <div className="text-sm text-purple-100">Disponibile a breve</div>
          </div>
        </div>

        {/* 4. LOGO CREATOR */}
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
            <div className="text-white font-medium">Prossimamente</div>
            <div className="text-sm text-red-100">Disponibile a breve</div>
          </div>
        </div>
      </div>
    </div>
  );
}
