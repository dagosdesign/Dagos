import { motion } from 'motion/react';

interface CategoryTransitionProps {
  title: string;
}

export default function CategoryTransition({ title }: CategoryTransitionProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0b] flex flex-col items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center px-6 z-10"
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#e3b553]/70 mb-3">Hazırlanıyor</p>
        <h1 className="text-3xl sm:text-4xl font-serif italic text-white leading-tight whitespace-pre-line">
          {title}
        </h1>
      </motion.div>

      <div className="absolute bottom-[18%] flex items-center justify-center">
        <span className="ping-ring" style={{ animationDelay: '0s' }} />
        <span className="ping-ring" style={{ animationDelay: '0.5s' }} />
        <span className="ping-ring" style={{ animationDelay: '1s' }} />
        <span className="ping-ring" style={{ animationDelay: '1.5s' }} />
        <span className="absolute w-3 h-3 rounded-full bg-[#e3b553]" style={{ boxShadow: '0 0 20px 6px rgba(227,181,83,0.7)' }} />
      </div>
    </div>
  );
}
