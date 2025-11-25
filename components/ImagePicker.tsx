'use client';
import { useState, useRef } from 'react';

interface ImagePickerProps {
  onImageSelected: (imageData: {
    type: 'stock' | 'upload' | 'gradient' | 'plain';
    data: any;
    prompt?: string;
  }) => void;
  currentImage?: string;
}

interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
    full: string;
  };
  alt_description: string;
  user: {
    name: string;
  };
}

export default function ImagePicker({ onImageSelected, currentImage }: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState<'stock' | 'upload' | 'gradient' | 'plain'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockImages, setStockImages] = useState<UnsplashImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [gradientPrompt, setGradientPrompt] = useState('');
  const [gradientColors, setGradientColors] = useState(['#3b82f6', '#8b5cf6']);
  const [gradientDirection, setGradientDirection] = useState<'to right' | 'to bottom' | 'to bottom right' | 'radial'>('to bottom');
  const [plainColor, setPlainColor] = useState('#f8fafc');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ricerca immagini stock (Unsplash + Pexels)
  async function searchStockImages() {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      // Prima prova Unsplash
      const unsplashResponse = await fetch(`/api/images/unsplash?query=${encodeURIComponent(searchQuery)}&per_page=12`);
      
      if (unsplashResponse.ok) {
        const data = await unsplashResponse.json();
        setStockImages(data.results || []);
      } else {
        // Fallback su Pexels se Unsplash fallisce
        const pexelsResponse = await fetch(`/api/images/pexels?query=${encodeURIComponent(searchQuery)}&per_page=12`);
        
        if (pexelsResponse.ok) {
          const data = await pexelsResponse.json();
          // Adatta formato Pexels a formato Unsplash
          const adaptedImages = data.photos?.map((photo: any) => ({
            id: photo.id.toString(),
            urls: {
              small: photo.src.medium,
              regular: photo.src.large,
              full: photo.src.original
            },
            alt_description: photo.alt || 'Stock photo',
            user: {
              name: photo.photographer
            }
          })) || [];
          setStockImages(adaptedImages);
        } else {
          throw new Error('Errore nella ricerca immagini');
        }
      }
    } catch (e: any) {
      setError(e.message);
      setStockImages([]);
    } finally {
      setIsSearching(false);
    }
  }

  // Upload immagine personale
  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Seleziona un file immagine valido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Immagine troppo grande. Massimo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      onImageSelected({
        type: 'upload',
        data: result
      });
    };
    reader.readAsDataURL(file);
    setError(null);
  }

  // Genera gradiente da prompt
  async function generateGradientFromPrompt() {
    if (!gradientPrompt.trim()) return;
    
    try {
      const response = await fetch('/api/images/generate-gradient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: gradientPrompt })
      });

      if (response.ok) {
        const data = await response.json();
        setGradientColors(data.colors);
        setGradientDirection(data.direction);
        
        onImageSelected({
          type: 'gradient',
          data: { colors: data.colors, direction: data.direction },
          prompt: gradientPrompt
        });
      }
    } catch (e: any) {
      setError('Errore nella generazione del gradiente');
    }
  }

  // Anteprima gradiente
  const gradientStyle = gradientDirection === 'radial' 
    ? `radial-gradient(circle, ${gradientColors.join(', ')})`
    : `linear-gradient(${gradientDirection}, ${gradientColors.join(', ')})`;

  const tabs = [
    { id: 'stock', name: 'Stock Photos', icon: '📸' },
    { id: 'upload', name: 'Carica Immagine', icon: '📁' },
    { id: 'gradient', name: 'Sfondo Neutro', icon: '🎨' },
    { id: 'plain', name: 'Colore Unito', icon: '⚪' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.name}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p><strong>Errore:</strong> {error}</p>
        </div>
      )}

      {/* Stock Photos Tab */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca immagini (es: ansia, relax, natura, terapia...)"
              className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && searchStockImages()}
            />
            <button
              onClick={searchStockImages}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? 'Cercando...' : 'Cerca'}
            </button>
          </div>

          {stockImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stockImages.map(image => (
                <div key={image.id} className="relative group cursor-pointer" onClick={() => onImageSelected({
                  type: 'stock',
                  data: image.urls.regular
                })}>
                  <img
                    src={image.urls.small}
                    alt={image.alt_description}
                    className="w-full h-32 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                    <span className="text-white font-medium opacity-0 group-hover:opacity-100">Seleziona</span>
                  </div>
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {image.user.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && stockImages.length === 0 && !isSearching && (
            <div className="text-center py-8 text-gray-500">
              <p>Nessuna immagine trovata per "{searchQuery}"</p>
              <p className="text-sm">Prova con termini come: ansia, relax, natura, studio, benessere</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {uploadedImage ? (
              <div className="space-y-4">
                <img src={uploadedImage} alt="Uploaded" className="max-h-48 mx-auto rounded-lg" />
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700"
                  >
                    Cambia Immagine
                  </button>
                  <button
                    onClick={() => onImageSelected({ type: 'upload', data: uploadedImage })}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                  >
                    Usa questa Immagine
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-4">📁</div>
                <p className="text-gray-600 mb-4">Carica la tua immagine personale</p>
                <p className="text-sm text-gray-500 mb-4">JPG, PNG - Massimo 5MB</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
                >
                  Seleziona File
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Gradient Tab */}
      {activeTab === 'gradient' && (
        <div className="space-y-6">
          
          {/* AI Prompt */}
          <div className="space-y-3">
            <label className="block font-medium text-gray-700">🤖 Descrivi lo sfondo che vuoi</label>
            <textarea
              value={gradientPrompt}
              onChange={(e) => setGradientPrompt(e.target.value)}
              placeholder="Es: Sfondo rilassante con colori pastelli per post sull'ansia, gradiente professionale blu per LinkedIn..."
              className="w-full border rounded-lg p-4 min-h-[80px] focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={generateGradientFromPrompt}
              disabled={!gradientPrompt.trim()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              🎨 Genera da Descrizione
            </button>
          </div>

          <div className="border-t pt-6">
            <p className="font-medium text-gray-700 mb-4">Oppure personalizza manualmente:</p>
            
            {/* Manual Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Colori Gradiente</label>
                  <div className="space-y-2">
                    {gradientColors.map((color, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...gradientColors];
                            newColors[index] = e.target.value;
                            setGradientColors(newColors);
                          }}
                          className="w-12 h-8 border rounded"
                        />
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...gradientColors];
                            newColors[index] = e.target.value;
                            setGradientColors(newColors);
                          }}
                          className="flex-1 border rounded px-3 py-1 font-mono text-sm"
                        />
                        {gradientColors.length > 2 && (
                          <button
                            onClick={() => setGradientColors(gradientColors.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {gradientColors.length < 4 && (
                      <button
                        onClick={() => setGradientColors([...gradientColors, '#ffffff'])}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        + Aggiungi Colore
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Direzione</label>
                  <select
                    value={gradientDirection}
                    onChange={(e) => setGradientDirection(e.target.value as any)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="to bottom">Dall'alto in basso</option>
                    <option value="to right">Da sinistra a destra</option>
                    <option value="to bottom right">Diagonale</option>
                    <option value="radial">Radiale (dal centro)</option>
                  </select>
                </div>

                <button
                  onClick={() => onImageSelected({
                    type: 'gradient',
                    data: { colors: gradientColors, direction: gradientDirection }
                  })}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
                >
                  ✅ Usa questo Gradiente
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium">Anteprima</label>
                <div 
                  className="w-full h-48 rounded-lg border"
                  style={{ background: gradientStyle }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plain Color Tab */}
      {activeTab === 'plain' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Colore di Sfondo</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={plainColor}
                    onChange={(e) => setPlainColor(e.target.value)}
                    className="w-12 h-8 border rounded"
                  />
                  <input
                    type="text"
                    value={plainColor}
                    onChange={(e) => setPlainColor(e.target.value)}
                    className="flex-1 border rounded px-3 py-2 font-mono"
                  />
                </div>
              </div>

              {/* Quick Colors */}
              <div>
                <label className="block text-sm font-medium mb-2">Colori Predefiniti</label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    '#ffffff', '#f8fafc', '#f1f5f9', 
                    '#e2e8f0', '#cbd5e1', '#94a3b8',
                    '#64748b', '#475569', '#334155',
                    '#1e293b', '#0f172a', '#000000'
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => setPlainColor(color)}
                      className={`w-8 h-8 rounded border-2 ${plainColor === color ? 'border-blue-500' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => onImageSelected({
                  type: 'plain',
                  data: plainColor
                })}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                ✅ Usa questo Colore
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Anteprima</label>
              <div 
                className="w-full h-48 rounded-lg border"
                style={{ backgroundColor: plainColor }}
              ></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
