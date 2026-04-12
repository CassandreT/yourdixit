import { useState } from 'react';
import { motion } from 'framer-motion';
import PhotoCard from '../components/PhotoCard.jsx';
import MagicButton from '../components/MagicButton.jsx';

export default function ClueScreen({ room, code, currentUid, photos, game }) {
  const isStoryteller = room.storyteller === currentUid;
  const myHand        = room.hands?.[currentUid] || [];
  const [selected, setSelected]   = useState(null);
  const [clueText, setClueText]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const storytellerName = room.players?.[room.storyteller]?.name || 'Someone';

  async function handleSubmit() {
    if (!selected || !clueText.trim()) return;
    setSubmitting(true);
    try {
      await game.submitClue(code, clueText.trim(), selected);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col px-4 py-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <p className="text-dim/60 text-xs font-display tracking-widest mb-1">ROUND {room.round}</p>
        {isStoryteller ? (
          <>
            <h2 className="font-display text-2xl text-accent">Choose your card</h2>
            <p className="text-[#fef0c8]/70 font-body italic mt-1">
              Pick a photo, then give a clue others might — but might not — guess
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl text-violet">
              {storytellerName} is choosing…
            </h2>
            <p className="text-[#fef0c8]/70 font-body italic mt-1">
              The storyteller is picking a card and crafting their clue
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {[0,1,2].map(i => (
                <motion.div key={i}
                  className="w-2 h-2 bg-violet/60 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.4 }}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Storyteller UI */}
      {isStoryteller && (
        <div className="flex-1 flex flex-col gap-6 max-w-2xl mx-auto w-full">
          {/* Hand */}
          <div>
            <p className="font-display text-xs text-dim tracking-widest mb-3">YOUR HAND</p>
            <div className="flex gap-3 overflow-x-auto pb-3 snap-x">
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
          </div>

          {/* Clue input */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="font-display text-xs text-accent tracking-widest">YOUR CLUE</p>
            <textarea
              value={clueText}
              onChange={e => setClueText(e.target.value)}
              maxLength={120}
              rows={2}
              placeholder="A word, a phrase, a feeling… make it mysterious"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3
                text-[#fef0c8] placeholder-dim/40 font-body text-base outline-none
                focus:border-accent/60 resize-none transition-all"
            />
            <div className="flex items-center justify-between">
              <p className="text-dim/40 text-xs font-body italic">
                {selected ? '✓ Card selected' : 'Select a card above first'}
              </p>
              <MagicButton
                variant="gold"
                onClick={handleSubmit}
                disabled={!selected || !clueText.trim() || submitting}
              >
                {submitting ? '✦ Sending…' : '✦ Give Clue'}
              </MagicButton>
            </div>
          </div>
        </div>
      )}

      {/* Non-storyteller: show your hand (read only for now) */}
      {!isStoryteller && myHand.length > 0 && (
        <div className="max-w-2xl mx-auto w-full">
          <p className="font-display text-xs text-dim tracking-widest mb-3 text-center">
            YOUR HAND — GET READY
          </p>
          <div className="flex gap-3 overflow-x-auto pb-3 justify-center">
            {myHand.map(photoId => (
              <PhotoCard
                key={photoId}
                photoUrl={photos[photoId]?.url}
                size="md"
                showGlow={false}
                disabled
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
