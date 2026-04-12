// ── Local game backend — no Firebase needed ──────────────────────
// Uses localStorage for persistence + BroadcastChannel for
// multi-tab sync (lets multiple browser tabs act as different players)
import {
  dealHands, replenishHand, generateRoomCode, calculateScores, shuffle,
  PHASE, WIN_SCORE,
} from './gameLogic.js';

const CHANNEL_NAME = 'your-dixit-local';
let channel = null;
function getChannel() {
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

// ── Storage helpers ──────────────────────────────────────────────
function saveRoom(code, room) {
  localStorage.setItem(`room_${code}`, JSON.stringify(room));
  getChannel().postMessage({ type: 'room_update', code, room });
}
function loadRoom(code) {
  const raw = localStorage.getItem(`room_${code}`);
  return raw ? JSON.parse(raw) : null;
}

// ── UID — stored per browser tab in sessionStorage ───────────────
let _uid = null;
export function getLocalUid() {
  if (_uid) return _uid;
  _uid = sessionStorage.getItem('local_uid');
  if (!_uid) { _uid = 'u_' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('local_uid', _uid); }
  return _uid;
}

export async function signInAnon() { return getLocalUid(); }

// ── Create room ──────────────────────────────────────────────────
export async function createRoom(hostName) {
  const code = generateRoomCode();
  const uid  = getLocalUid();
  const room = {
    host: uid,
    hostName,
    phase: PHASE.LOBBY,
    players: { [uid]: { name: hostName, score: 0, isHost: true } },
    photos: {},
    deck: [],
    hands: {},
    round: 0,
    storyteller: null,
    clue: null,
    played: {},
    votes: {},
    createdAt: Date.now(),
  };
  saveRoom(code, room);
  return code;
}

// ── Join room ────────────────────────────────────────────────────
export async function joinRoom(code, playerName) {
  const room = loadRoom(code);
  if (!room) throw new Error('Room not found. Check the code and try again.');
  if (room.phase !== PHASE.LOBBY) throw new Error('Game already started.');
  const uid = getLocalUid();
  room.players[uid] = { name: playerName, score: 0, isHost: false };
  saveRoom(code, room);
  return room;
}

// ── Upload photos (local — store as data URLs) ───────────────────
export async function uploadPhotos(code, files, onProgress) {
  const room = loadRoom(code);
  if (!room) throw new Error('Room not found');
  let i = 0;
  for (const file of files) {
    const id  = `p${Date.now()}_${i}`;
    const url = await readFileAsDataURL(file);
    room.photos[id] = { url, id };
    i++;
    onProgress && onProgress(Math.round((i / files.length) * 100));
  }
  saveRoom(code, room);
}
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Start game ───────────────────────────────────────────────────
export async function startGame(code) {
  const room = loadRoom(code);
  const photoIds   = Object.keys(room.photos || {});
  const playerUids = Object.keys(room.players || {});
  const { playerHands, deck } = dealHands(photoIds, playerUids);
  room.phase       = PHASE.CLUE;
  room.deck        = deck;
  room.hands       = playerHands;
  room.round       = 1;
  room.storyteller = room.host;
  room.clue        = null;
  room.played      = {};
  room.votes       = {};
  saveRoom(code, room);
}

// ── Submit clue ──────────────────────────────────────────────────
export async function submitClue(code, clue, photoId) {
  const uid  = getLocalUid();
  const room = loadRoom(code);
  room.clue           = clue;
  room.phase          = PHASE.SUBMIT;
  room.played[uid]    = photoId;
  room.hands[uid]     = (room.hands[uid] || []).filter(id => id !== photoId);
  saveRoom(code, room);
}

// ── Submit card ──────────────────────────────────────────────────
export async function submitCard(code, photoId) {
  const uid  = getLocalUid();
  const room = loadRoom(code);
  room.played[uid] = photoId;
  room.hands[uid]  = (room.hands[uid] || []).filter(id => id !== photoId);
  const playerUids  = Object.keys(room.players || {});
  const allSubmitted = playerUids.every(u => room.played[u]);
  if (allSubmitted) room.phase = PHASE.REVEAL;
  saveRoom(code, room);
}

// ── Submit vote ──────────────────────────────────────────────────
export async function submitVote(code, photoId) {
  const uid  = getLocalUid();
  const room = loadRoom(code);
  room.votes[uid] = photoId;
  const nonStorytellers = Object.keys(room.players).filter(u => u !== room.storyteller);
  const allVoted = nonStorytellers.every(u => room.votes[u]);
  if (allVoted) resolveRound(code, room);
  else saveRoom(code, room);
}

function resolveRound(code, room) {
  const roundScores = calculateScores(room.storyteller, room.played, room.votes);
  Object.entries(roundScores).forEach(([uid, pts]) => {
    room.players[uid].score = (room.players[uid].score || 0) + pts;
  });
  const winner = Object.entries(room.players).find(([, p]) => p.score >= WIN_SCORE);
  const deck   = [...(room.deck || [])];
  Object.keys(room.players).forEach(uid => {
    const { newHand, newDeck: nd } = replenishHand(room.hands[uid] || [], deck);
    deck.splice(0, deck.length, ...nd);
    room.hands[uid] = newHand;
  });
  const playerUids      = Object.keys(room.players);
  const currentIdx      = playerUids.indexOf(room.storyteller);
  room.nextStoryteller  = playerUids[(currentIdx + 1) % playerUids.length];
  room.deck             = deck;
  room.roundScores      = roundScores;
  room.phase            = winner ? PHASE.GAMEOVER : PHASE.RESULTS;
  room.winner           = winner ? winner[0] : null;
  room.round            = (room.round || 1) + 1;
  saveRoom(code, room);
}

// ── Next round ───────────────────────────────────────────────────
export async function nextRound(code) {
  const room = loadRoom(code);
  room.phase       = PHASE.CLUE;
  room.storyteller = room.nextStoryteller;
  room.clue        = null;
  room.played      = {};
  room.votes       = {};
  room.roundScores = null;
  saveRoom(code, room);
}

// ── Subscribe ────────────────────────────────────────────────────
export function subscribeRoom(code, callback) {
  // Immediate load
  callback(loadRoom(code));

  // Listen for updates from other tabs
  const ch = getChannel();
  function onMsg(e) {
    if (e.data?.type === 'room_update' && e.data.code === code) {
      callback(e.data.room);
    }
  }
  ch.addEventListener('message', onMsg);

  // Also poll localStorage for same-tab updates (fallback)
  const interval = setInterval(() => callback(loadRoom(code)), 500);

  return () => {
    ch.removeEventListener('message', onMsg);
    clearInterval(interval);
  };
}
