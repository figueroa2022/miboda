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

        {/* Engagement, civil, ceremony banner placeholder if no-caption */}
        {photo.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/85 via-black/50 to-transparent text-white">
            <p className="text-xs line-clamp-2 leading-relaxed text-slate-150">
              {photo.caption}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-sage-100/50 bg-white">
        <div className="flex items-center gap-4">
          {/* Heart Like Button */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 group cursor-pointer"
          >
            <motion.div
              animate={isLiking ? { scale: [1, 1.4, 0.9, 1.2, 1] } : {}}
              transition={{ duration: 0.5 }}
              className={`p-1.5 rounded-full transition-colors ${
                photo.likes > 0
                  ? 'bg-rose-50 text-rose-500'
                  : 'bg-stone-50 text-stone-400 group-hover:text-rose-400 group-hover:bg-rose-50/40'
              }`}
            >
              <Heart className={`w-4 h-4 ${photo.likes > 0 ? 'fill-rose-500' : ''}`} />
            </motion.div>
            <span className={`text-xs font-semibold ${photo.likes > 0 ? 'text-rose-500' : 'text-stone-500'}`}>
              {photo.likes}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
