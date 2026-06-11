import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, User, Users } from 'lucide-react';

interface WelcomeScreenProps {
  onEnter: (username: string, relation: string) => void;
}

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Invitado general');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, dinos tu nombre para darte la bienvenida.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Por favor, ingresa un nombre válido.');
      return;
    }
    setError('');
    onEnter(name.trim(), relation);
  };

  const relationshipOptions = [
    { value: 'Familia de Valentina', label: 'Familia de Valentina' },
    { value: 'Familia de Anderson', label: 'Familia de Anderson' },
    { value: 'Amigo de Valentina', label: 'Amigo de Valentina' },
    { value: 'Amigo de Anderson', label: 'Amigo de Anderson' },
    { value: 'Invitado de Ambos', label: 'Invitado de Ambos' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-sage-50 via-emerald-50 to-sage-100 p-4 relative overflow-hidden">
      {/* Decorative floral blurs */}
      <div className="absolute -top-30 -left-30 w-72 h-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="absolute -bottom-30 -right-30 w-80 h-80 rounded-full bg-sage-300/40 blur-3xl" />
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-sage-100/60 shadow-xl shadow-sage-900/5 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            className="inline-flex p-3 rounded-full bg-sage-100 text-sage-600 mb-4"
          >
            <Heart className="w-8 h-8 fill-sage-500/10 text-sage-500" />
          </motion.div>
          <p className="text-xs uppercase tracking-widest text-sage-500 font-semibold mb-2">Dots. Memories</p>
          <h1 className="font-serif text-3xl md:text-4xl text-sage-800 leading-tight">
            Valentina & Anderson
          </h1>
          <div className="h-[1px] w-24 bg-sage-200 mx-auto my-3" />
          <p className="text-xs font-serif italic text-sage-600">14 de Junio 2024</p>
          <p className="text-sm text-sage-600 mt-4 px-2">
            ¡Te damos la bienvenida a nuestro álbum de momentos compartidos! Por favor regístrate para subir fotos, dar me gusta y dejar comentarios en tiempo real.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-sage-700 uppercase block" htmlFor="guest-name">
              Tu Nombre Completo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sage-400">
                <User className="w-5 h-5" />
              </span>
              <input
                id="guest-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setError('');
                }}
                placeholder="Ej. Sofía Figueroa"
                className="w-full pl-10 pr-4 py-3 bg-white/90 border border-sage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent text-sage-800 transition-all text-sm placeholder-sage-400"
              />
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-500 mt-1"
              >
                {error}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-sage-700 uppercase block" htmlFor="guest-relation">
              ¿Cuál es tu relación con nosotros?
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sage-400">
                <Users className="w-5 h-5" />
              </span>
              <select
                id="guest-relation"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white/90 border border-sage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent text-sage-800 transition-all text-sm appearance-none cursor-pointer"
              >
                {relationshipOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sage-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-xl shadow-md shadow-sage-800/10 hover:shadow-lg hover:shadow-sage-800/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>Ingresar al Álbum</span>
            <Heart className="w-4 h-4 fill-white" />
          </motion.button>
        </form>

        <div className="text-center mt-8 text-[11px] text-sage-400">
          Unidos por el amor. Hecho para compartir memorias eternas.
        </div>
      </motion.div>
    </div>
  );
}
