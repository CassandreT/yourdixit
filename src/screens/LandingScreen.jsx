import { useState } from 'react';
import { motion } from 'framer-motion';
import MagicButton from '../components/MagicButton.jsx';
import * as firebaseGame from '../utils/firebaseGame.js';

export default function LandingScreen({ onEnter }) {
  const [mode, setMode]       = useState(null); // 'host' | 'join'
  const [name, setName]       = useState('');
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleHost() {
    if (!name.trim()) return setError('Enter your name first');
    setLoading(true); setError('');
    try {
      await firebaseGame.signInAnon();
      const roomCode = await firebaseGame.createRoom(name.trim());
      onEnter({ role: 'host', name: name.trim(), code: roomCode, backend: 'remote' });
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  async function handleJoin() {
    if (!name.trim()) return setError('Enter your name first');
    if (!code.trim()) return setError('Enter the room code');
    setLoading(true); setError('');
    try {
      await firebaseGame.signInAnon();
      await firebaseGame.joinRoom(code.trim().toUpperCase(), name.trim());
      onEnter({ role: 'player', name: name.trim(), code: code.trim().toUpperCase(), backend: 'remote' });
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-24">

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="text-center mb-16"
      >
        <div className="flex items-center justify-center gap-3 mb-4 opacity-60">
          <span className="text-accent text-2xl">🍂</span>
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-accent" />
          <span className="text-accent text-xl">✦</span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-accent" />
          <span className="text-accent text-2xl">🍂</span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl text-accent mb-3 tracking-wide"
            style={{ textShadow: '0 0 40px rgba(245,200,66,0.4), 0 2px 8px rgba(0,0,0,0.8)' }}>
          Your Dixit
        </h1>
        <p className="font-body italic text-xl md:text-2xl text-[#fef0c8]/80">
          The game of Dixit, but with your pictures. Play remotely.
        </p>

        {/* Rules summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 max-w-md mx-auto bg-white/5 border border-white/10 rounded-2xl p-5 text-left"
        >
          <p className="font-display text-xs text-accent mb-3 tracking-widest">HOW TO PLAY</p>
          <ol className="space-y-2 text-[#fef0c8]/80 text-sm font-body">
            <li><span className="text-accent mr-2">1.</span>The host uploads up to <strong className="text-[#fef0c8]">100 photos</strong> from their phone</li>
            <li><span className="text-accent mr-2">2.</span>Each player gets <strong className="text-[#fef0c8]">6 secret cards</strong></li>
            <li><span className="text-accent mr-2">3.</span>The storyteller picks a card and gives a <strong className="text-[#fef0c8]">clue</strong></li>
            <li><span className="text-accent mr-2">4.</span>Everyone else plays a card that <strong className="text-[#fef0c8]">matches the clue</strong></li>
            <li><span className="text-accent mr-2">5.</span>All cards revealed — <strong className="text-[#fef0c8]">vote</strong> for the storyteller's card</li>
            <li><span className="text-accent mr-2">6.</span>First to <strong className="text-[#fef0c8]">30 points</strong> wins</li>
          </ol>
        </motion.div>
      </motion.div>

      {/* Action panel */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="w-full max-w-sm"
      >
        {/* Mode selector */}
        {!mode && (
          <div className="flex gap-3">
            <MagicButton variant="gold" onClick={() => { setMode('host'); setError(''); }} className="flex-1 py-4 text-base">
              ✦ Host a Game
            </MagicButton>
            <MagicButton variant="ghost" onClick={() => { setMode('join'); setError(''); }} className="flex-1 py-4 text-base">
              Join a Game
            </MagicButton>
          </div>
        )}

        {/* Name / code form */}
        {mode && (
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => { setMode(null); setError(''); }}
                className="text-dim hover:text-[#fef0c8] transition-colors text-sm">← back</button>
              <h2 className="font-display text-accent text-lg">
                {mode === 'host' ? '✦ Host a Game' : '🌿 Join a Game'}
              </h2>
            </div>

            <div>
              <label className="text-xs text-dim font-display tracking-widest block mb-1">YOUR NAME</label>
              <input
                type="text"
                value={name}
                maxLength={24}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (mode === 'host' ? handleHost() : handleJoin())}
                placeholder="Enter your name…"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3
                  text-[#fef0c8] placeholder-dim/50 font-body text-base outline-none
                  focus:border-accent/60 focus:bg-white/15 transition-all"
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="text-xs text-dim font-display tracking-widest block mb-1">ROOM CODE</label>
                <input
                  type="text"
                  value={code}
                  maxLength={5}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="5-letter code"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3
                    text-[#fef0c8] placeholder-dim/50 font-display text-xl tracking-[0.3em] text-center
                    outline-none focus:border-accent/60 focus:bg-white/15 transition-all uppercase"
                />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm font-body text-center">{error}</p>
            )}

            <MagicButton
              variant="gold"
              className="w-full py-4 text-base"
              onClick={mode === 'host' ? handleHost : handleJoin}
              disabled={loading}
            >
              {loading ? '✦ Entering…' : mode === 'host' ? '✦ Create Room' : '🌿 Enter Room'}
            </MagicButton>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
