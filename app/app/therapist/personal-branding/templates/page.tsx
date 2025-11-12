'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface LayoutTemplate {
  id: string;
  name: string;
  description?: string;
  platform: string[];
  color_scheme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
    size_multiplier: number;
  };
  layout_type: string;
  usage_count: number;
  is_default: boolean;
}

const DEFAULT_TEMPLATES = [
  {
    id: 'minimal-blue',
    name: 'Minimal Blue',
    description: 'Template pulito e professionale',
    platform: ['instagram', 'facebook'],
    color_scheme: {
      primary: '#2563eb',
      secondary: '#64748b', 
      background: '#f8fafc',
      text: '#1e293b'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      size_multiplier: 1.0
    },
    layout_type: 'minimal'
  },
  {
    id: 'wellness-green',
    name: 'Wellness Green',
    description: 'Stile naturale e rilassante',
    platform: ['instagram', 'facebook'],
    color_scheme: {
      primary: '#059669',
      secondary: '#6b7280',
      background: '#f0fdf4', 
      text: '#064e3b'
    },
    fonts: {
      heading: 'Nunito Sans',
      body: 'Nunito Sans',
      size_multiplier: 1.0
    },
    layout_type: 'card'
  },
  {
    id: 'professional-navy',
    name: 'Professional Navy',
    description: 'Elegante e autorevole',
    platform: ['linkedin', 'facebook'],
    color_scheme: {
      primary: '#f1f5f9',
      secondary: '#e2e8f0',
      background: '#1e293b',
      text: '#f1f5f9'
    },
    fonts: {
      heading: 'Roboto',
      body: 'Open Sans', 
      size_multiplier: 1.1
    },
    layout_type: 'card'
  }
];

