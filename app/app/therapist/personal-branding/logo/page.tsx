'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type LogoStyle = 'minimale' | 'moderno' | 'professionale' | 'creativo';
type LogoConcept = {
  id: string;
  name: string;
  description: string;
  style: LogoStyle;
  svgContent: string;
  colors: string[];
  fontFamily: string;
};

export default function LogoBuilderPage() {
  const router = useRouter();
  const [step, setStep] = useState<'input' | 'generation' | 'customization' | 'export'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Input data
  const [logoData, setLogoData] = useState({
    name: '',
    specialization: '',
    style: 'professionale' as LogoStyle,
    preferredColors: ['#2c3e50', '#3498db']
  });

  // Generated concepts
  const [concepts, setConcepts] = useState<LogoConcept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<LogoConcept | null>(null);
  
  // Customization
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [customName, setCustomName] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const styles = [
    { id: 'minimale', name: 'Minimale', icon: '⚪', desc: 'Pulito e essenziale' },
    { id: 'moderno', name: 'Moderno', icon: '🔵', desc: 'Contemporaneo e dinamico' },
    { id: 'professionale', name: 'Professionale', icon: '💼', desc: 'Classico e affidabile' },
    { id: 'creativo', name: 'Creativo', icon: '🎨', desc: 'Originale e distintivo' }
  ];

  const specializations = [
    'Psicologo Clinico',
    'Psicoterapeuta',
    'Psicologo del Lavoro',
    'Psicologo dello Sviluppo',
    'Neuropsicólogo',
    'Psicologo Forense',
    'Coach Psicologico',
    'Counselor'
  ];

  async function generateLogoConcepts() {
    if (!logoData.name.trim()) {
      setError('Inserisci il tuo nome');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/logo/generate-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logoData)
      });

      if (!response.ok) throw new Error('Errore generazione logo');

      const data = await response.json();
      setConcepts(data.concepts || []);
      setStep('generation');

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function selectConcept(concept: LogoConcept) {
    setSelectedConcept(concept);
    setCustomColors(concept.colors);
    setCustomName(logoData.name);
    setStep('customization');
  }

  function generateSVG(concept: LogoConcept, colors: string[], name: string): string {
    const [primaryColor, secondaryColor] = colors;
    
    switch (concept.style) {
      case 'minimale':
        return `
<svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="20" width="40" height="40" fill="${primaryColor}" rx="5"/>
  <text x="60" y="35" font-family="${concept.fontFamily}" font-size="16" font-weight="600" fill="${primaryColor}">${name}</text>
  <text x="60" y="50" font-family="${concept.fontFamily}" font-size="12" fill="${secondaryColor}">${logoData.specialization}</text>
</svg>`;

      case 'moderno':
        return `
<svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="30" cy="40" r="20" fill="url(#grad1)"/>
  <text x="60" y="35" font-family="${concept.fontFamily}" font-size="16" font-weight="600" fill="${primaryColor}">${name}</text>
  <text x="60" y="50" font-family="${concept.fontFamily}" font-size="12" fill="${secondaryColor}">${logoData.specialization}</text>
</svg>`;

      case 'professionale':
        return `
<svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="15" width="35" height="35" fill="none" stroke="${primaryColor}" stroke-width="2"/>
  <circle cx="27.5" cy="32.5" r="8" fill="${secondaryColor}"/>
  <text x="55" y="30" font-family="${concept.fontFamily}" font-size="16" font-weight="600" fill="${primaryColor}">${name}</text>
  <text x="55" y="45" font-family="${concept.fontFamily}" font-size="12" fill="${secondaryColor}">${logoData.specialization}</text>
</svg>`;

      case 'creativo':
        return `
<svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 40 L35 20 L50 40 L35 50 Z" fill="${primaryColor}"/>
  <path d="M25 35 L40 25 L45 35 L40 40 Z" fill="${secondaryColor}"/>
  <text x="60" y="35" font-family="${concept.fontFamily}" font-size="16" font-weight="600" fill="${primaryColor}">${name}</text>
  <text x="60" y="50" font-family="${concept.fontFamily}" font-size="12" fill="${secondaryColor}">${logoData.specialization}</text>
</svg>`;

      default:
        return concept.svgContent;
    }
  }

  function downloadSVG() {
    if (!selectedConcept) return;
    
    const svgContent = generateSVG(selectedConcept, customColors, customName);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customName.toLowerCase().replace(/\s+/g, '-')}-logo.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPNG() {
    if (!selectedConcept || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const svgContent = generateSVG(selectedConcept, customColors, customName);
    
    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 160;
      ctx?.drawImage(img, 0, 0, 400, 160);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `${customName.toLowerCase().replace(/\s+/g, '-')}-logo.png`;
          a.click();
          URL.revokeObjectURL(pngUrl);
        }
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1f3a' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
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
            <h1 className="text-3xl font-bold text-white">🎨 Logo & Brand Builder</h1>
            <p style={{ color: '#a8b2d6' }}>Crea la tua identità visiva professionale</p>
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

        {/* STEP 1: Input */}
        {step === 'input' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">📝 Le tue informazioni</h2>
              <p style={{ color: '#a8b2d6' }}>Inserisci i dati per creare il tuo logo professionale</p>
            </div>

            <div className="rounded-lg p-8" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div className="space-y-6">
                <div>
                  <label className="block font-medium text-white mb-2">Nome/Titolo *</label>
                  <input
                    type="text"
                    value={logoData.name}
                    onChange={(e) => setLogoData({...logoData, name: e.target.value})}
                    placeholder="Dr. Mario Rossi"
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-white mb-2">Specializzazione</label>
                  <select
                    value={logoData.specialization}
                    onChange={(e) => setLogoData({...logoData, specialization: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Seleziona specializzazione</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-white mb-4">Stile Logo</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {styles.map(style => (
                      <div
                        key={style.id}
                        onClick={() => setLogoData({...logoData, style: style.id as LogoStyle})}
                        className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                          logoData.style === style.id
                            ? 'border-red-500 bg-red-500/20'
                            : 'border-gray-600 bg-white/5 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-2xl text-center mb-2">{style.icon}</div>
                        <h3 className="font-medium text-white text-center text-sm">{style.name}</h3>
                        <p className="text-xs text-gray-400 text-center mt-1">{style.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-white mb-2">Colori Preferiti</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={logoData.preferredColors[0]}
                      onChange={(e) => setLogoData({
                        ...logoData, 
                        preferredColors: [e.target.value, logoData.preferredColors[1]]
                      })}
                      className="w-12 h-12 rounded border-2 border-gray-600"
                    />
                    <input
                      type="color"
                      value={logoData.preferredColors[1]}
                      onChange={(e) => setLogoData({
                        ...logoData, 
                        preferredColors: [logoData.preferredColors[0], e.target.value]
                      })}
                      className="w-12 h-12 rounded border-2 border-gray-600"
                    />
                  </div>
                </div>

                <button
                  onClick={generateLogoConcepts}
                  disabled={loading || !logoData.name.trim()}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-medium hover:from-red-700 hover:to-red-800 disabled:opacity-50"
                >
                  {loading ? 'Generando...' : '🎨 Genera Logo Concepts'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Generation */}
        {step === 'generation' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">✨ I tuoi logo concepts</h2>
              <p style={{ color: '#a8b2d6' }}>Scegli il design che preferisci</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {concepts.map(concept => (
                <div
                  key={concept.id}
                  onClick={() => selectConcept(concept)}
                  className="p-6 rounded-lg cursor-pointer transition-all hover:scale-105 border border-gray-600 bg-white/5 hover:border-red-500"
                >
                  <div className="bg-white rounded-lg p-6 mb-4">
                    <div dangerouslySetInnerHTML={{ 
                      __html: generateSVG(concept, concept.colors, logoData.name)
                    }} />
                  </div>
                  <h3 className="font-medium text-white mb-2">{concept.name}</h3>
                  <p className="text-sm text-gray-400">{concept.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep('input')}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                ← Modifica Dati
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Customization */}
        {step === 'customization' && selectedConcept && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">🔧 Personalizza il logo</h2>
              <p style={{ color: '#a8b2d6' }}>Adatta colori e testo alle tue preferenze</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block font-medium text-white mb-2">Nome</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-white mb-2">Colori</label>
                  <div className="space-y-3">
                    {customColors.map((color, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...customColors];
                            newColors[index] = e.target.value;
                            setCustomColors(newColors);
                          }}
                          className="w-12 h-8 rounded border border-gray-600"
                        />
                        <span className="font-mono text-sm text-white">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-white">Anteprima</h3>
                <div className="bg-white rounded-lg p-8">
                  <div dangerouslySetInnerHTML={{ 
                    __html: generateSVG(selectedConcept, customColors, customName)
                  }} />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('generation')}
                    className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                  >
                    ← Cambia Logo
                  </button>
                  <button
                    onClick={() => setStep('export')}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    Finalizza →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Export */}
        {step === 'export' && selectedConcept && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">📥 Download del tuo logo</h2>
              <p style={{ color: '#a8b2d6' }}>Scarica i file per utilizzare ovunque</p>
            </div>

            <div className="rounded-lg p-8 text-center" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div className="bg-white rounded-lg p-8 mb-6 inline-block">
                <div dangerouslySetInnerHTML={{ 
                  __html: generateSVG(selectedConcept, customColors, customName)
                }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={downloadSVG}
                  className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                >
                  📄 Scarica SVG (Vettoriale)
                </button>
                <button
                  onClick={downloadPNG}
                  className="bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
                >
                  🖼️ Scarica PNG (Immagine)
                </button>
              </div>

              <div className="text-sm text-gray-400 space-y-1">
                <p><strong>SVG:</strong> Perfetto per stampa e web, ridimensionabile</p>
                <p><strong>PNG:</strong> Per social media e presentazioni</p>
              </div>

              <div className="mt-6 flex gap-4 justify-center">
                <button
                  onClick={() => setStep('customization')}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  ← Modifica
                </button>
                <button
                  onClick={() => {
                    setStep('input');
                    setConcepts([]);
                    setSelectedConcept(null);
                    setLogoData({
                      name: '',
                      specialization: '',
                      style: 'professionale',
                      preferredColors: ['#2c3e50', '#3498db']
                    });
                  }}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                >
                  🔄 Nuovo Logo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden canvas for PNG export */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

      </div>
    </div>
  );
}
