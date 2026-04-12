import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FireflyCanvas from './components/FireflyCanvas.jsx';
import LandingScreen  from './screens/LandingScreen.jsx';
import LobbyScreen    from './screens/LobbyScreen.jsx';
import ClueScreen     from './screens/ClueScreen.jsx';
import SubmitScreen   from './screens/SubmitScreen.jsx';
import RevealScreen   from './screens/RevealScreen.jsx';
import ResultsScreen  from './screens/ResultsScreen.jsx';
import GameOverScreen from './screens/GameOverScreen.jsx';
import * as firebaseGame from './utils/firebaseGame.js';
import * as localGame from './utils/localGame.js';
import { PHASE } from './utils/gameLogic.js';
import { auth } from './firebase.js';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -24, transition: { duration: 0.3, ease: 'easeIn' } },
};

export default function App() {
  const [session, setSession] = useState(null); // { role, name, code, backend }
  const [room, setRoom]       = useState(null);
  const [currentUid, setCurrentUid] = useState(null);

  // Track UID — Firebase or local
  useEffect(() => {
    const uid = localGame.getLocalUid();
    setCurrentUid(uid);
    // Also track Firebase UID if it comes in
    return auth.onAuthStateChanged(u => {
      if (u) setCurrentUid(u.uid);
    });
  }, []);

  // Subscribe to room once session exists
  useEffect(() => {
    if (!session?.code) return;
    const game = session.backend === 'remote' ? firebaseGame : localGame;
    const unsub = game.subscribeRoom(session.code, data => setRoom(data));
    return unsub;
  }, [session?.code, session?.backend]);

  function handleEnter(sess) {
    setSession(sess);
  }

  // Build photo lookup map from room
  const photos = room?.photos || {};

  const isHost   = session?.role === 'host' || room?.host === currentUid;
  const phase    = room?.phase || PHASE.LOBBY;
  const code     = session?.code;

  // Determine which screen to show
  function renderScreen() {
    if (!session) {
      return (
        <motion.div key="landing" {...pageVariants}>
          <LandingScreen onEnter={handleEnter} />
        </motion.div>
      );
    }

    if (!room) {
      return (
        <motion.div key="loading" {...pageVariants} className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="flex justify-center gap-2">
              {[0,1,2].map(i => (
                <motion.div key={i}
                  className="w-3 h-3 bg-accent/60 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.4 }}
                />
              ))}
            </div>
            <p className="text-dim/60 font-body italic text-sm">Entering the forest…</p>
          </div>
        </motion.div>
      );
    }

    const gameBackend = session.backend === 'remote' ? firebaseGame : localGame;
    switch (phase) {
      case PHASE.LOBBY:
        return (
          <motion.div key="lobby" {...pageVariants}>
            <LobbyScreen room={room} code={code} isHost={isHost} currentUid={currentUid} game={gameBackend} />
          </motion.div>
        );
      case PHASE.CLUE:
        return (
          <motion.div key="clue" {...pageVariants}>
            <ClueScreen room={room} code={code} currentUid={currentUid} photos={photos} game={gameBackend} />
          </motion.div>
        );
      case PHASE.SUBMIT:
        return (
          <motion.div key="submit" {...pageVariants}>
            <SubmitScreen room={room} code={code} currentUid={currentUid} photos={photos} game={gameBackend} />
          </motion.div>
        );
      case PHASE.REVEAL:
        return (
          <motion.div key="reveal" {...pageVariants}>
            <RevealScreen room={room} code={code} currentUid={currentUid} photos={photos} game={gameBackend} />
          </motion.div>
        );
      case PHASE.RESULTS:
        return (
          <motion.div key="results" {...pageVariants}>
            <ResultsScreen room={room} code={code} currentUid={currentUid} photos={photos} isHost={isHost} game={gameBackend} />
          </motion.div>
        );
      case PHASE.GAMEOVER:
        return (
          <motion.div key="gameover" {...pageVariants}>
            <GameOverScreen room={room} currentUid={currentUid} />
          </motion.div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* WEATHER CANVAS — dusk atmosphere + fireflies */}
      <FireflyCanvas />

      {/* Grain overlay for texture */}
      <div
        className="pointer-events-none fixed inset-0 z-[2] opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px',
        }}
      />

      {/* Content — above canvas */}
      <div className="relative z-10">
        {/* Top bar when in game */}
        {session && room && phase !== PHASE.LOBBY && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
              px-4 py-2 bg-base/70 backdrop-blur-md border-b border-white/5"
          >
            <div className="flex items-center gap-2">
              <span className="font-display text-accent text-sm tracking-wider">Your Dixit</span>
              <span className="text-dim/30 text-xs">✦</span>
              <span className="text-dim/60 text-xs font-body">Room: {code}</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Mini score display */}
              {Object.entries(room.players || {}).slice(0, 4).map(([uid, p]) => (
                <div key={uid} className={`text-xs font-display ${uid === currentUid ? 'text-accent' : 'text-dim/60'}`}>
                  {p.name.split(' ')[0]}: <strong>{p.score || 0}</strong>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className={session && room && phase !== PHASE.LOBBY ? 'pt-10' : ''}>
          <AnimatePresence mode="wait">
            {renderScreen()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
