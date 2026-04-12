import { motion } from 'framer-motion';

// LIVING BORDERS — rotates conic-gradient border via @property --angle
// Used for cards in hand, played cards, and voting cards
export default function PhotoCard({
  photoUrl,
  selected = false,
  onClick,
  size = 'md',
  showGlow = true,
  label = null,
  voteCount = 0,
  disabled = false,
  isStoryteller = false,
  revealed = false,
}) {
  const sizes = {
    sm:  'w-24 h-32',
    md:  'w-36 h-48',
    lg:  'w-44 h-60',
    xl:  'w-52 h-72',
  };

  return (
    <motion.div
      className={`relative flex-shrink-0 cursor-pointer rounded-2xl overflow-visible
        ${showGlow ? 'card-glow' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${sizes[size]}
      `}
      style={selected ? { '--angle': '0deg' } : {}}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.06, y: -6 }}
      whileTap={disabled ? {}  : { scale: 0.97 }}
      animate={selected ? { y: -12 } : { y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Card face */}
      <div
        className={`w-full h-full rounded-2xl overflow-hidden bg-surface border-2 transition-all duration-300
          ${selected ? 'border-accent shadow-[0_0_24px_rgba(245,200,66,0.6)]' : 'border-[#f5c84222]'}
        `}
        style={{ position: 'relative', zIndex: 2 }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface2">
            <span className="text-4xl opacity-30">🌿</span>
          </div>
        )}

        {/* Storyteller indicator */}
        {isStoryteller && (
          <div className="absolute top-2 left-2 bg-accent text-base text-xs font-bold px-2 py-0.5 rounded-full font-display">
            ✦
          </div>
        )}

        {/* Vote count badge */}
        {voteCount > 0 && (
          <div className="absolute top-2 right-2 bg-violet text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {voteCount} ✦
          </div>
        )}

        {/* Label overlay */}
        {label && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="text-xs text-[#fef0c8] text-center truncate font-body">{label}</p>
          </div>
        )}

        {/* Selected shimmer overlay */}
        {selected && (
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(245,200,66,0.15) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
