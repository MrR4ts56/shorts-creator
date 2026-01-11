import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CANVAS_SIZES } from '../../types';
import { UseProjectReturn } from '../../hooks/useProject';
import { useAnimation } from '../../hooks/useAnimation';
import { CharacterSprite } from '../canvas/GameCanvas';
import { Countdown } from '../ui/Countdown';
import { ResultScreen } from '../ui/ResultScreen';

type RenderState = 'idle' | 'countdown' | 'playing' | 'finished' | 'result';

interface Phase3RenderProps {
  project: UseProjectReturn['project'];
  getCharacterPath: UseProjectReturn['getCharacterPath'];
  onBack: () => void;
  onReset: () => void;
}

export function Phase3Render({
  project,
  getCharacterPath,
  onBack,
  onReset,
}: Phase3RenderProps) {
  const [renderState, setRenderState] = useState<RenderState>('idle');
  const { width, height } = CANVAS_SIZES.preview;

  const {
    currentTime,
    totalDuration,
    characterStates,
    isPausePhase,
    play,
    stop,
  } = useAnimation({
    paths: project.paths,
    characters: project.characters,
    duration: project.duration,
    killerDelay: project.killerDelay,
    startPause: project.startPause,
    endPause: project.endPause,
    onComplete: () => setRenderState('finished'),
  });

  const handleStart = useCallback(() => {
    setRenderState('countdown');
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setRenderState('playing');
    play();
  }, [play]);

  const handleCanvasClick = useCallback(() => {
    // Only show result when finished and user clicks
    if (renderState === 'finished') {
      setRenderState('result');
    }
  }, [renderState]);

  const handleReplay = useCallback(() => {
    stop();
    setRenderState('countdown');
  }, [stop]);

  const handleEdit = useCallback(() => {
    stop();
    onBack();
  }, [stop, onBack]);

  // Calculate progress percentage
  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Check if we're in "clean" render mode (no UI elements)
  const isCleanMode = renderState === 'playing' || renderState === 'finished';

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col select-none">
      {/* Header - hide during clean render */}
      {!isCleanMode && (
        <header className="bg-dark-200 border-b border-gray-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Final Render</h1>
                <p className="text-sm text-gray-400">ดู Animation สุดท้าย</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">✓</div>
              <div className="w-8 h-0.5 bg-green-500" />
              <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">✓</div>
              <div className="w-8 h-0.5 bg-green-500" />
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">3</div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col items-center justify-center p-4 ${isCleanMode ? 'bg-black' : ''}`}>
        {/* Canvas Container */}
        <div
          className={`relative overflow-hidden ${isCleanMode ? '' : 'rounded-xl shadow-2xl'}`}
          style={{ width, height, backgroundColor: '#000' }}
          onClick={handleCanvasClick}
        >
          {/* Map Background */}
          {project.map && (
            <img
              src={project.map.imageUrl}
              alt={project.map.name}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-500 ${
                isPausePhase && isCleanMode ? 'blur-md scale-105' : ''
              }`}
              draggable={false}
            />
          )}
          <div className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
            isPausePhase && isCleanMode ? 'bg-black/50' : 'bg-black/20'
          }`} />

          {/* Characters - no names in render mode, hide during pause */}
          {!isPausePhase && project.characters.map((char, index) => {
            const state = characterStates[char.id];
            const path = getCharacterPath(char.id);
            const hasPath = path && path.points.length > 0;

            // Don't show characters without paths during render
            if (!hasPath && isCleanMode) return null;

            const initialPos = hasPath
              ? path.points[0]
              : {
                  x: width / 2 + (index - project.characters.length / 2) * 60,
                  y: height - 100,
                };

            return (
              <CharacterSprite
                key={char.id}
                character={char}
                isSelected={false}
                initialPosition={initialPos}
                position={state ? { x: state.x, y: state.y } : undefined}
                opacity={state?.opacity ?? 1}
                effect={state?.effect}
                showName={false}
                isRenderMode={true}
                isShaking={state?.isShaking}
              />
            );
          })}

          {/* Countdown Overlay */}
          <AnimatePresence>
            {renderState === 'countdown' && (
              <Countdown onComplete={handleCountdownComplete} />
            )}
          </AnimatePresence>

          {/* Result Screen Overlay */}
          <AnimatePresence>
            {renderState === 'result' && (
              <ResultScreen
                characters={project.characters}
                paths={project.paths}
                onReplay={handleReplay}
                onEdit={handleEdit}
                onNewProject={onReset}
              />
            )}
          </AnimatePresence>


          {/* Progress Bar (during play) - subtle at bottom */}
          {isCleanMode && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <motion.div
                className="h-full bg-white/50"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Tap to see result hint */}
          {renderState === 'finished' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-center"
              >
                <div className="text-white text-xl font-bold mb-2">GAME OVER</div>
                <div className="text-gray-300 text-sm">แตะเพื่อดูผลลัพธ์</div>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Start Button (when idle) */}
        {renderState === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-white text-lg font-semibold rounded-xl shadow-lg shadow-primary/30"
            >
              <span className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                เริ่ม Render
              </span>
            </motion.button>

            <p className="text-gray-500 text-sm mt-4">
              จะเริ่มนับถอยหลัง 3-2-1 แล้วเล่น Animation
            </p>
          </motion.div>
        )}

        {/* Summary (when idle) */}
        {renderState === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap justify-center gap-4"
          >
            {project.characters.map(char => {
              const path = getCharacterPath(char.id);
              const hasPath = path && path.points.length > 1;

              return (
                <div
                  key={char.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    hasPath ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-500'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center overflow-hidden"
                    style={{
                      borderColor: char.color,
                      backgroundColor: char.imageUrl ? 'transparent' : '#374151',
                    }}
                  >
                    {char.imageUrl ? (
                      <img src={char.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs">{char.type === 'killer' ? '🔪' : '😊'}</span>
                    )}
                  </div>
                  <span className="text-sm">{char.name}</span>
                  {hasPath ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs">(ไม่มี path)</span>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
