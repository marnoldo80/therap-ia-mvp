'use client';
import React, { useRef } from 'react';

interface CanvasRendererProps {
  content: {
    title?: string;
    content: string;
    hashtags: string[];
  };
  template: {
    name: string;
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
  };
  platform: 'instagram' | 'facebook' | 'linkedin';
  onImageGenerated?: (dataUrl: string) => void;
}

const CanvasRenderer = React.forwardRef<HTMLDivElement, CanvasRendererProps>(
  ({ content, template, platform, onImageGenerated }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null);

    const getDimensions = () => {
      switch (platform) {
        case 'instagram':
          return { width: 1080, height: 1080 };
        case 'facebook':
          return { width: 1200, height: 630 };
        case 'linkedin':
          return { width: 1200, height: 627 };
        default:
          return { width: 1080, height: 1080 };
      }
    };

    const generateImage = async () => {
      const element = ref && 'current' in ref ? ref.current : canvasRef.current;
      if (!element) return;

      try {
        const html2canvas = (await import('html2canvas')).default;
        
        const canvas = await html2canvas(element, {
          backgroundColor: template.color_scheme.background,
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          width: getDimensions().width,
          height: getDimensions().height
        });

        const dataUrl = canvas.toDataURL('image/png', 1.0);
        if (onImageGenerated) {
          onImageGenerated(dataUrl);
        }
        return dataUrl;
      } catch (error) {
        console.error('Errore generazione immagine:', error);
        return null;
      }
    };

    const downloadImage = async () => {
      const dataUrl = await generateImage();
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `post-${platform}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    };

    const formatContent = (text: string) => {
      const maxLength = platform === 'instagram' ? 200 : 300;
      if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
      }
      return text;
    };

    const dimensions = getDimensions();

    return (
      <div className="space-y-4">
        {/* Canvas Preview */}
        <div 
          ref={ref || canvasRef}
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            backgroundColor: template.color_scheme.background,
            fontFamily: template.fonts.body,
            transform: 'scale(0.8)',
            transformOrigin: 'top left',
            overflow: 'hidden'
          }}
          className="relative flex flex-col justify-center p-16"
        >
          
          {/* Logo Area */}
          <div className="absolute top-8 left-8 flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: template.color_scheme.primary }}
            >
              🧠
            </div>
            <div>
              <p 
                className="text-lg font-semibold"
                style={{ 
                  color: template.color_scheme.text,
                  fontFamily: template.fonts.heading 
                }}
              >
                Dr. Cognome
              </p>
              <p 
                className="text-sm opacity-80"
                style={{ color: template.color_scheme.secondary }}
              >
                Psicoterapeuta
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center space-y-8 mt-20 mb-20">
            
            {/* Title */}
            {content.title && (
              <h1 
                className="text-6xl font-bold leading-tight text-center"
                style={{ 
                  color: template.color_scheme.primary,
                  fontFamily: template.fonts.heading,
                  fontSize: `${60 * template.fonts.size_multiplier}px`
                }}
              >
                {content.title}
              </h1>
            )}

            {/* Content */}
            <div className="space-y-4">
              <p 
                className="text-3xl leading-relaxed text-center"
                style={{ 
                  color: template.color_scheme.text,
                  fontFamily: template.fonts.body,
                  fontSize: `${36 * template.fonts.size_multiplier}px`
                }}
              >
                {formatContent(content.content)}
              </p>
            </div>

            {/* Hashtags */}
            <div className="flex flex-wrap justify-center gap-3 pt-8">
              {content.hashtags.slice(0, 5).map((tag, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 rounded-full text-2xl font-medium"
                  style={{ 
                    backgroundColor: template.color_scheme.primary + '20',
                    color: template.color_scheme.primary
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 right-8">
            <p 
              className="text-xl"
              style={{ 
                color: template.color_scheme.secondary,
                fontFamily: template.fonts.body 
              }}
            >
              therap-ia.com
            </p>
          </div>

          {/* Decorations */}
          {template.layout_type === 'card' && (
            <div 
              className="absolute inset-8 border-4 rounded-3xl opacity-20"
              style={{ borderColor: template.color_scheme.primary }}
            ></div>
          )}

          {template.layout_type === 'minimal' && (
            <div>
              <div 
                className="absolute top-0 left-0 w-full h-2"
                style={{ backgroundColor: template.color_scheme.primary }}
              ></div>
              <div 
                className="absolute bottom-0 left-0 w-full h-2"
                style={{ backgroundColor: template.color_scheme.primary }}
              ></div>
            </div>
          )}

        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={downloadImage}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            ⬇️ Scarica Immagine
          </button>
          
          <button
            onClick={generateImage}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
          >
            🔄 Genera Preview
          </button>
        </div>

      </div>
    );
  }
);

CanvasRenderer.displayName = 'CanvasRenderer';

export default CanvasRenderer;
