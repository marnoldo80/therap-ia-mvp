'use client';
import { useState, useRef } from 'react';
import CanvasRenderer from './CanvasRenderer';

interface ImagePreviewProps {
  content: {
    title?: string;
    content: string;
    hashtags: string[];
  };
  platform: 'instagram' | 'facebook' | 'linkedin';
  template?: any;
}

const DEFAULT_TEMPLATE = {
  name: 'Professional Blue',
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
};

const PRESET_TEMPLATES = {
  professional: {
    name: 'Professional Blue',
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
  wellness: {
    name: 'Wellness Green',
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
  warm: {
    name: 'Warm Orange',
    color_scheme: {
      primary: '#ea580c',
      secondary: '#78716c',
      background: '#fff7ed',
      text: '#9a3412'
    },
    fonts: {
      heading: 'Poppins',
      body: 'Open Sans',
      size_multiplier: 1.1
    },
    layout_type: 'card'
  }
};

export default function ImagePreview({ content, platform, template }: ImagePreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(template || DEFAULT_TEMPLATE);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleImageGenerated = (dataUrl: string) => {
    setGeneratedImageUrl(dataUrl);
  };

  const copyImageToClipboard = async () => {
    if (!generatedImageUrl) return;
    
    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      alert('✅ Immagine copiata negli appunti!');
    } catch (error) {
      console.error('Errore copia clipboard:', error);
      alert('❌ Errore copia immagine');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Template Selector */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">🎨 Template Immagine</h3>
          <button
            onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            className="text-blue-600 text-sm hover:underline"
          >
            {showTemplateSelector ? 'Nascondi' : 'Cambia Template'}
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-3">
          Template attivo: <span className="font-medium">{selectedTemplate.name}</span>
        </div>

        {showTemplateSelector && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(PRESET_TEMPLATES).map(([key, tmpl]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedTemplate(tmpl);
                  setShowTemplateSelector(false);
                }}
                className={`p-3 border rounded-lg text-left transition-all ${
                  selectedTemplate.name === tmpl.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div 
                  className="w-full h-8 rounded mb-2"
                  style={{ backgroundColor: tmpl.color_scheme.background }}
                >
                  <div 
                    className="h-2 rounded-t"
                    style={{ backgroundColor: tmpl.color_scheme.primary }}
                  ></div>
                </div>
                <p className="font-medium text-sm">{tmpl.name}</p>
                <p className="text-xs text-gray-600">{tmpl.layout_type}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas Renderer */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold mb-4">🖼️ Anteprima Immagine {platform}</h3>
        
        <div className="overflow-hidden border rounded-lg">
          <CanvasRenderer
            ref={canvasRef}
            content={content}
            template={selectedTemplate}
            platform={platform}
            onImageGenerated={handleImageGenerated}
          />
        </div>
      </div>

      {/* Image Actions */}
      {generatedImageUrl && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3">✨ Immagine Generata</h3>
          
          <div className="flex gap-3 flex-wrap">
            <a
              href={generatedImageUrl}
              download={`post-${platform}-${Date.now()}.png`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              ⬇️ Scarica PNG
            </a>
            
            <button
              onClick={copyImageToClipboard}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
            >
              📋 Copia Immagine
            </button>
            
            <button
              onClick={() => window.open(generatedImageUrl, '_blank')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
            >
              👁️ Apri in Nuova Tab
            </button>
          </div>
          
          <p className="text-xs text-gray-600 mt-2">
            💡 Tip: Usa "Copia Immagine" per incollare direttamente sui social media
          </p>
        </div>
      )}

      {/* Platform Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">📏 Linee Guida {platform}</h4>
        <div className="text-sm text-blue-700">
          {platform === 'instagram' && (
            <ul className="space-y-1">
              <li>• Formato: 1080x1080 px (quadrato)</li>
              <li>• Dimensione file: Max 30MB</li>
              <li>• Formato: PNG/JPG</li>
              <li>• Testo: Breve e visibile</li>
            </ul>
          )}
          {platform === 'facebook' && (
            <ul className="space-y-1">
              <li>• Formato: 1200x630 px (rettangolare)</li>
              <li>• Dimensione file: Max 8MB</li>
              <li>• Formato: PNG/JPG</li>
              <li>• Testo: Più lungo consentito</li>
            </ul>
          )}
          {platform === 'linkedin' && (
            <ul className="space-y-1">
              <li>• Formato: 1200x627 px (rettangolare)</li>
              <li>• Dimensione file: Max 5MB</li>
              <li>• Formato: PNG/JPG</li>
              <li>• Stile: Professionale</li>
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}
