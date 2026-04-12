import { motion } from 'framer-motion';
import MagicButton from '../components/MagicButton.jsx';
import PhotoCard from '../components/PhotoCard.jsx';

export default function ResultsScreen({ room, code, currentUid, photos, isHost, game }) {
  const players     = room.players || {};
  const roundScores = room.roundScores || {};
  const played      = room.played || {};
  const votes       = room.votes  || {};
  const storyteller = room.storyteller;
  const clue        = room.clue || '';

  // Sort players by total score
  const sorted = Object.entries(players).sort((a, b) => (b[1].score || 0) - (a[1].score || 0));

  // Storyteller's card
  const storytellerCard = played[storyteller];
  // How many guessed correctly
  const correctGuessers = Object.entries(votes)
    .filter(([uid, photoId]) => uid !== storyteller && photoId === storytellerCard)
    .map(([uid]) => uid);

  const allWrong    = correctGuessers.length === 0;
  const allCorrect  = correctGuessers.length === Object.keys(votes).filter(u => u !== storyteller).length;
  const storytellerScored = !allWrong && !allCorrect;

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6"
      >
        {/* Round header */}
        <div className="text-center">
          <p className="text-dim/60 text-xs font-display tracking-widest mb-1">
            ROUND {(room.round || 1) - 1} RESULTS
          </p>
          <h2 className="font-display text-3xl text-accent">"{clue}"</h2>
          <p className="text-dim/60 font-body italic text-sm mt-1">
            — {players[storyteller]?.name}'s clue
          </p>
        </div>

        {/* Outcome summary */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl p-5 text-center border ${
            allCorrect || allWrong
              ? 'bg-violet/10 border-violet/30'
              : 'bg-accent/10 border-accent/30'
          }`}
        >
          {allCorrect && (
            <>
              <p className="text-2xl mb-1">🌙</p>
              <p className="font-display text-violet text-lg">Too obvious!</p>
              <p className="text-[#fef0c8]/70 text-sm font-body mt-1">
                Everyone guessed correctly — storyteller scores 0, all others +2
              </p>
            </>
          )}
          {allWrong && (
            <>
              <p className="text-2xl mb-1">🌑</p>
              <p className="font-display text-violet text-lg">Too mysterious!</p>
              <p className="text-[#fef0c8]/70 text-sm font-body mt-1">
                Nobody found it — storyteller scores 0, all others +2
              </p>
            </>
          )}
          {storytellerScored && (
            <>
              <p className="text-2xl mb-1">✦</p>
              <p className="font-display text-accent text-lg">Just right!</p>
              <p className="text-[#fef0c8]/70 text-sm font-body mt-1">
                {correctGuessers.length} player{correctGuessers.length !== 1 ? 's' : ''} found the card — storyteller +3
              </p>
            </>
          )}
        </motion.div>

        {/* Storyteller's card reveal */}
        {storytellerCard && (
          <div className="flex flex-col items-center gap-2">
            <p className="font-display text-xs text-dim tracking-widest">STORYTELLER'S CARD</p>
            <PhotoCard
              photoUrl={photos[storytellerCard]?.url}
              size="xl"
              isStoryteller
              showGlow
            />
          </div>
        )}

        {/* Round score deltas */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
          <p className="font-display text-xs text-accent tracking-widest mb-3">SCORES THIS ROUND</p>
          {sorted.map(([uid, player]) => {
            const delta = roundScores[uid] || 0;
            return (
              <motion.div
                key={uid}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2"
              >
                <div>
                  <span className="text-sm font-body text-[#fef0c8]">{player.name}</span>
                  {uid === storyteller && <span className="text-violet text-xs ml-2">storyteller</span>}
                  {uid === currentUid && <span className="text-dim text-xs ml-1">(you)</span>}
                </div>
                <div className="flex items-center gap-3">
                  {delta > 0 && (
                    <span className="text-green-400 text-sm font-bold">+{delta}</span>
                  )}
                  <span className="text-accent font-display font-bold">{player.score}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Next round */}
        {isHost && (
          <MagicButton
            variant="gold"
            className="w-full py-4 text-base"
            onClick={() => game.nextRound(code)}
          >
            ✦ Next Round
          </MagicButton>
        )}
        {!isHost && (
          <p className="text-dim/50 text-xs font-body italic text-center">
            Waiting for host to start the next round…
          </p>
        )}
      </motion.div>
    </div>
  );
}
