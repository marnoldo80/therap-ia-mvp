'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SocialMediaPage() {
  const router = useRouter();

  const platforms = [
    {
      id: 'instagram',
      icon: '📸',
      name: 'Instagram',
      description: 'Post visuali professionali e Stories coinvolgenti',
      color: 'from-pink-500 to-rose-500',
      comingSoon: false
    },
    {
      id: 'facebook', 
      icon: '👥',
      name: 'Facebook',
      description: 'Community building e contenuti per il coinvolgimento',
      color: 'from-blue-500 to-blue-600',
      comingSoon: false
    },
    {
      id: 'linkedin',
      icon: '💼', 
      name: 'LinkedIn',
      description: 'Contenuti professionali per networking e autorità',
      color: 'from-blue-600 to-indigo-600',
      comingSoon: false
    }
  ];

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
            <h1 className="text-3xl font-bold text-white">📱 Social Media</h1>
            <p style={{ color: '#a8b2d6' }}>Crea contenuti professionali per i tuoi canali social</p>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Scegli la piattaforma
            </h2>
            <p className="text-lg" style={{ color: '#a8b2d6' }}>
              Ogni piattaforma ha il suo approccio ottimizzato
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className={`relative rounded-xl p-8 transition-all duration-200 ${
                  platform.comingSoon 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:scale-105 cursor-pointer'
                } shadow-lg`}
                style={{
                  background: `linear-gradient(135deg, ${platform.color.split(' ')[1]} 0%, ${platform.color.split(' ')[3]} 100%)`,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => !platform.comingSoon && router.push(`/app/therapist/personal-branding/create?platform=${platform.id}`)}
              >
                {/* Coming Soon Badge */}
                {platform.comingSoon && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-black/20 text-white text-xs px-2 py-1 rounded-full">
                      Prossimamente
                    </span>
                  </div>
                )}

                {/* Platform Icon */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-4" style={{
                    background: 'rgba(255,255,255,0.2)'
                  }}>
                    {platform.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{platform.name}</h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {platform.description}
                  </p>
                </div>

                {/* Platform Features */}
                <div className="space-y-3 mb-6">
                  {platform.id === 'instagram' && (
                    <>
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="text-lg">🎨</span>
                        <span className="text-sm">Visual-first approach</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="text-lg">✨</span>
                        <span className="text-sm">4 stili di testo diversi</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="text-lg">🖼️</span>
                        <span className="text-sm">Concept visual personalizzati</span>
                      </div>
                    </>
                  )}
                  
                  {platform.id === 'facebook' && (
                    <>
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="text-lg">👥</span>
                        <span className="text-sm">Community building</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="text-lg">💬</span>
                        <span className="text-sm">Contenuti conversazionali</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="text-lg">📄</span>
                        <span className="text-sm">Articoli lunghi</span>
                      </div>
                    </>
                  )}

                  {platform.id === 'linkedin' && (
                    <>
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="text-lg">💼</span>
                        <span className="text-sm">Contenuti professionali</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="text-lg">🎯</span>
                        <span className="text-sm">Thought leadership</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="text-lg">🤝</span>
                        <span className="text-sm">Networking mirato</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Call to Action */}
                <div className="text-center">
                  {platform.comingSoon ? (
                    <div className="text-white/70 font-medium">
                      In sviluppo
                    </div>
                  ) : (
                    <div className="text-white font-bold">
                      🚀 Crea Post →
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Instagram Call-to-Action */}
          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/app/therapist/personal-branding/create?platform=instagram')}
              className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-pink-700 hover:to-rose-700 transition-all duration-200 shadow-lg"
            >
              🎨 Inizia con Instagram
            </button>
            <p className="text-sm mt-3" style={{ color: '#64748b' }}>
              La piattaforma più visual per psicologi e terapeuti
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
