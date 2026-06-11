import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, User, Trash2, Calendar } from 'lucide-react';
import { Photo } from '../types';

interface PhotoCardProps {
  key?: string;
  photo: Photo;
  currentUsername: string;
  onLike: (photoId: string) => void;
  onDelete: (photoId: string) => void;
}

export default function PhotoCard({ photo, currentUsername, onLike, onDelete }: PhotoCardProps) {
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = () => {
    setIsLiking(true);
    onLike(photo.id);
    setTimeout(() => setIsLiking(false), 600);
  };

  // Human friendly time formatting
  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      // Let's make it friendly
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Hace un instante';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} hr`;

      return date.toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  const isAuthor = photo.uploadedBy === currentUsername || photo.uploadedBy === 'Inspiración';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl overflow-hidden border border-sage-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
    >
      {/* Card Header */}
      <div className="p-4 flex items-center justify-between bg-sage-50/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center text-sage-600 border border-sage-200">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-sage-800">{photo.uploadedBy}</h4>
            <div className="flex items-center gap-1 text-[10px] text-sage-400">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(photo.uploadedAt)}</span>
            </div>
          </div>
        </div>

        {/* Delete option is removed as per user request */}
      </div>

      {/* Main Image Aspect Ratio Container */}
      <div className="relative group overflow-hidden bg-stone-100 flex items-center justify-center aspect-[4/3]">
        <img
          src={photo.url}
          alt={photo.caption || 'Foto del Recuerdo'}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          loading="lazy"
        />

      </div>
    </motion.div>
  );
}
