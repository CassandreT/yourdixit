import { useState } from 'react';
import { motion } from 'framer-motion';
import PhotoCard from '../components/PhotoCard.jsx';
import MagicButton from '../components/MagicButton.jsx';

export default function SubmitScreen({ room, code, currentUid, photos, game }) {
  const isStoryteller = room.storyteller === currentUid;
  const myHand        = room.hands?.[currentUid] || [];
  const clue          = room.clue || '';
  const played        = room.played || {};
  const hasPlayed     = !!played[currentUid];
  const [selected, setSelected]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const players       = room.players || {};
  const nonStorytellers = Object.keys(players).filter(u => u !== room.storyteller);
  const waitingOn     = nonStorytellers.filter(u => !played[u]);
  const storytellerName = players[room.storyteller]?.name || 'The storyteller';

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await game.submitCard(code, selected);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col px-4 py-8">

      {/* Clue banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8"
      >
        <p className="text-dim/60 text-xs font-display tracking-widest mb-2">
          ROUND {room.round} — {storytellerName}'s CLUE
        </p>
        <div className="inline-block bg-accent/10 border border-accent/30 rounded-2xl px-8 py-5 max-w-sm">
          <p className="font-display text-2xl md:text-3xl text-accent leading-tight"
             style={{ textShadow: '0 0 20px rgba(245,200,66,0.3)' }}>
            "{clue}"
          </p>
        </div>
      </motion.div>

      {/* Storyteller waiting view */}
      {isStoryteller && (
        <div className="flex-1 flex flex-col items-center gap-4 max-w-lg mx-auto w-full">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full text-center">
            <p className="text-[#fef0c8]/70 font-body italic mb-4">
              Waiting for others to choose their matching card…
            </p>
            <div className="space-y-2">
              {nonStorytellers.map(uid => (
                <div key={uid} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
                  <span className="text-sm font-body text-[#fef0c8]">{players[uid]?.name}</span>
                  <span className={`text-xs font-display ${played[uid] ? 'text-green-400' : 'text-dim/50'}`}>
                    {played[uid] ? '✓ submitted' : '…choosing'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Non-storyteller: pick a card */}
      {!isStoryteller && !hasPlayed && (
        <div className="flex-1 flex flex-col gap-6 max-w-2xl mx-auto w-full">
          <p className="text-[#fef0c8]/70 font-body italic text-center text-sm">
            Pick the card from your hand that best matches the clue
          </p>

          <div className="flex gap-3 overflow-x-auto pb-3 snap-x justify-start md:justify-center">
            {myHand.map(photoId => (
              <div key={photoId} className="snap-center flex-shrink-0">
                <PhotoCard
                  photoUrl={photos[photoId]?.url}
                  selected={selected === photoId}
                  onClick={() => setSelected(selected === photoId ? null : photoId)}
                  size="lg"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <MagicButton
              variant="gold"
              onClick={handleSubmit}
              disabled={!selected || submitting}
              className="px-10"
            >
              {submitting ? '✦ Submitting…' : '✦ Submit Card'}
            </MagicButton>
          </div>
        </div>
      )}

      {/* Already submitted — waiting */}
      {!isStoryteller && hasPlayed && (
        <div className="flex-1 flex flex-col items-center gap-6 max-w-lg mx-auto w-full">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-5xl"
          >✦</motion.div>
          <p className="text-[#fef0c8]/70 font-body italic text-center">
            Card submitted! Waiting for others…
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full space-y-2">
            {nonStorytellers.map(uid => (
              <div key={uid} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
                <span className="text-sm font-body text-[#fef0c8]">
                  {players[uid]?.name}{uid === currentUid ? ' (you)' : ''}
                </span>
                <span className={`text-xs font-display ${played[uid] ? 'text-green-400' : 'text-dim/50'}`}>
                  {played[uid] ? '✓ submitted' : '…choosing'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
