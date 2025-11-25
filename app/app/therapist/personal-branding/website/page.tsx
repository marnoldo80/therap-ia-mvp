'use client';
import { useState, useEffect, useRef } from 'react';
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
  const [step, setStep] = useState<'templates' | 'builder' | 'settings'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<WebsiteTemplate | null>(null);
  const [savedWebsites, setSavedWebsites] = useState<SavedWebsite[]>([]);
  const [grapesEditor, setGrapesEditor] = useState<any>(null);
  const [isGrapesLoading, setIsGrapesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

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

      const { data: websites, error } = await supabase
        .from('therapist_websites')
        .select('*')
        .eq('therapist_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSavedWebsites(websites || []);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function initGrapesEditor(template: WebsiteTemplate) {
    setIsGrapesLoading(true);
    setError(null);

    try {
      // Import dinamico di GrapesJS (solo client-side)
      const grapesjs = (await import('grapesjs')).default;
      const websitePreset = (await import('grapesjs-preset-webpage')).default;
      const basicBlocks = (await import('grapesjs-blocks-basic')).default;
      const forms = (await import('grapesjs-plugin-forms')).default;

      if (!editorRef.current) return;

      // Template HTML di base per psicologi
      const templateHTML = getTemplateHTML(template);
      const templateCSS = getTemplateCSS(template);

      const editor = grapesjs.init({
        container: editorRef.current,
        width: '100%',
        height: '600px',
        plugins: [websitePreset, basicBlocks, forms],
        pluginsOpts: {
          'grapesjs-preset-webpage': {
            modalImportTitle: 'Importa Template',
            modalImportLabel: '<div style="margin-bottom: 10px; font-size: 13px;">Incolla il tuo codice HTML/CSS</div>',
            modalImportContent: function(editor: any) {
              return editor.getHtml() + '<style>' + editor.getCss() + '</style>';
            },
            filestackOpts: null,
            aviaryOpts: false,
            customStyleManager: [{
              name: 'General',
              open: false,
              buildProps: ['float', 'display', 'position', 'top', 'right', 'left', 'bottom'],
              properties: [{
                name: 'Alignment',
                property: 'float',
                type: 'radio',
                defaults: 'none',
                list: [
                  { value: 'none', className: 'fa fa-times'},
                  { value: 'left', className: 'fa fa-align-left'},
                  { value: 'right', className: 'fa fa-align-right'}
                ],
              },{
                property: 'position',
                type: 'select',
              }]
            }]
          }
        },
        canvas: {
          styles: [
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
          ]
        },
        storageManager: {
          type: 'local',
          autosave: true,
          autoload: true,
          stepsBeforeSave: 3,
        },
        assetManager: {
          embedAsBase64: false,
          assets: [
            'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
            'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800',
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800'
          ]
        },
        styleManager: {
          appendTo: '.styles-container',
          sectors: [{
            name: 'Typography',
            open: false,
            buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height'],
            properties: [{
              name: 'Font',
              property: 'font-family'
            }, {
              name: 'Weight',
              property: 'font-weight'
            }, {
              name: 'Size',
              property: 'font-size'
            }, {
              name: 'Line Height', 
              property: 'line-height'
            }, {
              name: 'Letter Spacing',
              property: 'letter-spacing'
            }, {
              name: 'Color',
              property: 'color'
            }]
          }, {
            name: 'Decorations',
            open: false,
            buildProps: ['background-color', 'border-radius', 'border', 'box-shadow', 'background'],
            properties: [{
              name: 'Background',
              property: 'background-color'
            }, {
              name: 'Border Radius',
              property: 'border-radius'
            }, {
              name: 'Border',
              property: 'border'
            }, {
              name: 'Box Shadow',
              property: 'box-shadow'
            }]
          }, {
            name: 'Extra',
            open: false,
            buildProps: ['transition', 'perspective', 'transform'],
            properties: [{
              name: 'Transition',
              property: 'transition'
            }, {
              name: 'Transform',
              property: 'transform'
            }]
          }]
        },
        layerManager: {
          appendTo: '.layers-container'
        },
        traitManager: {
          appendTo: '.traits-container',
        },
        selectorManager: {
          appendTo: '.styles-container'
        },
        panels: {
          defaults: [{
            id: 'layers',
            el: '.panel__right',
            resizable: {
              maxDim: 350,
              minDim: 200,
              tc: false,
              cl: true,
              cr: false,
              bc: false,
              keyWidth: 'flex-basis',
            },
          }, {
            id: 'panel-switcher',
            el: '.panel__switcher',
            buttons: [{
              id: 'show-layers',
              active: true,
              label: 'Layers',
              command: 'show-layers',
              togglable: false,
            }, {
              id: 'show-style',
              active: true,
              label: 'Styles',
              command: 'show-styles',
              togglable: false,
            }],
          }]
        },
        blockManager: {
          appendTo: '.blocks-container',
          blocks: [
            {
              id: 'section',
              label: '<div><div class="gjs-block-label">Sezione</div></div>',
              category: 'Basic',
              content: '<section style="padding: 40px 20px; background-color: #f8f9fa;"><div style="max-width: 1200px; margin: 0 auto;"><h2>Nuova Sezione</h2><p>Inserisci qui il tuo contenuto.</p></div></section>',
            },
            {
              id: 'hero-therapist',
              label: '<div><div class="gjs-block-label">Hero Terapista</div></div>',
              category: 'Therapy',
              content: `
                <section style="padding: 80px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center;">
                  <div style="max-width: 800px; margin: 0 auto;">
                    <h1 style="font-size: 3rem; margin-bottom: 20px; font-weight: 700;">Dr. [Nome Cognome]</h1>
                    <p style="font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9;">Psicologo/a specializzato/a in [Specializzazione]</p>
                    <a href="#contatti" style="background: white; color: #667eea; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: 600;">Prenota Consulenza</a>
                  </div>
                </section>
              `
            },
            {
              id: 'services-grid',
              label: '<div><div class="gjs-block-label">Servizi</div></div>',
              category: 'Therapy',
              content: `
                <section style="padding: 60px 20px;">
                  <div style="max-width: 1200px; margin: 0 auto;">
                    <h2 style="text-align: center; margin-bottom: 50px;">I Miei Servizi</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
                      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <h3>Terapia Individuale</h3>
                        <p>Supporto personalizzato per il tuo percorso di crescita personale.</p>
                      </div>
                      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <h3>Terapia di Coppia</h3>
                        <p>Accompagnamento per rafforzare la relazione e la comunicazione.</p>
                      </div>
                      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <h3>Consulenza Online</h3>
                        <p>Sessioni video sicure e professionali dal comfort di casa.</p>
                      </div>
                    </div>
                  </div>
                </section>
              `
            },
            {
              id: 'contact-form',
              label: '<div><div class="gjs-block-label">Form Contatti</div></div>',
              category: 'Therapy',
              content: `
                <section style="padding: 60px 20px; background-color: #f8f9fa;">
                  <div style="max-width: 600px; margin: 0 auto;">
                    <h2 style="text-align: center; margin-bottom: 30px;">Contattami</h2>
                    <form style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                      <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Nome</label>
                        <input type="text" name="nome" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px;">
                      </div>
                      <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Email</label>
                        <input type="email" name="email" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px;">
                      </div>
                      <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Messaggio</label>
                        <textarea name="messaggio" rows="5" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                      </div>
                      <button type="submit" style="width: 100%; background: #667eea; color: white; padding: 15px; border: none; border-radius: 5px; font-weight: 600; cursor: pointer;">Invia Messaggio</button>
                    </form>
                  </div>
                </section>
              `
            }
          ]
        },
        commands: {
          defaults: [{
            id: 'show-layers',
            getRowEl(editor: any) { return editor.getContainer().closest('.editor-row'); },
            getLayersEl(row: any) { return row.querySelector('.layers-container') },
            run(editor: any, sender: any) {
              const row = this.getRowEl(editor);
              const layers = this.getLayersEl(row);
              layers.style.display = '';
            },
            stop(editor: any, sender: any) {
              const row = this.getRowEl(editor);
              const layers = this.getLayersEl(row);
              layers.style.display = 'none';
            },
          }, {
            id: 'show-styles',
            getRowEl(editor: any) { return editor.getContainer().closest('.editor-row'); },
            getStyleEl(row: any) { return row.querySelector('.styles-container') },
            run(editor: any, sender: any) {
              const row = this.getRowEl(editor);
              const style = this.getStyleEl(row);
              style.style.display = '';
            },
            stop(editor: any, sender: any) {
              const row = this.getRowEl(editor);
              const style = this.getStyleEl(row);
              style.style.display = 'none';
            },
          }]
        },
      });

      // Carica template
      editor.setComponents(templateHTML);
      editor.setStyle(templateCSS);

      // Nascondi pannelli di default
      editor.Panels.removePanel('commands');
      editor.Panels.removePanel('options');

      setGrapesEditor(editor);
      setStep('builder');

    } catch (e: any) {
      setError('Errore nel caricamento del builder: ' + e.message);
    } finally {
      setIsGrapesLoading(false);
    }
  }

  function getTemplateHTML(template: WebsiteTemplate): string {
    const templates = {
      'clinical-classic': `
        <section style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 80px 20px; text-align: center;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h1 style="font-size: 3rem; margin-bottom: 20px;">Dr. [Il Tuo Nome]</h1>
            <p style="font-size: 1.2rem; opacity: 0.9;">Psicologo Clinico - Aiuto specializzato per il tuo benessere</p>
          </div>
        </section>
        
        <section style="padding: 60px 20px;">
          <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
            <h2 style="margin-bottom: 50px;">I Miei Servizi</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px;">
              <div style="padding: 30px; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                <h3>Terapia Individuale</h3>
                <p>Percorsi personalizzati per la crescita personale</p>
              </div>
              <div style="padding: 30px; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                <h3>Valutazione Clinica</h3>
                <p>Assessment professionali e diagnosi specialistiche</p>
              </div>
              <div style="padding: 30px; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                <h3>Consulenza</h3>
                <p>Supporto esperto per situazioni specifiche</p>
              </div>
            </div>
          </div>
        </section>
      `,

      'modern-therapist': `
        <section style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 100px 20px; text-align: center;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h1 style="font-size: 3.5rem; margin-bottom: 20px; font-weight: 300;">Un nuovo inizio</h1>
            <p style="font-size: 1.3rem; margin-bottom: 30px; opacity: 0.9;">Accompagno le persone nel loro percorso di crescita e benessere</p>
            <a href="#contatti" style="background: rgba(255,255,255,0.2); color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: 500; border: 2px solid white;">Inizia il tuo percorso</a>
          </div>
        </section>
        
        <section style="padding: 80px 20px; background: #f8f9fa;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;">
              <div>
                <h2 style="font-size: 2.5rem; margin-bottom: 30px; color: #2c3e50;">Chi sono</h2>
                <p style="font-size: 1.1rem; line-height: 1.6; color: #555;">Sono [Nome], psicologo/a con esperienza nell'accompagnare persone verso il benessere emotivo. Credo nel potenziale di ognuno di trovare equilibrio e serenità.</p>
              </div>
              <div style="text-align: center;">
                <div style="width: 200px; height: 200px; border-radius: 50%; background: #ddd; margin: 0 auto;"></div>
              </div>
            </div>
          </div>
        </section>
      `,

      'minimal-wellness': `
        <section style="padding: 100px 20px; text-align: center; background: white;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h1 style="font-size: 4rem; margin-bottom: 30px; color: #2c3e50; font-weight: 300;">Benessere</h1>
            <p style="font-size: 1.2rem; color: #7f8c8d; line-height: 1.6;">Spazio dedicato alla tua crescita personale e al tuo equilibrio interiore</p>
          </div>
        </section>
        
        <section style="padding: 60px 20px; background: #f8f9fa;">
          <div style="max-width: 800px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px;">
            <div style="text-align: center;">
              <div style="width: 80px; height: 80px; border-radius: 50%; background: #3498db; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">🧠</div>
              <h3 style="margin-bottom: 15px;">Mente</h3>
              <p style="color: #7f8c8d;">Tecniche per la gestione di stress e ansia</p>
            </div>
            <div style="text-align: center;">
              <div style="width: 80px; height: 80px; border-radius: 50%; background: #2ecc71; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">💚</div>
              <h3 style="margin-bottom: 15px;">Emozioni</h3>
              <p style="color: #7f8c8d;">Ascolto e comprensione del mondo emotivo</p>
            </div>
            <div style="text-align: center;">
              <div style="width: 80px; height: 80px; border-radius: 50%; background: #e74c3c; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">🌱</div>
              <h3 style="margin-bottom: 15px;">Crescita</h3>
              <p style="color: #7f8c8d;">Percorsi di sviluppo personale</p>
            </div>
          </div>
        </section>
      `,

      'professional-suite': `
        <header style="background: white; padding: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 20px;">
            <h1 style="color: #2c3e50; font-size: 1.8rem; font-weight: 600;">Studio [Nome]</h1>
            <nav style="display: flex; gap: 30px;">
              <a href="#servizi" style="color: #2c3e50; text-decoration: none;">Servizi</a>
              <a href="#team" style="color: #2c3e50; text-decoration: none;">Team</a>
              <a href="#contatti" style="color: #2c3e50; text-decoration: none;">Contatti</a>
            </nav>
          </div>
        </header>
        
        <section style="padding: 80px 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
          <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;">
            <div>
              <h2 style="font-size: 3rem; margin-bottom: 30px; font-weight: 700;">Studio Multidisciplinare</h2>
              <p style="font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9;">Un team di professionisti al servizio del tuo benessere psicologico</p>
              <a href="#contatti" style="background: white; color: #f5576c; padding: 15px 30px; border-radius: 5px; text-decoration: none; font-weight: 600;">Prenota Appuntamento</a>
            </div>
            <div style="text-align: center;">
              <div style="width: 300px; height: 200px; background: rgba(255,255,255,0.2); border-radius: 10px; margin: 0 auto;"></div>
            </div>
          </div>
        </section>
      `
    };

    return templates[template.id as keyof typeof templates] || templates['clinical-classic'];
  }

  function getTemplateCSS(template: WebsiteTemplate): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      
      h1, h2, h3, h4, h5, h6 {
        line-height: 1.2;
        margin-bottom: 1rem;
      }
      
      p {
        margin-bottom: 1rem;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
      }
      
      @media (max-width: 768px) {
        h1 { font-size: 2rem !important; }
        h2 { font-size: 1.5rem !important; }
        section { padding: 40px 20px !important; }
        .grid { grid-template-columns: 1fr !important; }
      }
    `;
  }

  async function saveWebsite() {
    if (!grapesEditor) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      const html = grapesEditor.getHtml();
      const css = grapesEditor.getCss();

      const websiteData = {
        therapist_user_id: user.id,
        name: `Sito ${new Date().toLocaleDateString()}`,
        template_id: selectedTemplate?.id || 'custom',
        html_content: html,
        css_content: css,
        status: 'draft'
      };

      const { error } = await supabase.from('therapist_websites').insert(websiteData);
      if (error) throw error;

      alert('✅ Sito salvato con successo!');
      await loadSavedWebsites();

    } catch (e: any) {
      setError('Errore nel salvataggio: ' + e.message);
    }
  }

  function exportWebsite() {
    if (!grapesEditor) return;

    const html = grapesEditor.getHtml();
    const css = grapesEditor.getCss();
    
    const fullHTML = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Il Tuo Sito Web - Psicologo</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${css}
    </style>
</head>
<body>
    ${html}
</body>
</html>
    `.trim();

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mio-sito-web.html';
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

        {/* Step 1: Template Selection */}
        {step === 'templates' && (
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
                  onClick={() => setSelectedTemplate(template)}
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

            <div className="text-center">
              <button
                onClick={() => selectedTemplate && initGrapesEditor(selectedTemplate)}
                disabled={!selectedTemplate || isGrapesLoading}
                className="bg-emerald-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
              >
                {isGrapesLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Caricamento Editor...
                  </>
                ) : (
                  <>🚀 Inizia a Creare</>
                )}
              </button>
            </div>

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
          </div>
        )}

        {/* Step 2: GrapesJS Editor */}
        {step === 'builder' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                🎨 Editor Sito Web - {selectedTemplate?.name}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('templates')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700"
                >
                  ← Template
                </button>
                <button
                  onClick={saveWebsite}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  💾 Salva
                </button>
                <button
                  onClick={exportWebsite}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700"
                >
                  📥 Export HTML
                </button>
              </div>
            </div>

            {/* GrapesJS Container */}
            <div className="bg-white rounded-lg" style={{ minHeight: '600px' }}>
              <div className="editor-row" style={{ display: 'flex', height: '600px' }}>
                
                {/* Left Panel - Blocks */}
                <div className="panel__left" style={{ 
                  width: '300px', 
                  background: '#f8f9fa', 
                  borderRight: '1px solid #dee2e6',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ padding: '15px', borderBottom: '1px solid #dee2e6' }}>
                    <h4 style={{ margin: 0, color: '#495057' }}>🧱 Blocchi</h4>
                  </div>
                  <div className="blocks-container" style={{ 
                    flex: 1, 
                    overflow: 'auto', 
                    padding: '10px' 
                  }}></div>
                </div>

                {/* Center - Canvas */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <div ref={editorRef} style={{ height: '100%', width: '100%' }}></div>
                </div>

                {/* Right Panel */}
                <div className="panel__right" style={{ 
                  width: '300px', 
                  background: '#f8f9fa', 
                  borderLeft: '1px solid #dee2e6',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Panel Switcher */}
                  <div className="panel__switcher" style={{ 
                    padding: '10px', 
                    borderBottom: '1px solid #dee2e6',
                    display: 'flex',
                    justifyContent: 'center'
                  }}></div>
                  
                  {/* Layers */}
                  <div className="layers-container" style={{ 
                    flex: 1, 
                    overflow: 'auto', 
                    padding: '10px' 
                  }}></div>
                  
                  {/* Styles */}
                  <div className="styles-container" style={{ 
                    flex: 1, 
                    overflow: 'auto', 
                    padding: '10px',
                    display: 'none'
                  }}></div>
                  
                  {/* Traits */}
                  <div className="traits-container" style={{ 
                    padding: '10px',
                    borderTop: '1px solid #dee2e6'
                  }}></div>
                </div>

              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-400">
                💡 Trascina i blocchi nel canvas per costruire il tuo sito. Usa il pannello di destra per modificare stili e proprietà.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
