import { motion } from 'framer-motion';

const FOREST_ANIMALS = ['🦋','🦊','🦉','🐺','🐸','🦌','🐇','🦝','🐿️','🦔'];

export default function GameOverScreen({ room, currentUid }) {
  const players = room.players || {};
  const sorted  = Object.entries(players).sort((a, b) => (b[1].score || 0) - (a[1].score || 0));
  const winnerUid   = sorted[0]?.[0];
  const winnerName  = sorted[0]?.[1]?.name || 'Unknown';
  const isWinner    = winnerUid === currentUid;

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 18 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        {/* Crown */}
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="text-7xl"
        >
          {isWinner ? '👑' : '🌿'}
        </motion.div>

        <div>
          <p className="text-dim/60 text-xs font-display tracking-widest mb-2">THE FOREST CHOOSES</p>
          <h1 className="font-display text-4xl text-accent mb-2"
              style={{ textShadow: '0 0 40px rgba(245,200,66,0.5)' }}>
            {winnerName}
          </h1>
          <p className="text-[#fef0c8]/60 font-body italic">
            {isWinner ? 'You weave the most enchanting tales' : 'wins with the most enchanting tales'}
          </p>
        </div>

        {/* Final scoreboard */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 text-left">
          <p className="font-display text-xs text-accent tracking-widest">FINAL STANDINGS</p>
          {sorted.map(([uid, player], i) => (
            <motion.div
              key={uid}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3
                ${i === 0 ? 'bg-accent/15 border border-accent/30' : 'bg-white/5'}
              `}
            >
              <span className="text-xl">{FOREST_ANIMALS[i % FOREST_ANIMALS.length]}</span>
              <div className="flex-1">
                <p className="font-body text-[#fef0c8] text-sm">
                  {player.name}
                  {uid === currentUid && <span className="text-dim text-xs ml-1">(you)</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {i === 0 && <span className="text-xs text-accent">👑</span>}
                <span className="font-display font-bold text-accent text-lg">{player.score}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-dim/40 font-body italic text-sm">
          The forest remembers every story told within it…
        </p>
      </motion.div>
    </div>
  );
}
