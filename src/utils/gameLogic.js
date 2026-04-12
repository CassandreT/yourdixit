// ── Game constants ──────────────────────────────────────────────
export const HAND_SIZE = 6;

// How many photos to recommend uploading based on player count
export function recommendedPhotoCount(playerCount) {
  // Each player needs 6 cards, plus ~20 extras for rotation buffer
  const min = playerCount * HAND_SIZE + 20;
  return Math.min(Math.ceil(min / 10) * 10, 100);
}

// ── Shuffle (Fisher-Yates) ───────────────────────────────────────
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Deal initial hands ───────────────────────────────────────────
// Returns { playerHands: { uid: [photoId, ...] }, deck: [remaining] }
export function dealHands(photoIds, playerUids) {
  const deck = shuffle(photoIds);
  const playerHands = {};
  playerUids.forEach(uid => {
    playerHands[uid] = deck.splice(0, HAND_SIZE);
  });
  return { playerHands, deck };
}

// ── Replenish a player's hand after they play a card ─────────────
// Returns { newHand, newDeck }
export function replenishHand(hand, deck) {
  if (deck.length === 0) return { newHand: hand, newDeck: deck };
  const newDeck = [...deck];
  const drawn   = newDeck.splice(0, 1);
  return { newHand: [...hand, ...drawn], newDeck };
}

// ── Generate a short room code ───────────────────────────────────
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Calculate scores after a voting round ───────────────────────
// storytellerUid: who gave the clue
// playedCards:    { uid: photoId }
// votes:          { voterUid: photoId }  (voters = non-storytellers)
// Returns { scores: { uid: pointsEarned } }
export function calculateScores(storytellerUid, playedCards, votes) {
  const scores = {};
  const playerUids = Object.keys(playedCards);

  // Map photoId → owner
  const photoOwner = {};
  Object.entries(playedCards).forEach(([uid, photoId]) => {
    photoOwner[photoId] = uid;
    scores[uid] = 0;
  });

  const storytellerCard = playedCards[storytellerUid];
  const voterUids = Object.keys(votes).filter(u => u !== storytellerUid);

  // Count how many guessed the storyteller's card
  const correctVoters = voterUids.filter(u => votes[u] === storytellerCard);
  const allCorrect = correctVoters.length === voterUids.length;
  const noneCorrect = correctVoters.length === 0;

  if (allCorrect || noneCorrect) {
    // Storyteller scores 0; everyone else +2
    playerUids.forEach(uid => {
      if (uid !== storytellerUid) scores[uid] += 2;
    });
  } else {
    // Storyteller +3; correct voters +3
    scores[storytellerUid] += 3;
    correctVoters.forEach(uid => { scores[uid] += 3; });
  }

  // Each non-storyteller card gets +1 per vote it received (decoy bonus)
  voterUids.forEach(voterUid => {
    const votedCard = votes[voterUid];
    const owner = photoOwner[votedCard];
    if (owner && owner !== storytellerUid) {
      scores[owner] = (scores[owner] || 0) + 1;
    }
  });

  return scores;
}

// ── GAME PHASES ──────────────────────────────────────────────────
export const PHASE = {
  LOBBY:      'lobby',       // Waiting for players
  UPLOAD:     'upload',      // Host uploading photos
  DEALING:    'dealing',     // Cards being dealt
  CLUE:       'clue',        // Storyteller writing clue + picking card
  SUBMIT:     'submit',      // Other players submitting their card
  REVEAL:     'reveal',      // All cards shown, voting open
  RESULTS:    'results',     // Round results shown
  GAMEOVER:   'gameover',    // Final scores
};

export const WIN_SCORE = 30;
