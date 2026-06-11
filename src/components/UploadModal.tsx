import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { CategoryKey } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newPhoto: any) => void;
  username: string;
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess, username }: UploadModalProps) {
  const selectedCategory: CategoryKey = 'reception';
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
          // Export as compressed JPEG (0.82 quality)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
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

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: 'shared-photo.jpg',
          data: imagePreview,
          category: selectedCategory,
          username: username,
          caption: caption.trim()
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Fallo al subir la foto.');
      }

      const newPhoto = await response.json();
      onUploadSuccess(newPhoto);
      
      // Reset State
      setImagePreview(null);
      setCaption('');
      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorCode(err?.message || 'Error de conexión al cargar la foto. Inténtalo de nuevo.');
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

            {/* Folder / Moment Locked to Reception */}
            <div className="space-y-1.5 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs">
              <span className="font-semibold block uppercase tracking-wider text-[10px] text-emerald-700">Destino de la foto</span>
              <p className="flex items-center gap-1.5 font-medium">
                <span>🥂</span> <span>Gran Recepción Especial</span>
                <span className="text-[10px] text-emerald-600 font-normal">(Subidas habilitadas solo para la fiesta)</span>
              </p>
            </div>

            {/* Caption */}
            <div className="space-y-1">
              <label className="text-xs font-semibold tracking-wider uppercase text-sage-600 block" htmlFor="photo-cap">
                Dedicatoria o Descripción (Opcional)
              </label>
              <textarea
                id="photo-cap"
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Ej. ¡Qué bonita pareja! Amamos bailar con ustedes..."
                className="w-full border border-sage-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 placeholder-sage-400 text-sage-800 resize-none"
              />
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
