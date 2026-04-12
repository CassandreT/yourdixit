import { motion } from 'framer-motion';

const FOREST_ANIMALS = ['🦋','🦊','🦉','🐺','🐸','🦌','🐇','🦝','🐿️','🦔'];

export default function PlayerList({ players = {}, storytellerUid, currentUid, showScores = false }) {
  const list = Object.entries(players).sort((a, b) => (b[1].score || 0) - (a[1].score || 0));

  return (
    <div className="flex flex-col gap-2">
      {list.map(([uid, player], i) => (
        <motion.div
          key={uid}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all
            ${uid === currentUid ? 'bg-accent/10 border border-accent/30' : 'bg-white/5 border border-white/5'}
            ${uid === storytellerUid ? 'ring-1 ring-violet' : ''}
          `}
        >
          <span className="text-xl">{FOREST_ANIMALS[i % FOREST_ANIMALS.length]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#fef0c8] truncate font-display">
              {player.name}
              {uid === currentUid && <span className="text-accent text-xs ml-1">(you)</span>}
              {uid === storytellerUid && <span className="text-violet text-xs ml-1"> ✦ storyteller</span>}
              {player.isHost && <span className="text-dim text-xs ml-1"> host</span>}
            </p>
          </div>
          {showScores && (
            <span className="text-accent font-bold text-sm font-display">{player.score || 0}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
