import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MagicButton from '../components/MagicButton.jsx';
import PlayerList from '../components/PlayerList.jsx';
import { recommendedPhotoCount } from '../utils/gameLogic.js';

export default function LobbyScreen({ room, code, isHost, currentUid, game }) {
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [uploadedCount, setUploaded] = useState(0);
  const [dragging, setDragging]     = useState(false);
  const [error, setError]           = useState('');
  const fileRef = useRef(null);

  const players     = room?.players || {};
  const playerCount = Object.keys(players).length;
  const photos      = room?.photos || {};
  const photoCount  = Object.keys(photos).length;
  const recommended = recommendedPhotoCount(playerCount);
  const canStart    = isHost && playerCount >= 2 && photoCount >= playerCount * 6;

  async function handleFiles(files) {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 100 - photoCount);
    if (!validFiles.length) return;
    setUploading(true); setError('');
    try {
      await game.uploadPhotos(code, validFiles, p => setProgress(p));
      setUploaded(validFiles.length);
    } catch (e) {
      setError('Upload failed: ' + e.message);
    } finally {
      setUploading(false); setProgress(0);
    }
  }

  function onDrop(e) {
    e.preventDefault(); setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6"
      >
        {/* Room code display */}
        <div className="text-center">
          <p className="text-dim/60 text-xs font-display tracking-widest mb-2">ROOM CODE</p>
          <div className="inline-block bg-accent/10 border border-accent/30 rounded-2xl px-8 py-4">
            <span className="font-display text-4xl text-accent tracking-[0.4em]">{code}</span>
          </div>
          <p className="text-dim/50 text-sm font-body mt-2 italic">Share this code with your friends</p>
        </div>

        {/* Players */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="font-display text-xs text-accent tracking-widest mb-3">
            PLAYERS ({playerCount})
          </p>
          <PlayerList players={players} currentUid={currentUid} />
          {playerCount < 2 && (
            <p className="text-dim/50 text-xs font-body italic mt-3 text-center">
              Waiting for more players to join…
            </p>
          )}
        </div>

        {/* Photo upload (host only) */}
        {isHost && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-display text-xs text-accent tracking-widest">PHOTOS</p>
              <p className="text-dim text-xs font-body">
                {photoCount} uploaded
                {photoCount > 0 && <span className="text-green-400 ml-1">✓</span>}
              </p>
            </div>

            {/* Recommendation */}
            <div className="bg-violet/10 border border-violet/20 rounded-xl px-4 py-2">
              <p className="text-[#fef0c8]/70 text-xs font-body">
                💡 For <strong className="text-[#fef0c8]">{playerCount} players</strong>, upload at least{' '}
                <strong className="text-accent">{recommended} photos</strong> for a full game
              </p>
            </div>

            {/* Drop zone */}
            <div
              className={`upload-zone rounded-xl p-6 text-center cursor-pointer ${dragging ? 'dragging' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
              <div className="text-3xl mb-2">📷</div>
              <p className="text-[#fef0c8]/70 text-sm font-body">
                {uploading
                  ? `Uploading… ${progress}%`
                  : 'Drop photos here or tap to browse'}
              </p>
              <p className="text-dim/40 text-xs mt-1">Up to 100 photos total • JPG, PNG, HEIC</p>
            </div>

            {/* Progress bar */}
            {uploading && (
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
            )}

            {uploadedCount > 0 && !uploading && (
              <p className="text-green-400 text-xs font-body text-center">
                ✓ {uploadedCount} photos added successfully
              </p>
            )}

            {error && <p className="text-red-400 text-xs font-body text-center">{error}</p>}
          </div>
        )}

        {/* Non-host waiting */}
        {!isHost && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-dim/60 text-sm font-body italic">
              Waiting for the host to upload photos and start the game…
            </p>
            <div className="flex justify-center gap-2 mt-3">
              {[0,1,2].map(i => (
                <motion.div key={i}
                  className="w-2 h-2 bg-accent/60 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.4 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Start game */}
        {isHost && (
          <div className="space-y-2">
            <MagicButton
              variant="gold"
              className="w-full py-4 text-base"
              onClick={() => game.startGame(code)}
              disabled={!canStart}
            >
              ✦ Begin the Game
            </MagicButton>
            {!canStart && (
              <p className="text-dim/50 text-xs font-body text-center italic">
                {playerCount < 2
                  ? 'Need at least 2 players'
                  : `Need ${Math.max(0, playerCount * 6 - photoCount)} more photos to start`}
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
