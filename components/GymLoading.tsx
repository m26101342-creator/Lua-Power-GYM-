import React from 'react';
import { Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';

export const GymLoading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        animate={{
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        className="mb-4"
      >
        <Dumbbell className="w-16 h-16 text-emerald-500" />
      </motion.div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-slate-600 font-bold uppercase tracking-widest text-sm"
      >
        Organizando os pesos...
      </motion.p>
    </div>
  );
};
