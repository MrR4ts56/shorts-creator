import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Character, CharacterPath, EFFECT_CONFIG, EffectType } from '../../types';

interface TimelineProps {
  characters: Character[];
  paths: CharacterPath[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  selectedCharacterId: string | null;
  onSelectCharacter: (id: string) => void;
  onSeek: (time: number) => void;
  onSpeedChange: (characterId: string, speed: number) => void;
}

export function Timeline({
  characters,
  paths,
  currentTime,
  totalDuration,
  isPlaying,
  selectedCharacterId,
  onSelectCharacter,
  onSeek,
  onSpeedChange,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    onSeek(progress * totalDuration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="bg-dark-200 rounded-xl p-4 space-y-4">
      {/* Time Display */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-white font-mono">{formatTime(currentTime)}</span>
        <span className="text-gray-500">/ {formatTime(totalDuration)}</span>
      </div>

      {/* Main Timeline Scrubber */}
      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="relative h-3 bg-dark-300 rounded-full cursor-pointer group"
      >
        {/* Progress Bar */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-primary rounded-full"
          style={{ width: `${progressPercent}%` }}
          transition={{ duration: isPlaying ? 0 : 0.1 }}
        />

        {/* Playhead */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary"
          style={{ left: `calc(${progressPercent}% - 8px)` }}
          transition={{ duration: isPlaying ? 0 : 0.1 }}
        />

        {/* Hover effect */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-white/10 transition-opacity" />
      </div>

      {/* Character Tracks */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {characters.map(character => {
          const path = paths.find(p => p.characterId === character.id);
          const isSelected = selectedCharacterId === character.id;

          return (
            <CharacterTrack
              key={character.id}
              character={character}
              path={path}
              totalDuration={totalDuration}
              isSelected={isSelected}
              onSelect={() => onSelectCharacter(character.id)}
              onSpeedChange={(speed) => onSpeedChange(character.id, speed)}
            />
          );
        })}
      </div>

      {/* Empty state */}
      {characters.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          ไม่มีตัวละคร
        </div>
      )}
    </div>
  );
}

interface CharacterTrackProps {
  character: Character;
  path?: CharacterPath;
  totalDuration: number;
  isSelected: boolean;
  onSelect: () => void;
  onSpeedChange: (speed: number) => void;
}

function CharacterTrack({
  character,
  path,
  totalDuration,
  isSelected,
  onSelect,
  onSpeedChange,
}: CharacterTrackProps) {
  const points = path?.points || [];
  const pathDuration = points.length > 0 ? points[points.length - 1].time : 0;

  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      onClick={onSelect}
      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-primary/20 ring-1 ring-primary' : ''
      }`}
    >
      {/* Character Avatar */}
      <div
        className="w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{
          borderColor: character.color,
          backgroundColor: character.imageUrl ? 'transparent' : '#374151',
        }}
      >
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs">
            {character.type === 'killer' ? '🔪' : '😊'}
          </span>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{character.name}</div>

        {/* Path visualization */}
        <div className="relative h-4 bg-dark-300 rounded mt-1">
          {pathDuration > 0 && (
            <div
              className="absolute left-0 top-0 h-full rounded"
              style={{
                width: `${(pathDuration / totalDuration) * 100}%`,
                backgroundColor: character.color,
                opacity: 0.6,
              }}
            />
          )}

          {/* Effect markers */}
          {points.map((point, i) => {
            if (point.effect === 'normal' || !point.effect) return null;
            const position = (point.time / totalDuration) * 100;
            const config = EFFECT_CONFIG[point.effect as EffectType];

            return (
              <div
                key={i}
                className="absolute top-0 h-full flex items-center"
                style={{ left: `${position}%` }}
                title={config.label}
              >
                <span className="text-xs">{config.icon}</span>
              </div>
            );
          })}

          {/* No path indicator */}
          {points.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-gray-500">ยังไม่มี Path</span>
            </div>
          )}
        </div>
      </div>

      {/* Speed Control */}
      {isSelected && path && (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <span className="text-xs text-gray-400">Speed:</span>
          <select
            value={path.speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="bg-dark-300 text-white text-xs rounded px-2 py-1 border border-gray-600"
          >
            <option value={50}>0.5x</option>
            <option value={100}>1x</option>
            <option value={150}>1.5x</option>
            <option value={200}>2x</option>
          </select>
        </div>
      )}
    </motion.div>
  );
}
