'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type WebsiteTemplate = {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: 'clinical' | 'modern' | 'minimal' | 'professional';
  features: string[];
};

type SavedWebsite = {
  id: string;
  name: string;
  template_id: string;
  html_content: string;
  css_content: string;
  created_at: string;
  status: 'draft' | 'published';
};

const TEMPLATES: WebsiteTemplate[] = [
  {
    id: 'clinical-classic',
    name: 'Clinical Classic',
    description: 'Design professionale e rassicurante per studi clinici',
    preview: '🏥',
    category: 'clinical',
    features: ['Form contatti', 'Info servizi', 'Chi sono', 'Contatti']
  },
  {
    id: 'modern-therapist',
    name: 'Modern Therapist', 
    description: 'Layout moderno e accogliente per terapeuti',
    preview: '🌱',
    category: 'modern',
    features: ['Booking online', 'Blog integrato', 'Testimonianze', 'FAQ']
  },
  {
    id: 'minimal-wellness',
    name: 'Minimal Wellness',
    description: 'Stile minimalista per psicologi del benessere',
    preview: '🎯',
    category: 'minimal', 
    features: ['One-page', 'Portfolio', 'Testimonials', 'Social links']
  },
  {
    id: 'professional-suite',
    name: 'Professional Suite',
    description: 'Completo per studi multiprofessionali',
    preview: '💼',
    category: 'professional',
    features: ['Multi-pagina', 'Team', 'Servizi', 'Prenotazioni', 'Blog']
  }
];

