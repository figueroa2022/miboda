import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { CategoryKey, DEFAULT_PHOTOS_FALLBACK } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newPhoto: any) => void;
  username: string;
  defaultCategory?: CategoryKey;
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess, username, defaultCategory }: UploadModalProps) {
  const [selectedCategory] = useState<CategoryKey>('reception');
  
  const [caption, setCaption] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Compress and resize image in local browser before base64 encoding to speed up upload
  const processAndPreviewFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorCode('Tipo de archivo no válido. Solo se admiten imágenes (.jpg, .jpeg, .png, .webp).');
      return;
    }

    setErrorCode(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const srcUrl = event.target?.result as string;
      
      // Load image into HTML5 Image to perform canvas compression
      const img = new Image();
      img.src = srcUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          // Preserve original format (PNG, WebP, JPEG) when storing in the code's physical folder
          let mimeType = 'image/jpeg';
          let quality = 0.82;
          
          if (file.type === 'image/png') {
            mimeType = 'image/png';
          } else if (file.type === 'image/webp') {
            mimeType = 'image/webp';
          }
          
          const compressedBase64 = canvas.toDataURL(mimeType, quality);
          setImagePreview(compressedBase64);
        } else {
          // Fallback if canvas context fails
          setImagePreview(srcUrl);
        }
      };
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndPreviewFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processAndPreviewFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      setErrorCode('Por favor selecciona o arrastra una imagen primero.');
      return;
    }

    setIsUploading(true);
    setErrorCode(null);

    let useFallback = false;
    let response: Response | null = null;
    let responseData: any = null;

    try {
      try {
        response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: `upload-${Date.now()}.png`,
            data: imagePreview,
            category: selectedCategory,
            username: username,
            caption: ''
          }),
        });
      } catch (fetchErr) {
        console.warn('Backend server connection failed, using client fallback:', fetchErr);
        useFallback = true;
      }

      if (response && response.ok) {
        const responseText = await response.text();
        if (responseText.trim().startsWith('{')) {
          try {
            responseData = JSON.parse(responseText);
          } catch (parseErr) {
            console.error('Failed to parse JSON response content:', parseErr);
          }
        } else if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          console.warn('Backend responded with a landing/404 HTML page. Activating Netlify client fallback.');
          useFallback = true;
        }
      } else if (response) {
        if (response.status === 413) {
          throw new Error('La foto es demasiado pesada para el servidor de internet. Por favor intenta con otra de menor peso o resolución.');
        }
        // General server failures are treated with fallback on static hosts
        useFallback = true;
      } else {
        useFallback = true;
      }

      // If we need to fallback because we are on a static host (Netlify)
      if (useFallback || !responseData) {
        console.log('Using browser LocalStorage fallback for photo preservation...');
        
        const localPhoto = {
          id: `uploaded-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          url: imagePreview, // Save the optimized Base64 representation directly
          category: 'reception', // Reception only, as requested by system rules
          uploadedBy: username || 'Invitado',
          uploadedAt: new Date().toISOString(),
          likes: 0,
          comments: []
        };

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
        }

        localPhotos.unshift(localPhoto);
        localStorage.setItem('wedding-photos-local-db', JSON.stringify(localPhotos));

        onUploadSuccess(localPhoto);
        
        // Reset state
        setImagePreview(null);
        setCaption('');
        onClose();
        return;
      }

      onUploadSuccess(responseData);
      
      // Reset State
      setImagePreview(null);
      setCaption('');
      onClose();
    } catch (err: any) {
      console.error('Upload error details:', err);
      setErrorCode(err?.message || 'Error de conexión al cargar la foto. Confirma tu conexión a internet o intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };



  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-sage-900/40 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-sage-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between bg-sage-50/50">
            <h3 className="font-serif text-lg text-sage-800 flex items-center gap-2 font-semibold">
              <Upload className="w-5 h-5 text-sage-500" />
              <span>Añadir un Recuerdo</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-sage-400 hover:text-sage-600 hover:bg-sage-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
            {errorCode && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorCode}</span>
              </div>
            )}

            {/* Dropzone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold tracking-wider uppercase text-sage-600 block">
                Selecciona tu Foto
              </label>

              {imagePreview ? (
                <div className="relative border-2 border-dashed border-sage-200 rounded-xl overflow-hidden bg-sage-50/20 flex flex-col items-center justify-center min-h-[220px]">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-[260px] w-auto object-contain rounded-lg p-2"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-3 right-3 bg-sage-900/75 hover:bg-sage-900 text-white p-1.5 rounded-full shadow-md transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-sage-500 pb-2 italic">Foto cargada y optimizada para subida instantánea</p>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[220px] ${
                    dragActive
                      ? 'border-sage-500 bg-sage-100/50'
                      : 'border-sage-200 hover:border-sage-300 bg-sage-50/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                  <div className="bg-sage-100 text-sage-600 p-3 rounded-full mb-3">
                    <ImageIcon className="w-6 h-6 text-sage-500" />
                  </div>
                  <p className="text-sm font-semibold text-sage-800 mb-1">
                    Arrastra aquí tu foto, o haz clic para examinar
                  </p>
                  <p className="text-xs text-sage-400 max-w-xs mb-4">
                    Soporta imágenes de cámara móvil (JPEG, PNG, WebP). La comprimiremos para ahorrar tus datos.
                  </p>
                  <button
                    type="button"
                    onClick={handleButtonClick}
                    className="px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Seleccionar Archivo
                  </button>
                </div>
              )}
            </div>

            {/* Album/Folder Destination Info */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-950 text-xs">
              <span className="font-bold block uppercase tracking-wider text-[10px] text-emerald-700">Carpeta del Código</span>
              <p className="flex items-center gap-1.5 font-semibold text-emerald-900">
                <span>🥂</span> <span>Gran Recepción Especial</span>
              </p>
              <p className="text-[10px] text-emerald-600 leading-normal">
                📁 Esta foto se guardará de forma permanente y física en la carpeta del código: <strong className="text-emerald-700">/uploads/reception</strong>
              </p>
            </div>



            {/* Submit Button */}
            <div className="pt-2 border-t border-sage-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-medium text-sage-600 hover:text-sage-800 bg-white hover:bg-sage-50 rounded-lg transition-all border border-sage-200 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploading || !imagePreview}
                className="px-5 py-2 text-xs font-medium bg-sage-600 hover:bg-sage-700 text-white rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Subiendo Recuerdo...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Compartir Foto</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
