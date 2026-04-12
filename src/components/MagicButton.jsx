import { motion } from 'framer-motion';

export default function MagicButton({ children, onClick, disabled, variant = 'gold', className = '', type = 'button' }) {
  const variants = {
    gold:   'bg-accent text-base hover:bg-amber-300 shadow-[0_0_20px_rgba(245,200,66,0.3)] hover:shadow-[0_0_32px_rgba(245,200,66,0.5)]',
    violet: 'bg-violet text-white hover:bg-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.3)]',
    ghost:  'bg-white/10 text-[#fef0c8] hover:bg-white/15 border border-white/20',
    danger: 'bg-red-700/70 text-white hover:bg-red-600/80',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className={`px-6 py-3 rounded-2xl font-display font-bold text-sm transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