export default function TemplatesManager() {
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<LayoutTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state for creating template
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    platform: [] as string[],
    color_scheme: {
      primary: '#2563eb',
      secondary: '#64748b',
      background: '#f8fafc', 
      text: '#1e293b'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      size_multiplier: 1.0
    },
    layout_type: 'minimal'
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      // Carica template dell'utente
      const { data: userTemplates, error } = await supabase
        .from('layout_templates')
        .select('*')
        .eq('therapist_user_id', user.id)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      // Combina con template predefiniti
      const allTemplates = [
        ...DEFAULT_TEMPLATES.map(t => ({ ...t, usage_count: 0, is_default: true })),
        ...(userTemplates || [])
      ];

      setTemplates(allTemplates as LayoutTemplate[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveTemplate() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const { error } = await supabase.from('layout_templates').insert({
        therapist_user_id: user.id,
        name: newTemplate.name,
        description: newTemplate.description,
        platform: newTemplate.platform,
        color_scheme: newTemplate.color_scheme,
        fonts: newTemplate.fonts,
        layout_type: newTemplate.layout_type
      });

      if (error) throw error;

      // Reset form
      setIsCreating(false);
      setNewTemplate({
        name: '',
        description: '',
        platform: [],
        color_scheme: {
          primary: '#2563eb',
          secondary: '#64748b',
          background: '#f8fafc',
          text: '#1e293b'
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter', 
          size_multiplier: 1.0
        },
        layout_type: 'minimal'
      });

      // Ricarica templates
      loadTemplates();
    } catch (e: any) {
      setError(e.message);
    }
  }

  const TemplatePreview = ({ template }: { template: LayoutTemplate }) => (
    <div 
      className="w-full h-48 rounded-lg p-4 flex flex-col justify-center"
      style={{ backgroundColor: template.color_scheme.background }}
    >
      <h3 
        className="text-lg font-bold mb-2"
        style={{ 
          color: template.color_scheme.primary,
          fontFamily: template.fonts.heading
        }}
      >
        Titolo del Post
      </h3>
      <p 
        className="text-sm mb-3"
        style={{ 
          color: template.color_scheme.text,
          fontFamily: template.fonts.body
        }}
      >
        Questo è un esempio di come appariranno i tuoi contenuti con questo template...
      </p>
      <div className="flex gap-2">
        <span 
          className="text-xs px-2 py-1 rounded"
          style={{ 
            backgroundColor: template.color_scheme.primary + '20',
            color: template.color_scheme.primary
          }}
        >
          #psicologia
        </span>
        <span 
          className="text-xs px-2 py-1 rounded"
          style={{ 
            backgroundColor: template.color_scheme.secondary + '20',
            color: template.color_scheme.secondary
          }}
        >
          #benessere
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/app/therapist/personal-branding" className="text-blue-600 hover:underline text-sm mb-2 block">
            ← Personal Branding
          </Link>
          <h1 className="text-3xl font-bold">🎨 Template Manager</h1>
          <p className="text-gray-600 mt-1">Gestisci i layout per i tuoi contenuti social</p>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          ➕ Nuovo Template
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p><strong>Errore:</strong> {error}</p>
        </div>
      )}

      {/* Create Template Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Crea Nuovo Template</h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome Template</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Il mio template blu"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Descrizione</label>
                  <input
                    type="text"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Template professionale per post educativi"
                  />
                </div>
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Piattaforme</label>
                <div className="flex gap-3">
                  {['instagram', 'facebook', 'linkedin'].map(platform => (
                    <label key={platform} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newTemplate.platform.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTemplate(prev => ({
                              ...prev,
                              platform: [...prev.platform, platform]
                            }));
                          } else {
                            setNewTemplate(prev => ({
                              ...prev,
                              platform: prev.platform.filter(p => p !== platform)
                            }));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-medium mb-3">Colori</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(newTemplate.color_scheme).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium mb-1 capitalize">
                        {key === 'primary' ? 'Primario' : 
                         key === 'secondary' ? 'Secondario' :
                         key === 'background' ? 'Sfondo' : 'Testo'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => setNewTemplate(prev => ({
                            ...prev,
                            color_scheme: {
                              ...prev.color_scheme,
                              [key]: e.target.value
                            }
                          }))}
                          className="w-8 h-8 border rounded"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setNewTemplate(prev => ({
                            ...prev,
                            color_scheme: {
                              ...prev.color_scheme,
                              [key]: e.target.value
                            }
                          }))}
                          className="flex-1 border rounded px-2 py-1 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fonts */}
              <div>
                <label className="block text-sm font-medium mb-3">Tipografia</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Font Titoli</label>
                    <select
                      value={newTemplate.fonts.heading}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        fonts: { ...prev.fonts, heading: e.target.value }
                      }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Nunito Sans">Nunito Sans</option>
                      <option value="Poppins">Poppins</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Font Corpo</label>
                    <select
                      value={newTemplate.fonts.body}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        fonts: { ...prev.fonts, body: e.target.value }
                      }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Nunito Sans">Nunito Sans</option>
                      <option value="Poppins">Poppins</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Dimensione</label>
                    <select
                      value={newTemplate.fonts.size_multiplier}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        fonts: { ...prev.fonts, size_multiplier: parseFloat(e.target.value) }
                      }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value={0.9}>Piccolo</option>
                      <option value={1.0}>Normale</option>
                      <option value={1.1}>Grande</option>
                      <option value={1.2}>Molto Grande</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium mb-3">Anteprima</label>
                <TemplatePreview template={newTemplate as LayoutTemplate} />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={!newTemplate.name || newTemplate.platform.length === 0}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Salva Template
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div>
        {templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold mb-2">Nessun template ancora</h3>
            <p className="text-sm mb-4">Crea il tuo primo template personalizzato</p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Crea Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div key={template.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                
                {/* Preview */}
                <TemplatePreview template={template} />
                
                {/* Info */}
                <div className="p-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{template.name}</h3>
                    {template.is_default && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        Predefinito
                      </span>
                    )}
                  </div>
                  
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-1">
                      {template.platform.map(p => (
                        <span key={p} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {p === 'instagram' ? '📸' : p === 'facebook' ? '👥' : '💼'}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTemplate(template)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        👁️ Preview
                      </button>
                      
                      <Link
                        href={`/app/therapist/personal-branding/create?template=${template.id}`}
                        className="text-green-600 hover:text-green-700 text-sm"
                      >
                        ✨ Usa
                      </Link>
                    </div>
                  </div>

                  {template.usage_count > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {template.usage_count} utilizzi
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
