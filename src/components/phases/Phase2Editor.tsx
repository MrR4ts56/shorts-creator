import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PathPoint, CANVAS_SIZES } from '../../types';
import { UseProjectReturn } from '../../hooks/useProject';
import { useAnimation } from '../../hooks/useAnimation';
import { CharacterSprite } from '../canvas/GameCanvas';
import { PathDrawer } from '../canvas/PathDrawer';
import { Timeline } from '../timeline/Timeline';
import { WaypointList } from '../ui/WaypointList';

interface Phase2EditorProps {
  project: UseProjectReturn['project'];
  selectedCharacterId: UseProjectReturn['selectedCharacterId'];
  setSelectedCharacterId: UseProjectReturn['setSelectedCharacterId'];
  updatePath: UseProjectReturn['updatePath'];
  updatePathPoint: UseProjectReturn['updatePathPoint'];
  getCharacterPath: UseProjectReturn['getCharacterPath'];
  setDuration: UseProjectReturn['setDuration'];
  setKillerDelay: UseProjectReturn['setKillerDelay'];
  setStartPause: UseProjectReturn['setStartPause'];
  setEndPause: UseProjectReturn['setEndPause'];
  canProceedToRender: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function Phase2Editor({
  project,
  selectedCharacterId,
  setSelectedCharacterId,
  updatePath,
  updatePathPoint,
  getCharacterPath,
  setDuration,
  setKillerDelay,
  setStartPause,
  setEndPause,
  canProceedToRender,
  onBack,
  onNext,
}: Phase2EditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'waypoints' | 'settings'>('waypoints');

  const {
    isPlaying,
    isPaused,
    currentTime,
    totalDuration,
    characterStates,
    isPausePhase,
    play,
    pause,
    resume,
    stop,
    seekTo,
  } = useAnimation({
    paths: project.paths,
    characters: project.characters,
    duration: project.duration,
    killerDelay: project.killerDelay,
    startPause: project.startPause,
    endPause: project.endPause,
  });

  const { width, height } = CANVAS_SIZES.preview;

  const getCanvasPosition = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(width, e.clientX - rect.left)),
      y: Math.max(0, Math.min(height, e.clientY - rect.top)),
    };
  }, [width, height]);

  // Add waypoint on canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!selectedCharacterId || isPlaying) return;

    const target = e.target as HTMLElement;
    if (target.closest('[data-character]')) return;

    const pos = getCanvasPosition(e);
    const existingPath = getCharacterPath(selectedCharacterId);
    const points = existingPath?.points || [];
    const speed = existingPath?.speed || 100;

    let newTime = 0;
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      const distance = Math.sqrt(
        Math.pow(pos.x - lastPoint.x, 2) + Math.pow(pos.y - lastPoint.y, 2)
      );
      newTime = lastPoint.time + (distance / speed) + (lastPoint.duration || 0);
    }

    const newPoint: PathPoint = {
      x: pos.x,
      y: pos.y,
      time: newTime,
      effect: 'normal',
      opacity: 1,
      duration: 0,
    };

    updatePath(selectedCharacterId, {
      points: [...points, newPoint],
      speed,
    });
  }, [selectedCharacterId, isPlaying, getCanvasPosition, getCharacterPath, updatePath]);

  const handleUpdatePoint = useCallback((pointIndex: number, updates: Partial<PathPoint>) => {
    if (!selectedCharacterId) return;
    updatePathPoint(selectedCharacterId, pointIndex, updates);
  }, [selectedCharacterId, updatePathPoint]);

  const handleDeletePoint = useCallback((pointIndex: number) => {
    if (!selectedCharacterId) return;

    const path = getCharacterPath(selectedCharacterId);
    if (!path) return;

    const newPoints = path.points.filter((_, i) => i !== pointIndex);

    // Recalculate times
    let accumulatedTime = 0;
    const recalculatedPoints = newPoints.map((point, i) => {
      if (i === 0) return { ...point, time: 0 };

      const prevPoint = newPoints[i - 1];
      const distance = Math.sqrt(
        Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
      );
      accumulatedTime += distance / (path.speed || 100) + (prevPoint.duration || 0);

      return { ...point, time: accumulatedTime };
    });

    updatePath(selectedCharacterId, { points: recalculatedPoints });
  }, [selectedCharacterId, getCharacterPath, updatePath]);

  const clearPath = useCallback((characterId: string) => {
    updatePath(characterId, { points: [] });
  }, [updatePath]);

  const updateSpeed = useCallback((characterId: string, speed: number) => {
    const existingPath = getCharacterPath(characterId);
    if (!existingPath || existingPath.points.length === 0) return;

    let accumulatedTime = 0;
    const recalculatedPoints = existingPath.points.map((point, i) => {
      if (i === 0) return { ...point, time: 0 };

      const prevPoint = existingPath.points[i - 1];
      const distance = Math.sqrt(
        Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
      );
      accumulatedTime += distance / speed + (prevPoint.duration || 0);

      return { ...point, time: accumulatedTime };
    });

    updatePath(characterId, { points: recalculatedPoints, speed });
  }, [getCharacterPath, updatePath]);

  const handlePlayPause = () => {
    if (isPlaying && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      play();
    }
  };

  const selectedChar = project.characters.find(c => c.id === selectedCharacterId);
  const selectedPath = selectedCharacterId ? getCharacterPath(selectedCharacterId) : undefined;
  const survivors = project.characters.filter(c => c.type === 'survivor');
  const killer = project.characters.find(c => c.type === 'killer');

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col select-none">
      {/* Header */}
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
              <h1 className="text-xl font-bold text-white">Path Editor</h1>
              <p className="text-sm text-gray-400">คลิกบน Canvas เพื่อสร้างจุดเดิน</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 mr-4">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">✓</div>
              <div className="w-8 h-0.5 bg-green-500" />
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">2</div>
              <div className="w-8 h-0.5 bg-gray-700" />
              <div className="w-6 h-6 rounded-full bg-gray-700 text-gray-400 text-xs flex items-center justify-center">3</div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
              disabled={!canProceedToRender}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                canProceedToRender
                  ? 'bg-primary hover:bg-primary/90 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Render
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Left Panel */}
        <div className="lg:w-72 space-y-4">
          {/* Tabs */}
          <div className="flex bg-dark-200 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('waypoints')}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'waypoints'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📍 Waypoints
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'settings'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ⚙️ ตั้งค่า
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'waypoints' && (
            <div className="bg-dark-200 rounded-xl p-4">
              {selectedChar ? (
                <>
                  {/* Selected Character Header */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-700">
                    <div
                      className="w-10 h-10 rounded-full border-3 flex items-center justify-center overflow-hidden"
                      style={{
                        borderColor: selectedChar.color,
                        backgroundColor: selectedChar.imageUrl ? 'transparent' : '#374151',
                      }}
                    >
                      {selectedChar.imageUrl ? (
                        <img src={selectedChar.imageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        selectedChar.type === 'killer' ? '🔪' : '😊'
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">{selectedChar.name}</div>
                      <div className="text-xs text-gray-500">
                        {selectedChar.type === 'killer' ? 'ฆาตกร' : 'ผู้รอดชีวิต'}
                      </div>
                    </div>
                  </div>

                  {/* Waypoint List */}
                  <WaypointList
                    character={selectedChar}
                    path={selectedPath}
                    survivors={survivors}
                    onUpdatePoint={handleUpdatePoint}
                    onDeletePoint={handleDeletePoint}
                    onClearPath={() => clearPath(selectedCharacterId!)}
                  />
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3">👆</div>
                  <p className="text-sm">เลือกตัวละครจาก Timeline<br />เพื่อแก้ไข Waypoints</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-dark-200 rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-white mb-3">ตั้งค่าเกม</h3>

              {/* Total Duration */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  ความยาวทั้งหมด: {project.duration} วินาที
                </label>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={project.duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>10s</span>
                  <span>120s</span>
                </div>
              </div>

              {/* Killer Delay */}
              {killer && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    🔪 ฆาตกรเริ่มหลัง: {project.killerDelay} วินาที
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={project.killerDelay}
                    onChange={(e) => setKillerDelay(Number(e.target.value))}
                    className="w-full accent-red-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>0s (พร้อมกัน)</span>
                    <span>30s</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ผู้รอดชีวิตจะเริ่มก่อน ฆาตกรจะเริ่มหลังจากเวลาที่กำหนด
                  </p>
                </div>
              )}

              {/* Pause Settings */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                <h4 className="text-sm font-medium text-white mb-3">⏸️ พักหน้าจอ (สำหรับตัดต่อ)</h4>

                {/* Start Pause */}
                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-2">
                    พักตอนเริ่ม: {project.startPause} วินาที
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={project.startPause}
                    onChange={(e) => setStartPause(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>0s</span>
                    <span>10s</span>
                  </div>
                </div>

                {/* End Pause */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    พักตอนจบ: {project.endPause} วินาที
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={project.endPause}
                    onChange={(e) => setEndPause(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>0s</span>
                    <span>10s</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  หน้าจอจะเบลอและตัวละครจะหยุดนิ่งระหว่างพัก
                </p>
              </div>

              {/* Phase Info */}
              <div className="bg-dark-300 rounded-lg p-3 mt-4">
                <h4 className="text-sm font-medium text-white mb-2">🎬 ลำดับการเล่น</h4>
                <div className="space-y-2 text-xs">
                  {project.startPause > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-400">0s - พักหน้าจอ (เบลอ)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-gray-400">{project.startPause}s - ผู้รอดชีวิตเริ่มซ่อนตัว</span>
                  </div>
                  {killer && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-gray-400">{project.startPause + project.killerDelay}s - ฆาตกรเริ่มตามหา</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <span className="text-gray-400">{project.startPause + project.duration}s - จบเกม</span>
                  </div>
                  {project.endPause > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-400">{project.startPause + project.duration + project.endPause}s - จบพักหน้าจอ</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-dark-200 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">วิธีใช้</h3>
            <ol className="text-sm text-gray-400 space-y-2">
              <li className="flex gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>เลือกตัวละครจาก Timeline</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">2.</span>
                <span><strong>คลิก</strong>บน Canvas เพื่อเพิ่มจุด</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>ตั้งค่า Action ใน Waypoints tab</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">4.</span>
                <span>กด Play เพื่อดู Preview</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <div
            ref={canvasRef}
            className="relative bg-dark-300 rounded-xl overflow-hidden shadow-2xl select-none"
            style={{ width, height, userSelect: 'none' }}
            onClick={handleCanvasClick}
          >
            {project.map && (
              <img
                src={project.map.imageUrl}
                alt={project.map.name}
                className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-500 ${
                  isPausePhase && isPlaying ? 'blur-md scale-105' : ''
                }`}
                draggable={false}
              />
            )}
            <div className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
              isPausePhase && isPlaying ? 'bg-black/50' : 'bg-black/20'
            }`} />

            <PathDrawer
              paths={project.paths}
              characters={project.characters}
              selectedCharacterId={selectedCharacterId}
              isDrawing={false}
              currentDrawingPath={[]}
            />

            {project.characters.map((char, index) => {
              const state = characterStates[char.id];
              const path = getCharacterPath(char.id);
              const hasPath = path && path.points.length > 0;
              const initialPos = hasPath
                ? path.points[0]
                : {
                    x: width / 2 + (index - project.characters.length / 2) * 60,
                    y: height - 100,
                  };

              // Show placeholder for characters without path
              if (!hasPath && selectedCharacterId !== char.id && !isPlaying) {
                return (
                  <motion.div
                    key={char.id}
                    data-character={char.id}
                    className="absolute cursor-pointer opacity-30 hover:opacity-60 transition-opacity"
                    style={{
                      left: initialPos.x - char.size / 2,
                      top: initialPos.y - char.size / 2,
                      width: char.size,
                      height: char.size,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCharacterId(char.id);
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full border-2 border-dashed flex items-center justify-center"
                      style={{ borderColor: char.color }}
                    >
                      <span className="text-xs text-gray-400">?</span>
                    </div>
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                      {char.name}
                    </div>
                  </motion.div>
                );
              }

              return (
                <div key={char.id} data-character={char.id}>
                  <CharacterSprite
                    character={char}
                    isSelected={selectedCharacterId === char.id}
                    onClick={() => setSelectedCharacterId(char.id)}
                    initialPosition={initialPos}
                    position={state ? { x: state.x, y: state.y } : undefined}
                    opacity={state?.opacity ?? 1}
                    effect={state?.effect}
                    showName={true}
                    isShaking={state?.isShaking}
                  />
                </div>
              );
            })}

            {selectedCharacterId && !isPlaying && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-primary/80 rounded text-xs text-white pointer-events-none">
                คลิกเพื่อเพิ่มจุด
              </div>
            )}

            {isPlaying && (
              <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs text-white pointer-events-none ${
                isPausePhase ? 'bg-blue-500' : 'bg-green-500'
              }`}>
                {isPausePhase ? '⏸️ Pause' : 'Playing'}
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={stop}
              disabled={!isPlaying && currentTime === 0}
              className="w-10 h-10 bg-dark-200 rounded-full flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayPause}
              className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30"
            >
              {isPlaying && !isPaused ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="5" width="4" height="14" />
                  <rect x="14" y="5" width="4" height="14" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </motion.button>

            <div className="text-sm text-gray-400 font-mono w-24">
              {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Right Panel - Timeline */}
        <div className="lg:w-80">
          <Timeline
            characters={project.characters}
            paths={project.paths}
            currentTime={currentTime}
            totalDuration={totalDuration}
            isPlaying={isPlaying}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={setSelectedCharacterId}
            onSeek={seekTo}
            onSpeedChange={updateSpeed}
          />
        </div>
      </div>
    </div>
  );
}
