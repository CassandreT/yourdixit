import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoCard from '../components/PhotoCard.jsx';
import MagicButton from '../components/MagicButton.jsx';
import { shuffle } from '../utils/gameLogic.js';

export default function RevealScreen({ room, code, currentUid, photos, game }) {
  const isStoryteller  = room.storyteller === currentUid;
  const played         = room.played || {};
  const votes          = room.votes  || {};
  const players        = room.players || {};
  const clue           = room.clue || '';
  const hasVoted       = !!votes[currentUid];

  const [myVote, setMyVote]       = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Shuffle cards once for random display order (stable per render via memo alternative)
  const [shuffledCards] = useState(() =>
    shuffle(Object.entries(played).map(([uid, photoId]) => ({ uid, photoId })))
  );

  const nonStorytellers = Object.keys(players).filter(u => u !== room.storyteller);
  const allVoted = nonStorytellers.every(u => votes[u]);

  // Vote count per photo
  const voteCounts = {};
  Object.values(votes).forEach(photoId => {
    voteCounts[photoId] = (voteCounts[photoId] || 0) + 1;
  });

  async function handleVote() {
    if (!myVote || isStoryteller || hasVoted) return;
    setSubmitting(true);
    try { await game.submitVote(code, myVote); }
    finally { setSubmitting(false); }
  }

  const storytellerCard = played[room.storyteller];

  return (
    <div className="relative z-10 min-h-screen flex flex-col px-4 py-8">

      {/* Clue banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <p className="text-dim/60 text-xs font-display tracking-widest mb-2">
          THE CLUE
        </p>
        <div className="inline-block bg-accent/10 border border-accent/30 rounded-2xl px-8 py-4">
          <p className="font-display text-2xl text-accent">"{clue}"</p>
        </div>
        {!allVoted && !isStoryteller && !hasVoted && (
          <p className="text-[#fef0c8]/70 font-body italic mt-3 text-sm">
            Which card do you think belongs to the storyteller?
          </p>
        )}
        {isStoryteller && (
          <p className="text-violet/80 font-body italic mt-3 text-sm">
            Watch the votes come in — you can't vote on your own clue
          </p>
        )}
      </motion.div>

      {/* Cards grid */}
      <div className="flex-1 max-w-3xl mx-auto w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center mb-8">
          {shuffledCards.map(({ uid, photoId }, i) => {
            const isOwner       = uid === currentUid;
            const isStoryCard   = uid === room.storyteller;
            const canVoteThis   = !isStoryteller && !hasVoted && !isOwner;
            const selected      = myVote === photoId;
            const voteCount     = allVoted ? (voteCounts[photoId] || 0) : 0;
            const revealOwner   = allVoted;

            return (
              <motion.div
                key={photoId}
                initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 200, damping: 18 }}
                className="flex flex-col items-center gap-2"
              >
                <PhotoCard
                  photoUrl={photos[photoId]?.url}
                  selected={selected}
                  onClick={canVoteThis ? () => setMyVote(selected ? null : photoId) : undefined}
                  size="xl"
                  showGlow={canVoteThis || allVoted}
                  voteCount={voteCount}
                  isStoryteller={allVoted && isStoryCard}
                  disabled={!canVoteThis && !allVoted && !isOwner}
                />
                {/* Owner reveal after all votes */}
                {revealOwner && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs font-display px-2 py-0.5 rounded-full
                      ${isStoryCard ? 'bg-accent/20 text-accent' : 'bg-white/10 text-dim'}`}
                  >
                    {isStoryCard ? '✦ ' : ''}{players[uid]?.name}
                  </motion.p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Vote submit */}
        {!isStoryteller && !hasVoted && (
          <div className="flex justify-center">
            <MagicButton
              variant="gold"
              onClick={handleVote}
              disabled={!myVote || submitting}
              className="px-10"
            >
              {submitting ? '✦ Voting…' : '✦ Cast Vote'}
            </MagicButton>
          </div>
        )}

        {/* Waiting for votes */}
        {(isStoryteller || hasVoted) && !allVoted && (
          <div className="text-center space-y-3">
            <p className="text-[#fef0c8]/60 font-body italic text-sm">
              Waiting for all votes…
            </p>
            <div className="flex justify-center gap-2">
              {nonStorytellers.map((uid, i) => (
                <motion.div
                  key={uid}
                  animate={{ opacity: votes[uid] ? 1 : [0.3, 1, 0.3] }}
                  transition={votes[uid] ? {} : { repeat: Infinity, duration: 1.2, delay: i * 0.3 }}
                  className={`w-2.5 h-2.5 rounded-full ${votes[uid] ? 'bg-accent' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