export default function WebsiteBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<WebsiteTemplate | null>(null);
  const [savedWebsites, setSavedWebsites] = useState<SavedWebsite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    loadSavedWebsites();
  }, []);

  async function loadSavedWebsites() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Per ora simuliamo dei siti salvati
      setSavedWebsites([
        {
          id: '1',
          name: 'Il mio primo sito',
          template_id: 'clinical-classic',
          html_content: '',
          css_content: '',
          created_at: new Date().toISOString(),
          status: 'draft'
        }
      ]);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleTemplateSelect(template: WebsiteTemplate) {
    setSelectedTemplate(template);
    setShowComingSoon(true);
  }

  function generateTemplateHTML(template: WebsiteTemplate): string {
    const templates = {
      'clinical-classic': `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dr. [Il Tuo Nome] - Psicologo Clinico</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        .hero { background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 80px 20px; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 20px; }
        .hero p { font-size: 1.2rem; opacity: 0.9; }
        
        .services { padding: 60px 20px; }
        .services h2 { text-align: center; margin-bottom: 50px; font-size: 2.5rem; }
        .service-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .service-card { padding: 30px; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-align: center; }
        .service-card h3 { margin-bottom: 15px; color: #2c3e50; }
        
        .contact { background: #f8f9fa; padding: 60px 20px; }
        .contact h2 { text-align: center; margin-bottom: 30px; }
        .contact-form { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 500; }
        .form-group input, .form-group textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; }
        .btn { background: #2c3e50; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; }
        .btn:hover { background: #34495e; }
        
        @media (max-width: 768px) {
            .hero h1 { font-size: 2rem; }
            .services { padding: 40px 20px; }
        }
    </style>
</head>
<body>
    <section class="hero">
        <div class="container">
            <h1>Dr. [Il Tuo Nome]</h1>
            <p>Psicologo Clinico - Aiuto specializzato per il tuo benessere</p>
        </div>
    </section>
    
    <section class="services">
        <div class="container">
            <h2>I Miei Servizi</h2>
            <div class="service-grid">
                <div class="service-card">
                    <h3>Terapia Individuale</h3>
                    <p>Percorsi personalizzati per la crescita personale e il benessere psicologico</p>
                </div>
                <div class="service-card">
                    <h3>Valutazione Clinica</h3>
                    <p>Assessment professionali e diagnosi specialistiche evidence-based</p>
                </div>
                <div class="service-card">
                    <h3>Consulenza Specialistica</h3>
                    <p>Supporto esperto per situazioni specifiche e problematiche acute</p>
                </div>
            </div>
        </div>
    </section>
    
    <section class="contact">
        <div class="container">
            <h2>Contattami</h2>
            <form class="contact-form">
                <div class="form-group">
                    <label>Nome</label>
                    <input type="text" name="nome" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" required>
                </div>
                <div class="form-group">
                    <label>Messaggio</label>
                    <textarea name="messaggio" rows="5" required></textarea>
                </div>
                <button type="submit" class="btn">Invia Messaggio</button>
            </form>
        </div>
    </section>
</body>
</html>`,

      'modern-therapist': `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Un Nuovo Inizio - Terapia e Benessere</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 100px 20px; text-align: center; }
        .hero h1 { font-size: 3.5rem; margin-bottom: 20px; font-weight: 300; }
        .hero p { font-size: 1.3rem; margin-bottom: 30px; opacity: 0.9; }
        .btn { background: rgba(255,255,255,0.2); color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: 500; border: 2px solid white; display: inline-block; }
        
        .about { padding: 80px 20px; background: #f8f9fa; }
        .about-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .about h2 { font-size: 2.5rem; margin-bottom: 30px; color: #2c3e50; }
        .about p { font-size: 1.1rem; line-height: 1.6; color: #555; }
        .profile-img { width: 200px; height: 200px; border-radius: 50%; background: #ddd; margin: 0 auto; }
        
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .about-grid { grid-template-columns: 1fr; gap: 40px; text-align: center; }
        }
    </style>
</head>
<body>
    <section class="hero">
        <h1>Un nuovo inizio</h1>
        <p>Accompagno le persone nel loro percorso di crescita e benessere</p>
        <a href="#contatti" class="btn">Inizia il tuo percorso</a>
    </section>
    
    <section class="about">
        <div class="about-grid">
            <div>
                <h2>Chi sono</h2>
                <p>Sono [Nome], psicologo/a con esperienza nell'accompagnare persone verso il benessere emotivo. Credo nel potenziale di ognuno di trovare equilibrio e serenità nella propria vita.</p>
            </div>
            <div style="text-align: center;">
                <div class="profile-img"></div>
            </div>
        </div>
    </section>
</body>
</html>`,

      'minimal-wellness': `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Benessere - Spazio per la tua crescita</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #2c3e50; }
        
        .hero { padding: 100px 20px; text-align: center; background: white; }
        .hero h1 { font-size: 4rem; margin-bottom: 30px; color: #2c3e50; font-weight: 300; }
        .hero p { font-size: 1.2rem; color: #7f8c8d; line-height: 1.6; max-width: 600px; margin: 0 auto; }
        
        .services { padding: 60px 20px; background: #f8f9fa; }
        .service-grid { max-width: 800px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; }
        .service-item { text-align: center; }
        .service-icon { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; }
        .service-item h3 { margin-bottom: 15px; }
        .service-item p { color: #7f8c8d; }
        
        @media (max-width: 768px) {
            .hero h1 { font-size: 3rem; }
        }
    </style>
</head>
<body>
    <section class="hero">
        <h1>Benessere</h1>
        <p>Spazio dedicato alla tua crescita personale e al tuo equilibrio interiore</p>
    </section>
    
    <section class="services">
        <div class="service-grid">
            <div class="service-item">
                <div class="service-icon" style="background: #3498db;">🧠</div>
                <h3>Mente</h3>
                <p>Tecniche per la gestione di stress e ansia</p>
            </div>
            <div class="service-item">
                <div class="service-icon" style="background: #2ecc71;">💚</div>
                <h3>Emozioni</h3>
                <p>Ascolto e comprensione del mondo emotivo</p>
            </div>
            <div class="service-item">
                <div class="service-icon" style="background: #e74c3c;">🌱</div>
                <h3>Crescita</h3>
                <p>Percorsi di sviluppo personale</p>
            </div>
        </div>
    </section>
</body>
</html>`,

      'professional-suite': `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Studio [Nome] - Servizi Multidisciplinari</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        
        .header { background: white; padding: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .nav { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
        .logo { color: #2c3e50; font-size: 1.8rem; font-weight: 600; }
        .nav-links { display: flex; gap: 30px; list-style: none; }
        .nav-links a { color: #2c3e50; text-decoration: none; }
        
        .hero { padding: 80px 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
        .hero-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 30px; font-weight: 700; }
        .hero p { font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9; }
        .hero-img { width: 300px; height: 200px; background: rgba(255,255,255,0.2); border-radius: 10px; margin: 0 auto; }
        .btn { background: white; color: #f5576c; padding: 15px 30px; border-radius: 5px; text-decoration: none; font-weight: 600; display: inline-block; }
        
        @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr; gap: 40px; text-align: center; }
            .nav { flex-direction: column; gap: 20px; }
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="logo">Studio [Nome]</div>
            <ul class="nav-links">
                <li><a href="#servizi">Servizi</a></li>
                <li><a href="#team">Team</a></li>
                <li><a href="#contatti">Contatti</a></li>
            </ul>
        </nav>
    </header>
    
    <section class="hero">
        <div class="hero-grid">
            <div>
                <h1>Studio Multidisciplinare</h1>
                <p>Un team di professionisti al servizio del tuo benessere psicologico</p>
                <a href="#contatti" class="btn">Prenota Appuntamento</a>
            </div>
            <div>
                <div class="hero-img"></div>
            </div>
        </div>
    </section>
</body>
</html>`
    };

    return templates[template.id as keyof typeof templates] || templates['clinical-classic'];
  }

  function downloadTemplate() {
    if (!selectedTemplate) return;

    const html = generateTemplateHTML(selectedTemplate);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate.name.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
            <h1 className="text-3xl font-bold text-white">🌐 Website Builder</h1>
            <p style={{ color: '#a8b2d6' }}>Crea il tuo sito web professionale</p>
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

        {/* Template Selection */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              🎨 Scegli il tuo template
            </h2>
            <p className="text-lg" style={{ color: '#a8b2d6' }}>
              Template professionali ottimizzati per psicologi e terapeuti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TEMPLATES.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`cursor-pointer rounded-lg p-6 border-2 transition-all hover:scale-105 ${
                  selectedTemplate?.id === template.id
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : 'border-gray-600 bg-white/5 hover:border-gray-500'
                }`}
              >
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{template.preview}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                  <p className="text-gray-300 text-sm">{template.description}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-white">Features:</h4>
                  {template.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="text-emerald-400">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Coming Soon Modal */}
          {showComingSoon && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-md mx-4">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚧</div>
                  <h3 className="text-2xl font-bold mb-4">Website Builder in Sviluppo</h3>
                  <p className="text-gray-600 mb-6">
                    Il builder drag-and-drop sarà disponibile presto. Per ora puoi scaricare il template HTML base.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setShowComingSoon(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Chiudi
                    </button>
                    <button
                      onClick={downloadTemplate}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      📥 Scarica Template HTML
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Saved Websites */}
          {savedWebsites.length > 0 && (
            <div className="rounded-lg p-6" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h3 className="text-lg font-bold text-white mb-4">💾 I tuoi siti salvati</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {savedWebsites.map((website) => (
                  <div key={website.id} className="p-4 rounded bg-white/10 border border-white/20">
                    <h4 className="font-medium text-white">{website.name}</h4>
                    <p className="text-sm text-gray-400">
                      {new Date(website.created_at).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        website.status === 'published' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {website.status === 'published' ? 'Pubblicato' : 'Bozza'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="text-center rounded-lg p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="text-xl font-bold text-white mb-4">🚀 Prossimamente</h3>
            <p className="text-gray-300 mb-4">
              Il builder completo con drag-and-drop, personalizzazione avanzata e hosting integrato sarà disponibile a breve.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">Editor Drag & Drop</span>
              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm">Hosting Incluso</span>
              <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">Domini Personalizzati</span>
              <span className="px-3 py-1 bg-orange-600 text-white rounded-full text-sm">Form Integrati</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
