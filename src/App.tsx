import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Clock, 
  Upload, 
  Camera, 
  Sparkles, 
  LogOut, 
  Calendar,
  Layers,
  CheckCircle,
  HelpCircle,
  Image as ImageIcon
} from 'lucide-react';
import { Photo, CategoryKey, DEFAULT_PHOTOS_FALLBACK } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import GallerySection from './components/GallerySection';
import UploadModal from './components/UploadModal';
import weddingPortrait from './assets/images/wedding_portrait_1781150099889.png';

export default function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [relation, setRelation] = useState<string>('Invitado');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [currentCategory, setCategory] = useState<CategoryKey>('engagement');
  
  // Real-time time states
  const [currentClock, setCurrentClock] = useState<string>('');
  const [marriageTimeElapsed, setMarriageTimeElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isFutureWedding, setIsFutureWedding] = useState(true);

  // UI States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUpdatingBg, setIsUpdatingBg] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load username & relation from localStorage on startup
  useEffect(() => {
    const savedName = localStorage.getItem('wedding-guest-name');
    const savedRelation = localStorage.getItem('wedding-guest-relation');
    if (savedName) {
      setUsername(savedName);
    }
    if (savedRelation) {
      setRelation(savedRelation);
    }
  }, []);

  // Fetch album photos and background from custom Node.js server with localStorage fallback for static sites (like Netlify)
  const fetchAlbumData = async () => {
    let loadedFromApi = false;
    try {
      const response = await fetch('/api/album-data');
      if (response.ok) {
        const text = await response.text();
        if (text.trim().startsWith('{')) {
          const data = JSON.parse(text);
          if (data && Array.isArray(data.photos)) {
            setPhotos(data.photos);
            loadedFromApi = true;
          }
          if (data && data.backgroundUrl) {
            setBackgroundUrl(data.backgroundUrl);
          }
        }
      }
    } catch (error) {
      console.warn('Backend API not available or threw error, using client-side fallback:', error);
    }

    if (!loadedFromApi) {
      // Local fallback representation for Netlify/static hosting
      const storedLocalStr = localStorage.getItem('wedding-photos-local-db');
      let localPhotos = [];
      if (storedLocalStr) {
        try {
          localPhotos = JSON.parse(storedLocalStr);
        } catch (e) {
          localPhotos = [];
        }
      }
      
      if (!Array.isArray(localPhotos) || localPhotos.length === 0) {
        localPhotos = [...DEFAULT_PHOTOS_FALLBACK];
        localStorage.setItem('wedding-photos-local-db', JSON.stringify(localPhotos));
      }
      setPhotos(localPhotos);

      const cachedBg = localStorage.getItem('wedding-background-local');
      if (cachedBg) {
        setBackgroundUrl(cachedBg);
      }
    }
  };

  // Poll for live additions in real-time every 5 seconds
  useEffect(() => {
    fetchAlbumData(); // Initial load
    const interval = setInterval(fetchAlbumData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Live clocks effect (current time and countdown/count-up for June 14, 2026)
  useEffect(() => {
    const weddingDate = new Date('2026-06-14T12:00:00'); // Wedding Day is 14 June 2026

    const updateClocks = () => {
      // 1. Current clock time
      const now = new Date();
      setCurrentClock(now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));

      // 2. Decide if it is a future wedding
      const isFuture = now.getTime() < weddingDate.getTime();
      setIsFutureWedding(isFuture);

      // 3. Difference in Ms
      const diffMs = isFuture 
        ? weddingDate.getTime() - now.getTime()
        : now.getTime() - weddingDate.getTime();
      
      const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
      const days = Math.floor(diffSeconds / (3600 * 24));
      const hours = Math.floor((diffSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;

      setMarriageTimeElapsed({ days, hours, minutes, seconds });
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEnterGuest = (name: string, guestRelation: string) => {
    setUsername(name);
    setRelation(guestRelation);
    localStorage.setItem('wedding-guest-name', name);
    localStorage.setItem('wedding-guest-relation', guestRelation);
    showStatus(`¡Bienvenido/a, ${name}! Te has unido como ${guestRelation}.`, 'success');
  };

  const handleSignOut = () => {
    if (confirm('¿Deseas cerrar sesión del álbum de Valentina y Anderson?')) {
      localStorage.removeItem('wedding-guest-name');
      localStorage.removeItem('wedding-guest-relation');
      setUsername(null);
    }
  };

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  // --- API Handlers ---

  const handleLikePhoto = async (photoId: string) => {
    // Optimistic update
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes: p.likes + 1 } : p));

    // Persist like to local storage fallback
    const storedLocalStr = localStorage.getItem('wedding-photos-local-db');
    if (storedLocalStr) {
      try {
        const localPhotos = JSON.parse(storedLocalStr);
        if (Array.isArray(localPhotos)) {
          const updated = localPhotos.map((p: any) => p.id === photoId ? { ...p, likes: p.likes + 1 } : p);
          localStorage.setItem('wedding-photos-local-db', JSON.stringify(updated));
        }
      } catch (e) {
        console.error('Error saving local likes', e);
      }
    }

    try {
      await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId })
      });
    } catch (e) {
      console.warn('Liked on client-side cache only (no server connected).');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    // Delete from localStorage fallback
    const storedLocalStr = localStorage.getItem('wedding-photos-local-db');
    if (storedLocalStr) {
      try {
        const localPhotos = JSON.parse(storedLocalStr);
        if (Array.isArray(localPhotos)) {
          const updated = localPhotos.filter((p: any) => p.id !== photoId);
          localStorage.setItem('wedding-photos-local-db', JSON.stringify(updated));
        }
      } catch (e) {
        console.error('Error updating cache on delete', e);
      }
    }

    try {
      const response = await fetch('/api/delete-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, username })
      });

      if (response.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        showStatus('La hermosa memoria ha sido removida del álbum compartido.', 'success');
      } else {
        const text = await response.text();
        // If response is HTML page (like Netlify CDN 404), treat as client delete success
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          setPhotos(prev => prev.filter(p => p.id !== photoId));
          showStatus('La hermosa memoria ha sido removida de tu navegador.', 'success');
        } else {
          let errorMsg = 'No fue posible eliminar la foto.';
          if (text.trim().startsWith('{')) {
            try {
              const data = JSON.parse(text);
              errorMsg = data.error || errorMsg;
            } catch (e) {
              // ignore
            }
          }
          showStatus(errorMsg, 'error');
        }
      }
    } catch (e) {
      // Offline fallback: perform deletion on client state anyway
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      showStatus('Memoria removida de tu navegador local (Modo Sin Servidor).', 'success');
    }
  };

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUpdatingBg(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (event) => {
      const base64Img = event.target?.result as string;

      // Instantly apply locally so they see the background update on static-only hosts
      localStorage.setItem('wedding-background-local', base64Img);
      setBackgroundUrl(base64Img);

      try {
        const response = await fetch('/api/update-background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: base64Img })
        });

        if (response.ok) {
          const text = await response.text();
          if (text.trim().startsWith('{')) {
            const resData = JSON.parse(text);
            setBackgroundUrl(resData.backgroundUrl);
            showStatus('¡Se actualizó la hermosa foto de portada del álbum familiar!', 'success');
          } else {
            showStatus('¡Se actualizó la hermosa foto de portada!', 'success');
          }
        } else {
          showStatus('Foto de portada actualizada de forma local (Servidor no responde).', 'success');
        }
      } catch (err) {
        console.warn('Network unreachable, updated background locally inside browser.', err);
        showStatus('¡Se actualizó la hermosa foto de portada localmente!', 'success');
      } finally {
        setIsUpdatingBg(false);
      }
    };
  };

  const handleNewUploadSuccess = (newPhoto: Photo) => {
    setPhotos(prev => [newPhoto, ...prev]);
    showStatus('¡Gracias por agregar un nuevo recuerdo al álbum familiar! ✨', 'success');
  };

  // If no guest registered yet, display welcome panel
  if (!username) {
    return <WelcomeScreen onEnter={handleEnterGuest} />;
  }

  // Pre-configured pastel card categories for UI
  const coverPresetUrl = weddingPortrait;

  return (
    <div className="min-h-screen bg-sage-50 text-sage-900 pb-16 flex flex-col justify-between selection:bg-sage-200">
      
      {/* Dynamic Status bar notifications */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className={`p-4 rounded-xl shadow-lg border flex items-center gap-2.5 backdrop-blur-md ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-550 border-emerald-600 text-white' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <HelpCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="text-xs font-semibold leading-snug">{statusMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Header/Bar */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-sage-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-serif text-sm border border-emerald-100 font-bold">
              DM
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-sage-400 font-bold block leading-none">Wedding Album</span>
              <span className="font-serif text-base text-sage-800 font-bold">Valentina & Anderson</span>
            </div>
          </div>

          {/* User badge and clock widgets */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-sage-500 bg-sage-100 px-3 py-1.5 rounded-xl border border-sage-200">
              <Clock className="w-3.5 h-3.5 text-sage-400" />
              <span>Hora: {currentClock || 'Cargando...'}</span>
            </div>

            <div className="flex items-center gap-2 bg-sage-50 border border-sage-200 py-1 pl-2.5 pr-2 rounded-xl text-xs">
              <div className="text-right">
                <span className="text-[10px] text-sage-400 block font-semibold leading-none">{relation}</span>
                <span className="font-semibold text-sage-800 leading-none">{username}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg text-sage-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner / Interactive Hero cover */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div 
          className="relative rounded-3xl overflow-hidden h-[340px] md:h-[420px] shadow-lg border border-sage-100 bg-sage-900 group flex flex-col justify-end p-6 md:p-10"
        >
          {/* Background image either user-uploaded couple photo or preset Unsplash cover */}
          <img
            src={backgroundUrl || coverPresetUrl}
            alt="Fondo Valentina y Anderson"
            className="absolute inset-0 w-full h-full object-cover object-[center_17%] opacity-85 transition-all duration-300"
            referrerPolicy="no-referrer"
          />
          {/* Subtle color overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-sage-950 via-sage-900/40 to-transparent" />

          {/* Bottom layout elements on Hero */}
          <div className="relative z-10 text-white max-w-2xl space-y-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-[10px] tracking-wider uppercase font-bold text-sage-100 mb-3">
                <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                <span>Nuestra Hermosa Historia de Amor</span>
              </span>
              <h1 className="font-serif text-3xl md:text-5xl leading-tight font-serif text-white tracking-tight">
                Dots. Memories <br className="hidden sm:block" />
                <span className="italic font-light">de</span> Valentina & Anderson
              </h1>
              <p className="text-xs md:text-sm font-light text-sage-100/90 mt-2 max-w-lg leading-relaxed">
                Cada paso que dimos, cada sonrisa compartida y cada amigo que nos acompañó. Bienvenidos a nuestro álbum compartido eterno. ¡Sube tus fotos para revivir la felicidad juntos!
              </p>
            </div>

            {/* LIVE COUNTDOWN / WEDDING DAYS TRACKER */}
            <div className="h-[1px] w-full bg-white/20" />
            
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-sage-300 block">
                  {isFutureWedding ? 'Faltan para nuestro gran día' : 'Tiempo transcurrido casados desde'}
                </span>
                <span className="text-xs font-semibold flex items-center gap-1 text-emerald-200">
                  <Calendar className="w-3.5 h-3.5 text-emerald-250" />
                  <span>14 de Junio de 2026</span>
                </span>
              </div>

              {/* Time units counter capsules */}
              <div className="flex items-center gap-2 text-center">
                <div className="bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 min-w-[50px]">
                  <span className="block text-sm md:text-base font-bold font-mono tracking-tight text-white leading-none">
                    {marriageTimeElapsed.days}
                  </span>
                  <span className="text-[8px] text-sage-300 uppercase font-semibold">Días</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 min-w-[50px]">
                  <span className="block text-sm md:text-base font-bold font-mono tracking-tight text-white leading-none">
                    {marriageTimeElapsed.hours.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[8px] text-sage-300 uppercase font-semibold">Horas</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 min-w-[50px]">
                  <span className="block text-sm md:text-base font-bold font-mono tracking-tight text-white leading-none">
                    {marriageTimeElapsed.minutes.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[8px] text-sage-300 uppercase font-semibold">Min</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 min-w-[50px]">
                  <span className="block text-sm md:text-base font-bold font-mono tracking-tight text-emerald-200 leading-none">
                    {marriageTimeElapsed.seconds.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[8px] text-sage-300 uppercase font-semibold">Segs</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Mobile Current Clock Widget */}
      <div className="md:hidden max-w-7xl mx-auto w-full px-4 pt-4">
        <div className="bg-white border border-sage-200 rounded-xl px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-sage-500 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sage-400" />
            <span>Hora Actual:</span>
          </span>
          <span className="font-mono font-bold text-sage-800">{currentClock || 'Cargando...'}</span>
        </div>
      </div>

      {/* Main Albums & Folders content area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 flex-1">
        <GallerySection
          photos={photos}
          currentCategory={currentCategory}
          setCategory={setCategory}
          username={username}
          onLike={handleLikePhoto}
          onDelete={handleDeletePhoto}
          onOpenUpload={() => setIsUploadOpen(true)}
        />
      </main>

      {/* Upload button floating for quick acces on narrow phones with clean tabs layout */}
      <div className="fixed bottom-6 right-6 z-35 md:hidden">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsUploadOpen(true)}
          className="bg-sage-600 border border-sage-700 hover:bg-sage-700 text-white p-4 rounded-full shadow-xl flex items-center justify-center cursor-pointer"
        >
          <Upload className="w-5.5 h-5.5" />
        </motion.button>
      </div>

      {/* Modal overlays */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleNewUploadSuccess}
        username={username}
        defaultCategory={currentCategory}
      />

      {/* Simple footer containing wedding signatures */}
      <footer className="mt-16 border-t border-sage-100 py-6 text-center text-xs text-sage-400">
        <p className="font-serif italic text-sage-550 text-[13px] mb-1">“El amor es paciente, es servicial; el amor no es envidioso, no es jactancioso...”</p>
        <p>© 2024 Valentina & Anderson • Dots. Memories • Álbum de Bodas interactivo.</p>
      </footer>
    </div>
  );
}
