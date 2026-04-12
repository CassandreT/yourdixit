import { db, auth, signInAnon } from '../firebase.js';
import {
  ref, set, get, update, onValue, serverTimestamp, off,
} from 'firebase/database';

export { signInAnon };
import {
  dealHands, replenishHand, generateRoomCode, calculateScores, shuffle,
  PHASE, WIN_SCORE, HAND_SIZE,
} from './gameLogic.js';

// ── Create a new room ────────────────────────────────────────────
export async function createRoom(hostName) {
  const code = generateRoomCode();
  const uid  = auth.currentUser?.uid;
  await set(ref(db, `rooms/${code}`), {
    host:      uid,
    hostName,
    phase:     PHASE.LOBBY,
    players:   { [uid]: { name: hostName, score: 0, isHost: true } },
    photos:    {},
    deck:      [],
    hands:     {},
    round:     0,
    storyteller: null,
    clue:      null,
    played:    {},
    votes:     {},
    createdAt: serverTimestamp(),
  });
  return code;
}

// ── Join a room ──────────────────────────────────────────────────
export async function joinRoom(code, playerName) {
  const uid      = auth.currentUser?.uid;
  const roomSnap = await get(ref(db, `rooms/${code}`));
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = roomSnap.val();
  if (room.phase !== PHASE.LOBBY) throw new Error('Game already started');

  await update(ref(db, `rooms/${code}/players/${uid}`), {
    name: playerName, score: 0, isHost: false,
  });
  return room;
}

// ── Compress image to a small JPEG data URL ───────────────────────
function compressImage(file, maxSize = 400) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = url;
  });
}

// ── Upload photos — stored as compressed base64 in Realtime DB ────
export async function uploadPhotos(code, files, onProgress) {
  for (let i = 0; i < files.length; i++) {
    const id  = `p${Date.now()}_${i}`;
    const url = await compressImage(files[i]);
    await update(ref(db, `rooms/${code}/photos/${id}`), { url, id });
    onProgress && onProgress(Math.round(((i + 1) / files.length) * 100));
  }
}

// ── Start the game — deal cards ───────────────────────────────────
export async function startGame(code) {
  const snap    = await get(ref(db, `rooms/${code}`));
  const room    = snap.val();
  const photoIds = Object.keys(room.photos || {});
  const playerUids = Object.keys(room.players || {});

  const { playerHands, deck } = dealHands(photoIds, playerUids);

  // Choose first storyteller (host)
  const storyteller = room.host;

  await update(ref(db, `rooms/${code}`), {
    phase:       PHASE.CLUE,
    deck,
    hands:       playerHands,
    round:       1,
    storyteller,
    clue:        null,
    played:      {},
    votes:       {},
  });
}

// ── Storyteller submits clue + chosen card ────────────────────────
export async function submitClue(code, clue, photoId) {
  const uid = auth.currentUser?.uid;
  await update(ref(db, `rooms/${code}`), {
    clue,
    phase: PHASE.SUBMIT,
    [`played/${uid}`]: photoId,
  });
  // Remove card from storyteller's hand
  const handSnap = await get(ref(db, `rooms/${code}/hands/${uid}`));
  const hand = handSnap.val() || [];
  const newHand = hand.filter(id => id !== photoId);
  await set(ref(db, `rooms/${code}/hands/${uid}`), newHand);
}

// ── Player submits their matching card ───────────────────────────
export async function submitCard(code, photoId) {
  const uid = auth.currentUser?.uid;
  await update(ref(db, `rooms/${code}/played`), { [uid]: photoId });

  // Remove from hand
  const handSnap = await get(ref(db, `rooms/${code}/hands/${uid}`));
  const hand = handSnap.val() || [];
  const newHand = hand.filter(id => id !== photoId);
  await set(ref(db, `rooms/${code}/hands/${uid}`), newHand);

  // Check if all non-storyteller players have submitted
  const snap = await get(ref(db, `rooms/${code}`));
  const room = snap.val();
  const playerUids = Object.keys(room.players || {});
  const played     = room.played || {};

  const allSubmitted = playerUids.every(u => played[u]);
  if (allSubmitted) {
    await update(ref(db, `rooms/${code}`), { phase: PHASE.REVEAL });
  }
}

// ── Player votes for a card ───────────────────────────────────────
export async function submitVote(code, photoId) {
  const uid = auth.currentUser?.uid;
  await update(ref(db, `rooms/${code}/votes`), { [uid]: photoId });

  // Check if all non-storytellers have voted
  const snap = await get(ref(db, `rooms/${code}`));
  const room = snap.val();
  const playerUids = Object.keys(room.players || {}).filter(u => u !== room.storyteller);
  const votes      = { ...(room.votes || {}), [uid]: photoId };

  const allVoted = playerUids.every(u => votes[u]);
  if (allVoted) {
    await resolveRound(code, room, votes);
  }
}

// ── Resolve round, update scores, advance ─────────────────────────
async function resolveRound(code, room, votes) {
  const roundScores = calculateScores(room.storyteller, room.played || {}, votes);
  const players     = room.players || {};

  // Update cumulative scores
  const scoreUpdates = {};
  Object.entries(roundScores).forEach(([uid, pts]) => {
    scoreUpdates[`players/${uid}/score`] = (players[uid]?.score || 0) + pts;
  });

  // Check win condition
  const updatedScores = {};
  Object.keys(players).forEach(uid => {
    updatedScores[uid] = (players[uid]?.score || 0) + (roundScores[uid] || 0);
  });
  const winner = Object.entries(updatedScores).find(([, s]) => s >= WIN_SCORE);

  // Replenish hands from deck
  const deck     = [...(room.deck || [])];
  const handUpdates = {};
  Object.keys(players).forEach(uid => {
    const hand = room.hands?.[uid] || [];
    const { newHand, newDeck: nd } = replenishHand(hand, deck);
    deck.splice(0, deck.length, ...nd);
    handUpdates[`hands/${uid}`] = newHand;
  });

  // Next storyteller (rotate through players array)
  const playerUids    = Object.keys(players);
  const currentIdx    = playerUids.indexOf(room.storyteller);
  const nextStoryteller = playerUids[(currentIdx + 1) % playerUids.length];

  await update(ref(db, `rooms/${code}`), {
    ...scoreUpdates,
    ...handUpdates,
    deck,
    roundScores,
    phase:       winner ? PHASE.GAMEOVER : PHASE.RESULTS,
    winner:      winner ? winner[0] : null,
    round:       (room.round || 1) + 1,
    nextStoryteller,
  });
}

// ── Advance from RESULTS → next CLUE round ───────────────────────
export async function nextRound(code) {
  const snap = await get(ref(db, `rooms/${code}`));
  const room = snap.val();
  await update(ref(db, `rooms/${code}`), {
    phase:       PHASE.CLUE,
    storyteller: room.nextStoryteller,
    clue:        null,
    played:      {},
    votes:       {},
    roundScores: null,
  });
}

// ── Subscribe to room updates ────────────────────────────────────
export function subscribeRoom(code, callback) {
  const r = ref(db, `rooms/${code}`);
  onValue(r, snap => callback(snap.val()));
  return () => off(r);
}
