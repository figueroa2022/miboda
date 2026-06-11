import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderHeart, 
  Sparkles, 
  Upload, 
  ChevronRight, 
  ChevronLeft, 
  FileHeart, 
  ArrowLeft, 
  Heart, 
  Calendar, 
  User, 
  Grid, 
  Play, 
  Pause,
  Layers
} from 'lucide-react';
import { CategoryKey, Photo } from '../types';
import PhotoCard from './PhotoCard';

interface GallerySectionProps {
  photos: Photo[];
  currentCategory: CategoryKey;
  setCategory: (cat: CategoryKey) => void;
  username: string;
  onLike: (photoId: string) => void;
  onDelete: (photoId: string) => void;
  onOpenUpload: () => void;
}

export default function GallerySection({
  photos,
  currentCategory,
  setCategory,
  username,
  onLike,
  onDelete,
  onOpenUpload
}: GallerySectionProps) {
  // Navigation & Sub-views states
  const [viewMode, setViewMode] = useState<'folders' | 'detail'>('folders');
  const [displayType, setDisplayType] = useState<'carousel' | 'grid'>('carousel');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLikingActive, setIsLikingActive] = useState(false);

  // Group options matching user requests
  const categories: { key: CategoryKey; label: string; description: string; emoji: string; count: number; special?: boolean }[] = [
    {
      key: 'engagement',
      label: 'Pedida de Mano',
      description: 'El romántico "¡Sí, acepto!"',
      emoji: '💍',
      count: photos.filter(p => p.category === 'engagement').length
    },
    {
      key: 'civil',
      label: 'Boda Civil',
      description: 'Nuestra firma legal de amor',
      emoji: '⚖️',
      count: photos.filter(p => p.category === 'civil').length
    },
    {
      key: 'ceremony',
      label: 'Ceremonia Sagrada',
      description: 'Unión de almas ante Dios',
      emoji: '⛪',
      count: photos.filter(p => p.category === 'ceremony').length
    },
    {
      key: 'reception',
      label: 'Gran Recepción',
      description: 'Brindis, baile y alegría eterna',
      emoji: '🥂',
      count: photos.filter(p => p.category === 'reception').length,
      special: true
    }
  ];

  const filteredPhotos = photos.filter(p => p.category === currentCategory);

  // Safe index guard
  useEffect(() => {
    if (carouselIndex >= filteredPhotos.length) {
      setCarouselIndex(Math.max(0, filteredPhotos.length - 1));
    }
  }, [filteredPhotos.length, carouselIndex]);

  // Slideshow intervals for automatic play
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && filteredPhotos.length > 1) {
      interval = setInterval(() => {
        setCarouselIndex(prev => (prev + 1) % filteredPhotos.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, filteredPhotos.length]);

  const handleSelectAlbum = (catKey: CategoryKey) => {
    setCategory(catKey);
    setCarouselIndex(0);
    setViewMode('detail');
    
    // Smooth scroll down to the album viewpoint
    setTimeout(() => {
      const element = document.getElementById('album-view-point');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleNextSlide = () => {
    if (filteredPhotos.length === 0) return;
    setCarouselIndex(prev => (prev + 1) % filteredPhotos.length);
  };

  const handlePrevSlide = () => {
    if (filteredPhotos.length === 0) return;
    setCarouselIndex(prev => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  const handleLikeCurrent = (photoId: string) => {
    setIsLikingActive(true);
    onLike(photoId);
    setTimeout(() => setIsLikingActive(false), 500);
  };

  // Date formatting for carousel card
  const formatDateFriendly = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('es-ES', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-8" id="album-view-point">
      {/* 1. Folders Directory Mode */}
      {viewMode === 'folders' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl md:text-2xl text-sage-800 tracking-tight font-semibold flex items-center gap-2">
                <FolderHeart className="w-6 h-6 text-sage-500" />
                <span>Nuestras Carpetas de Recuerdos</span>
              </h2>
              <p className="text-xs text-sage-500 mt-1">Elige un álbum para abrir los momentos en un carrusel interactivo</p>
            </div>
            <span className="text-xs text-sage-600 bg-sage-100 border border-sage-200 px-3 py-1.5 rounded-full font-semibold">
              {photos.length} Fotos Totales
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((cat) => (
              <motion.button
                key={cat.key}
                whileHover={{ y: -5, scale: 1.01, boxShadow: '0 10px 25px -5px rgba(112, 128, 112, 0.12)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectAlbum(cat.key)}
                className={`text-left rounded-3xl p-5 md:p-6 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[160px] md:min-h-[175px] bg-white border-sage-150 text-sage-900 shadow-sm hover:border-sage-300`}
              >
                {cat.special && (
                  <div className="absolute top-3 right-3 flex p-1 bg-emerald-500/10 text-emerald-600 rounded-full animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${
                    cat.special ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-sage-50 text-sage-600 border border-sage-100'
                  }`}>
                    {cat.special ? <Sparkles className="w-5 h-5" /> : <FolderHeart className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-sage-100 text-sage-700 rounded-full">
                    {cat.count} {cat.count === 1 ? 'foto' : 'fotos'}
                  </span>
                </div>

                <div className="mt-5">
                  <h3 className={`text-base font-bold leading-tight flex items-center gap-1.5 text-sage-800`}>
                    <span className="text-lg">{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </h3>
                  <p className="text-xs mt-1 leading-snug text-sage-500 flex items-center justify-between w-full">
                    <span>{cat.description}</span>
                    <ChevronRight className="w-4 h-4 text-sage-300 group-hover:text-sage-500 transition-colors" />
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        /* 2. Album detail mode ("Otra página" transition effect in state) */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Action Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-md rounded-2xl border border-sage-150 p-4 shadow-sm">
            <button
              onClick={() => setViewMode('folders')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-sage-600 hover:text-sage-800 bg-white border border-sage-200 px-3.5 py-2 rounded-xl shadow-sm transition-all cursor-pointer hover:bg-sage-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Álbumes</span>
            </button>

            <div className="flex items-center gap-2 self-end md:self-auto bg-sage-100/70 p-1.5 rounded-xl border border-sage-200">
              <button
                onClick={() => setDisplayType('carousel')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  displayType === 'carousel' 
                    ? 'bg-sage-600 text-white shadow-sm' 
                    : 'text-sage-600 hover:bg-sage-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ver Carrusel 🎠</span>
              </button>
              <button
                onClick={() => setDisplayType('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  displayType === 'grid' 
                    ? 'bg-sage-600 text-white shadow-sm' 
                    : 'text-sage-600 hover:bg-sage-50'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Ver Cuadrícula 📱</span>
              </button>
            </div>
          </div>

          {/* Title description segment */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sage-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-sage-400 block">
                Usted está viendo &bull; Momentos Especiales
              </span>
              <h2 className="font-serif text-xl md:text-2xl text-sage-800 font-bold flex items-center gap-2 mt-0.5">
                <span>{currentCategory === 'engagement' ? '💍' : currentCategory === 'civil' ? '⚖️' : currentCategory === 'ceremony' ? '⛪' : '🥂'}</span>
                <span>
                  {currentCategory === 'engagement'
                    ? 'Pedida de Mano'
                    : currentCategory === 'civil'
                    ? 'Boda Civil'
                    : currentCategory === 'ceremony'
                    ? 'Ceremonia Sagrada'
                    : 'Gran Recepción'}
                </span>
                <span className="text-xs font-sans font-normal text-sage-400">
                  ({filteredPhotos.length} {filteredPhotos.length === 1 ? 'recorrido' : 'recuerdos'})
                </span>
              </h2>
            </div>

            {currentCategory === 'reception' ? (
              <button
                onClick={onOpenUpload}
                className="flex items-center justify-center gap-2 px-4 py-2 hover:bg-sage-700 bg-sage-600 font-medium text-xs text-white rounded-xl shadow-md transition-all cursor-pointer hover:shadow-lg"
              >
                <Upload className="w-4 h-4" />
                <span>Subir fotos de Recepción</span>
              </button>
            ) : (
              <span className="text-[11px] text-sage-500 font-medium italic bg-sage-50 border border-sage-100 px-3 py-1.5 rounded-xl">
                Álbum exclusivo de Valentina & Anderson ✨
              </span>
            )}
          </div>

          {/* Carousel Showcase Container */}
          {filteredPhotos.length === 0 ? (
            <div className="py-20 bg-white rounded-3xl border border-sage-150 flex flex-col items-center justify-center text-center p-6">
              <div className="bg-sage-50 text-sage-400 p-4 rounded-full mb-3 border border-sage-100">
                <FileHeart className="w-8 h-8 text-sage-300" />
              </div>
              <h3 className="text-base font-semibold text-sage-700 mb-1">Aún no hay fotos en este álbum</h3>
              <p className="text-xs text-sage-400 max-w-sm mb-4">
                {currentCategory === 'reception' 
                  ? 'Añade la primera memoria para iniciar el carrusel de fotos compartidas de esta hermosa recepción.'
                  : 'Este álbum está reservado para fotos oficiales compartidas de Valentina y Anderson.'}
              </p>
              {currentCategory === 'reception' && (
                <button
                  onClick={onOpenUpload}
                  className="px-5 py-2 bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Subir Foto Ahora
                </button>
              )}
            </div>
          ) : displayType === 'carousel' ? (
            /* CAROUSEL VIEW MODE */
            <div className="space-y-6">
              {/* Grand stage card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl border border-sage-150 overflow-hidden shadow-md">
                
                {/* 1. Large Slide Window (Col-span 8) */}
                <div className="lg:col-span-8 bg-stone-950 aspect-[4/3] lg:aspect-auto lg:h-[480px] relative flex items-center justify-center overflow-hidden">
                  
                  {/* Active Slide Image */}
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={filteredPhotos[carouselIndex].id}
                      src={filteredPhotos[carouselIndex].url}
                      alt={filteredPhotos[carouselIndex].caption || 'Boda de Valentina y Anderson'}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.35 }}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>

                  {/* Gentle shadow gradients for overlay UI */}
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                  {/* Left / Right floating chevrons */}
                  {filteredPhotos.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevSlide}
                        className="absolute left-4 p-2.5 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-md border border-white/15 shadow-lg transition-all cursor-pointer z-10 hover:scale-105"
                        title="Anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNextSlide}
                        className="absolute right-4 p-2.5 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-md border border-white/15 shadow-lg transition-all cursor-pointer z-10 hover:scale-105"
                        title="Siguiente"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Counter Badge */}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-lg border border-white/10">
                    Imagen {carouselIndex + 1} de {filteredPhotos.length}
                  </div>

                  {/* Play/Pause Autoslide button */}
                  {filteredPhotos.length > 1 && (
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`absolute top-4 right-4 p-2 rounded-lg backdrop-blur-md border border-white/10 text-white transition-all cursor-pointer ${
                        isPlaying ? 'bg-emerald-600 border-emerald-500' : 'bg-black/50 hover:bg-black/75'
                      }`}
                      title={isPlaying ? "Pausar presentación" : "Iniciar presentación automática"}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* 2. Interactive Details sidebar (Col-span 4) */}
                <div className="lg:col-span-4 p-6 md:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-sage-100 bg-white">
                  
                  <div className="space-y-6">
                    {/* Author Details Card */}
                    <div className="flex items-center justify-between border-b border-sage-100 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-sage-50 text-sage-600 font-semibold flex items-center justify-center border border-sage-150 shadow-inner">
                          <User className="w-4 h-4 text-sage-500" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wide text-sage-400 block leading-none">Compartido por</span>
                          <span className="text-sm font-bold text-sage-800">{filteredPhotos[carouselIndex].uploadedBy}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-medium text-sage-500">
                        <Calendar className="w-4 h-4 text-sage-400" />
                        <span>{formatDateFriendly(filteredPhotos[carouselIndex].uploadedAt)}</span>
                      </div>
                    </div>

                    {/* Quotation caption space */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-sage-400 block">Detalles & Recuerdos</span>
                      <div className="bg-sage-50/50 rounded-2xl p-4 border border-sage-100/60 relative">
                        <span className="font-serif text-3xl text-sage-300 absolute -top-1 -left-1 opacity-40">“</span>
                        <p className="text-xs md:text-sm text-sage-700 italic leading-relaxed pl-5 relative z-10">
                          {filteredPhotos[carouselIndex].caption || 'Sin descripción redactada.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Liking interaction row */}
                  <div className="mt-8 pt-6 border-t border-sage-100 flex items-center justify-between bg-sage-50/30 p-4 rounded-2xl border border-sage-100">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-sage-400 block tracking-wider leading-none">Votos familiares</span>
                      <span className="text-xs font-semibold text-sage-700">
                        A {filteredPhotos[carouselIndex].likes} {filteredPhotos[carouselIndex].likes === 1 ? 'persona le encanta' : 'personas les encanta'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleLikeCurrent(filteredPhotos[carouselIndex].id)}
                      className="flex items-center gap-1.5 group cursor-pointer"
                    >
                      <motion.div
                        animate={isLikingActive ? { scale: [1, 1.4, 0.9, 1.2, 1] } : {}}
                        transition={{ duration: 0.5 }}
                        className={`p-3 rounded-full border shadow-sm transition-all ${
                          filteredPhotos[carouselIndex].likes > 0
                            ? 'bg-rose-500 border-rose-650 text-white hover:bg-rose-600'
                            : 'bg-white border-sage-200 text-slate-400 hover:text-rose-500 hover:border-rose-300'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${filteredPhotos[carouselIndex].likes > 0 ? 'fill-white text-white' : ''}`} />
                      </motion.div>
                    </button>
                  </div>

                </div>
              </div>

              {/* 3. Horizontal timeline strip of thumbnails */}
              <div className="bg-white/50 backdrop-blur-sm border border-sage-150 p-4 rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-sage-400 block tracking-wider mb-2.5">
                  Saltar a otro momento ({filteredPhotos.length} fotos)
                </span>
                
                <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-sage-200">
                  {filteredPhotos.map((photo, tIdx) => {
                    const isActive = tIdx === carouselIndex;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => { setCarouselIndex(tIdx); setIsPlaying(false); }}
                        className={`relative rounded-xl overflow-hidden shrink-0 w-16 h-12 md:w-20 md:h-14 border-2 transition-all cursor-pointer ${
                          isActive 
                            ? 'border-sage-600 scale-102 ring-2 ring-sage-600/20' 
                            : 'border-sage-150 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={photo.url} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        {isActive && (
                          <div className="absolute inset-0 bg-sage-900/10 pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* CLASSIC GALLERY GRID VIEW MODE */
            <motion.div
              layout
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  currentUsername={username}
                  onLike={onLike}
                  onDelete={onDelete}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
